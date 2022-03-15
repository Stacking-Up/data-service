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

    it('should return 400 when trying to get a rental with non integer parameters', async () => {
      // Fixture    
      const expected = "Invalid parameter. It must be an integer number"; 
      
      // Mock DB Query
      findMany.withArgs({ skip: "invalid", take: "invalid" }).rejects();
    
      // API Call
      await axios.get(`${host}/api/v1/rentals?offset=invalid&limit=invalid`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 400);
        assert.equal(err.response.data, expected);
      });  
    });

    it('should return 500 unexpected error when trying to get a rental', async () => {
      // Fixture    
      const expected = "Server error: Could not get rentals."; 
      
      // Mock DB Query
      findMany.withArgs({ skip: undefined, take: undefined }).rejects();
    
      // API Call
      await axios.get(`${host}/api/v1/rentals`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 500);
        assert.equal(err.response.data, expected);
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
      await axios.get(`${host}/api/v1/rentals/1`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 404);
        assert.equal(err.response.data, expected);
      });
    
    });

    it('should return a 400 when a non integer rentalId is given', async () => {
      // Fixture
      const dbOutput= undefined;
    
      const expected = 'Invalid rentalId. It must be an integer number'
    
      // Mock DB Query
      findUnique.withArgs({
        where:{
          id: "invalid"
        }
      }).rejects()
    
      // API Call
      await axios.get(`${host}/api/v1/rentals/invalid`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 400);
        assert.equal(err.response.data, expected);
      });
    
    });

    it('should return 500 unexpected error when trying to get a rental', async () => {
      // Fixture
      const dbOutput= undefined;
    
      const expected = 'Server error: Could not get rentals.'
    
      // Mock DB Query
      findUnique.withArgs({
        where:{
          id: 1
        }
      }).rejects()
    
      // API Call
      await axios.get(`${host}/api/v1/rentals/1`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 500);
        assert.equal(err.response.data, expected);
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
      await axios.get(`${host}/api/v1/users/1/rentals`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 404);
        assert.equal(err.response.data, expected);
      });  
    });
 
    it('should return a list of rentals when a spaceId is given', async () => {
      // Fixture
      const dbOutput = [{id:1, initialDate: '2018-04-10T00:00:00.000Z', finalDate: '2019-03-17T00:00:00.000Z', cost: 50, type: 'HOUR', meters: 100, spaceId: 1, renterId: 1}, 
      {id:2, initialDate: '2021-04-10T00:00:00.000Z', finalDate: '2022-02-17T00:00:00.000Z', cost: 122, type: 'HOUR', meters: 111, spaceId: 1, renterId: 1}];

      const expected = [{id:1, initialDate: '2018-04-10T00:00:00.000Z', finalDate: '2019-03-17T00:00:00.000Z', cost: 50, type: 'HOUR', meters: 100, spaceId: 1, renterId: 1}, 
      {id:2, initialDate: '2021-04-10T00:00:00.000Z', finalDate: '2022-02-17T00:00:00.000Z', cost: 122, type: 'HOUR', meters: 111, spaceId: 1, renterId: 1}];
      
      // Mock DB Query
      findMany.withArgs({
        skip: undefined,
        take: undefined,
        where: {
          spaceId: 1
        }
      }).resolves(dbOutput)
    
      // API Call
      await axios.get(`${host}/api/v1/spaces/1/rentals`).then(res => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.data, expected);
      });
    
    });

    it('should return 404 when not finding rentals by userid', async () => {
      // Fixture
      const dbOutput = undefined;

      const expected = "Rentals not found";

      // Mock DB Query
      findMany.withArgs({
        skip: undefined,
        take: undefined,
        where: {
          spaceId: 1
        }
      }).resolves(dbOutput);
    
      // API Call
      await axios.get(`${host}/api/v1/spaces/1/rentals`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 404);
        assert.deepEqual(err.response.data, expected);
      });
    });

    it('should return 400 when trying to get rentals with a non integer spaceId', async () => {
      // Fixture
      const expected = "Invalid parameter. It must be an integer number";

      // Mock DB Query
      findMany.withArgs({
        skip: undefined,
        take: undefined,
        where: {
          spaceId: "invalid"
        }
      }).rejects();
    
      // API Call
      await axios.get(`${host}/api/v1/spaces/invalid/rentals`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 400);
        assert.equal(err.response.data, expected);
      });
    });

    it('should return 500 unexpected error when trying to get rentals with an integer spaceId', async () => {
      // Fixture
      const expected = "Server error: Could not get rentals.";

      // Mock DB Query
      findMany.withArgs({
        skip: undefined,
        take: undefined,
        where: {
          spaceId: 1
        }
      }).rejects();
    
      // API Call
      await axios.get(`${host}/api/v1/spaces/1/rentals`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 500);
        assert.equal(err.response.data, expected);
      });
    });

    it('should return rentals when a userId is given', async () => {
      // Fixture
      const dbOutput = [{id:1, initialDate: '2018-04-10T00:00:00.000Z', finalDate: '2019-03-17T00:00:00.000Z', cost: 50, type: 'HOUR', meters: 100, spaceId: 1, renterId: 1}, 
      {id:2, initialDate: '2021-04-10T00:00:00.000Z', finalDate: '2022-02-17T00:00:00.000Z', cost: 122, type: 'HOUR', meters: 111, spaceId: 1, renterId: 1}];

      const expected = [{id:1, initialDate: '2018-04-10T00:00:00.000Z', finalDate: '2019-03-17T00:00:00.000Z', cost: 50, type: 'HOUR', meters: 100, spaceId: 1, renterId: 1}, 
      {id:2, initialDate: '2021-04-10T00:00:00.000Z', finalDate: '2022-02-17T00:00:00.000Z', cost: 122, type: 'HOUR', meters: 111, spaceId: 1, renterId: 1}];

      // Mock DB Query
      findMany.withArgs({
        skip: undefined,
        take: undefined,
        where: {
          renterId: 1
        }
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/users/1/rentals`).then(res => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.data, expected);
      });
    });

    it('should return 404 when not found rentals for a userId', async () => {
      // Fixture
      const dbOutput = undefined;

      const expected = 'Rentals not found';

      // Mock DB Query
      findMany.withArgs({
        skip: undefined,
        take: undefined,
        where: {
          renterId: 1
        }
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/users/1/rentals`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 404);
        assert.equal(err.response.data, expected);
      });
    });

    it('should return 400 when trying to get a rental with non integer userId', async () => {
      // Fixture
      const expected = 'Invalid userId parameter. It must be an integer number';

      // Mock DB Query
      findMany.withArgs({
        skip: undefined,
        take: undefined,
        where: {
          renterId: "invalid"
        }
      }).rejects();

      // API Call
      await axios.get(`${host}/api/v1/users/invalid/rentals`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 400);
        assert.equal(err.response.data, expected);
      });
    });

    it('should return 500 unexpected error when trying to get rentals of an user', async () => {
      // Fixture
      const expected = 'Server error: Could not get rentals.';

      // Mock DB Query
      findMany.withArgs({
        skip: undefined,
        take: undefined,
        where: {
          renterId: 1
        }
      }).rejects();

      // API Call
      await axios.get(`${host}/api/v1/users/1/rentals`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 500);
        assert.equal(err.response.data, expected);
      });
    });
    
  });
}