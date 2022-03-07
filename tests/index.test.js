'use-strict';

const userTest = require('./suites/user.test');
const spaceTest = require('./suites/space.test');
const rentalTest = require('./suites/rental.test');
const server = require('../server');

describe('Unit testing', () => {
    before( (done) => {
        server.deploy('test').then( () => done());
    });

    describe('User Tests', userTest.bind(this));
    describe('Space Tests', spaceTest.bind(this));
    describe('Rental Tests', rentalTest.bind(this));

    after( (done) => {
        server.undeploy();
        done();
    });
});