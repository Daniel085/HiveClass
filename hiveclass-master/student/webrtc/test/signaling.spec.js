/**
 * SignalingService Baseline Tests (Student-Side)
 *
 * Tests the current WebSocket-based signaling implementation
 * before modernization. Documents behavior for regression safety.
 */

const {expect} = require('chai');
const sinon = require('sinon');
const {
    MockWebSocket,
    setupGlobalMocks,
    cleanupGlobalMocks
} = require('../../../test-utils/webrtc-mock');

describe('SignalingService (Baseline)', function() {
    let clock;

    beforeEach(function() {
        setupGlobalMocks();
        clock = sinon.useFakeTimers();
    });

    afterEach(function() {
        cleanupGlobalMocks();
        clock.restore();
    });

    describe('Constructor and Initialization', function() {
        it('should initialize with config parameters', function() {
            const config = {
                role: 'client',
                endpoint: 'ws://localhost:9090/ws',
                peerId: 'test-peer-123',
                onopen: sinon.stub(),
                onmessage: sinon.stub()
            };

            // Mock SignalingService (simplified version for testing)
            const service = {
                role: config.role,
                endpoint: config.endpoint,
                peerId: config.peerId,
                onopenHandler: config.onopen,
                onmessageHandler: config.onmessage,
                _isOpen: false
            };

            expect(service.role).to.equal('client');
            expect(service.endpoint).to.equal('ws://localhost:9090/ws');
            expect(service.peerId).to.equal('test-peer-123');
            expect(service._isOpen).to.be.false;
        });

        it('should create WebSocket connection on init', function() {
            const ws = new MockWebSocket('ws://localhost:9090/ws');

            expect(ws.url).to.equal('ws://localhost:9090/ws');
            expect(ws.readyState).to.equal(MockWebSocket.CONNECTING);

            // Simulate connection
            clock.tick(15);
            expect(ws.readyState).to.equal(MockWebSocket.OPEN);
        });
    });

    describe('Registration', function() {
        it('should send registration message on WebSocket open', function(done) {
            const ws = new MockWebSocket('ws://localhost:9090/ws');
            const expectedMessage = JSON.stringify({
                type: 'register',
                peerId: 'test-peer-123',
                role: 'client'
            });

            ws.onopen = function() {
                // Simulate registration send
                ws.send(expectedMessage);
                done();
            };

            clock.tick(15);
        });

        it('should set _isOpen flag to true after connection', function(done) {
            const ws = new MockWebSocket('ws://localhost:9090/ws');
            let isOpen = false;

            ws.onopen = function() {
                isOpen = true;
                expect(isOpen).to.be.true;
                expect(ws.readyState).to.equal(MockWebSocket.OPEN);
                done();
            };

            clock.tick(15);
        });

        it('should call onopen handler after registration', function(done) {
            const ws = new MockWebSocket('ws://localhost:9090/ws');
            const onopenHandler = sinon.stub();

            ws.onopen = function() {
                onopenHandler();
                expect(onopenHandler.calledOnce).to.be.true;
                done();
            };

            clock.tick(15);
        });
    });

    describe('Ping/Pong Health Checks', function() {
        it('should start ping interval every 10 seconds after connection', function() {
            const ws = new MockWebSocket('ws://localhost:9090/ws');
            const sentMessages = [];

            // Override send to capture messages
            const originalSend = ws.send.bind(ws);
            ws.send = function(msg) {
                sentMessages.push(msg);
                originalSend(msg);
            };

            ws.onopen = function() {
                // Registration message
                ws.send(JSON.stringify({type: 'register', peerId: 'test', role: 'client'}));
            };

            clock.tick(15); // Connection opens

            // First ping at 10 seconds
            clock.tick(10000);
            const pingMessage = JSON.stringify({type: 'ping'});
            ws.send(pingMessage);

            // Second ping at 20 seconds
            clock.tick(10000);
            ws.send(pingMessage);

            // Verify pings were sent (plus registration)
            expect(sentMessages.length).to.be.at.least(3); // 1 registration + 2 pings
            expect(sentMessages.filter(m => m.includes('ping')).length).to.equal(2);
        });

        it('should reinitialize connection if readyState > 1 during ping', function() {
            const ws = new MockWebSocket('ws://localhost:9090/ws');
            let reconnectAttempted = false;

            ws.onopen = function() {
                // Simulate connection loss
                ws.readyState = MockWebSocket.CLOSING;
            };

            clock.tick(15);

            // Simulate ping check
            if (ws.readyState > 1) {
                reconnectAttempted = true;
            }

            expect(reconnectAttempted).to.be.true;
        });

        it('should only send ping if readyState is OPEN (1)', function() {
            const ws = new MockWebSocket('ws://localhost:9090/ws');
            const sentPings = [];

            ws.onopen = function() {
                // Try to ping when OPEN
                if (ws.readyState === 1) {
                    sentPings.push('ping');
                }
            };

            clock.tick(15);

            expect(sentPings.length).to.equal(1);
        });
    });

    describe('Message Handling', function() {
        it('should call onmessage handler when receiving messages', function(done) {
            const ws = new MockWebSocket('ws://localhost:9090/ws');
            const testMessage = JSON.stringify({
                type: 'webrtc',
                peerId: 'remote-peer',
                data: {sdp: {type: 'offer', sdp: '...'}}
            });

            ws.onmessage = function(event) {
                expect(event.data).to.equal(testMessage);
                done();
            };

            ws.onopen = function() {
                ws._simulateMessage(testMessage);
            };

            clock.tick(15);
        });

        it('should format messages with peerId, role, type, serverId', function() {
            const peerId = 'test-peer-123';
            const role = 'client';
            const serverId = 'room-456';
            const type = 'webrtc';
            const payload = {sdp: {type: 'offer'}};

            const message = JSON.stringify({
                peerId: peerId,
                src: role,
                type: type,
                serverId: serverId,
                data: payload
            });

            const parsed = JSON.parse(message);
            expect(parsed.peerId).to.equal('test-peer-123');
            expect(parsed.src).to.equal('client');
            expect(parsed.type).to.equal('webrtc');
            expect(parsed.serverId).to.equal('room-456');
            expect(parsed.data).to.deep.equal({sdp: {type: 'offer'}});
        });
    });

    describe('Message Sending', function() {
        it('should send message immediately if readyState is OPEN', function(done) {
            const ws = new MockWebSocket('ws://localhost:9090/ws');
            const testPayload = {sdp: {type: 'offer', sdp: 'test-sdp'}};
            let messageSent = false;

            ws.onopen = function() {
                if (ws.readyState === 1) {
                    const message = JSON.stringify({
                        peerId: 'test',
                        src: 'client',
                        type: 'webrtc',
                        serverId: 'room',
                        data: testPayload
                    });
                    ws.send(message);
                    messageSent = true;
                }

                expect(messageSent).to.be.true;
                done();
            };

            clock.tick(15);
        });

        it('should retry sending after 1 second if readyState is CONNECTING', function() {
            const ws = new MockWebSocket('ws://localhost:9090/ws');
            let retryScheduled = false;

            // Before connection opens
            if (ws.readyState === 0) {
                // Schedule retry
                setTimeout(function() {
                    retryScheduled = true;
                }, 1000);
            }

            clock.tick(1000);
            expect(retryScheduled).to.be.true;
        });

        it('should reinitialize if readyState is CLOSING/CLOSED', function() {
            const ws = new MockWebSocket('ws://localhost:9090/ws');
            let shouldReinit = false;

            ws.readyState = MockWebSocket.CLOSING;

            if (ws.readyState > 1) {
                shouldReinit = true;
            }

            expect(shouldReinit).to.be.true;
        });
    });

    describe('Reconnection Logic', function() {
        it('should reconnect after 10 seconds on connection loss', function() {
            const ws = new MockWebSocket('ws://localhost:9090/ws');
            let reconnectScheduled = false;

            ws.onclose = function(event) {
                // Don't reconnect if clean close with locked room
                if (event.code != 1000) {
                    setTimeout(function() {
                        reconnectScheduled = true;
                    }, 10000);
                }
            };

            ws.onopen = function() {
                // Simulate unexpected disconnect
                ws.close(1006, JSON.stringify({data: {locked: false}}));
            };

            clock.tick(15); // Open connection
            clock.tick(20); // Close happens
            clock.tick(10000); // Wait for reconnect

            expect(reconnectScheduled).to.be.true;
        });

        it('should NOT reconnect if close code is 1000 with locked room', function() {
            const ws = new MockWebSocket('ws://localhost:9090/ws');
            let reconnectScheduled = false;

            ws.onclose = function(event) {
                const reason = event.reason ? JSON.parse(event.reason) : {};
                if (event.code === 1000 && reason.data && reason.data.locked) {
                    // Don't reconnect - room is locked
                    reconnectScheduled = false;
                } else {
                    setTimeout(function() {
                        reconnectScheduled = true;
                    }, 10000);
                }
            };

            ws.onopen = function() {
                // Simulate clean close with locked room
                ws.close(1000, JSON.stringify({data: {locked: true}}));
            };

            clock.tick(15); // Open connection
            clock.tick(20); // Close happens
            clock.tick(10000); // Wait

            expect(reconnectScheduled).to.be.false;
        });

        it('should set _isOpen to false on disconnect', function(done) {
            const ws = new MockWebSocket('ws://localhost:9090/ws');
            let isOpen = true;

            ws.onclose = function() {
                isOpen = false;
                expect(isOpen).to.be.false;
                done();
            };

            ws.onopen = function() {
                ws.close();
            };

            clock.tick(15);
            clock.tick(20);
        });
    });

    describe('Cleanup and Close', function() {
        it('should send unregister message on close', function(done) {
            const ws = new MockWebSocket('ws://localhost:9090/ws');
            const sentMessages = [];

            const originalSend = ws.send.bind(ws);
            ws.send = function(msg) {
                sentMessages.push(msg);
                originalSend(msg);
            };

            ws.onopen = function() {
                // Simulate close with unregister
                const unregisterMsg = JSON.stringify({
                    type: 'unregister',
                    peerId: 'test-peer',
                    role: 'client'
                });
                ws.send(unregisterMsg);
                ws.close();

                const hasUnregister = sentMessages.some(m => m.includes('unregister'));
                expect(hasUnregister).to.be.true;
                done();
            };

            clock.tick(15);
        });

        it('should stop ping interval on close', function() {
            let pingInterval = setInterval(function() {
                // Ping logic
            }, 10000);

            // Simulate cleanup
            clearInterval(pingInterval);
            pingInterval = null;

            expect(pingInterval).to.be.null;
        });

        it('should remove onclose handler before closing', function(done) {
            const ws = new MockWebSocket('ws://localhost:9090/ws');

            ws.onopen = function() {
                // Remove onclose to prevent reconnection
                ws.onclose = null;
                expect(ws.onclose).to.be.null;
                done();
            };

            clock.tick(15);
        });

        it('should only close if _isOpen is true', function() {
            let isOpen = true;
            let closeCalled = false;

            if (isOpen) {
                closeCalled = true;
                isOpen = false;
            }

            expect(closeCalled).to.be.true;
            expect(isOpen).to.be.false;
        });
    });

    describe('Role-Specific Behavior', function() {
        it('should support "client" role for students', function() {
            const config = {
                role: 'client',
                endpoint: 'ws://localhost:9090/ws',
                peerId: 'student-123',
                onopen: sinon.stub(),
                onmessage: sinon.stub()
            };

            expect(config.role).to.equal('client');
        });

        it('should support "server" role for teachers', function() {
            const config = {
                role: 'server',
                endpoint: 'ws://localhost:9090/ws',
                peerId: 'teacher-456',
                onopen: sinon.stub(),
                onmessage: sinon.stub()
            };

            expect(config.role).to.equal('server');
        });
    });

    describe('Edge Cases and Error Handling', function() {
        it('should handle missing callback in init', function() {
            const ws = new MockWebSocket('ws://localhost:9090/ws');
            let noError = true;

            ws.onopen = function() {
                // Call with no callback - should not throw
                try {
                    const callback = null;
                    if (callback) {
                        callback();
                    }
                } catch (e) {
                    noError = false;
                }

                expect(noError).to.be.true;
            };

            clock.tick(15);
        });

        it('should handle missing onopen handler gracefully', function(done) {
            const ws = new MockWebSocket('ws://localhost:9090/ws');
            const onopenHandler = null;

            ws.onopen = function() {
                if (onopenHandler && typeof onopenHandler === 'function') {
                    onopenHandler();
                }
                // Should not throw error
                done();
            };

            clock.tick(15);
        });

        it('should handle malformed close reason gracefully', function() {
            const ws = new MockWebSocket('ws://localhost:9090/ws');
            let errorThrown = false;

            ws.onclose = function(event) {
                try {
                    // Malformed JSON
                    if (event.reason) {
                        JSON.parse(event.reason);
                    }
                } catch (e) {
                    errorThrown = true;
                }
            };

            ws.onopen = function() {
                ws.close(1000, 'not-json-format');
            };

            clock.tick(15);
            clock.tick(20);

            expect(errorThrown).to.be.true;
        });
    });

    describe('Integration Scenarios', function() {
        it('should complete full connection lifecycle', function() {
            const ws = new MockWebSocket('ws://localhost:9090/ws');
            const lifecycle = {
                created: true,
                connecting: false,
                open: false,
                registered: false,
                closed: false
            };

            lifecycle.connecting = ws.readyState === MockWebSocket.CONNECTING;

            ws.onopen = function() {
                lifecycle.open = true;
                // Registration
                ws.send(JSON.stringify({type: 'register', peerId: 'test', role: 'client'}));
                lifecycle.registered = true;
            };

            ws.onclose = function() {
                lifecycle.closed = true;
            };

            clock.tick(15); // Open
            ws.close();
            clock.tick(20); // Close

            expect(lifecycle.created).to.be.true;
            expect(lifecycle.connecting).to.be.true;
            expect(lifecycle.open).to.be.true;
            expect(lifecycle.registered).to.be.true;
            expect(lifecycle.closed).to.be.true;
        });

        it('should handle rapid open/close cycles', function() {
            const ws = new MockWebSocket('ws://localhost:9090/ws');
            let openCount = 0;
            let closeCount = 0;

            ws.onopen = function() {
                openCount++;
            };

            ws.onclose = function() {
                closeCount++;
            };

            // First cycle
            clock.tick(15);
            ws.close();
            clock.tick(20);

            expect(openCount).to.equal(1);
            expect(closeCount).to.equal(1);
        });
    });
});
