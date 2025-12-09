/**
 * WebRTC Mock Utilities for Testing
 *
 * Provides mock implementations of WebRTC APIs to enable unit testing
 * without requiring actual peer connections.
 */

/**
 * Mock RTCPeerConnection
 * Simulates the behavior of the real RTCPeerConnection API
 */
class MockRTCPeerConnection {
    constructor(configuration) {
        this.configuration = configuration;
        this.localDescription = null;
        this.remoteDescription = null;
        this.signalingState = 'stable';
        this.iceConnectionState = 'new';
        this.iceGatheringState = 'new';
        this.connectionState = 'new';
        this._senders = [];
        this._receivers = [];
        this._dataChannels = [];

        // Event handlers
        this.onicecandidate = null;
        this.onnegotiationneeded = null;
        this.ontrack = null;
        this.onaddstream = null;  // Deprecated but still in use
        this.ondatachannel = null;
        this.oniceconnectionstatechange = null;
        this.onconnectionstatechange = null;
    }

    /**
     * Create SDP offer (supports both callback and Promise APIs)
     */
    createOffer(successCallback, errorCallback, options) {
        const offer = {
            type: 'offer',
            sdp: 'v=0\r\no=- 1234567890 1234567890 IN IP4 127.0.0.1\r\n...'
        };

        // If callback provided, use callback pattern (deprecated API)
        if (typeof successCallback === 'function') {
            setTimeout(() => {
                successCallback(offer);
            }, 0);
        } else {
            // Return Promise (modern API)
            return Promise.resolve(offer);
        }
    }

    /**
     * Create SDP answer (supports both callback and Promise APIs)
     */
    createAnswer(successCallback, errorCallback, options) {
        const answer = {
            type: 'answer',
            sdp: 'v=0\r\no=- 9876543210 9876543210 IN IP4 127.0.0.1\r\n...'
        };

        // If callback provided, use callback pattern (deprecated API)
        if (typeof successCallback === 'function') {
            setTimeout(() => {
                successCallback(answer);
            }, 0);
        } else {
            // Return Promise (modern API)
            return Promise.resolve(answer);
        }
    }

    /**
     * Set local description (supports both callback and Promise APIs)
     */
    setLocalDescription(description, successCallback, errorCallback) {
        // If callback provided, use callback pattern (deprecated API)
        if (typeof successCallback === 'function') {
            setTimeout(() => {
                this.localDescription = description;
                this.signalingState = description.type === 'offer' ? 'have-local-offer' : 'stable';
                successCallback();
            }, 0);
        } else {
            // Return Promise (modern API)
            this.localDescription = description;
            this.signalingState = description.type === 'offer' ? 'have-local-offer' : 'stable';
            return Promise.resolve();
        }
    }

    /**
     * Set remote description (supports both callback and Promise APIs)
     */
    setRemoteDescription(description, successCallback, errorCallback) {
        // If callback provided, use callback pattern (deprecated API)
        if (typeof successCallback === 'function') {
            setTimeout(() => {
                this.remoteDescription = description;
                this.signalingState = description.type === 'offer' ? 'have-remote-offer' : 'stable';
                successCallback();
            }, 0);
        } else {
            // Return Promise (modern API)
            this.remoteDescription = description;
            this.signalingState = description.type === 'offer' ? 'have-remote-offer' : 'stable';
            return Promise.resolve();
        }
    }

    /**
     * Add ICE candidate
     */
    addIceCandidate(candidate) {
        // Simulate adding ICE candidate
        return Promise.resolve();
    }

    /**
     * Create data channel
     */
    createDataChannel(label, options) {
        const dataChannel = new MockRTCDataChannel(label, options);
        this._dataChannels.push(dataChannel);
        return dataChannel;
    }

    /**
     * Add stream (deprecated API)
     */
    addStream(stream) {
        // Simulate adding stream
        stream.getTracks().forEach(track => {
            const sender = { track, stream };
            this._senders.push(sender);
        });
    }

    /**
     * Remove stream (deprecated API)
     */
    removeStream(stream) {
        this._senders = this._senders.filter(sender => sender.stream !== stream);
    }

    /**
     * Add track (modern API)
     */
    addTrack(track, stream) {
        const sender = { track, stream };
        this._senders.push(sender);
        return sender;
    }

    /**
     * Remove track (modern API)
     */
    removeTrack(sender) {
        const index = this._senders.indexOf(sender);
        if (index !== -1) {
            this._senders.splice(index, 1);
        }
    }

    /**
     * Get senders
     */
    getSenders() {
        return this._senders;
    }

    /**
     * Get receivers
     */
    getReceivers() {
        return this._receivers;
    }

    /**
     * Close connection
     */
    close() {
        this.signalingState = 'closed';
        this.iceConnectionState = 'closed';
        this.connectionState = 'closed';
        this._dataChannels.forEach(dc => dc.close());
    }

    /**
     * Simulate ICE candidate event
     */
    _simulateIceCandidate() {
        if (this.onicecandidate) {
            this.onicecandidate({
                candidate: {
                    candidate: 'candidate:1 1 UDP 2130706431 192.168.1.1 54321 typ host',
                    sdpMLineIndex: 0,
                    sdpMid: '0'
                }
            });
        }
    }

    /**
     * Simulate negotiation needed event
     */
    _simulateNegotiationNeeded() {
        if (this.onnegotiationneeded) {
            this.onnegotiationneeded();
        }
    }
}

/**
 * Mock RTCDataChannel
 */
class MockRTCDataChannel {
    constructor(label, options) {
        this.label = label;
        this.protocol = options?.protocol || '';
        this.readyState = 'connecting';
        this.bufferedAmount = 0;
        this.bufferedAmountLowThreshold = 0;

        // Event handlers
        this.onopen = null;
        this.onclose = null;
        this.onmessage = null;
        this.onerror = null;
        this.onbufferedamountlow = null;

        // Simulate opening after a short delay
        setTimeout(() => {
            this.readyState = 'open';
            if (this.onopen) {
                this.onopen();
            }
        }, 10);
    }

    /**
     * Send data
     */
    send(data) {
        if (this.readyState !== 'open') {
            throw new Error('Data channel is not open');
        }
        // Simulate sending (in real tests, you'd capture this)
        this.bufferedAmount += data.length;

        // Simulate buffer drain
        setTimeout(() => {
            this.bufferedAmount = 0;
            if (this.onbufferedamountlow) {
                this.onbufferedamountlow();
            }
        }, 1);
    }

    /**
     * Close data channel
     */
    close() {
        this.readyState = 'closing';
        setTimeout(() => {
            this.readyState = 'closed';
            if (this.onclose) {
                this.onclose();
            }
        }, 1);
    }

    /**
     * Simulate receiving message
     */
    _simulateMessage(data) {
        if (this.onmessage) {
            this.onmessage({ data });
        }
    }
}

/**
 * Mock RTCSessionDescription
 */
class MockRTCSessionDescription {
    constructor(descriptionInitDict) {
        this.type = descriptionInitDict.type;
        this.sdp = descriptionInitDict.sdp;
    }
}

/**
 * Mock RTCIceCandidate
 */
class MockRTCIceCandidate {
    constructor(candidateInitDict) {
        this.candidate = candidateInitDict.candidate;
        this.sdpMLineIndex = candidateInitDict.sdpMLineIndex;
        this.sdpMid = candidateInitDict.sdpMid;
    }
}

/**
 * Mock WebSocket
 */
class MockWebSocket {
    constructor(url, protocols) {
        this.url = url;
        this.protocols = protocols;
        this.readyState = MockWebSocket.CONNECTING;
        this.bufferedAmount = 0;

        // Event handlers
        this.onopen = null;
        this.onclose = null;
        this.onmessage = null;
        this.onerror = null;

        // Simulate connection after short delay
        setTimeout(() => {
            this.readyState = MockWebSocket.OPEN;
            if (this.onopen) {
                this.onopen({ target: this });
            }
        }, 10);
    }

    /**
     * Send data
     */
    send(data) {
        if (this.readyState !== MockWebSocket.OPEN) {
            throw new Error('WebSocket is not open');
        }
        // In real tests, you'd capture sent messages
    }

    /**
     * Close connection
     */
    close(code, reason) {
        this.readyState = MockWebSocket.CLOSING;
        setTimeout(() => {
            this.readyState = MockWebSocket.CLOSED;
            if (this.onclose) {
                this.onclose({ code: code || 1000, reason: reason || '', wasClean: true });
            }
        }, 1);
    }

    /**
     * Simulate receiving message
     */
    _simulateMessage(data) {
        if (this.onmessage) {
            this.onmessage({ data });
        }
    }
}

// WebSocket constants
MockWebSocket.CONNECTING = 0;
MockWebSocket.OPEN = 1;
MockWebSocket.CLOSING = 2;
MockWebSocket.CLOSED = 3;

/**
 * Mock MediaStream
 */
class MockMediaStream {
    constructor(tracks) {
        this.id = 'mock-stream-' + Math.random().toString(36).substr(2, 9);
        this._tracks = tracks || [];
    }

    getTracks() {
        return this._tracks;
    }

    getAudioTracks() {
        return this._tracks.filter(t => t.kind === 'audio');
    }

    getVideoTracks() {
        return this._tracks.filter(t => t.kind === 'video');
    }

    addTrack(track) {
        this._tracks.push(track);
    }

    removeTrack(track) {
        const index = this._tracks.indexOf(track);
        if (index !== -1) {
            this._tracks.splice(index, 1);
        }
    }
}

/**
 * Mock MediaStreamTrack
 */
class MockMediaStreamTrack {
    constructor(kind) {
        this.kind = kind || 'video';
        this.id = 'mock-track-' + Math.random().toString(36).substr(2, 9);
        this.label = 'Mock ' + this.kind + ' track';
        this.enabled = true;
        this.muted = false;
        this.readyState = 'live';

        this.onended = null;
        this.onmute = null;
        this.onunmute = null;
    }

    stop() {
        this.readyState = 'ended';
        if (this.onended) {
            this.onended();
        }
    }
}

/**
 * Setup global WebRTC mocks for testing
 */
function setupGlobalMocks() {
    global.RTCPeerConnection = MockRTCPeerConnection;
    global.RTCSessionDescription = MockRTCSessionDescription;
    global.RTCIceCandidate = MockRTCIceCandidate;
    global.RTCDataChannel = MockRTCDataChannel;
    global.WebSocket = MockWebSocket;
    global.MediaStream = MockMediaStream;
    global.MediaStreamTrack = MockMediaStreamTrack;

    // Also set webkitRTCPeerConnection for legacy code
    global.webkitRTCPeerConnection = MockRTCPeerConnection;
}

/**
 * Clean up global mocks
 */
function cleanupGlobalMocks() {
    delete global.RTCPeerConnection;
    delete global.RTCSessionDescription;
    delete global.RTCIceCandidate;
    delete global.RTCDataChannel;
    delete global.WebSocket;
    delete global.MediaStream;
    delete global.MediaStreamTrack;
    delete global.webkitRTCPeerConnection;
}

// Export mocks
module.exports = {
    MockRTCPeerConnection,
    MockRTCDataChannel,
    MockRTCSessionDescription,
    MockRTCIceCandidate,
    MockWebSocket,
    MockMediaStream,
    MockMediaStreamTrack,
    setupGlobalMocks,
    cleanupGlobalMocks
};
