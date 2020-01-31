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
const fogger = new gpio(14, 'out');
const lightcontrol = new gpio(26, 'out');
var client_connect = 0;
var client_data = [];

var foggerison = false;
var lightcontrolison = false;

var averageHumidtiy = 0;
var averageLightIntensity

require('dns').lookup(require('os').hostname(), function (err, add, fam) {
    console.log('addr: ' + add);
});
app.use('/greenhouse', routes);

function noop() {
}

function heartbeat() {
  this.isAlive = true;
}

async function foggerLogControl(humidity)
{
    if(humidity < 150)
    {
        if(!foggerison)
        {
            console.log("Fogger is on");
            fogger.writeSync(1);
            foggerison = true;
            var http_post_req = {
                method: 'post',
                body: {
                    component : "fogger",
                    state : 1
               },
               json: true,
               url: "http://127.0.1.1:3000/greenhouse/event?event=control-logs"
            }
            
	   return new Promise(function(resolve,reject) {
            request(http_post_req, function (err, res, body) {
               if (err) reject(err);
               console.log("throwing log status")
               console.log(res.statusCode);
               foggerison = true;
               resolve(foggerison);
            });
	   });
        }
    }
    else
    {
        if(foggerison)
        {
            fogger.writeSync(0);
            var http_post_req = {
                method: 'post',
                body: {
                    component : "fogger",
                    state : 0
               },
               json: true,
               url: "http://127.0.1.1:3000/greenhouse/event?event=control-logs"
            }

            return new Promise(function(resolve,reject) {
            request(http_post_req, function (err, res, body) {
               if (err) reject(err);
               console.log("throwing log status")
               console.log(res.statusCode);
	       foggerison = false;
               resolve(foggerison);
              });
	    });
        }
        
    }
}

async function lightLogControls(lightintesity)
{
    if(lightintesity < 30)
    {
        if(!lightcontrolison)
        {
            lightcontrol.writeSync(1);
            console.log("light control is on");
            var http_post_req = {
                method: 'post',
                body: {
                    component : "LED Lights",
                    state : 1
               },
               json: true,
               url: "http://127.0.1.1:3000/greenhouse/event?event=control-logs"
            }
            
	   return new Promise(function(resolve, reject) {
            request(http_post_req, function (err, res, body) {
               if (err) reject(err);
               console.log("throwing log status")
               console.log(res.statusCode);
	       lightcontrolison = true;
	       resolve(lightcontrolison);
             });
	    });
        }
    }
    else
    {
        if(lightcontrolison)
        {
            console.log("light control is off");
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
            
           return new Promise(function(resolve,reject) {
            request(http_post_req, function (err, res, body) {
               if (err) reject(err);
               console.log("throwing log status")
               console.log(res.statusCode);
               lightcontrolisoff = false;
	       resolve(lightcontrolisoff);
            });
	   });
        }
    }
}
async function waterLogControl(waterLog)
{
    if(waterLog)
        {
            var http_post_req = {
                method: 'post',
                body: {
                    component : "Water Pump",
                    state : 1
               },
               json: true,
               url: "http://127.0.1.1:3000/greenhouse/event?event=control-logs"
            }

	   return new Promise(function(resolve,reject) {
            request(http_post_req, function (err, res, body) {
               if (err) reject(err);
               console.log("throwing log status")
               console.log(res.statusCode);
	       lightcontrolison = true;
	       resolve(lightcontrolison);
            });
	   });
        }
}

function collectData(data, maxclient)
{
    // for(x=0; x < client_connect; x++)
    // {
    //     client_data.push({ tempc: msg_parse.tempC, humidity: msg_parse.humid, soilm: msg_parse.soilM, lightInt: msg_parse.lightI, nodepos: msg_parse.nodepos });          
    //     if(x+1 == client_connect)
    //     {
    //         lightLogControls(averageLightIntensity);
    //         foggerLogControl(averageHumidtiy);
    //         waterLogControl(msg_parse.waterLog);
    //     }
    // }
}


s.on('connection', function (ws, req) {
    ws.isAlive = true;
    client_connect++;
    ws.on('message', function (message) {
        
        var msg_parse = JSON.parse(message);
            client_data[client_connect] = [];
            
            // msg_parse.soilM < 150 ? fogger.writeSync(1) : fogger.writeSync(0);
            // msg_parse.lightI < 30 ? lightcontrol.writeSync(1) : lightcontrol.writeSync(0);

            for(x=0; x < client_connect; x++)
            {
                client_data.push({ tempc: msg_parse.tempC, humidity: msg_parse.humid, soilm: msg_parse.soilM, lightInt: msg_parse.lightI, nodepos: msg_parse.nodepos });
                
                if(x+1 == client_connect)
                {
                    lightLogControls(averageLightIntensity);
                    foggerLogControl(averageHumidtiy);
                    waterLogControl(msg_parse.waterLog);
                }
            }
        s.clients.forEach(function (client) { //broadcast incoming message to all clients (s.clients)
            if (client.isAlive === false) return client.terminate();
            ws.isAlive = false;
            ws.ping(noop);
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

    ws.on('open', function open() {
        var obj1 = {tempC : 32, humidity: 20, soilm: 100, lightInt: 300, nodepos: "test1", waterLog : false };
        ws.send(obj1);
    });

    ws.on('open', function open() {
        var obj2 = {tempC : 34, humidity: 30, soilm: 200, lightInt: 400, nodepos: "test2", waterLog : false };
        ws.send(obj2);
    });

    ws.on('open', function open() {
        var obj3 = {tempC : 36, humidity: 40, soilm: 300, lightInt: 500, nodepos: "test3", waterLog : false };
        ws.send(obj3);
    });
});

cron.schedule('*/30 * * * * *', () => {
    console.log("log data every 30 seconds");
    client_data.forEach(data => {
        var http_post_req = {
        method: 'post',
        body: {
            nodepos : data.nodepos,
            tempc : data.tempc,
            humidity : data.humidity,
            soilm : data.soilm,
            lightInt: data.lightInt
       },
       json: true,
       url: "http://127.0.1.1:3000/greenhouse/event?event=sensor-readings"
    }
    
    request(http_post_req, function (err, res, body) {
       console.log(res.statusCode);
    })
});
});
server.listen(3000);
