const pg = require('pg');
const md5 = require('md5');

function getMd5(str) {
  const md5NoDash = md5(str);
  return md5NoDash.substring(0, 8) + "-" + md5NoDash.substring(8, 12) + "-" + md5NoDash.substring(12, 16) + "-" + md5NoDash.substring(16, 20) + "-" + md5NoDash.substring(20, 32);
}

class Database {
  constructor() {
    this.client_ = null;
  }

  /**
   * Establish connection to the database.
   *
   * @public
   **/
  connect() {
    this.client_ = new pg.Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    return this.client_.connect();
  }

  /**
   * Returns all searches.
   *
   * @public
   **/
  getSearches() {
    return this.select_('searches');
  }

  /**
   * Returns all queries.
   *
   * @public
   **/
  getQueries() {
    return this.select_('queries');
  }

  addQueries(entries) {
    const query = 'INSERT INTO queries (id, href, search_id, creation_date) VALUES ' +
      this.getValuesMap_(entries.length, /* valuesPerEntry */ 4);

    const values = entries.map(entry => [
      getMd5(entry.href),
      entry.href,
      getMd5(entry.name),
      new Date().toISOString()
    ]);

    return this.tryAddSearches_(entries.map(entry => entry.name))
      .then(() => this.client_.query(query, [].concat.apply([], values)));
  }

  tryAddSearches_(searches) {
    return this.getSearches()
      .then(results => {
        const currentSearches = results.map(result => result.name);
        const newSearches = [...new Set(searches)]
                           .filter(search => !currentSearches.includes(search));
        // No new search to update.
        if (newSearches.length == 0) {
          return;
        }
        const query = 'INSERT INTO searches (id, name) VALUES ' +
          this.getValuesMap_(newSearches.length, /* valuesPerEntry */ 2);
        return this.client_.query(query, [].concat.apply([],
          newSearches.map(name => [getMd5(name), name])
        ));
      });
  }

  deleteQueries(ids) {
    return this.delete_('queries', 'id IN ' + this.createSqlSet_(ids))
      .then(() => this.clearSearches_());
  }

  clearSearches_() {
    return this.getQueries()
      .then(results => {
        const activeSearches = this.uniqueArray_(
          results.map(result => result.search_id));

        return this.delete_('searches',
          'id NOT IN ' + this.createSqlSet_(activeSearches));
      });
  }

  getRents(identifier) {
    const query = 'SELECT * FROM rents WHERE query_id = $1';
    return this.client_
      .query(query, [identifier])
      .then(res => res.rows);
  }

  addNewRents(rents, queryId) {
    const query = 'INSERT INTO rents (id, href, query_id, creation_date, last_update) VALUES ' +
      rents.map((rent, i) => '($' + (i * 5 + 1) + ', $' + (i * 5 + 2) + ', $' + (i * 5 + 3) + ', $' + (i * 5 + 4) + ', $' + (i * 5 + 5) + ')').join(',');

    const values = rents.map(rent => [
      rent.id,
      rent.href,
      queryId,
      new Date().toISOString(),
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

  select_(tableName, conditional = null) {
    const query = 'SELECT * FROM ' + tableName
      + (conditional ? ' WHERE ' + conditional : '');

    return this.assertConnection_()
      .then(() => this.client_.query(query))
      .then(res => res.rows);
  }

  delete_(tableName, conditional) {
    const query = 'DELETE FROM ' + tableName + ' WHERE ' + conditional;
    return this.assertConnection_()
      .then(() => this.client_.query(query));
  }

  createSqlSet_(values, encloseQuotes = true) {
    if (encloseQuotes) {
      return '(' + values.map(value => `'${value}'`).join(',') + ')';
    } else {
      return '(' + values.join(',') + ')';
    }
  }

  uniqueArray_(array) {
    return [...new Set(array)];
  }

  getValuesMap_(totalEntries, valuesPerEntry) {
    var entries = [];
    for (var i = 0; i < totalEntries; ++i) {
      var entry = [];
      for (var j = 0; j < valuesPerEntry; ++j) {
        entry.push('$' + (i * valuesPerEntry + j + 1));
      }
      entries.push('(' + entry.join(',') + ')');
    }
    return entries.join(',');
  }

  assertConnection_() {
    if (this.client_ == null) {
      return Promise.reject(new Error('Uninitialized database client.'));
    }

    return Promise.resolve();
  }
}

module.exports = {
  Database
}
