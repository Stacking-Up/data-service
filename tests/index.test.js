'use-strict';

const userTest = require('./suites/user.test');
const spaceTest = require('./suites/space.test');
const rentalTest = require('./suites/rental.test');

describe('Unit testing', () => {
    before(function() {
        //Before all tests
        return;
    });

    describe('User Tests', userTest.bind(this));
    describe('Space Tests', spaceTest.bind(this));
    describe('Rental Tests', rentalTest.bind(this));
});