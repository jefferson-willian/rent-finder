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
    return this.client_
      .query('SELECT * FROM queries')
      .then(res => res.rows);
  }

  getRents(identifier) {
    const query = 'SELECT * FROM rents WHERE query_id = $1';
    return this.client_
      .query(query, [identifier])
      .then(res => res.rows);
  }

  close() {
    return this.client_.end();
  }
}

module.exports = {
  Database
}
