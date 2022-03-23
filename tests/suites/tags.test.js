const assert = require('assert');
const axios = require('axios');
const sinon = require('sinon');

const host = "http://localhost:4100";

module.exports = () => {
    var sandbox;

    before(() => {
        sandbox = sinon.createSandbox();
    });

    after(() => {
        sandbox.restore();
    });

    /***************************************************************************
     * TAG UNIT TESTS
    ***************************************************************************/
    describe('GET Endpoint tests:', () => {
        it('should return all the tags available', async () => {
            const tags = Object.values(require('@prisma/client').TagEnum);

            await axios.get(`${host}/api/v1/tags`).then(res => {
                assert.equal(res.status, 200);
                assert.deepEqual(res.data, tags);
            }).catch(() => assert.fail());
        });

        it('should return 500 if unexpected error throws', async () => {
            sandbox.stub(Object, 'values').withArgs(require('@prisma/client').TagEnum).throws('Unexpected error');

            await axios.get(`${host}/api/v1/tags`).then(() => {
                assert.fail();
            }).catch(err => {
                assert.equal(err.response.status, 500);
                assert.equal(err.response.data, 'Internal Server Error');
            });
        });
    });
};