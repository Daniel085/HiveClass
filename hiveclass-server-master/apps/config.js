var env = process.env;

module.exports = {
    server: {
        host: env.HOST || '0.0.0.0',
        port: parseInt(env.PORT || '8082', 10),
        contextRoot: '/apps',
        appsRoot: env.APPS_ROOT || __dirname
    },
    authenticationEndpoint: '/auth/google',
    cookie: {
        is_secure: env.COOKIE_SECURE === 'true',
        // Must match auth and storage. Dev-only default; set COOKIE_PASSWORD (32+ chars) for any real deployment.
        password: env.COOKIE_PASSWORD || 'dev-only-insecure-cookie-password-0000'
    },
    cache: {
        ttl: 0
    }
};
