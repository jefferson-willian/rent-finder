const { Database } = require('./database.js');
const { Client } = require('pg');

// Mock postgres.
jest.mock('pg');

// Instance of Database.
let db;

beforeEach(() => {
  db = new Database();
});

describe('Connection', () => {
  it('connect succesfully', () => {
    mockDatabase({
      rejectConnection: false
    });

    return expect(new Database().connect()).resolves.toEqual();
  });

  it('fail to connect', () => {
    mockDatabase({
      rejectConnection: true
    });

    return expect(new Database().connect()).rejects.toEqual();
  });

  it('close succesfully', () => {
    mockDatabase({
      failOnClose: false
    });

    return expect(db.connect().then(() => db.close())).resolves.toEqual();
  });

  it('fail to close', () => {
    mockDatabase({
      failOnClose: true
    });

    return expect(db.connect().then(() => db.close())).rejects.toEqual();
  });

  it('close before connecting', () => {
    mockDatabase({});

    return expect(db.close()).rejects.toEqual();
  });
});

describe('Select', () => {
  it('get searches', () => {
    const result = ["result1", "result2"];
    mockDatabase({
      query: {
        "select * from searches": { rows: result }
      }
    });

    return expect(db.connect().then(() => db.getSearches()))
        .resolves.toEqual(result);
  });

  it('get queries', () => {
    const result = ["result1", "result2"];
    mockDatabase({
      query: {
        "select * from queries": { rows: result }
      }
    });

    return expect(db.connect().then(() => db.getQueries()))
        .resolves.toEqual(result);
  });

  it('get rents', () => {
    const result = ["result1", "result2"];
    mockDatabase({
      query: {
        "select * from rents where query_id = '12345'": { rows: result }
      }
    });

    return expect(db.connect().then(() => db.getRents('12345')))
        .resolves.toEqual(result);
  });
});

function mockDatabase(paramsOverride) {
  const params = {
    rejectConnection: getOrDefault(paramsOverride.rejectConnection, false),
    failOnClose: getOrDefault(paramsOverride.failOnClose, false),
    query: getOrDefault(paramsOverride.query, {}),
  }

  Client.mockImplementation(() => {
    return {
      connect: jest.fn(() => {
        return params.rejectConnection ? Promise.reject() : Promise.resolve();
      }),
      end: jest.fn(() => {
        return params.failOnClose ? Promise.reject() : Promise.resolve();
      }),
      query: jest.fn(query => {
        return params.query[query.toLowerCase()];
      }),
    };
  });
}

function getOrDefault(value, defaultValue) {
  return value == null ? defaultValue : value;
}
