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

  addNewRents(rents, queryId) {
    const query = 'INSERT INTO rents (id, href, query_id, last_update) VALUES ' +
      rents.map((rent, i) => '($' + (i * 4 + 1) + ', $' + (i * 4 + 2) + ', $' + (i * 4 + 3) + ', $' + (i * 4 + 4) + ')').join(',');

    const values = rents.map(rent => [
      rent.id,
      rent.href,
      queryId,
      new Date().toISOString()
    ]);

    return this.client_
      .query(query, [].concat.apply([], values));
  }

  refreshRentState(rentIds) {
    const query = 'UPDATE rents SET last_update = $1 WHERE id IN (' + rentIds.map((val, i) => '$' + (i + 2)).join(',') + ')';
    return this.client_
      .query(query, [new Date().toISOString()].concat(rentIds))
  }

  refreshQueryState(id) {
    const query = 'UPDATE queries SET last_update = $2 WHERE id = $1';
    return this.client_
      .query(query, [id, new Date().toISOString()])
  }

  close() {
    return this.client_.end();
  }
}

module.exports = {
  Database
}
