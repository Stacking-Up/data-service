const assert = require('assert');
const axios = require('axios');
const sinon = require('sinon');

const host = "http://localhost:4100";

module.exports = (prisma) => {
  let findMany = sinon.stub(prisma.user, 'findMany').rejects("Not implemented");
  let findUnique = sinon.stub(prisma.user, 'findUnique').rejects("Not implemented");

  before(() => {
    sinon.replace(prisma.user, 'findMany', findMany);
    sinon.replace(prisma.user, 'findUnique', findUnique);
  });

  /***************************************************************************
  * USER UNIT TESTS
  ***************************************************************************/
  it('should return empty list when no users are found in DB', async () => {
      // Mock DB Query
      findMany.withArgs({ skip: undefined, take: undefined }).resolves([]);

      // API Call
      await axios.get(`${host}/api/v1/users`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 0);
      });
  });

  it('should return data in DB when present', async () => {
    // Fixture
    const dbOutput = [{id:1, name: 'John', surname: 'Doe', avatar: null}, {id:2, name: 'Jane', surname: 'Doe'}];
    const expected = [{id:1, name: 'John', surname: 'Doe'}, {id:2, name: 'Jane', surname: 'Doe'}];
    
    // Mock DB Query
    findMany.withArgs({ skip: undefined, take: undefined }).resolves(dbOutput);

    // API Call
    await axios.get(`${host}/api/v1/users`).then(res => {
      assert.equal(res.status, 200);
      assert.equal(res.data.length, 2);
      assert.deepEqual(res.data, expected);
    });
  });

  it('should return 404 when a non-existing userId is given', async () => {
    // Fixture
    const dbOutput = undefined;
    const expected = 'User not found';

    // Mock DB Query
    findUnique.withArgs({
      where:{
        id: 1
      }
    }).resolves(dbOutput)

    // API Call
    axios.get(`${host}/api/v1/users/1`).then(res => {
      assert.equal(res.status, 404);
      assert.deepEqual(res.data, expected);
    });
  });

  it('should return an user in DB when an userId is given', async () => {
    // Fixture
    const dbOutput = [{id:1, name: 'John', surname: 'Doe', avatar: null}];
    const expected = [{id:1, name: 'John', surname: 'Doe'}];;

    // Mock DB Query
    findUnique.withArgs({
      where:{
        id: 1
      }
    }).resolves(dbOutput)

    // API Call
    axios.get(`${host}/api/v1/users/1`).then(res => {
      assert.equal(res.status, 200);
      assert.deepEqual(res.data, expected);
    });
  });
}