const { Database } = require('./database.js');
const { Client } = require('pg');

// Mock postgres.
jest.mock('pg');

describe('Connection', () => {
  it('should connect', () => {
    mockDatabase({
      rejectConnection: false
    });

    return expect(new Database().connect()).resolves.toEqual();
  });

  it('should not connect', () => {
    mockDatabase({
      rejectConnection: true
    });

    return expect(new Database().connect()).rejects.toEqual();
  });
})

function mockDatabase(params) {
  Client.mockImplementation(() => {
    return {
      connect: jest.fn(() => {
        return params.rejectConnection ? Promise.reject() : Promise.resolve();
      })
    };
  });
}
