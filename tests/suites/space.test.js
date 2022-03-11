const assert = require('assert');
const axios = require('axios');
const sinon = require('sinon');

const host = "http://localhost:4100";

module.exports = (prisma) => {
  let findMany = sinon.stub(prisma.space, 'findMany').rejects("Not implemented");
  let findUnique = sinon.stub(prisma.space, 'findUnique').rejects("Not implemented");

  before(() => {
    sinon.replace(prisma.space, 'findMany', findMany);
    sinon.replace(prisma.space, 'findUnique', findUnique);
  });

/***************************************************************************
  * SPACE UNIT TESTS
  ***************************************************************************/
 it('should return empty list when no spaces are found in DB', async () => {
  // Mock DB Query
  findMany.withArgs({ skip: undefined, take: undefined }).resolves([]);

  // API Call
  await axios.get(`${host}/api/v1/spaces`).then(res => {
    assert.equal(res.status, 200);
    assert.equal(res.data.length, 0);
  });
});

it('should return data in DB when spaces present', async () => {
  // Fixture
  const dbOutput = [{id:1, name: 'Space 1', description: 'So much space',
   initialDate: '2020-03-10T00:00:00.000Z', finalDate:null,
   location: 'Sevilla', dimensions: '2x2', priceHour: '10', priceDay: '4', priceMonth: '45', ownerId: 1}, 

  {id:2, name: 'Space 2', description: 'So much space',
  initialDate: '2020-03-11T00:00:00.000Z', finalDate: '2022-03-17T00:00:00.000Z', 
  location: 'Sevilla', dimensions: '9x2', priceHour: '10', priceDay: '4', priceMonth: '45',image:null,
 shared: true, ownerId: 1}];

  const expected = [{id:1, name: 'Space 1', description: 'So much space',
  initialDate: '2020-03-10T00:00:00.000Z',
  location: 'Sevilla', dimensions: '2x2', priceHour: '10', priceDay: '4', priceMonth: '45', ownerId: 1}, 
 
 {id:2, name: 'Space 2', description: 'So much space',
 initialDate: '2020-03-11T00:00:00.000Z', finalDate: '2022-03-17T00:00:00.000Z', 
 location: 'Sevilla', dimensions: '9x2', priceHour: '10', priceDay: '4', priceMonth: '45', 
shared: true, ownerId: 1}];
  
  // Mock DB Query
  findMany.withArgs({ skip: undefined, take: undefined }).resolves(dbOutput);

  // API Call
  await axios.get(`${host}/api/v1/spaces`).then(res => {
    assert.equal(res.status, 200);
    assert.equal(res.data.length, 2);
    assert.deepEqual(res.data, expected);
  });  
});


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
  axios.get(`${host}/api/v1/spaces/1`).then(res => {
    assert.equal(res.status, 404);
    assert.deepEqual(res.data, expected);
  });

});


}