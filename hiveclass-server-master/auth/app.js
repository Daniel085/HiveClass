process.title = 'auth';
const PROFILE_COOKIE = 'hiveschool_id';
const TOKENS_COOKIE = 'hiveschool_tokens';
const AUTH_COOKIE = 'hiveschool_auth';

const config = require('./config');
const Hapi = require('@hapi/hapi');
const Wreck = require('@hapi/wreck');
const WhitelistService = require('./lib/whitelist').WhitelistService;

const serverConfig = {
    host: config.server.host,
    port: config.server.port,
    debug: {
        log: ['error'],
        request: ['error']
    },
    state: {
        strictHeader: false
    }
};

const CONTEXT_ROOT = (config.server.contextRoot || '');

function extractDomain(profile) {
    if (profile) {
        return profile.raw.hd || profile.email.split('@').reverse()[0];
    }
}

const init = async () => {
    const server = Hapi.server(serverConfig);

    const whitelistService = new WhitelistService(config.mongodbUrl);

    server.state(PROFILE_COOKIE, {
        isSecure: config.cookie.is_secure,
        isHttpOnly: true,
        path: '/',
        encoding: 'iron',
        password: config.cookie.password
    });

    server.state(TOKENS_COOKIE, {
        isSecure: config.cookie.is_secure,
        isHttpOnly: false,
        path: '/',
        encoding: 'iron',
        password: config.cookie.password
    });

    server.ext('onRequest', (request, h) => {
        if (request.headers['x-public-host']) {
            request.info.host = request.headers['x-public-host'];
        }
        return h.continue;
    });

    await server.register([
        require('@hapi/bell'),
        require('@hapi/cookie'),
        require('hapi-auth-bearer-token'),
        require('@hapi/inert'),
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

    server.auth.strategy('google', 'bell', {
        cookie: AUTH_COOKIE,
        provider: 'google',
        clientId: config.providers.google.client_id,
        clientSecret: config.providers.google.client_secret,
        password: 'google' + config.cookie.password,
        isSecure: config.cookie.is_secure,
        forceHttps: config.forceHttps,
        location: config.oauthLocation,
        scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/drive.appfolder'
        ],
        providerParams: {
            access_type: 'offline'
        }
    });

    server.auth.strategy('session', 'cookie', {
        cookie: {
            name: 'session',
            password: 'session' + config.cookie.password,
            isSecure: config.cookie.is_secure,
            isHttpOnly: false,
            path: '/'
        }
    });

    server.auth.strategy('bearer', 'bearer-access-token', {
        allowQueryToken: false,
        validate: async (request, token, h) => {
            const isValid = token === config.bearerToken;
            const credentials = { token: token };
            return { isValid, credentials };
        }
    });

    server.route({
        method: ['GET', 'POST'],
        path: CONTEXT_ROOT + '/google',
        options: {
            auth: {
                strategies: ['session', 'google'],
                mode: 'try'
            },
            handler: async (request, h) => {
                if (request.auth.isAuthenticated) {
                    request.cookieAuth.clear();

                    const isAuthorized = await whitelistService.isDomainAuthorized(extractDomain(request.auth.credentials.profile));
                    const credentials = request.auth.credentials;
                    let response;

                    if (isAuthorized) {
                        const nextLocation = credentials.query.next || request.query.next;
                        response = h.redirect(nextLocation);

                        const profile = {
                            id: credentials.profile.id,
                            email: credentials.profile.email,
                            gender: credentials.profile.raw.gender,
                            firstname: credentials.profile.name.first,
                            lastname: credentials.profile.name.last,
                            avatar: credentials.profile.raw.picture
                        };
                        response.state(PROFILE_COOKIE, profile);

                        const tokens = {
                            access: credentials.token,
                            refresh: credentials.refreshToken,
                            expires: Date.now() + (credentials.expiresIn * 1000)
                        };
                        response.state(TOKENS_COOKIE, tokens);
                    } else {
                        await Wreck.get('https://accounts.google.com/o/oauth2/revoke?token=' + credentials.token);
                        console.log('Unauthorized domain:', credentials.profile.raw.hd, 'for user', credentials.profile.email);
                        response = h.redirect(config.loginUrl + '?cause=forbidden-hd').unstate(AUTH_COOKIE);
                    }
                    return response;
                } else {
                    console.log(request);
                    return h.redirect(config.loginUrl + '?cause=unauthorized');
                }
            },
            state: {
                failAction: 'ignore'
            }
        }
    });

    server.route({
        method: 'GET',
        path: CONTEXT_ROOT + '/check',
        options: {
            handler: (request, h) => {
                const tokenCookie = request.state[TOKENS_COOKIE];
                const statusCode = (tokenCookie && tokenCookie.refresh && tokenCookie.refresh.length > 0) ? 204 : 402;
                return h.response().code(statusCode);
            },
            state: {
                failAction: 'ignore'
            }
        }
    });

    server.route({
        method: 'GET',
        path: CONTEXT_ROOT + '/invalidate',
        options: {
            handler: async (request, h) => {
                const tokenCookie = request.state[TOKENS_COOKIE];
                if (tokenCookie && tokenCookie.access) {
                    await Wreck.get('https://accounts.google.com/o/oauth2/revoke?token=' + tokenCookie.access);
                }
                return h.response().code(204).unstate(PROFILE_COOKIE).unstate(TOKENS_COOKIE).unstate(AUTH_COOKIE);
            },
            state: {
                failAction: 'ignore'
            }
        }
    });

    server.route({
        method: 'GET',
        path: CONTEXT_ROOT + '/me',
        options: {
            handler: (request, h) => {
                return h.response(request.state[PROFILE_COOKIE]).type('application/json');
            },
            state: {
                failAction: 'ignore'
            }
        }
    });

    server.route({
        method: 'POST',
        path: CONTEXT_ROOT + '/whitelist/{clientName}',
        options: {
            auth: 'bearer',
            handler: async (request, h) => {
                const clientName = request.params.clientName;
                const code = await whitelistService.createClient(clientName);
                let response = h.response().code(code);

                if (code < 400 && request.payload) {
                    await whitelistService.addDomainsToClient(clientName, request.payload);
                }
                return response;
            },
            state: {
                failAction: 'ignore'
            }
        }
    });

    server.route({
        method: 'PUT',
        path: CONTEXT_ROOT + '/whitelist/{clientName}/domains',
        options: {
            auth: 'bearer',
            handler: async (request, h) => {
                const clientName = request.params.clientName;
                const code = await whitelistService.addDomainsToClient(clientName, request.payload);
                return h.response().code(code);
            },
            state: {
                failAction: 'ignore'
            }
        }
    });

    server.route({
        method: 'PUT',
        path: CONTEXT_ROOT + '/whitelist/{clientName}/active',
        options: {
            auth: 'bearer',
            handler: async (request, h) => {
                const clientName = request.params.clientName;
                const code = await whitelistService.setClientActiveStatus(clientName, request.payload);
                return h.response().code(code);
            },
            state: {
                failAction: 'ignore'
            }
        }
    });

    server.route({
        method: 'GET',
        path: CONTEXT_ROOT + '/whitelist',
        options: {
            auth: 'bearer',
            handler: async (request, h) => {
                return whitelistService.getClients();
            },
            state: {
                failAction: 'ignore'
            }
        }
    });

    server.route({
        method: 'GET',
        path: CONTEXT_ROOT + '/whitelist/{clientName}',
        options: {
            auth: 'bearer',
            handler: async (request, h) => {
                return whitelistService.getClient(request.params.clientName);
            },
            state: {
                failAction: 'ignore'
            }
        }
    });

    await server.start();
    console.log('Server listening on ' + serverConfig.host + ':' + serverConfig.port);
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init();
