const assert = require('assert');
const axios = require('axios');
const sinon = require('sinon');

const host = "http://localhost:4100";

module.exports = (prisma) => {
  let findMany = sinon.stub(prisma.user, 'findMany').rejects("Not implemented");
  let findManyRatings = sinon.stub(prisma.rating, 'findMany').rejects("Not implemented");

  before(() => {
    sinon.replace(prisma.user, 'findMany', findMany);
    sinon.replace(prisma.rating, 'findMany', findManyRatings);
  });

  /***************************************************************************
  * USER UNIT TESTS
  ***************************************************************************/
  describe('GET Endpoint tests:', () => {
    it('should return empty list when no users are found in DB', async () => {
        // Mock DB Query
        findMany.withArgs({ skip: undefined, take: undefined, include: {auth: {select: {email: true, role: true}}} }).resolves([]);

        // API Call
        await axios.get(`${host}/api/v1/users`).then(res => {
          assert.equal(res.status, 200);
          assert.equal(res.data.length, 0);
        });
    });

    it('should return data in DB when present', async () => {
      // Fixture
      const dbOutput = [{id:1, name: 'John', surname: 'Doe'}, {id:2, name: 'Jane', surname: 'Doe'}];
      const expected = [{id:1, name: 'John', surname: 'Doe'}, {id:2, name: 'Jane', surname: 'Doe'}];
      
      // Mock DB Query
      findMany.withArgs({ skip: undefined, take: undefined, include: {auth: {select: {email: true, role: true}}} }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/users`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 2);
        assert.deepEqual(res.data, expected);
      });
    });

    it('should return 400 when invalid query parameters provided', async () => {
      // Mock DB Query
      findMany.withArgs({ skip: "invalid", take: "invalid", include: {auth: {select: {email: true, role: true}}} }).rejects();

      // API Call
      await axios.get(`${host}/api/v1/users?offset=invalid&limit=invalid`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 400);
        assert.equal(err.response.data, 'Invalid query. It must be an integer number');
      });
    });

    it('should return 500 when unexpected error throws getting the users', async () => {
      // Mock DB Query
      console.error = sinon.stub(); //avoid printing error to console
      findMany.withArgs({ skip: undefined, take: undefined, include: {auth: {select: {email: true, role: true}}} }).rejects();

      // API Call
      await axios.get(`${host}/api/v1/users`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 500);
        assert.equal(err.response.data, 'Server error: Could not get users');
      });
    });

    it('should return ratings that an user has given or received', async () => {
      // Fixture
      const dbOutput = [{id:1, title: 'given_rating', description: 'given_rating', rating: 5, reviewerId: 1, receiverId: 2}, 
      {id:2, title: 'received_rating', description: 'received_rating', rating: 7, reviewerId: 2, receiverId: 1}];
      const expected = [{id:1, title: 'given_rating', description: 'given_rating', rating: 5, reviewerId: 1, receiverId: 2}, 
                        {id:2, title: 'received_rating', description: 'received_rating', rating: 7, reviewerId: 2, receiverId: 1}];

      // Mock DB Query
      findManyRatings.withArgs({
        skip: undefined,
        take: undefined,
        where: {
          OR: [
            { receiverId: { equals: 1 } },
            { reviewerId: { equals: 1 } }
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
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/users/1/ratings`).then(res => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.data, expected)
      });

      await axios.get(`${host}/api/v1/users/1/ratings?filter=given`).then(res => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.data, [expected[0]])
      });

      await axios.get(`${host}/api/v1/users/1/ratings?filter=received`).then(res => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.data, [expected[1]])
      });

      await axios.get(`${host}/api/v1/users/1/ratings?filter=all`).then(res => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.data, expected)
      });
    });

    it('should return 404 when trying to get non-existing ratings that an user has given or received', async () => {
      // Fixture
      const dbOutput = undefined;
      const expected = 'Ratings not found';

      // Mock DB Query
      findManyRatings.withArgs({
        skip: undefined,
        take: undefined,
        where: {
          OR: [
            { receiverId: { equals: 1 } },
            { reviewerId: { equals: 1 } },
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
      await axios.get(`${host}/api/v1/users/1/ratings`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 404);
        assert.equal(err.response.data, expected);
      });
    });

    it('should return 400 when setting an invalid filter', async () => {
      // Fixture
      const dbOutput = [{id:1, title: 'given_rating', description: 'given_rating', rating: 5, reviewerId: 1, receiverId: 2}, 
      {id:2, title: 'received_rating', description: 'received_rating', rating: 7, reviewerId: 2, receiverId: 1}];
      
      const expected = 'Invalid filter parameter. It must be one of the following: all, received, given';

      // Mock DB Query
      findManyRatings.withArgs({
        skip: undefined,
        take: undefined,
        where: {
          OR: [
            { receiverId: { equals: 1 } },
            { reviewerId: { equals: 1 } }
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
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/users/1/ratings?filter=testing`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 400);
        assert.equal(err.response.data, expected);
      });
    });

    it('should return 400 when a non integer parameter provided', async () => {
      const expected = 'Invalid parameter. It must be an integer number';

      // Mock DB Query
      findManyRatings.withArgs({
        skip: "invalid",
        take: "invalid",
        where: {
          OR: [
            { receiverId: { equals: 1 } },
            { reviewerId: { equals: 1 } }
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
      }).rejects();

      // API Call
      await axios.get(`${host}/api/v1/users/invalid/ratings`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 400);
        assert.equal(err.response.data, expected);
      });
    });

    it('should return 500 unexpected error when trying to get the ratings of an user', async () => {
      const expected = 'Server error: Could not get ratings.';

      // Mock DB Query
      findManyRatings.withArgs({
        skip: undefined,
        take: undefined,
        where: {
          OR: [
            { receiverId: { equals: 1 } },
            { reviewerId: { equals: 1 } }
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
      }).rejects();

      // API Call
      await axios.get(`${host}/api/v1/users/1/ratings`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 500);
        assert.equal(err.response.data, expected);
      });
    });

  }
);}