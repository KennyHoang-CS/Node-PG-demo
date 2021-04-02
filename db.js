/** Database setup for BizTime. */
process.env.NODE_ENV = "test";
const { Client } =  require('pg');

let DB_URI;

if (process.env.NODE_ENV === 'test'){
    DB_URI = 'postgres:///biztime_test';
} else {
    DB_URI = 'postgres:///biztime';
}

let db = new Client({
    connectionString: 'postgres:///biztime_test'
});

db.connect();

module.exports = db;


