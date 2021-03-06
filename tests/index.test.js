'use-strict';

const userTest = require('./suites/user.test');
const tagsTest = require('./suites/tags.test');
const spaceTest = require('./suites/space.test');
const rentalTest = require('./suites/rental.test');
const itemTest = require('./suites/item.test');
const server = require('../server');
const prisma = require('../prisma');
const jwt = require('jsonwebtoken');
const fs = require('fs');

describe('========== UNIT TESTING ==========', () => {
    before( (done) => {
        server.deploy('test').then( () => done());
    });

    describe('\n  USER TESTS', userTest.bind(this, prisma));
    describe('\n  SPACE TESTS', spaceTest.bind(this, prisma, jwt));
    describe('\n  TAGS TESTS', tagsTest.bind(this));
    describe('\n  RENTAL TESTS', rentalTest.bind(this, prisma));
    describe('\n  ITEM TESTS', itemTest.bind(this, prisma));

    after( (done) => {
        fs.rmSync(`${__dirname}/../storedData`, { recursive: true, force: true });
        server.undeploy();
        done();
    });
});