const pg = require('pg');

class Database {
  constructor() {
    this.client_ = null;
  }

  connect() {
    this.client_ = new pg.Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    return this.client_.connect();
  }

  getQueries() {
    return this.client_.query('SELECT * FROM queries');
  }

  close() {
    return this.client_.end();
  }
}

exports.newDatabase = function () {
  return new Database();
}
