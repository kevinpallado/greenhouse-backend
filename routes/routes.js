const express = require('express'),
      Router = express.Router(),
      Sensor = require('../core/sensors'),
      Image = require('../core/image'),
      Logs = require('../core/logs');

Router.post("/event", async(req, res) => {
    var response;
    switch(req.query.event)
    {
        case "sensor-readings":
            response = await Sensor.add(req.query.method, req.body);
            break;
        
        case "control-logs":
            response = await Logs.add(req.query.method, req.body);
            break;

        case "upload-image":
            response = await Image.view(req.query.method, req.body);
            break;
        
        case "check-image-command":
            response = await Image.update(req.query.method, req.body);
            break;
            
        default:
            break;
    }
    res.send(JSON.stringify(response));
});

module.exports = Router;