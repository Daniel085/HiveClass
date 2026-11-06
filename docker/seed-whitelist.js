// Allows sign-in from the email domains listed in DEV_WHITELIST_DOMAINS
// (a JSON array) by registering them under the "dev" client in the auth service.
// Safe to run repeatedly. Replaces the curl call that start.sh used to make.
var http = require('http');

var host = process.env.AUTH_HOST || 'auth';
var port = parseInt(process.env.AUTH_PORT || '8081', 10);
var token = process.env.ADMIN_BEARER_TOKEN || 'local_token';
var domains = process.env.DEV_WHITELIST_DOMAINS || '["gmail.com"]';

function call(method, path, body, callback) {
    var req = http.request({
        host: host, port: port, method: method, path: path,
        headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token }
    }, function(res) {
        res.resume();
        callback(null, res.statusCode);
    });
    req.on('error', callback);
    req.end(body);
}

function seed(attempt) {
    call('POST', '/auth/whitelist/dev', null, function(err, status) {
        if (err || status >= 500) {
            if (attempt >= 30) {
                console.error('Auth service not reachable:', err ? err.message : status);
                process.exit(1);
            }
            return setTimeout(function() { seed(attempt + 1); }, 1000);
        }
        call('PUT', '/auth/whitelist/dev/domains', domains, function(err, status) {
            if (err || status !== 204) {
                console.error('Failed to add domains:', err ? err.message : status);
                process.exit(1);
            }
            console.log('Sign-in allowed for domains:', domains);
        });
    });
}

seed(1);
