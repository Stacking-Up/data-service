const assert = require('assert');
const axios = require('axios');
const sinon = require('sinon');

const host = "http://localhost:4100";

module.exports = () => {

    var sandbox;

    before(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    /***************************************************************************
     * ITEM UNIT TESTS
    ***************************************************************************/
    describe('GET Endpoint tests:', () => {
        it('should return all the items types available', async () => {
            const items = Object.values(require('@prisma/client').ItemType);

            await axios.get(`${host}/api/v1/items/types`).then(res => {
                assert.equal(res.status, 200);
                assert.deepEqual(res.data, items);
            }).catch(() => assert.fail());
        });

        it('should return all the items dimensions available', async () => {
            const dimensions = Object.values(require('@prisma/client').Dimensions);

            await axios.get(`${host}/api/v1/items/dimensions`).then(res => {
                assert.equal(res.status, 200);
                assert.deepEqual(res.data, dimensions);
            }).catch(() => assert.fail());
        });

        it('should return 500 if unexpected error throws trying to get all the items types', async () => {
            sandbox.stub(Object, 'values').withArgs(require('@prisma/client').ItemType).throws('Unexpected error');

            await axios.get(`${host}/api/v1/items/types`).then(() => {
                assert.fail();
            }).catch(err => {
                assert.equal(err.response.status, 500);
                assert.equal(err.response.data, 'Internal Server Error');
            });
        });

        it('should return 500 if unexpected error throws trying to get all the items dimensions', async () => {
            sandbox.stub(Object, 'values').withArgs(require('@prisma/client').Dimensions).throws('Unexpected error');

            await axios.get(`${host}/api/v1/items/dimensions`).then(() => {
                assert.fail();
            }).catch(err => {
                assert.equal(err.response.status, 500);
                assert.equal(err.response.data, 'Internal Server Error');
            });
        });
    });
};