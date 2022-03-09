const assert = require('assert');
const axios = require('axios');
const sinon = require('sinon');

const host = "http://localhost:4100";

module.exports = (prisma) => {
  let findMany = sinon.stub(prisma.space, 'findMany').rejects("Not implemented");
  let findUnique = sinon.stub(prisma.space, 'findUnique').rejects("Not implemented");

  before(() => {
    sinon.replace(prisma.rental, 'findMany', findMany);
    sinon.replace(prisma.rental, 'findUnique', findUnique);
  });

/***************************************************************************
  * USER UNIT TESTS
  ***************************************************************************/
 it('should return empty list when no rentals are found in DB', async () => {
  // Mock DB Query
  findMany.withArgs({}).resolves([]);

  // API Call
  await axios.get(`${host}/api/v1/rentals`).then(res => {
    assert.equal(res.status, 200);
    assert.equal(res.data.length, 0);
  });
  });

  it('should return data in DB when rentals present', async () => {
    // Fixture
    const dbOutput = [{id:1, initialDate: '2020-04-10T00:00:00.000Z', finalDate: '2021-03-17T00:00:00.000Z', 
     cost: 50, type: 'HOUR', meters: 100, spaceId: 1, renterId: 1}, 
  
     {id:2, initialDate: '2020-04-20T00:00:00.000Z', finalDate: '2021-03-18T00:00:00.000Z', 
     cost: 68, type: 'DAY', meters: 170, spaceId: 2, renterId: 1}];
  
    const expected = [{id:1, initialDate: '2020-04-10T00:00:00.000Z', finalDate: '2021-03-17T00:00:00.000Z', 
    cost: 50, type: 'HOUR', meters: 100, spaceId: 1, renterId: 1}, 
 
    {id:2, initialDate: '2020-04-20T00:00:00.000Z', finalDate: '2021-03-18T00:00:00.000Z', 
    cost: 68, type: 'DAY', meters: 170, spaceId: 2, renterId: 1}];
    
    // Mock DB Query
    findMany.withArgs({}).resolves(dbOutput);
  
    // API Call
    await axios.get(`${host}/api/v1/rentals`).then(res => {
      assert.equal(res.status, 200);
      assert.equal(res.data.length, 2);
      assert.deepEqual(res.data, expected);
    });  
  });

}