var env = process.env;

module.exports = {
    server: {
        host: env.HOST || 'localhost',
        port: parseInt(env.PORT || '8084', 10)
    }
};
