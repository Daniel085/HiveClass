var env = process.env;

module.exports = {
    server: {
        host: env.HOST || '0.0.0.0',
        port: parseInt(env.PORT || '8085', 10),
        contextRoot: '/storage'
    },
    providers: {
        google: {
            client_id: env.GOOGLE_CLIENT_ID || 'not-configured',
            client_secret: env.GOOGLE_CLIENT_SECRET || 'not-configured'
        }
    },
    authenticationEndpoint: '/auth/google',
    cookie: {
        is_secure: env.COOKIE_SECURE === 'true',
        // Must match apps and auth. Dev-only default; set COOKIE_PASSWORD (32+ chars) for any real deployment.
        password: env.COOKIE_PASSWORD || 'dev-only-insecure-cookie-password-0000'
    },
    mongodbUrl: env.MONGODB_URL || 'mongodb://localhost:27017/storage'
};
