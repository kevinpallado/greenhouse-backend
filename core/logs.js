const db = require('../connection');

function add(event, data) {
    return new Promise((resolve, reject) => {
        db.sql.query("INSERT INTO control_logs (component, state) VALUES ('" + data.component + "','" + data.state + "')", (err, rows,result) => {
            if(err) throw err;
            resolve(rows.affectedRows);
        });
    });
}

module.exports = {
    add : add
}