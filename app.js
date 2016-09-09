require('pmx').init({
    http          : true, // HTTP routes logging (default: false)
    http_latency  : 200,  // Limit of acceptable latency
    http_code     : 500,  // Error code to track'
    alert_enabled : false,  // Enable alerts (If you add alert subfield in custom it's going to be enabled)
    ignore_routes : [], // Ignore http routes with this pattern (default: [])
    errors        : true, // Exceptions loggin (default: true)
    custom_probes : true, // Auto expose JS Loop Latency and HTTP req/s as custom metrics (default: true)
    network       : true, // Network monitoring at the application level (default: false)
    ports         : true  // Shows which ports your app is listening on (default: false)
});

var express = require('express');
var app = express();
var port = 1337;

var compression = require('compression');
app.use(compression({ filter : () => {true} }));

var cookieParser = require('cookie-parser');
app.use(cookieParser());

var st = require('st');


var mount = st({
    path : __dirname + '/public',
    url : '/',

    index: false, // use 'index.html' file as the index
    dot: false, // default: return 403 for any url with a dot-file part
    passthrough: true, // calls next/returns instead of returning a 404 error
    gzip: true, // default: compresses the response with gzip compression
    cors: false // default: static assets not accessible from other domains
});


app.use(mount);

var metrics = require('./metrics');

var pmxActions = require('./pmxActions');

var userManager = require('./UserManager')({
    metrics : metrics
});

app.use(userManager.middleware);

var Controller = require('./Controller')({
    userManager : userManager,
    metrics : metrics,
    pmxAction : pmxActions
});

process.on('uncaughtException', function (err) {
    console.log('uncaught error ',err);
});

Object.keys(Controller).forEach((route) => {
    app.get(route, Controller[route]);
});

app.listen(port, function () {
    console.log(`Example app listening on port ${port}!`);
});
