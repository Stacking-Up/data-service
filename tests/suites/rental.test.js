const assert = require('assert');
const axios = require('axios');
const sinon = require('sinon');

const host = "http://localhost:4100";

module.exports = (prisma) => {
  let findMany = sinon.stub(prisma.rental, 'findMany').rejects("Not implemented");
  let findUnique = sinon.stub(prisma.rental, 'findUnique').rejects("Not implemented");

  before(() => {
    sinon.replace(prisma.rental, 'findMany', findMany);
    sinon.replace(prisma.rental, 'findUnique', findUnique);
  });

/***************************************************************************
  * RENTAL UNIT TESTS
  ***************************************************************************/
  describe('GET Endpoint tests:', () => {
    it('should return empty list when no rentals are found in DB', async () => {
    // Mock DB Query
    findMany.withArgs({ skip: undefined, take: undefined }).resolves([]);

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
      findMany.withArgs({ skip: undefined, take: undefined }).resolves(dbOutput);
    
      // API Call
      await axios.get(`${host}/api/v1/rentals`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 2);
        assert.deepEqual(res.data, expected);
      });  
    });

    it('should return a rental in DB when a rentalId is given', async () => {
      // Fixture
      const dbOutput = {id:1, initialDate: '2020-04-10T00:00:00.000Z', finalDate: '2021-03-17T00:00:00.000Z', 
      cost: 50, type: 'HOUR', meters: 100, spaceId: 1, renterId: 1};
    
      const expected = {id:1, initialDate: '2020-04-10T00:00:00.000Z', finalDate: '2021-03-17T00:00:00.000Z', 
      cost: 50, type: 'HOUR', meters: 100, spaceId: 1, renterId: 1};
      
      // Mock DB Query
      findUnique.withArgs({
        where:{
          id: 1
        }
      }).resolves(dbOutput)
    
      // API Call
      await axios.get(`${host}/api/v1/rentals/1`).then(res => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.data, expected);
      });
    
    });

    it('should return a 404 when a non-existing rentalId is given', async () => {
      // Fixture
      const dbOutput= undefined;
    
      const expected = "Rental not found" 
    
      // Mock DB Query
      findUnique.withArgs({
        where:{
          id: 1
        }
      }).resolves(dbOutput)
    
      // API Call
      axios.get(`${host}/api/v1/rentals/1`).then(res => {
        assert.equal(res.status, 404);
        assert.deepEqual(res.data, expected);
      });
    
    });

    it('should return rentals of an user when a renterId is given', async () => {
      // Fixture
      const dbOutput = [{id:1, initialDate: '2020-02-10T00:00:00.000Z', finalDate: '2021-03-17T00:00:00.000Z', 
      cost: 50, type: 'HOUR', meters: 100, spaceId: 1, renterId: 1},

      {id:3, initialDate: '2020-04-20T00:00:00.000Z', finalDate: '2021-03-18T00:00:00.000Z', 
      cost: 68, type: 'DAY', meters: 1210, spaceId: 3, renterId: 1}];
    
      const expected = [{id:1, initialDate: '2020-02-10T00:00:00.000Z', finalDate: '2021-03-17T00:00:00.000Z', 
      cost: 50, type: 'HOUR', meters: 100, spaceId: 1, renterId: 1}, 
  
      {id:3, initialDate: '2020-04-20T00:00:00.000Z', finalDate: '2021-03-18T00:00:00.000Z', 
      cost: 68, type: 'DAY', meters: 1210, spaceId: 3, renterId: 1}];
      
      // Mock DB Query
      findMany.withArgs({ skip: undefined, take: undefined ,
        where:{
          renterId:1
        }
      }).resolves(dbOutput);
    
      // API Call
      await axios.get(`${host}/api/v1/users/1/rentals`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 2);
        assert.deepEqual(res.data, expected);
      });  
    });

    it('should return 404 when a non-existing renterId is given or there are not rentals assigned', async () => {
      // Fixture
      const dbOutput=undefined;
    
      const expected = "Rentals not found";
      
      // Mock DB Query
      findMany.withArgs({ skip: undefined, take: undefined ,
        where:{
          renterId:1
        }
      }).resolves(dbOutput);
    
      // API Call
      axios.get(`${host}/api/v1/users/1/rentals`).then(res => {
        assert.equal(res.status, 404);
        assert.deepEqual(res.data, expected);
      });  
    });
  });
}