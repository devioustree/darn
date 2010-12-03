var io = require('socket.io');
var express = require('express');
var fs = require('fs');
var sys = require('sys');

var app = express.createServer();

app.get('/', function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    fs.readFile(process.cwd() + '/test.html', function(err, data) {
        res.end(data);
    })
});
app.get('/darn.js', function(req, res) {
    fs.readFile(process.cwd() + '/lib/darn.js', function(err, data) {
        res.send(data);
    })
});
app.listen(8000);

var socket = io.listen(app);

socket.on('connection', function(client) {
    client.on('message', function(msg) {
        console.log('Got message: ' + sys.inspect(msg));
        
        if (msg.method === 'GET') {
            client.send({
                sequenceId : msg.sequenceId,
                method : msg.method,
                obj : {
                    name : 'Tom'
                }
            })
        }
    });
});