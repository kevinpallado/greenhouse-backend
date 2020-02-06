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
    multer = require('multer'),
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
let client_data = [];

var foggerison = false;
var lightcontrolison = false;

var averageHumidity = 0;
var averageLightIntensity = 0;

const handleError = (err, res) => {
    res
      .status(500)
      .contentType("text/plain")
      .end("Oops! Something went wrong!");
  };
  
const upload = multer({
    dest: "~/greenhouse/images"
});

require('dns').lookup(require('os').hostname(), function (err, add, fam) {
    console.log('addr: ' + add);
});
app.use('/greenhouse', routes);
app.get("/", (req, res) => {
  res.send("Hello from Node.js!" + client_data + " <= client data ");
});
function noop() {
}

function heartbeat() {
  this.isAlive = true;
}

async function foggerLogControl(humidity)
{
    console.log("ALERT HUMIDITY !!!!");
    //console.log("Humidity => " + humidity);
    if(humidity < 150 && humidity != undefined && humidity > 0)
    {
	console.log("HUMIDITY => " + humidity);
        if(!foggerison)
        {
            console.log("Fogger is on");
            fogger.writeSync(1);
            foggerison = true;
            var http_post_req = {
                method: 'post',
                body: {
                    component : "fogger",
                    state : 1,
		    position : "default"
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
                    state : 0,
		    position : "default"
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

async function lightLogControls(lightintensity)
{
    console.log("ALERT LIGHT INTENSITY!!!");
    //console.log("Light intensity => " + lightintesity);
    if(lightintensity < 30 && lightintensity != undefined && lightintensity > 0)
    {
	console.log("Light intensity => " + lightintensity);
        if(!lightcontrolison)
        {
            lightcontrol.writeSync(1);
            console.log("light control is on");
            var http_post_req = {
                method: 'post',
                body: {
                    component : "LED Lights",
                    state : 1,
		    position : "default"
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
                    state : 1,
		    position : "default"
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
async function waterLogControl(waterLog, position)
{
    if(waterLog)
        {
            var http_post_req = {
                method: 'post',
                body: {
                    component : "Water Pump",
                    state : 1,
		    position : position
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
app.post('/sensor-data1', function(req, res) {
    if(req.body.nodeid != undefined)
    {
     console.log("sender => " + req.body.nodeid);
     console.log("light intensity => " + req.body.lightI);
     console.log("humidity ===> " + req.body.humid);
     client_data[client_data.length > 0 ? client_data.length - 1 : 0] = { tempc: req.body.tempC, humidity: req.body.humid, soilm: req.body.soilM, lightInt: req.body.lightI, nodepos: req.body.nodepos };
    //  client_data[req.body.nodeid] = { tempc: req.body.tempC, humidity: req.body.humid, soilm: req.body.soilM, lightInt: req.body.lightI, nodepos: req.body.nodepos };
     console.log(client_data[req.body.nodeid]);
     waterLogControl(req.body.waterLog, req.body.nodeid);
     res.status(200).send("Succes");
    }
});
app.post('/sensor-data2', function(req, res) {
   if(req.body.nodeid != undefined)
   {
    console.log("sender => " + req.body.nodeid);
    console.log("light intensity => " + req.body.lightI);
    console.log("humidity ===> " + req.body.humid);
    client_data[client_data.length > 0 ? client_data.length - 1 : 0] = { tempc: req.body.tempC, humidity: req.body.humid, soilm: req.body.soilM, lightInt: req.body.lightI, nodepos: req.body.nodepos };
    // client_data[req.body.nodeid] = { tempc: req.body.tempC, humidity: req.body.humid, soilm: req.body.soilM, lightInt: req.body.lightI, nodepos: req.body.nodepos };
    console.log(client_data[req.body.nodeid]);
    waterLogControl(req.body.waterLog, req.body.nodeid);
    res.status(200).send("Sucess");
   }

});
app.post('/sensor-data3', function(req, res) {
    if(req.body.nodeid != undefined)
    {
     console.log("sender => " + req.body.nodeid);
     console.log("light intensity => " + req.body.lightI);
     console.log("humidity ===> " + req.body.humid);
     client_data[client_data.length > 0 ? client_data.length - 1 : 0] = { tempc: req.body.tempC, humidity: req.body.humid, soilm: req.body.soilM, lightInt: req.body.lightI, nodepos: req.body.nodepos };
    //  client_data[req.body.nodeid] = { tempc: req.body.tempC, humidity: req.body.humid, soilm: req.body.soilM, lightInt: req.body.lightI, nodepos: req.body.nodepos };
     console.log(client_data[req.body.nodeid]);
     waterLogControl(req.body.waterLog, req.body.nodeid);
     res.status(200).send("Success");
    }
});
app.post('/sensor-data4', function(req, res) {
    if(req.body.nodeid != undefined)
    {
     console.log("sender => " + req.body.nodeid);
     console.log("light intensity => " + req.body.lightI);
     console.log("humidity ===> " + req.body.humid);
     client_data[client_data.length > 0 ? client_data.length - 1 : 0] = { tempc: req.body.tempC, humidity: req.body.humid, soilm: req.body.soilM, lightInt: req.body.lightI, nodepos: req.body.nodepos };
    //  client_data[req.body.nodeid] = { tempc: req.body.tempC, humidity: req.body.humid, soilm: req.body.soilM, lightInt: req.body.lightI, nodepos: req.body.nodepos };
     console.log(client_data[req.body.nodeid]);
     waterLogControl(req.body.waterLog, req.body.nodeid);
     res.status(200).send("Success");
    }
});


app.post(
    "/upload",
    upload.single("file" /* name attribute of <file> element in your form */),
    (req, res) => {
      const tempPath = req.file.path;
      const targetPath = path.join(__dirname, "./uploads/image.png");
  
      if (path.extname(req.file.originalname).toLowerCase() === ".png" || path.extname(req.file.originalname).toLowerCase() === ".jpg") {
        fs.rename(tempPath, targetPath, err => {
          if (err) return handleError(err, res);
  
          res
            .status(200)
            .contentType("text/plain")
            .end("File uploaded!");
        });
      } else {
        fs.unlink(tempPath, err => {
          if (err) return handleError(err, res);
  
          res
            .status(403)
            .contentType("text/plain")
            .end("Only .png files are allowed!");
        });
      }
    }
  );

function collectData()
{
    console.log("collecting data");
    for(x=0; x < client_data.length; x++)
    {
        //console.log("DATA ==================> " + client_data[x].lightInt);
        averageHumidity += client_data[x].humidity;
        averageLightIntensity += client_data[x].lightInt;
    }
    console.log("average light intensity ===========> " + averageLightIntensity/client_data.length);
    lightLogControls(averageLightIntensity/client_data.length);
    foggerLogControl(averageHumidity/client_data.length);
    client_data = [];
}
cron.schedule('*/5 * * * * *', () => {
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
            soilr : data.soilr,
            lightInt: data.lightInt,
            lightr : 'default'
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
