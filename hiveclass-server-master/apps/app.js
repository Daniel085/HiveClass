process.title = 'apps';

const config = require('./config');
const Hapi = require('@hapi/hapi');
const path = require('path');

const serverConfig = {
    host: config.server.host,
    port: config.server.port,
    debug: {
        log: ['error'],
        request: ['error']
    }
};

const CONTEXT_ROOT = (config.server.contextRoot || '');
const REDIRECT_STATUSES = [301, 302, 303, 307];
const ENDPOINTS = [];

const generateAppRoute = function (appName, auth) {
    const appEndpoint = '/' + appName + '/';
    ENDPOINTS.push(appEndpoint);
    const appRoute = {
        method: ['GET'],
        path: appEndpoint + '{path*}',
        config: {
            handler: {
                directory: {
                    path: function() {
                        return path.join(config.server.appsRoot, appName);
                    },
                    index: true
                }
            },
            cache: {
                expiresIn: config.cache.ttl
            },
            state: {
                failAction: 'ignore'
            }
        }
    };
    if (auth) {
        appRoute.config.auth = auth;
    }
    return appRoute;
};

const init = async () => {
    const server = Hapi.server(serverConfig);

    server.ext('onRequest', (request, h) => {
        if (CONTEXT_ROOT) {
            request.path = request.path.replace(CONTEXT_ROOT, '');
        }
        return h.continue;
    });

    server.ext('onPreResponse', (request, h) => {
        if (REDIRECT_STATUSES.indexOf(request.response.statusCode) != -1 &&
            ENDPOINTS.indexOf(request.response.headers.location) != -1) {
            request.response.headers.location = CONTEXT_ROOT + request.response.headers.location;
        }
        return h.continue;
    });

    await server.register([
        require('@hapi/cookie'),
        require('blipp'),
        require('@hapi/inert'),
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

    server.auth.strategy('session', 'cookie', {
        cookie: {
            name: 'hiveschool_id',
            password: config.cookie.password,
            isSecure: config.cookie.is_secure,
            path: '/',
            clearInvalid: true
        },
        keepAlive: true,
        redirectTo: CONTEXT_ROOT + '/login/',
        appendNext: true
    });

    server.route(generateAppRoute('login'));
    server.route(generateAppRoute('teacher', 'session'));
    server.route(generateAppRoute('student', 'session'));

    await server.start();
    console.log('Server listening on ' + serverConfig.host + ':' + serverConfig.port);
    console.log('Serving apps from:', config.server.appsRoot);
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init();
