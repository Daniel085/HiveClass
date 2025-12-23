// Use standard RTCPeerConnection with fallback for older browsers
var RTCPeerConnection = window.RTCPeerConnection ||
                        window.webkitRTCPeerConnection ||
                        window.mozRTCPeerConnection;

var configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ],
    iceCandidatePoolSize: 10
};

var RTCClient = function(rendezvousEndpoint, peerId, signalingHandlers) {
    if (!signalingHandlers && typeof peerId === 'object') {
        signalingHandlers = peerId;
        peerId = null;
    }
    this.signalingHandlers = signalingHandlers || {};
    this.peerId = peerId || Date.now() + '-' + Math.round(Math.random() * 10000);
    this.signalingConfig = {
        endpoint: rendezvousEndpoint,
        role: 'client',
        peerId: this.peerId,
        onopen: this.signalingHandlers.onopen
    };
    this.signalingService = null;

    this.peerConnection = null;
    this.dataChannel = null;

    this.messages = {};

    // Perfect Negotiation state (client is always polite)
    this.makingOffer = false;
    this.ignoreOffer = false;
    this.isSettingRemoteAnswerPending = false;

    var self = this;

    this.start = function() {
        this.signalingConfig.onmessage = this._handleSignalingMessage;
        this.signalingService = new SignalingService(this.signalingConfig);
    };

    this.stop = function () {
        this.signalingConfig.onmessage = null;
        this.signalingService.close();
        if (this.peerConnection && this.peerConnection.signalingState != "closed") {
            this.peerConnection.close();
        }
    };

    this.joinServer = function(serverId) {
        this.serverId = serverId;
        this._createPeerConnection();
    };

    this._createPeerConnection = function () {
        if (this.peerConnection) {
            this.peerConnection.close();
        }
        this.peerConnection = new RTCPeerConnection(configuration);
        this.peerConnection.id = peerId;

        this.peerConnection.onicecandidate = function (evt) {
            if (evt.candidate && !self.peerConnection.connectionDone) {
                self.signalingService.send({candidate: evt.candidate}, self.serverId, 'webrtc');
            }
        };

        // Perfect Negotiation: Handle offer creation with collision detection
        this.peerConnection.onnegotiationneeded = async function () {
            try {
                self.makingOffer = true;
                await self.peerConnection.setLocalDescription();  // Creates offer automatically
                self.signalingService.send({sdp: self.peerConnection.localDescription}, self.serverId, 'webrtc');
            } catch (error) {
                console.error('Negotiation failed:', error);
                if (self.onerror) {
                    self.onerror(error);
                }
            } finally {
                self.makingOffer = false;
            }
        };

        // Modern ontrack API (replaces deprecated onaddstream)
        this.peerConnection.ontrack = function(event) {
            // event.streams[0] contains the MediaStream
            if (self.onaddstream) {
                self.onaddstream(event.streams[0]);
            }
        };

        this.peerConnection.oniceconnectionstatechange = function (event) {
            if (self.oniceconnectionstatechange) {
                self.oniceconnectionstatechange(event);
            }
        };

        this.dataChannel = this.peerConnection.createDataChannel("messagingChannel", {protocol: "tcp"});
        this.dataChannel.onopen = function () {
            if (self.onopen) {
                self.onopen();
            }
        };

        this.dataChannel.onmessage = function (event) {
            var message = self._unfragmentMessage(event.data);
            if (message) {
                message = JSON.parse(message);
                if (message.sdp) {
                    self._handleSdpMessage(message, function(data) {
                        self.sendMessage(data);
                    });
                }
                if (self.onmessage) {
                    self.onmessage(message, peerId);
                }
            }
        };

        this.dataChannel.onclose = function () {
            if (self.onclose) {
                self.onclose();
            } else {
                setTimeout(function () {
                    self.start();
                    self._createPeerConnection();
                }, 5000);
            }
        }
    };

    this._handleSdpMessage = async function (data, callback) {
        console.trace('handleSdpMessage', data);
        try {
            var desc = new RTCSessionDescription(data.sdp);

            // Perfect Negotiation: Detect offer collision
            const polite = true;  // Client is always polite
            const offerCollision = (desc.type === 'offer') &&
                                  (self.makingOffer || self.peerConnection.signalingState !== 'stable');

            self.ignoreOffer = !polite && offerCollision;
            if (self.ignoreOffer) {
                console.log('Ignoring offer due to collision (impolite peer)');
                return;
            }

            // Perfect Negotiation: Handle rollback for polite peer
            self.isSettingRemoteAnswerPending = desc.type === 'answer';
            await self.peerConnection.setRemoteDescription(desc);
            self.isSettingRemoteAnswerPending = false;

            if (desc.type == "offer") {
                await self.peerConnection.setLocalDescription();  // Creates answer automatically
                if (callback) {
                    callback({sdp: self.peerConnection.localDescription});
                }
            } else {
                console.log(self.peerConnection);
            }
        } catch (error) {
            console.error('SDP handling failed:', error);
            if (self.onerror) {
                self.onerror(error);
            }
        }
    };

    this._handleCandidateMessage = function (data) {
        self.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    };

    this._handleSignalingMessage = function(payload) {
        var message = JSON.parse(payload);
        if (!message.peerId || message.peerId != self.peerId) {
            var data = message.data;
            if (data) {
                if (data.sdp) {
                    self._handleSdpMessage(data, function(data) {
                        if (data) {
                            self.signalingService.send(data, self.serverId, 'webrtc');
                        }
                    });
                } else if (data.candidate) {
                    self._handleCandidateMessage(data);
                }
            }
        }
        if (self.signalingHandlers && self.signalingHandlers.onmessage && typeof self.signalingHandlers.onmessage === 'function') {
            self.signalingHandlers.onmessage(message);
        }
    };

    this._unfragmentMessage = function(data) {
        var partialMessage = JSON.parse(data);
        var partId = partialMessage.id;
        var partsContainer = this.messages[partId];
        if (!partsContainer) {
            partsContainer = this.messages[partId] = {};
        }
        partsContainer[partialMessage.seq] = partialMessage.data;
        if (partialMessage.isLast) {
            partsContainer.count = partialMessage.seq + 1;
        }
        if (partsContainer.count) {
            var receivedParts = Object.keys(partsContainer)
                .filter(function (x) {
                    return !isNaN(parseInt(x));
                });
            if (receivedParts.length == partsContainer.count) {
                var message = receivedParts
                    .map(function (x) {
                        return partsContainer[x];
                    })
                    .reduce(function(a, b) {
                        return a + b;
                    }, '');
                delete this.messages[partId];
                return message;
            }
        }
    };

    this._makeMessage = function(payload) {
        var rawData = JSON.stringify(payload),
            id = [this.peerId, Date.now(), Math.round(Math.random() * 10000)].join('-'),
            chunks = [],
            start = 0,
            stop = 50000,
            length = rawData.length;

        while (stop < length) {
            chunks.push(JSON.stringify({
                id: id,
                seq: chunks.length,
                data: rawData.slice(start, stop)
            }));
            start = stop;
            stop += 50000;
        }
        chunks.push(JSON.stringify({
            id: id,
            seq: chunks.length,
            isLast: true,
            data: rawData.slice(start, stop)
        }));
        return chunks;
    };

    this.send = this.sendMessage = function(message) {
        var chunks = this._makeMessage(message);
        for (var i = 0; i < chunks.length; i++) {
            this.dataChannel.send(chunks[i]);
        }
    };

    this.attachStream = function(stream) {
        try {
            // Modern API: Add each track individually
            // onnegotiationneeded will be triggered automatically
            stream.getTracks().forEach(track => {
                self.peerConnection.addTrack(track, stream);
            });
        } catch (error) {
            console.error('Failed to attach stream:', error);
            if (self.onerror) {
                self.onerror(error);
            }
        }
    };

    this.detachStream = function(stream) {
        try {
            // Modern API: Remove each sender that matches the stream
            // onnegotiationneeded will be triggered automatically
            const senders = self.peerConnection.getSenders();
            senders.forEach(sender => {
                if (sender.track && stream.getTracks().includes(sender.track)) {
                    self.peerConnection.removeTrack(sender);
                }
            });
        } catch (error) {
            console.error('Failed to detach stream:', error);
            if (self.onerror) {
                self.onerror(error);
            }
        }
    };
};

// Export for ES6 modules
export { RTCClient };
