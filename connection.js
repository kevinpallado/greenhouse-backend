const mysql = require('mysql');
const conn = require('./database/config/config.json');

var mysqlConnection = mysql.createConnection({
    host: conn.development.host,
    user: conn.development.username,
    password: conn.development.password,
    database: conn.development.database,
    multipleStatements: true,
});

var mysqlPool  = mysql.createPool({
    connectionLimit : 3,
    host: conn.development.host,
    user: conn.development.username,
    password: conn.development.password,
    database: conn.development.database
  });

mysqlConnection.connect((err)=>{
    if(!err)
    {
        console.log('Connected');
    }
    else
    {
        console.log('Connection failed');
    }
});

module.exports = { pool : mysqlPool, sql : mysqlConnection};