process.title = 'rendezvous';

const { WebSocketServer } = require('ws');
const Hapi = require('@hapi/hapi');
const roomRepository = new (require('./repositories/room').RoomRepository)();
const codeRepository = new (require('./repositories/code').CodeRepository)();
const roomService = new (require('./services/room').RoomService)(roomRepository, codeRepository);
const webrtcService = new (require('./services/webrtc').WebrtcService)(roomService);

const PORT = 9090;

// WebSocket Server for WebRTC signaling
const wss = new WebSocketServer({ port: PORT }, function() {
    const address = wss._server.address();
    console.log('WebSocket server listening on', [address.address, address.port].join(':'));
});

const clients = {};

wss.on('connection', function(socket) {
    socket.id = Date.now() + '-' + Math.round(Math.random() * 1000000);
    clients[socket.id] = socket;
    const pingInterval = setInterval(function() {
        socket.ping();
    }, 5000);
    socket.on('close', function() {
        delete clients[socket.id];
        clearInterval(pingInterval);
    });
    socket.on('message', function(payload) {
        try {
            if (process.env.DEBUG) {
                console.log(payload);
            }
            const message = JSON.parse(payload);
            if (message.type) {
                switch (message.type) {
                    case 'presence':
                        handlePresenceMessage(message, socket)
                            .then(function(data) {
                                if (data) {
                                    socket.send(makeDataResponse(message.source, message.id, message.type, data));
                                } else {
                                    socket.send(makeEmptyResponse(message.source, message.id, message.type));
                                }
                            }, function(err) {
                                socket.send(makeErrorResponse(message.source, message.id, message.type, err, message));
                            });
                        break;
                    case 'webrtc':
                        handleWebrtcMessage(message, socket)
                            .then(function(data) {
                                if (data) {
                                    socket.send(makeDataResponse(message.source, message.id, message.type, data));
                                } else {
                                    socket.send(makeEmptyResponse(message.source, message.id, message.type));
                                }
                            }, function(err) {
                                console.log(err);
                                socket.send(makeErrorResponse(message.source, message.id, message.type, err, message));
                            });
                        break;
                    default:
                        console.log('Unknown message type:', message.type, message);
                        break;
                }
            }
        } catch (err) {
            console.log(err.stack);
        }
    });
});

function signalRoomChange(socket) {
    for (const socketId in clients) {
        if (clients.hasOwnProperty(socketId) && socketId != socket.id) {
            clients[socketId].send(makeDataResponse('', '', 'roomChange', ''));
        }
    }
}

function handlePresenceMessage(message, socket) {
    switch(message.cmd) {
        case 'createRoom':
            return roomService.create(message.data, socket)
                .then(function(data) {
                    signalRoomChange(socket);
                    return data;
                });
        case 'lock':
            return roomService.lock(message.data.id);
        case 'unlock':
            return roomService.unlock(message.data.id);
        case 'listRooms':
            return roomService.listRooms();
        case 'findRoomByCode':
            return roomService.findRoomByCode(message.data.code);
        case 'getRoom':
            return roomService.get(message.data.id);
        case 'closeRoom':
            return roomService.close(message.data.id)
                .then(function(data) {
                    signalRoomChange(socket);
                    return data;
                });
        default:
            const errorMessage = 'Unknown cmd: ' + message.cmd;
            console.log(errorMessage);
            return Promise.reject(new Error(errorMessage));
    }
}

function handleWebrtcMessage(message, socket) {
    switch (message.cmd) {
        case 'offer':
            return webrtcService.sendOfferToRoomOwner(message, socket);
        case 'answer':
            return webrtcService.sendAnswerToClient(message, socket);
        case 'candidates':
            return webrtcService.sendCandidates(message);
        default:
            const errorMessage = 'Unknown cmd: ' + message.cmd;
            console.log(errorMessage);
            return Promise.reject(new Error(errorMessage));
    }
}

function makeDataResponse(source, id, type, data) {
    return JSON.stringify({id: id, source: source, type: type, success: true, data: data});
}

function makeEmptyResponse(source, id, type) {
    return JSON.stringify({id: id, source: source, type: type, success: true});
}

function makeErrorResponse(source, id, type, err, message) {
    return JSON.stringify({id: id, source: source, type: type, success: false, error: err.message, cause: err.cause, request: message});
}

// HTTP REST API Server
const initHapiServer = async () => {
    const serverConfig = {
        host: '0.0.0.0',
        port: 10000 + PORT,
        debug: {
            log: ['error'],
            request: ['error']
        }
    };

    const server = Hapi.server(serverConfig);

    await server.register([
        require('blipp'),
        {
            plugin: require('@hapi/good'),
            options: {
                ops: {
                    interval: 5000
                },
                reporters: {
                    console: [
                        {
                            module: '@hapi/good-console',
                            args: [{ log: 'error', response: 'error', request: 'error' }]
                        },
                        'stdout'
                    ]
                }
            }
        }
    ]);

    server.route({
        method: 'GET',
        path: '/classroom',
        options: {
            handler: async (request, h) => {
                const rooms = await roomService.listRooms();
                const roomIds = rooms.roomIds;
                const roomsPromises = roomIds.map(roomId => roomService.get(roomId));
                return Promise.all(roomsPromises);
            },
            state: {
                failAction: 'ignore'
            }
        }
    });

    await server.start();
    console.log('Server listening on 0.0.0.0:' + serverConfig.port);
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

initHapiServer();
