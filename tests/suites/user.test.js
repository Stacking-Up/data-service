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

  it('should return items asociated to a user when giving an userId', async () => {
    // Fixture
    const dbOutput = {id:1, name: 'John', surname: 'Doe', items: 
    [{id:1, type: 'ELECTRONICS', dimensions: 'SMALL'}, {id:2, type: 'ELECTRONICS', dimensions: 'MEDIUM'}]};
    const expected = [{id:1, type: 'ELECTRONICS', dimensions: 'SMALL'}, {id:2, type: 'ELECTRONICS', dimensions: 'MEDIUM'}];

    // Mock DB Query
    findUnique.withArgs({
      where: {
        id: 1
      },
      include: {
        items: {
          select: {
            type: true,
            dimensions: true
          },
        },
      },
    }).resolves(dbOutput)

    // API Call
    axios.get(`${host}/api/v1/users/1/items`).then(res => {
      assert.equal(res.status, 200);
      assert.deepEqual(res.data, expected);
    });
  });

  it('should return 404 when trying to get non-existing items asociated to a user giving an userId', async () => {
    // Fixture
    const dbOutput = {id:1, name: 'John', surname: 'Doe'};
    const expected = 'Items not found';

    // Mock DB Query
    findUnique.withArgs({
      where: {
        id: 1
      },
      include: {
        items: {
          select: {
            type: true,
            dimensions: true
          },
        },
      },
    }).resolves(dbOutput)

    // API Call
    axios.get(`${host}/api/v1/users/1/items`).then(res => {
      assert.equal(res.status, 404);
      assert.deepEqual(res.data, expected);
    });
  });

  it('should return 404 when trying to get items asociated to a non-existing user', async () => {
    // Fixture
    const dbOutput = undefined;
    const expected = 'User not found';

    // Mock DB Query
    findUnique.withArgs({
      where: {
        id: 1
      },
      include: {
        items: {
          select: {
            type: true,
            dimensions: true
          },
        },
      },
    }).resolves(dbOutput)

    // API Call
    axios.get(`${host}/api/v1/users/1/items`).then(res => {
      assert.equal(res.status, 404);
      assert.deepEqual(res.data, expected);
    });
  });

  it('should return item asociated to an user giving an userId and itemId', async () => {
    // Fixture
    const dbOutput = {id:1, name: 'John', surname: 'Doe', items: 
    [{id:1, type: 'ELECTRONICS', dimensions: 'SMALL'}, {id:2, type: 'ELECTRONICS', dimensions: 'MEDIUM'}]};
    const expected = {id:1, type: 'ELECTRONICS', dimensions: 'SMALL'};

    // Mock DB Query
    findUnique.withArgs({
      where: {
        id: 1,
    },
      include: {
        items: {
          select: {
            type: true,
            dimensions: true,
          },
          where: {
            id: 1,
          },
        },
      },
    }).resolves(dbOutput)

    // API Call
    axios.get(`${host}/api/v1/users/1/items/1`).then(res => {
      assert.equal(res.status, 200);
      assert.deepEqual(res.data, expected);
    });
  });

  it('should return 404 when trying to get a non-existing item asociated to an user giving an userId and itemId', async () => {
    // Fixture
    const dbOutput = {id:1, name: 'John', surname: 'Doe'};
    const expected = 'Item not found';

    // Mock DB Query
    findUnique.withArgs({
      where: {
        id: 1,
    },
      include: {
        items: {
          select: {
            type: true,
            dimensions: true,
          },
          where: {
            id: 1,
          },
        },
      },
    }).resolves(dbOutput)

    // API Call
    axios.get(`${host}/api/v1/users/1/items/1`).then(res => {
      assert.equal(res.status, 404);
      assert.deepEqual(res.data, expected);
    });
  });

  it('should return 404 when trying to get an existing item asociated to a non-existing user giving an userId and itemId', async () => {
    // Fixture
    const dbOutput = undefined;
    const expected = 'User not found';

    // Mock DB Query
    findUnique.withArgs({
      where: {
        id: 1,
    },
      include: {
        items: {
          select: {
            type: true,
            dimensions: true,
          },
          where: {
            id: 1,
          },
        },
      },
    }).resolves(dbOutput)

    // API Call
    axios.get(`${host}/api/v1/users/1/items/1`).then(res => {
      assert.equal(res.status, 404);
      assert.deepEqual(res.data, expected);
    });
  });

  it('should return ratings that an user has given or received', async () => {
    // Fixture
    const dbOutput = {id:1, name: 'John', surname: 'Doe', ratings: 
    [{id:1, title: 'given_rating', description: 'given_rating', rating: 5, reviewerId: 1, receiverId: 2}, 
    {id:2, title: 'received_rating', description: 'received_rating', rating: 7, reviewerId: 2, receiverId: 1}]};
    const expected = [{id:1, title: 'given_rating', description: 'given_rating', rating: 5, reviewerId: 1, receiverId: 2}, 
                      {id:2, title: 'received_rating', description: 'received_rating', rating: 7, reviewerId: 2, receiverId: 1}];

    // Mock DB Query
    findMany.withArgs({
      skip: undefined,
      take: undefined,
      where: {
        OR: [
          { receiverId: { equals: 1, }, },
          { reviewerId: { equals: 1, }, },
        ],
      },
      select:
        {
          title: true,
          description: true,
          rating: true,
          reviewerId: true,
          receiverId: true,
      },
    }).resolves(dbOutput)

    // API Call
    axios.get(`${host}/api/v1/users/1/ratings`).then(res => {
      assert.equal(res.status, 200);
      assert.deepEqual(res.data, expected);
    });
  });

  it('should return 404 when trying to get non-existing ratings that an user has given or received', async () => {
    // Fixture
    const dbOutput = {id:1, name: 'John', surname: 'Doe'};
    const expected = 'Ratings not found';

    // Mock DB Query
    findMany.withArgs({
      skip: undefined,
      take: undefined,
      where: {
        OR: [
          { receiverId: { equals: 1, }, },
          { reviewerId: { equals: 1, }, },
        ],
      },
      select:
        {
          title: true,
          description: true,
          rating: true,
          reviewerId: true,
          receiverId: true,
      },
    }).resolves(dbOutput)

    // API Call
    axios.get(`${host}/api/v1/users/1/ratings`).then(res => {
      assert.equal(res.status, 404);
      assert.deepEqual(res.data, expected);
    });
  });
}