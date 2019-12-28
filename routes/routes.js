const express = require('express'),
      Router = express.Router(),
      Sensor = require('../core/sensors'),
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

        default:
            break;
    }
    res.send(JSON.stringify(response));
});

module.exports = Router;