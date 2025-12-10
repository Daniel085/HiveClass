process.title = 'router';

const config = require('./config');
const Hapi = require('@hapi/hapi');

const serverConfig = {
    host: config.server.host,
    port: config.server.port
};

const backends = config.backends;

function generateRoutes(upstreams) {
    const routes = [];
    for (const prefix in upstreams) {
        const upstream = upstreams[prefix];
        routes.push({
            path: '/' + prefix + '/{param*}',
            method: '*',
            config: {
                handler: {
                    proxy: {
                        host: upstream.host,
                        port: upstream.port,
                        protocol: upstream.protocol,
                        passThrough: upstream.passTrough || true,
                        xforward: true,
                        ttl: 'upstream'
                    }
                },
                state: {
                    failAction: 'ignore'
                }
            }
        });
    }
    return routes;
}

const init = async () => {
    const server = Hapi.server(serverConfig);

    server.ext('onRequest', (request, h) => {
        request.headers['x-public-host'] = request.headers.host;
        return h.continue;
    });

    await server.register([
        require('blipp'),
        require('@hapi/h2o2'),
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

    server.route(generateRoutes(backends));

    await server.start();
    console.log('Server listening on ' + serverConfig.host + ':' + serverConfig.port);
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init();
