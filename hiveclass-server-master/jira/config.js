var env = process.env;

module.exports = {
    server: {
        host: env.HOST || 'localhost',
        port: parseInt(env.PORT || '8083', 10)
    },
    upstream: {
        host:           env.JIRA_HOST || 'montage.atlassian.net',
        protocol:       'https',
        // e.g. 'Basic <base64 user:password>'
        authorization:  env.JIRA_AUTHORIZATION || ''
    }
};
