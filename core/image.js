const db = require('../connection');

function view(event, data) {
    return new Promise((resolve, reject) => {
        db.sql.query("SELECT state FROM image_controller WHERE component = '" + data.component + "'", (err, rows, results) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(rows);
            }
        });
    });
}

function update(event, data) {
    return new Promise((resolve, reject) => {
        db.sql.query("UPDATE image_controller SET state = '" + data.state + "' WHERE component = '" + data.component + "'", (err, rows, results) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(rows);
            }
        });
    });
}

module.exports = {
    view : view,
    update: update
}