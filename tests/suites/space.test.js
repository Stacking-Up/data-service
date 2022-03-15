const assert = require('assert');
const axios = require('axios');
const sinon = require('sinon');
const fs = require('fs');

const host = "http://localhost:4100";

module.exports = (prisma, jwt) => {
  let verify = sinon.stub(jwt, 'verify').rejects('Not Implemented');
  let create = sinon.stub(prisma.space, 'create').rejects("Not implemented");
  let update = sinon.stub(prisma.space, 'update').rejects("Not implemented");
  let findMany = sinon.stub(prisma.space, 'findMany').rejects("Not implemented");
  let findUnique = sinon.stub(prisma.space, 'findUnique').rejects("Not implemented");
  let updateUser = sinon.stub(prisma.user, 'update').rejects("Not implemented");

  before(() => {
    sinon.replace(prisma.space, 'create', create);
    sinon.replace(prisma.space, 'update', update);
    sinon.replace(prisma.space, 'findMany', findMany);
    sinon.replace(prisma.space, 'findUnique', findUnique);
    sinon.replace(prisma.user, 'update', updateUser);
  });

/***************************************************************************
  * SPACE UNIT TESTS
  ***************************************************************************/
  describe('GET Endpoint tests:', () => {
    it('should return a space in DB when a spaceId is given', async () => {
      // Fixture
      const dbOutput = {id:1, name: 'Space 1', description: 'So much space',
      initialDate: '2020-03-10T00:00:00.000Z', finalDate: '2022-03-17T00:00:00.000Z', 
      location: 'Sevilla', dimensions: '2x2', priceHour: null, priceDay: '4', priceMonth: '45', ownerId: 1};
    
      const expected = {id:1, name: 'Space 1', description: 'So much space',
      initialDate: '2020-03-10T00:00:00.000Z', finalDate: '2022-03-17T00:00:00.000Z', 
      location: 'Sevilla', dimensions: '2x2', priceDay: '4', priceMonth: '45', ownerId: 1};
      
      // Mock DB Query
      findUnique.withArgs({
        where:{
          id: 1
        }
      }).resolves(dbOutput)
    
      // API Call
      await axios.get(`${host}/api/v1/spaces/1`).then(res => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.data, expected);
      });
    
    });
    
    it('should return a 404 when a non-existing spaceId is given', async () => {
      // Fixture
      const dbOutput= undefined;
    
      const expected = "Space not found" 
    
      // Mock DB Query
      findUnique.withArgs({
        where:{
          id: 1
        }
      }).resolves(dbOutput)
    
      // API Call
      await axios.get(`${host}/api/v1/spaces/1`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 404);
        assert.equal(err.response.data, expected);
      });
    
    });

    it('should return a 400 when trying to get a space when a non integer spaceId', async () => {
      // Fixture    
      const expected = "Invalid parameter. It must be an integer number" 
    
      // Mock DB Query
      findUnique.withArgs({
        where:{
          id: 1
        }
      }).rejects();
    
      // API Call
      await axios.get(`${host}/api/v1/spaces/invalid`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 400);
        assert.equal(err.response.data, expected);
      });
    });

    it('should return a 500 when unexpected error happens getting a space', async () => {
      // Fixture    
      const expected = "Server error: Could not get space" 
    
      //Mock console.log to avoid printing errors
      console.error = sinon.stub();

      // Mock DB Query
      findUnique.withArgs({
        where:{
          id: 1
        }
      }).rejects();
    
      // API Call
      await axios.get(`${host}/api/v1/spaces/1`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 500);
        assert.equal(err.response.data, expected);
      });
    });

    it('Should return spaces that can not be shared', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      },
      {
        id: 2, name: "casa", description: "Esto es una casa", initialDate: "1970-01-01T00:00:00.000Z", finalDate: null, location: "Sevilla",
        dimensions: "2x4", priceHour: 8, priceDay: null, priceMonth: 760, shared: false, ownerId: 1, tags: [{ tag: "DRY" }]
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, "tags": [ "GARAGE", "DRY" ]
      },
      {
        id: 2, name: "casa", description: "Esto es una casa", initialDate: "1970-01-01T00:00:00.000Z", location: "Sevilla",
        dimensions: "2x4", priceHour: 8, priceMonth: 760, shared: false, ownerId: 1, tags: [ "DRY" ]
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        take: undefined, skip: undefined,
        where: {
          AND: [
            { shared: { equals: false } },
            {
              OR: [
                { finalDate: { gte: actualDate } },
                { finalDate: { equals: null } }
              ]
            }
          ]
        }, include: { tags: true }, orderBy: {}
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?shared=false`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 2);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces that can be shared', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        take: undefined, skip: undefined,
        where: {
          AND: [
            { shared: { equals: true } },
            {
              OR: [
                { finalDate: { gte: actualDate } },
                { finalDate: { equals: null } }
              ]
            }
          ]
        }, include: { tags: true }, orderBy: {}
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?shared=true`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 1);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces which m2 are inside in the given range', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        take: undefined, skip: undefined,
        where: {
          AND: [
            { shared: { equals: undefined } },
            {
              OR: [
                { finalDate: { gte: actualDate } },
                { finalDate: { equals: null } }
              ]
            }
          ]
        }, include: { tags: true }, orderBy: {}
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?minDim=1&maxDim=3`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 1);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces which m2 are greater than minDim parameter', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        take: undefined, skip: undefined,
        where: {
          AND: [
            { shared: { equals: undefined } },
            {
              OR: [
                { finalDate: { gte: actualDate } },
                { finalDate: { equals: null } }
              ]
            }
          ]
        }, include: { tags: true }, orderBy: {}
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?minDim=1`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 1);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces which m2 are lower than maxDim parameter', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        take: undefined, skip: undefined,
        where: {
          AND: [
            { shared: { equals: undefined } },
            {
              OR: [
                { finalDate: { gte: actualDate } },
                { finalDate: { equals: null } }
              ]
            }
          ]
        }, include: { tags: true }, orderBy: {}
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?maxDim=3`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 1);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces which priceHour are inside in the given range', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        take: undefined, skip: undefined,
        where: {
          AND: [
            { shared: { equals: undefined } },
            {
              OR: [
                { finalDate: { gte: actualDate } },
                { finalDate: { equals: null } }
              ]
            }
          ]
        }, include: { tags: true }, orderBy: {}
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?minPriceHour=4&maxPriceHour=6`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 1);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces which priceHour are greater than minPriceHour parameter', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        take: undefined, skip: undefined,
        where: {
          AND: [
            { shared: { equals: undefined } },
            {
              OR: [
                { finalDate: { gte: actualDate } },
                { finalDate: { equals: null } }
              ]
            }
          ]
        }, include: { tags: true }, orderBy: {}
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?minPriceHour=4`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 1);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces which priceHour are lower than maxPriceHour parameter', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        take: undefined, skip: undefined,
        where: {
          AND: [
            { shared: { equals: undefined } },
            {
              OR: [
                { finalDate: { gte: actualDate } },
                { finalDate: { equals: null } }
              ]
            }
          ]
        }, include: { tags: true }, orderBy: {}
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?maxPriceHour=6`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 1);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces which priceDay are inside in the given range', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        take: undefined, skip: undefined,
        where: {
          AND: [
            { shared: { equals: undefined } },
            {
              OR: [
                { finalDate: { gte: actualDate } },
                { finalDate: { equals: null } }
              ]
            }
          ]
        }, include: { tags: true }, orderBy: {}
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?minPriceDay=54&maxPriceDay=58`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 1);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces which priceDay are greater than minPriceDay parameter', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        take: undefined, skip: undefined,
        where: {
          AND: [
            { shared: { equals: undefined } },
            {
              OR: [
                { finalDate: { gte: actualDate } },
                { finalDate: { equals: null } }
              ]
            }
          ]
        }, include: { tags: true }, orderBy: {}
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?minPriceDay=54`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 1);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces which priceDay are lower than maxPriceDay parameter', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        take: undefined, skip: undefined,
        where: {
          AND: [
            { shared: { equals: undefined } },
            {
              OR: [
                { finalDate: { gte: actualDate } },
                { finalDate: { equals: null } }
              ]
            }
          ]
        }, include: { tags: true }, orderBy: {}
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?maxPriceDay=57`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 1);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces which priceMonth are inside in the given range', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        take: undefined, skip: undefined,
        where: {
          AND: [
            { shared: { equals: undefined } },
            {
              OR: [
                { finalDate: { gte: actualDate } },
                { finalDate: { equals: null } }
              ]
            }
          ]
        }, include: { tags: true }, orderBy: {}
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?minPriceMonth=450&maxPriceMonth=460`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 1);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces which priceMonth are greater than minPriceMonth parameter', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        take: undefined, skip: undefined,
        where: {
          AND: [
            { shared: { equals: undefined } },
            {
              OR: [
                { finalDate: { gte: actualDate } },
                { finalDate: { equals: null } }
              ]
            }
          ]
        }, include: { tags: true }, orderBy: {}
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?minPriceMonth=450`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 1);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces which priceMonth are greater than maxPriceMonth parameter', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        take: undefined, skip: undefined,
        where: {
          AND: [
            { shared: { equals: undefined } },
            {
              OR: [
                { finalDate: { gte: actualDate } },
                { finalDate: { equals: null } }
              ]
            }
          ]
        }, include: { tags: true }, orderBy: {}
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?maxPriceMonth=460`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 1);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces that can not be rented per hours', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        take: undefined, skip: undefined,
        where: {
          AND: [
            { shared: { equals: undefined } },
            {
              OR: [
                { finalDate: { gte: actualDate } },
                { finalDate: { equals: null } }
              ]
            }
          ]
        }, include: { tags: true }, orderBy: {}
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?isRentPerHour=false`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 1);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces that can be rented per hours', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 10, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 10, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        take: undefined, skip: undefined,
        where: {
          AND: [
            { shared: { equals: undefined } },
            {
              OR: [
                { finalDate: { gte: actualDate } },
                { finalDate: { equals: null } }
              ]
            }
          ]
        }, include: { tags: true }, orderBy: {}
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?isRentPerHour=true`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 1);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces that can not be rented per days', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: null, priceMonth: 456, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceMonth: 456, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        take: undefined, skip: undefined,
        where: {
          AND: [
            { shared: { equals: undefined } },
            {
              OR: [
                { finalDate: { gte: actualDate } },
                { finalDate: { equals: null } }
              ]
            }
          ]
        }, include: { tags: true }, orderBy: {}
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?isRentPerDay=false`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 1);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces that can be rented per days', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 456, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 456, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        take: undefined, skip: undefined,
        where: {
          AND: [
            { shared: { equals: undefined } },
            {
              OR: [
                { finalDate: { gte: actualDate } },
                { finalDate: { equals: null } }
              ]
            }
          ]
        }, include: { tags: true }, orderBy: {}
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?isRentPerDay=true`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 1);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces that can not be rented per months', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: null, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 55, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        take: undefined, skip: undefined,
        where: {
          AND: [
            { shared: { equals: undefined } },
            {
              OR: [
                { finalDate: { gte: actualDate } },
                { finalDate: { equals: null } }
              ]
            }
          ]
        }, include: { tags: true }, orderBy: {}
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?isRentPerMonth=false`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 1);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces that can be rented per months', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        take: undefined, skip: undefined,
        where: {
          AND: [
            { shared: { equals: undefined } },
            {
              OR: [
                { finalDate: { gte: actualDate } },
                { finalDate: { equals: null } }
              ]
            }
          ]
        }, include: { tags: true }, orderBy: {}
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?isRentPerMonth=true`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 1);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces that contains both selected tags', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        take: undefined, skip: undefined,
        where: {
          AND: [
            { shared: { equals: undefined } },
            {
              OR: [
                { finalDate: { gte: actualDate } },
                { finalDate: { equals: null } }
              ]
            }
          ]
        }, include: { tags: true }, orderBy: {}
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?tags=DRY,GARAGE`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 1);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces that contains selected tags', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        take: undefined, skip: undefined,
        where: {
          AND: [
            { shared: { equals: undefined } },
            {
              OR: [
                { finalDate: { gte: actualDate } },
                { finalDate: { equals: null } }
              ]
            }
          ]
        }, include: { tags: true }, orderBy: {}
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?tags=DRY`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 1);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return empty array of spaces because it does not contains selected tags', async () => {

      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        take: undefined, skip: undefined,
        where: {
          AND: [
            { shared: { equals: undefined } },
            {
              OR: [
                { finalDate: { gte: actualDate } },
                { finalDate: { equals: null } }
              ]
            }
          ]
        }, include: { tags: true }, orderBy: {}
      }).resolves([]);

      // API Call
      await axios.get(`${host}/api/v1/spaces?tags=WET`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 0);
        assert.deepEqual(res.data, []);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces sorted by priceHour asc', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      },
      {
        id: 2, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 8, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      },
      {
        id: 2, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 8, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);


      // Mock DB Query
      findMany.withArgs({
        take: undefined, skip: undefined,
        where: {
          AND: [
            { shared: { equals: undefined } },
            {
              OR: [
                { finalDate: { gte: actualDate } },
                { finalDate: { equals: null } }
              ]
            }
          ]
        }, include: { tags: true }, orderBy: { priceHour: 'asc' }
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?orderBy=priceHour-asc`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 2);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces sorted by priceHour desc', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 8, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      },
      {
        id: 2, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 8, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      },
      {
        id: 2, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);


      // Mock DB Query
      findMany.withArgs({
        take: undefined, skip: undefined,
        where: {
          AND: [
            { shared: { equals: undefined } },
            {
              OR: [
                { finalDate: { gte: actualDate } },
                { finalDate: { equals: null } }
              ]
            }
          ]
        }, include: { tags: true }, orderBy: { priceHour: 'desc' }
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?orderBy=priceHour-desc`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 2);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces sorted by priceDay asc', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 8, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      },
      {
        id: 2, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 58, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 8, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      },
      {
        id: 2, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 58, priceMonth: 430, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);


      // Mock DB Query
      findMany.withArgs({
        take: undefined, skip: undefined,
        where: {
          AND: [
            { shared: { equals: undefined } },
            {
              OR: [
                { finalDate: { gte: actualDate } },
                { finalDate: { equals: null } }
              ]
            }
          ]
        }, include: { tags: true }, orderBy: { priceDay: 'asc' }
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?orderBy=priceDay-asc`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 2);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces sorted by priceDay desc', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 8, priceDay: 58, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      },
      {
        id: 2, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 8, priceDay: 58, priceMonth: 430, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      },
      {
        id: 2, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);


      // Mock DB Query
      findMany.withArgs({
        take: undefined, skip: undefined,
        where: {
          AND: [
            { shared: { equals: undefined } },
            {
              OR: [
                { finalDate: { gte: actualDate } },
                { finalDate: { equals: null } }
              ]
            }
          ]
        }, include: { tags: true }, orderBy: { priceDay: 'desc' }
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?orderBy=priceDay-desc`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 2);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces sorted by priceMonth asc', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 8, priceDay: 58, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      },
      {
        id: 2, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 440, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 8, priceDay: 58, priceMonth: 430, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      },
      {
        id: 2, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 440, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);


      // Mock DB Query
      findMany.withArgs({
        take: undefined, skip: undefined,
        where: {
          AND: [
            { shared: { equals: undefined } },
            {
              OR: [
                { finalDate: { gte: actualDate } },
                { finalDate: { equals: null } }
              ]
            }
          ]
        }, include: { tags: true }, orderBy: { priceMonth: 'asc' }
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?orderBy=priceMonth-asc`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 2);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces sorted by priceMonth desc', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 8, priceDay: 58, priceMonth: 440, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      },
      {
        id: 2, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 8, priceDay: 58, priceMonth: 440, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      },
      {
        id: 2, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        take: undefined, skip: undefined,
        where: {
          AND: [
            { shared: { equals: undefined } },
            {
              OR: [
                { finalDate: { gte: actualDate } },
                { finalDate: { equals: null } }
              ]
            }
          ]
        }, include: { tags: true }, orderBy: { priceMonth: 'desc' }
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?orderBy=priceMonth-desc`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 2);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces which contains search text in title', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es una guarida", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "36.8551,-5.32362",
        dimensions: "1x3", priceHour: 8, priceDay: 58, priceMonth: 440, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es una guarida", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "36.8551,-5.32362",
        dimensions: "1x3", priceHour: 8, priceDay: 58, priceMonth: 440, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        take: undefined, skip: undefined,
        where: {
          AND: [
            { shared: { equals: undefined } },
            {
              OR: [
                { finalDate: { gte: actualDate } },
                { finalDate: { equals: null } }
              ]
            }
          ]
        }, include: { tags: true }, orderBy: { }
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?search=sotano`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 1);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces which contains search text in description', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es una guarida", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "36.8551,-5.32362",
        dimensions: "1x3", priceHour: 8, priceDay: 58, priceMonth: 440, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es una guarida", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "36.8551,-5.32362",
        dimensions: "1x3", priceHour: 8, priceDay: 58, priceMonth: 440, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY" ]
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        take: undefined, skip: undefined,
        where: {
          AND: [
            { shared: { equals: undefined } },
            {
              OR: [
                { finalDate: { gte: actualDate } },
                { finalDate: { equals: null } }
              ]
            }
          ]
        }, include: { tags: true }, orderBy: { }
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?search=esto`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 1);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return empty array because search filter is not contained in title and description', async () => {

      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        take: undefined, skip: undefined,
        where: {
          AND: [
            { shared: { equals: undefined } },
            {
              OR: [
                { finalDate: { gte: actualDate } },
                { finalDate: { equals: null } }
              ]
            }
          ]
        }, include: { tags: true }, orderBy: { }
      }).resolves([]);

      // API Call
      await axios.get(`${host}/api/v1/spaces?search=casa`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 0);
        assert.deepEqual(res.data, []);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return 500 when unexpected error occurs', async () => {
      // Fixture
      const expected = 'Server error: Could not get spaces';

      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      console.error = sinon.stub(); // Avoid logging intentionally provoked error
      findMany.withArgs({
        take: undefined, skip: undefined,
        where: {
          AND: [
            { shared: { equals: undefined } },
            {
              OR: [
                { finalDate: { gte: actualDate } },
                { finalDate: { equals: null } }
              ]
            }
          ]
        }, include: { tags: true }, orderBy: {}
      }).rejects('Unknown Error');

      // API Call
      await axios.get(`${host}/api/v1/spaces`).then(res => {
        assert.fail();
      }).catch(err => {
        assert.equal(err.response.status, 500);
        assert.equal(err.response.data, expected);
      });
    });

    it('should return spaces that an user owns', async () => {
      // Fixture
      const dbOutput = [{id: 1, name: 'space1', description: 'space1', initialDate: '1970-01-01T00:00:00.000Z', finalDate: '1971-01-01T00:00:00.000Z', location: '44.4,45.3', dimensions: '2x2', priceHour: 33, priceDay: 345, priceMonth: 3444, shared: true, ownerId: 1}, 
      {id: 2, name: 'space2', description: 'space2', initialDate: '1970-01-01T00:00:00.000Z', finalDate: '1971-01-01T00:00:00.000Z', location: '44.4,45.3', dimensions: '2x2', priceHour: 33, priceDay: 345, priceMonth: 3444, shared: false, ownerId: 1}];
      const expected = [{id: 1, name: 'space1', description: 'space1', initialDate: '1970-01-01T00:00:00.000Z', finalDate: '1971-01-01T00:00:00.000Z', location: '44.4,45.3', dimensions: '2x2', priceHour: 33, priceDay: 345, priceMonth: 3444, shared: true, ownerId: 1}, 
      {id: 2, name: 'space2', description: 'space2', initialDate: '1970-01-01T00:00:00.000Z', finalDate: '1971-01-01T00:00:00.000Z', location: '44.4,45.3', dimensions: '2x2', priceHour: 33, priceDay: 345, priceMonth: 3444, shared: false, ownerId: 1}];

      // Mock DB Query
      findMany.withArgs({
        skip: undefined,
        take: undefined,
        where: {
          ownerId: 1
        },
        include: {
          tags: true
        }
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/users/1/spaces`).then(res => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.data, expected);
      });
    });

    it('should return 404 when trying to get non-existing spaces that an user owns', async () => {
      // Fixture
      const dbOutput = undefined;
      const expected = 'Spaces not found';

      // Mock DB Query
      findMany.withArgs({
        skip: undefined,
        take: undefined,
        where: {
          ownerId: 1
        },
        include: {
          tags: true
        }
      }).resolves(dbOutput)

      // API Call
      await axios.get(`${host}/api/v1/users/1/spaces`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 404);
        assert.equal(err.response.data, expected);
      });
    });

    it('should return 400 when trying to get spaces with non integers userId', async () => {
      // Fixture
      const expected = 'Invalid userId parameter. It must be an integer number';

      // Mock DB Query
      findMany.withArgs({
        skip: undefined,
        take: undefined,
        where: {
          ownerId: "invalid"
        },
        include: {
          tags: true
        }
      }).rejects();

      // API Call
      await axios.get(`${host}/api/v1/users/invalid/spaces`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 400);
        assert.equal(err.response.data, expected);
      });
    });

    it('should return 500 unexpected error when trying to get spaces of an user', async () => {
      // Fixture
      const expected = 'Server error: Could not get items';

      // Mock DB Query
      findMany.withArgs({
        skip: undefined,
        take: undefined,
        where: {
          ownerId: 1
        },
        include: {
          tags: true
        }
      }).rejects();

      // API Call
      await axios.get(`${host}/api/v1/users/1/spaces`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 500);
        assert.equal(err.response.data, expected);
      });
    });

  });

  describe('POST Endpoint tests:', () => {
    it('Should post an space', async () => {
    // Fixture
    const expected = 'Space created successfully';
    const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
    const spaceToBePublished = {
      name: "test",
      description: "test",
      initialDate: new Date("2022-03-10T18:18:14.049Z"),
      finalDate: new Date("2023-03-10T18:18:14.049Z"),
      location: "44.43,43.21",
      dimensions: "2x2",
      shared: true,
      ownerId: 1,
      priceHour: 33.2,
      tags: ['ELEVATOR', 'WET'],
      images: [ fs.readFileSync(`${__dirname}/../assets/Test.png`, 'base64'), fs.readFileSync(`${__dirname}/../assets/Test.jpg`, 'base64') ]
    }
    // Mock Auth and DB Query
    verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
    create.resolves();

    // API Call
    await axios.post(`${host}/api/v1/spaces`, spaceToBePublished, { 
        withCredentials: true, 
        headers: {Cookie: 'authToken=testToken;'}
      })
      .then( res => {
        assert.equal(res.status, 201);
        assert.equal(res.data, expected);
      }).catch( () => assert.fail());
    });

    it('Should return 401 when token is missing', async () => {
      // Fixture
      const expected = 'Unauthorized';
        
      // API Call
      await axios.post(`${host}/api/v1/spaces`, {})
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 401);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 401 when JWTError is thrown on verification', async () => {
      // Fixture
      const expected = 'Unauthorized: Invalid token';

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').throws(new jwt.JsonWebTokenError('Invalid token'));
      
      // API Call
      await axios.post(`${host}/api/v1/spaces`, {}, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 401);
          assert.equal(err.response.data, expected);
      });
    });

    it('Should return 403 when someone with USER rol tries to post a space', async () => {
      // Fixture
      const expected = 'Forbidden';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
    
      // API Call
      await axios.post(`${host}/api/v1/spaces`, {ownerId: 1}, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 403);
          assert.equal(err.response.data, expected);
      });
    });

    it('Should return 403 when someone tries to publish a space with another userId', async () => {
      // Fixture
      const expected = 'Forbidden';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
    
      // API Call
      await axios.post(`${host}/api/v1/spaces`, {ownerId: 2}, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 403);
          assert.equal(err.response.data, expected);
      });
    });

    it('Should return 400 when space does not have an ownerId', async () => {
      // Fixture
      const expected = 'Missing required attributes';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
    
      // API Call
      await axios.post(`${host}/api/v1/spaces`, {}, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
      });
    });

    it('Should return 400 when a required field is missing', async () => {
      // Fixture
      const expected = 'Bad Request: Missing required attributes';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const testSpace = {name: 'test', description: 'test', initialDate: new Date(), location: '1,1', dimensions: '1x1', shared:true}

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
    
      // API Call
      Object.keys(testSpace).forEach( async key => {
        let spaceToPublish = Object.keys(testSpace).filter(k => k !== key).reduce((obj, k) => {obj[k] = testSpace[k]; return obj}, {ownerId: 1});
        await axios.post(`${host}/api/v1/spaces`, spaceToPublish,   
          { 
            withCredentials: true, 
            headers: {Cookie: 'authToken=testToken;'}
          })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
      });
    });

    it('Should return 400 when space name is shorter than two chars or longer than 50', async () => {
      // Fixture
      const expected = 'Bad Request: Name must be between 2 and 50 characters';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      let spaceToPublish = {ownerId: 1, name: 'test', description: 'test', initialDate: new Date(), location: '1,1', dimensions: '1x1', shared:true};

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      
      // API Call
      spaceToPublish.name = 't';
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
      });

      spaceToPublish.name = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, { 
        withCredentials: true, 
        headers: {Cookie: 'authToken=testToken;'}
      })
      .then( () => {
        assert.fail();
      }).catch( err => {
        assert.equal(err.response.status, 400);
        assert.equal(err.response.data, expected);
      });
    });

    it('Should return 400 when providing a space with an invalid initial date', async () => {
      // Fixture
      const expected = 'Bad Request: Initial date must be a Date';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const spaceToPublish = {ownerId: 1, name: 'test', description: 'test', initialDate: 'not_a_date', location: '1,1', dimensions: '1x1', shared:true};

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      
      // API Call
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
      });
    });

    it('Should return 400 when providing a space with an invalid final date', async () => {
      // Fixture
      const expected = 'Bad Request: Final date must be a Date';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const spaceToPublish = {ownerId: 1, name: 'test', description: 'test', initialDate: new Date(), finalDate: 'not_a_date', location: '1,1', dimensions: '1x1', shared:true};

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      
      // API Call
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
      });
    });

    it('Should return 400 when providing an invalid lat-lon pair', async () => {
      // Fixture
      const expected = 'Bad Request: Location must be a valid latitude,longitude pair';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const spaceToPublish = {ownerId: 1, name: 'test', description: 'test', initialDate: new Date(), location: '1,180.1', dimensions: '1x1', shared:true};

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      
      // API Call
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
      });
    });

    it('Should return 400 when providing an invalid dimensions pair', async () => {
      // Fixture
      const expected = 'Bad Request: Dimensions must be a valid width,height pair';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const spaceToPublish = {ownerId: 1, name: 'test', description: 'test', initialDate: new Date(), location: '1,1', dimensions: '1', shared:true};

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      
      // API Call
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
      });
    });

    it('Should return 400 when providing a non-numeric priceHour', async () => {
      // Fixture
      const expected = 'Bad Request: PriceHour must be a number';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const spaceToPublish = {ownerId: 1, name: 'test', description: 'test', priceHour:'not_num', initialDate: new Date(), location: '1,1', dimensions: '1x1', shared:true};

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      
      // API Call
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
      });
    });

    it('Should return 400 when providing a non-numeric priceDay', async () => {
      // Fixture
      const expected = 'Bad Request: PriceDay must be a number';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const spaceToPublish = {ownerId: 1, name: 'test', description: 'test', priceDay:'not_num', initialDate: new Date(), location: '1,1', dimensions: '1x1', shared:true};

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      
      // API Call
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
      });
    });

    it('Should return 400 when providing a non-numeric priceMonth', async () => {
      // Fixture
      const expected = 'Bad Request: PriceMonth must be a number';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const spaceToPublish = {ownerId: 1, name: 'test', description: 'test', priceMonth:'not_num', initialDate: new Date(), location: '1,1', dimensions: '1x1', shared:true};

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      
      // API Call
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
      });
    });

    it('Should return 400 when attribute shared is not a boolean', async () => {
      // Fixture
      const expected = 'Bad Request: Shared must be true or false';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const spaceToPublish = {ownerId: 1, name: 'test', description: 'test', priceMonth: 1, initialDate: new Date(), location: '1,1', dimensions: '1x1', shared:'not_true'};

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      
      // API Call
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
      });
    });

    it('Should return 400 when attribute tags is not an array', async () => {
      // Fixture
      const expected = 'Bad Request: Tags must be an array';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const spaceToPublish = {ownerId: 1, name: 'test', description: 'test', priceMonth: 1, initialDate: new Date(), location: '1,1', dimensions: '1x1', shared:true, tags:'not_array'};

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      
      // API Call
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
      });
    });

    it('Should return 400 when invalid tags provided', async () => {
      // Fixture
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const spaceToPublish = {ownerId: 1, name: 'test', description: 'test', priceMonth: 1, initialDate: new Date(), location: '1,1', dimensions: '1x1', shared:true, tags:['INVALID_TAG']};

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      
      // API Call
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 400);
          assert.match(err.response.data, /(?:Tags must be one of the following).*/);
      });
    });

    it('Should return 400 when invalid images provided', async () => {
      // Fixture
      const expected = 'Bad Request: Images must be jpeg or png';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const spaceToPublish = {ownerId: 1, name: 'test', description: 'test', priceMonth: 1, initialDate: new Date(), location: '1,1', dimensions: '1x1', shared:true, images:['invalid_img']};

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      
      // API Call
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
      });
    });

    it('RN03: Should return 400 when no price is set', async () => {
      // Fixture
      const expected = 'Bad Request: You must defined at least one valid price greater than 0';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const spaceToPublish = {ownerId: 1, name: 'test', description: 'test', initialDate: new Date(), location: '1,1', dimensions: '1x1', shared:true};

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      
      // API Call
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
      });
    });

    it('RN04: Should return 400 when final date before initial date', async () => {
      // Fixture
      let bad_date = new Date();
      bad_date.setDate(bad_date.getDate() - 1);
      const expected = 'Bad Request: Final date must be after initial date';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const spaceToPublish = {ownerId: 1, name: 'test', description: 'test', priceDay: 1, initialDate: new Date(), finalDate: bad_date, location: '1,1', dimensions: '1x1', shared:true};

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      
      // API Call
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
      });
    });

    it('Should return 500 when an unexpected error is thrown', async () => {
      // Fixture
      const expected = 'Internal Server Error';

      // Mock Auth and DB Query
      console.error = sinon.stub(); // Avoid logging intentionally provoked error
      verify.withArgs('testToken', 'stackingupsecretlocal').throws(new Error('Unexpected Error'));
      
      // API Call
      await axios.post(`${host}/api/v1/spaces`, {}, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 500);
          assert.equal(err.response.data, expected);
      });
    });

    it('Should return 500 when prisma create fails', async () => {
      // Fixture
      const expected = 'Internal Server Error';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const spaceToBePublished = {
        name: "test",
        description: "test",
        initialDate: new Date("2022-03-10T18:18:14.049Z"),
        location: "44.43,43.21",
        dimensions: "2x2",
        shared: true,
        ownerId: 1,
        priceHour: 33.2,
        tags: ['ELEVATOR', 'WET'],
        images: [ fs.readFileSync(`${__dirname}/../assets/Test.png`, 'base64'), fs.readFileSync(`${__dirname}/../assets/Test.jpg`, 'base64') ]
      }
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      create.rejects();
    
      // API Call
      await axios.post(`${host}/api/v1/spaces`, spaceToBePublished, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 500);
          assert.equal(err.response.data, expected);
        });
    });
  });

  describe('PUT Endpoint tests:', () => {
    it('Should update a space', async () => {
      // Fixture
      const expected = 'Space updated successfully';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const spaceToBeUpdated = {
        name: "test",
        description: "test",
        initialDate: new Date("2022-03-10T18:18:14.049Z"),
        finalDate: new Date("2023-03-10T18:18:14.049Z"),
        location: "44.43,43.21",
        dimensions: "2x2",
        shared: true,
        ownerId: 1,
        priceHour: 33.2,
        tags: ['ELEVATOR', 'WET'],
        images: [ fs.readFileSync(`${__dirname}/../assets/Test.png`, 'base64'), fs.readFileSync(`${__dirname}/../assets/Test.jpg`, 'base64') ]
      }
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      update.resolves();
      
      // API Call
      await axios.put(`${host}/api/v1/spaces/1`, spaceToBeUpdated, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( res => {
          assert.equal(res.status, 201);
          assert.equal(res.data, expected);
        }).catch( () => assert.fail());
    });

    it('Should return 401 when token is missing', async () => {
      // Fixture
      const expected = 'Unauthorized';
        
      // API Call
      await axios.put(`${host}/api/v1/spaces/1`, {})
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 401);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 401 when JWTError is thrown on verification', async () => {
      // Fixture
      const expected = 'Unauthorized: Invalid token';

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').throws(new jwt.JsonWebTokenError('Invalid token'));
      
      // API Call
      await axios.put(`${host}/api/v1/spaces/1`, {}, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 401);
          assert.equal(err.response.data, expected);
      });
    });

    it('Should return 403 when someone with USER rol tries to update a space', async () => {
      // Fixture
      const expected = 'Forbidden';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
    
      // API Call
      await axios.put(`${host}/api/v1/spaces/1`, {ownerId: 1}, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 403);
          assert.equal(err.response.data, expected);
      });
    });

    it('Should return 403 when someone tries to update a space with another userId', async () => {
      // Fixture
      const expected = 'Forbidden';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
    
      // API Call
      await axios.put(`${host}/api/v1/spaces/1`, {ownerId: 2}, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 403);
          assert.equal(err.response.data, expected);
      });
    });

    it('Should return 400 when the space to update is missing its ownerId', async () => {
      // Fixture
      const expected = 'Missing required attributes';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
    
      // API Call
      await axios.put(`${host}/api/v1/spaces/1`, {}, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
      });
    });

    it('Should return 400 when an invalid spaceId is provided in path', async () => {
      // Fixture
      const expected = 'Invalid spaceId. It must be an integer number';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
    
      // API Call
      await axios.put(`${host}/api/v1/spaces/invalid_spaceId`, {ownerId: 1}, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
      });
    });

    it('Should return 400 when any constraint from the model is violated', async () => {
      // Fixture
      const expected = 'Bad Request: Missing required attributes';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
    
      // API Call
      await axios.put(`${host}/api/v1/spaces/1`, {ownerId: 1}, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
      });
    });

    it('Should return 400 when trying to update a non-existent space', async () => {
      // Fixture
      const expected = 'No space records found';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const spaceToBeUpdated = {
        name: "test",
        description: "test",
        initialDate: new Date("2022-03-10T18:18:14.049Z"),
        location: "44.43,43.21",
        dimensions: "2x2",
        shared: true,
        ownerId: 1,
        priceHour: 33.2,
        tags: ['ELEVATOR', 'WET'],
        images: [ fs.readFileSync(`${__dirname}/../assets/Test.png`, 'base64'), fs.readFileSync(`${__dirname}/../assets/Test.jpg`, 'base64') ]
      }
      // Mock Auth and DB Query
      const error = new (require('@prisma/client/runtime').PrismaClientKnownRequestError)('No space records found', 'P2025');
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      update.rejects(error);
      
      // API Call
      await axios.put(`${host}/api/v1/spaces/1`, spaceToBeUpdated, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 500 when prisma update fails', async () => {
      // Fixture
      const expected = 'Internal Server Error';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const spaceToBeUpdated = {
        name: "test",
        description: "test",
        initialDate: new Date("2022-03-10T18:18:14.049Z"),
        location: "44.43,43.21",
        dimensions: "2x2",
        shared: true,
        ownerId: 1,
        priceHour: 33.2,
        tags: ['ELEVATOR', 'WET'],
        images: [ fs.readFileSync(`${__dirname}/../assets/Test.png`, 'base64'), fs.readFileSync(`${__dirname}/../assets/Test.jpg`, 'base64') ]
      }
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      update.rejects('Unknown error');
      
      // API Call
      await axios.put(`${host}/api/v1/spaces/1`, spaceToBeUpdated, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 500);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 500 when an unexpected error is thrown', async () => {
      // Fixture
      const expected = 'Internal Server Error';

      // Mock Auth and DB Query
      console.error = sinon.stub(); // Avoid logging intentionally provoked error
      verify.withArgs('testToken', 'stackingupsecretlocal').throws(new Error('Unexpected Error'));
      
      // API Call
      await axios.put(`${host}/api/v1/spaces/1`, {}, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 500);
          assert.equal(err.response.data, expected);
      });
    });
  });

  describe('DELETE Endpoint tests:', () => {
    it('Should delete a space', async () => {
      // Fixture
      const spaceToBeDeleted = {ownerId: 1};
      const expected = 'Space deleted successfully';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      
      // Mock Auth and DB Queries
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.resolves(spaceToBeDeleted);
      updateUser.resolves();

      // API Call
      await axios.delete(`${host}/api/v1/spaces/1`, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( res => {
          assert.equal(res.status, 200);
          assert.equal(res.data, expected);
        }).catch( () => assert.fail());
    });

    it('Should return 401 when token is missing', async () => {
      // Fixture
      const expected = 'Unauthorized';
        
      // API Call
      await axios.delete(`${host}/api/v1/spaces/1`)
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 401);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 401 when JWTError is thrown on verification', async () => {
      // Fixture
      const expected = 'Unauthorized: Invalid token';

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').throws(new jwt.JsonWebTokenError('Invalid token'));
      
      // API Call
      await axios.delete(`${host}/api/v1/spaces/1`, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 401);
          assert.equal(err.response.data, expected);
      });
    });

    it('Should return 403 when someone with USER rol tries to delete a space', async () => {
      // Fixture
      const expected = 'Forbidden';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
    
      // API Call
      await axios.delete(`${host}/api/v1/spaces/1`, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 403);
          assert.equal(err.response.data, expected);
      });
    });

    it('Should return 403 when someone tries to delete a space with another userId', async () => {
      // Fixture
      const spaceToBeDeleted = {ownerId: 2};
      const expected = 'Forbidden';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.resolves(spaceToBeDeleted);

      // API Call
      await axios.delete(`${host}/api/v1/spaces/1`, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 403);
          assert.equal(err.response.data, expected);
      });
    });

    it('Should return 400 when provided invalid spaceId in path', async () => {
      // Fixture
      const expected = 'Invalid spaceId. It must be an integer number';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      
      // Mock Auth and DB Queries
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);

      // API Call
      await axios.delete(`${host}/api/v1/spaces/sdsdss`, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when no space record is found to delete', async () => {
      // Fixture
      const expected = 'No space records found';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      
      // Mock Auth and DB Queries
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.resolves(null);

      // API Call
      await axios.delete(`${host}/api/v1/spaces/1`, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('RN09: Should return 400 when trying to delete a space containing rentals', async () => {
      // Fixture
      const spaceToBeDeleted = {ownerId: 1, rentals: [{id: 1}]};
      const expected = 'Cannot delete space containing rentals';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      
      // Mock Auth and DB Queries
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.resolves(spaceToBeDeleted);

      // API Call
      await axios.delete(`${host}/api/v1/spaces/1`, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 500 when prisma delete fails', async () => {
      // Fixture
      const spaceToBeDeleted = {ownerId: 1};
      const expected = 'Internal Server Error';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      
      // Mock Auth and DB Queries
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.resolves(spaceToBeDeleted);
      updateUser.rejects('Unknown error');

      // API Call
      await axios.delete(`${host}/api/v1/spaces/1`, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 500);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 500 when unexpected error is thrown', async () => {
      // Fixture
      const expected = 'Internal Server Error';
      
      // Mock Auth and DB Query
      console.error = sinon.stub(); // Avoid logging intentionally provoked error
      verify.withArgs('testToken', 'stackingupsecretlocal').throws(new Error('Unexpected Error'));

      // API Call
      await axios.delete(`${host}/api/v1/spaces/1`, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( () => {
          assert.fail();
        }).catch( err => {
          assert.equal(err.response.status, 500);
          assert.equal(err.response.data, expected);
        });
    });
  });
}