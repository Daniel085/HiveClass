var env = process.env;

if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    console.warn('WARNING: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set; Google sign-in will fail. See .env.example.');
}

module.exports = {
    server: {
        host: env.HOST || '0.0.0.0',
        port: parseInt(env.PORT || '8081', 10),
        contextRoot: '/auth'
    },
    providers: {
        google: {
            // Create an OAuth client at https://console.cloud.google.com/apis/credentials
            client_id: env.GOOGLE_CLIENT_ID || 'not-configured',
            client_secret: env.GOOGLE_CLIENT_SECRET || 'not-configured'
        }
    },
    cookie: {
        is_secure: env.COOKIE_SECURE === 'true',
        // Must match apps and storage. Dev-only default; set COOKIE_PASSWORD (32+ chars) for any real deployment.
        password: env.COOKIE_PASSWORD || 'dev-only-insecure-cookie-password-0000'
    },
    forceHttps: env.FORCE_HTTPS === 'true',
    mongodbUrl: env.MONGODB_URL || 'mongodb://localhost:27017/auth',
    // Token for the /auth/whitelist admin API.
    bearerToken: env.ADMIN_BEARER_TOKEN || 'local_token',
    loginUrl: (env.PUBLIC_URL || 'http://localhost:8080') + '/apps/login/',
    oauthLocation: env.PUBLIC_URL || 'http://localhost:8080'
};
