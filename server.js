const express = require('express'),
    bodyParser = require('body-parser'),
    http = require('http'),
    routes = require('./routes/routes'),
    crypto = require('crypto'),
    static = require('node-static'),
    request = require('request'),
    path = require('path'),
    cron = require('node-cron'),
    file = new static.Server('./'),
    app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
var Gpio = require('onoff').Gpio;
const server = http.createServer(app);
const WebSocket = require('ws');
const s = new WebSocket.Server({ server: server, path: "/readings", noServer: true});

var client_connect = 0;
var client_data = [];

require('dns').lookup(require('os').hostname(), function (err, add, fam) {
    console.log('addr: ' + add);
});
app.use('/greenhouse', routes);

function noop() {
}

function heartbeat() {
  this.isAlive = true;
}

s.on('connection', function (ws, req) {
    ws.isAlive = true;
    client_connect++;
    ws.on('message', function (message) {
        
        s.clients.forEach(function (client) { //broadcast incoming message to all clients (s.clients)1
            if (client.isAlive === false) return client.terminate();
            ws.isAlive = false;
            ws.ping(noop);

            var msg_parse = JSON.parse(message);
            client_data = [];
            for(x=0; x < client_connect; x++)
            {
                client_data.push({ tempc: msg_parse.tempC, humidity: msg_parse.humid, soilm: msg_parse.soilM, lightInt: msg_parse.lightI });
            }
            console.log(client_connect);
            });
    });
    ws.on('close', function () {
        client_connect--;
        console.log(client_connect);
        console.log("lost one client");
    });
    console.log(client_connect);
    console.log("new client connected");
    ws.on('pong', heartbeat);
});

cron.schedule('*/5 * * * * *', () => {
    client_data.forEach(data => {
        console.log()
        var http_post_req = {
        method: 'post',
        body: {
            nodepos : "P1",
            tempc : data.tempc,
            humidity : data.humidity,
            soilm : data.soilm,
            lightInt: data.lightInt
       },
       json: true,
       url: "http://localhost:3000/greenhouse/event?event=sensor-readings"
    }
    
    request(http_post_req, function (err, res, body) {
       if (err) throw err;
       console.log(res.statusCode);
    })
});
});
server.listen(3000);
