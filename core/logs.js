const db = require('../connection');

function add(event, data) {
    return new Promise((resolve, reject) => {
        db.sql.query("INSERT INTO control_logs (component, state, position) VALUES ('" + data.component + "','" + data.state + "','" + data.position + "')", (err, rows,result) => {
            if(err) throw err;
            resolve(rows.affectedRows);
        });
    });
}

module.exports = {
    add : add
}
