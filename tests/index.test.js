'use-strict';

const userTest = require('./suites/user.test');
const spaceTest = require('./suites/space.test');
const rentalTest = require('./suites/rental.test');
const server = require('../server');
const prisma = require('../prisma');

describe('Unit testing', () => {
    before( (done) => {
        server.deploy('test').then( () => done());
    });

    describe('User Tests', userTest.bind(this, prisma));
    describe('Space Tests', spaceTest.bind(this, prisma));
    describe('Rental Tests', rentalTest.bind(this, prisma));

    after( (done) => {
        server.undeploy();
        done();
    });
});