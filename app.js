
var express = require('express');
var app = express();
var port = 1337;

var compression = require('compression');
app.use(compression({ filter : () => {true} }));

var cookieParser = require('cookie-parser');
app.use(cookieParser());



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
