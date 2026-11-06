var env = process.env;

function backend(name, defaultPort) {
    var prefix = name.toUpperCase();
    return {
        host: env[prefix + '_HOST'] || 'localhost',
        port: parseInt(env[prefix + '_PORT'] || defaultPort, 10),
        protocol: 'http'
    };
}

module.exports = {
    server: {
        host: env.HOST || 'localhost',
        port: parseInt(env.PORT || '8088', 10)
    },
    backends: {
        auth: backend('auth', '8081'),
        // /google/* is served by the auth service.
        google: backend('auth', '8081'),
        apps: backend('apps', '8082'),
        jira: backend('jira', '8083'),
        logging: backend('logging', '8084'),
        storage: backend('storage', '8085')
    }
};
