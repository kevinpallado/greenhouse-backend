const db = require('../connection');

function add(event, data) {
    return new Promise((resolve, reject) => {
        db.sql.query("INSERT INTO sensor_readings (nodePosition, temperatureC, humidity, soilMoisture, soilRead, lightIntensity, lightRead) VALUES ('" + data.nodepos + "','" + data.tempc + "','" + data.humidity + "','" + data.soilm + "','" + data.soilr + "','" + data.lightInt + "','" + data.lightr + "')", (err, rows,result) => {
            if(err) throw err;
            resolve(rows.affectedRows);
        });
    });
}

module.exports = {
    add : add
}
