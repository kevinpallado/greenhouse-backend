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
const Gpio = require('onoff').Gpio;
const server = http.createServer(app);
const WebSocket = require('ws');
const s = new WebSocket.Server({ server: server, path: "/readings", noServer: true});

const gpio = require('onoff').Gpio;
const  waterpump = new gpio(19, 'out');
const lightcontrol = new gpio(26, 'out');
var client_connect = 0;
var client_data = [];
var waterpumpison = false;
var lightcontrolison = false;

require('dns').lookup(require('os').hostname(), function (err, add, fam) {
    console.log('addr: ' + add);
});
app.use('/greenhouse', routes);

function noop() {
}

function heartbeat() {
  this.isAlive = true;
}

function soilLogControls(soilmoisture)
{
    if(soilmoisture < 150)
    {
        if(!waterpumpison)
        {
            console.log("Pump is on");
            waterpump.writeSync(1);
            waterpumpison = true;
            var http_post_req = {
                method: 'post',
                body: {
                    component : "Waterpump",
                    state : 1
               },
               json: true,
               url: "http://127.0.1.1:3000/greenhouse/event?event=control-logs"
            }
            
            request(http_post_req, function (err, res, body) {
               if (err) throw err;
               console.log("throwing log status")
               console.log(res.statusCode);
            })
        }
    }
    else
    {
        if(waterpumpison)
        {
            waterpump.writeSync(0);
            var http_post_req = {
                method: 'post',
                body: {
                    component : "Waterpump",
                    state : 0
               },
               json: true,
               url: "http://127.0.1.1:3000/greenhouse/event?event=control-logs"
            }
            
            request(http_post_req, function (err, res, body) {
               if (err) throw err;
               console.log("throwing log status")
               console.log(res.statusCode);
            })
            waterpumpison = false;
        }
        
    }
}

function lightLogControls(lightintesity)
{
    if(lightintesity < 30)
    {
        if(!lightcontrolison)
        {
            lightcontrol.writeSync(1);
            lightcontrolison = true;
            
            var http_post_req = {
                method: 'post',
                body: {
                    component : "LED Lights",
                    state : 1
               },
               json: true,
               url: "http://127.0.1.1:3000/greenhouse/event?event=control-logs"
            }
            
            request(http_post_req, function (err, res, body) {
               if (err) throw err;
               console.log("throwing log status")
               console.log(res.statusCode);
            })
        }
    }
    else
    {
        if(lightcontrolison)
        {
            lightcontrol.writeSync(0);
            var http_post_req = {
                method: 'post',
                body: {
                    component : "LED Lights",
                    state : 1
               },
               json: true,
               url: "http://127.0.1.1:3000/greenhouse/event?event=control-logs"
            }
            
            request(http_post_req, function (err, res, body) {
               if (err) throw err;
               console.log("throwing log status")
               console.log(res.statusCode);
            })
            lightcontrolison = false;
        }
    }
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
            lightLogControls(msg_parse.lightI);
            soilLogControls(msg_parse.soilM);
            // msg_parse.soilM < 150 ? waterpump.writeSync(1) : waterpump.writeSync(0);
            // msg_parse.lightI < 30 ? lightcontrol.writeSync(1) : lightcontrol.writeSync(0);

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
    console.log("create post every 5 seconds");
    client_data.forEach(data => {
       // console.log()
        var http_post_req = {
        method: 'post',
        body: {
            nodepos : "P1",
       //     temc : 12.54,
       //     humidity : 12,
        //    soilm : 13,
         //   lightInt : 123
            tempc : data.tempc,
            humidity : data.humidity,
            soilm : data.soilm,
            lightInt: data.lightInt
       },
       json: true,
       url: "http://127.0.1.1:3000/greenhouse/event?event=sensor-readings"
    }
    
    request(http_post_req, function (err, res, body) {
       if (err) throw err;
       console.log(res.statusCode);
    })
});
});
server.listen(3000);
