// Use standard RTCPeerConnection with fallback for older browsers
var RTCPeerConnection = window.RTCPeerConnection ||
                        window.webkitRTCPeerConnection ||
                        window.mozRTCPeerConnection;

var pc,
    configuration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10
    };

var RTCServer = function(rendezvousEndpoint, peerId, signalingHandlers) {
    this.MAX_RETRIES = 3;
    this.signalingHandlers = signalingHandlers || {};
    this.peerId = peerId || Date.now() + '-' + Math.round(Math.random() * 10000);
    this.signalingConfig = {
        endpoint: rendezvousEndpoint,
        role: 'server',
        peerId: peerId,
        onopen: this.signalingHandlers.onopen
    };
    this.signalingService = null;

    this.peerConnections = {};
    this.dataChannels = {};

    this.messages = {};

    // Perfect Negotiation state per peer (server is always impolite)
    this.makingOffer = {};  // { peerId: boolean }
    this.ignoreOffer = {};  // { peerId: boolean }
    this.isSettingRemoteAnswerPending = {};  // { peerId: boolean }

    var self = this;

    this.start = function() {
        this.signalingConfig.onmessage = this._handleSignalingMessage;
        this.signalingService = new SignalingService(this.signalingConfig);
        console.log('Server started, waiting for clients.');
    };

    this.stop = function () {
        this.signalingConfig.onmessage = null;
        this.signalingService.close();
        console.log('Server stopped.');

    };

    this._createPeerConnection = function(peerId) {
        var peerConnection = new RTCPeerConnection(configuration);
        peerConnection.id = peerId;

        peerConnection.onicecandidate = function (evt) {
            if (evt.candidate) {
                self.signalingService.send({candidate: evt.candidate, remotePeerId: peerId}, self.peerId, 'webrtc');
            }
        };

        // Perfect Negotiation: Handle offer creation with collision detection (per peer)
        peerConnection.onnegotiationneeded = (function(peerId) {
            return async function() {
                try {
                    self.makingOffer[peerId] = true;
                    await peerConnection.setLocalDescription();  // Creates offer automatically
                    self.signalingService.send({sdp: peerConnection.localDescription, remotePeerId: peerId}, self.peerId, 'webrtc');
                } catch (error) {
                    console.error('Negotiation failed for peer', peerId, ':', error);
                    if (self.onerror) {
                        self.onerror(error, peerId);
                    }
                } finally {
                    self.makingOffer[peerId] = false;
                }
            };
        })(peerId);

        peerConnection.ondatachannel = (function(peerId) {
            return function (event) {
                var dataChannel = event.channel;

                dataChannel.onopen = function() {
                    console.log('data channel open with peer ' + peerId + '.');
                    if (typeof self.onopen === 'function') {
                        self.onopen(peerId);
                    }
                };

                dataChannel.onmessage = function(event) {
                    if (self.onmessage) {
                        var message = self._unfragmentMessage(event.data);
                        if (message) {
                            message = JSON.parse(message);
                            self.onmessage(message, peerId);
                        }
                    }
                };

                dataChannel.onclose = function () {
                    if (typeof self.onclose === 'function') {
                        self.onclose(peerId);
                    }
                };

                self.dataChannels[peerId] = dataChannel;

            };
        })(peerId);

        // Modern ontrack API (replaces deprecated onaddstream)
        peerConnection.ontrack = (function(peerId) {
            return function(event) {
                // event.streams[0] contains the MediaStream
                if (typeof self.onaddstream === 'function') {
                    self.onaddstream(event.streams[0], peerId);
                }
            };
        })(peerId);

        peerConnection.oniceconnectionstatechange = function(event) {
            if (typeof self.oniceconnectionstatechange === 'function') {
                self.oniceconnectionstatechange(event, peerId);
            }
        };

        this.peerConnections[peerId] = peerConnection;
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

    this._getPeerConnection = function(peerId) {
        if (!(peerId in this.peerConnections)) {
            this._createPeerConnection(peerId);
        }
        return this.peerConnections[peerId];
    };

    this._handleSignalingMessage = async function(payload) {
        var message = JSON.parse(payload);
        if (message.peerId) {

            var peerId = message.peerId;
            var peerConnection = self._getPeerConnection(peerId);
            var data = message.data;
            if (data.sdp) {
                try {
                    var desc = new RTCSessionDescription(data.sdp);

                    // Perfect Negotiation: Detect offer collision (per peer)
                    const polite = false;  // Server is always impolite
                    const offerCollision = (desc.type === 'offer') &&
                                          (self.makingOffer[peerId] || peerConnection.signalingState !== 'stable');

                    self.ignoreOffer[peerId] = !polite && offerCollision;
                    if (self.ignoreOffer[peerId]) {
                        console.log('Ignoring offer from peer', peerId, 'due to collision (impolite peer)');
                        return;
                    }

                    // Perfect Negotiation: Handle rollback for polite peer (not applicable to server)
                    self.isSettingRemoteAnswerPending[peerId] = desc.type === 'answer';
                    await peerConnection.setRemoteDescription(desc);
                    self.isSettingRemoteAnswerPending[peerId] = false;

                    if (desc.type == "offer") {
                        await peerConnection.setLocalDescription();  // Creates answer automatically
                        self.signalingService.send({sdp: peerConnection.localDescription, remotePeerId: peerId}, self.peerId, 'webrtc');
                    }
                } catch (error) {
                    console.error('SDP handling failed for peer', peerId, ':', error);
                    if (self.onerror) {
                        self.onerror(error, peerId);
                    }
                }
            } else if (data.candidate) {
                peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        }
        if (self.signalingHandlers && self.signalingHandlers.onmessage && typeof self.signalingHandlers.onmessage === 'function') {
            self.signalingHandlers.onmessage(message);
        }
    };

    this._makeMessage = function(payload) {
        var CHUNK_SIZE = 50000;
        var rawData = JSON.stringify(payload),
            id = [this.peerId, Date.now(), Math.round(Math.random() * 10000)].join('-'),
            chunks = [],
            start = 0,
            stop = CHUNK_SIZE,
            length = rawData.length;

        while (stop < length) {
            chunks.push(JSON.stringify({
                id: id,
                seq: chunks.length,
                data: rawData.slice(start, stop)
            }));
            start = stop;
            stop += CHUNK_SIZE;
        }
        chunks.push(JSON.stringify({
            id: id,
            seq: chunks.length,
            isLast: true,
            data: rawData.slice(start, stop)
        }));
        return chunks;
    };

    this.disconnect = function(peerId) {
        if (peerId) {
            this.dataChannels[peerId].close();
            this.peerConnections[peerId].close();
            delete this.dataChannels[peerId];
            delete this.peerConnections[peerId];
        } else {
            var peerIds = Object.keys(this.dataChannels);
            for (var i = 0; i< peerIds.length; i++) {
                peerId = peerIds[i];
                this.dataChannels[peerId].close();
                this.peerConnections[peerId].close();
                delete this.dataChannels[peerId];
                delete this.peerConnections[peerId];
            }
        }
    };

    this.sendMessageToClient = function(message, peerId, retries) {
        retries = retries || 0;
        var dataChannel = this.dataChannels[peerId];
        if (dataChannel) {
            var chunks = this._makeMessage(message);
            for (var i = 0; i < chunks.length; i++) {
                if (["closing", "closed"].indexOf(dataChannel.readyState) != -1) {
                    if (retries >= this.MAX_RETRIES) {
                        delete this.dataChannels[peerId];
                        break;
                    } else {
                        var self = this;
                        setTimeout(function() {
                            self.sendMessageToClient(message, peerId, ++retries);
                        }, 500);
                    }
                } else {
                    dataChannel.send(chunks[i]);
                }
            }
        }
    };

    this.broadcastMessage = function(message) {
        for (var peerId in this.dataChannels) {
            if (this.dataChannels.hasOwnProperty(peerId)) {
                this.sendMessageToClient(message, peerId);
            }
        }
    };

    this._addStreamToPeerConnection = function (stream, peerConnection) {
        try {
            // Modern API: Add each track individually
            // onnegotiationneeded will be triggered automatically
            stream.getTracks().forEach(track => {
                peerConnection.addTrack(track, stream);
            });
        } catch (error) {
            console.error('Failed to add stream to peer', peerConnection.id, ':', error);
            if (self.onerror) {
                self.onerror(error, peerConnection.id);
            }
        }
    };

    this._removeStreamToPeerConnection = function (stream, peerConnection) {
        if (stream) {
            try {
                // Modern API: Remove each sender that matches the stream
                // onnegotiationneeded will be triggered automatically
                const senders = peerConnection.getSenders();
                senders.forEach(sender => {
                    if (sender.track && stream.getTracks().includes(sender.track)) {
                        peerConnection.removeTrack(sender);
                    }
                });
            } catch (error) {
                console.error('Failed to remove stream from peer', peerConnection.id, ':', error);
                if (self.onerror) {
                    self.onerror(error, peerConnection.id);
                }
            }
        }
    };

    this.attachStream = function(stream, peerId) {
        if (peerId) {
            this._addStreamToPeerConnection(stream, this._getPeerConnection(peerId));
        } else {
            for (peerId in this.peerConnections) {
                if (this.peerConnections.hasOwnProperty(peerId)) {
                    this._addStreamToPeerConnection(stream, this._getPeerConnection(peerId));
                }
            }
        }
    };

    this.detachStream = function(stream, peerId) {
        if (peerId) {
            this._removeStreamToPeerConnection(stream, this._getPeerConnection(peerId));
        } else {
            for (peerId in this.peerConnections) {
                if (this.peerConnections.hasOwnProperty(peerId)) {
                    this._removeStreamToPeerConnection(stream, this._getPeerConnection(peerId));
                }
            }
        }
    };

    this.lockRoom = function(id) {
        var message = {msgId: Date.now(), id: id};
        this.signalingService.send(message, id, 'lock');
        return message.msgId;
    };

    this.unlockRoom = function(id) {
        this.signalingService.init();
        var message = {msgId: Date.now(), id: id};
        this.signalingService.send(message, id, 'unlock');
        return message.msgId;
    };
};
