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
// const s = new WebSocket.Server({ server: server, path: "/readings", noServer: true});

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
    console.log("Humidity => " + humidity);
    if(humidity < 150 && humidity != undefined && humidity > 0)
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
    averageHumidtiy = 0;
}

async function lightLogControls(lightintesity)
{
    console.log("Light intensity => " + lightintesity);
    if(lightintesity < 30 && lightintesity != undefined && lightintesity > 0)
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
    averageLightIntensity = 0;
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

app.post('/sensor-data', function(req, res) {
    console.log("sender => " + req.body.nodeid);
    client_data[req.body.nodeid] = { tempc: req.body.tempC, humidity: req.body.humid, soilm: req.body.soilM, lightInt: req.body.lightI, nodepos: req.body.nodepos };
    waterLogControl(req.body.waterLog);
});

function collectData()
{
    console.log("collecting data");
    for(x=0; x < client_data.length; x++)
    {
        averageHumidtiy += client_data[x].humid;
        averageLightIntensity += client_data[x].lightI;
    }
    lightLogControls(averageLightIntensity);
    foggerLogControl(averageHumidtiy);
    client_data = [];
}
cron.schedule('*/3 * * * * *', () => {
    collectData();
});
// s.on('connection', function (ws, req) {
//     ws.isAlive = true;
//     client_connect++;
//     ws.on('message', function (message) {
        
//         s.clients.forEach(function (client) { //broadcast incoming message to all clients (s.clients)1
//             if (client.isAlive === false) return client.terminate();
//             ws.isAlive = false;
//             ws.ping(noop);
//         });
//     });
//     ws.on('close', function () {
//         client_connect--;
//         console.log(client_connect);
//         console.log("lost one client");
//     });
//     console.log(client_connect);
//     console.log("new client connected");
//     ws.on('pong', heartbeat);
// });

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
