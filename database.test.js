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
})

function mockDatabase(paramsOverride) {
  const params = {
    rejectConnection: getOrDefault(paramsOverride.rejectConnection, false),
    failOnClose: getOrDefault(paramsOverride.failOnClose, false),
  }

  Client.mockImplementation(() => {
    return {
      connect: jest.fn(() => {
        return params.rejectConnection ? Promise.reject() : Promise.resolve();
      }),
      end: jest.fn(() => {
        return params.failOnClose ? Promise.reject() : Promise.resolve();
      }),
    };
  });
}

function getOrDefault(value, defaultValue) {
  return value == null ? defaultValue : value;
}
