const assert = require('assert');
const axios = require('axios');
const sinon = require('sinon');

const host = "http://localhost:4100";

module.exports = (prisma) => {
  let findMany = sinon.stub(prisma.user, 'findMany').rejects("Not implemented");
  let findUnique = sinon.stub(prisma.user, 'findUnique').rejects("Not implemented");
  let findManyRatings = sinon.stub(prisma.rating, 'findMany').rejects("Not implemented");

  before(() => {
    sinon.replace(prisma.user, 'findMany', findMany);
    sinon.replace(prisma.user, 'findUnique', findUnique);
    sinon.replace(prisma.rating, 'findMany', findManyRatings);
  });

  /***************************************************************************
  * USER UNIT TESTS
  ***************************************************************************/
  describe('GET Endpoint tests:', () => {
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
      const dbOutput = [{id:1, name: 'John', surname: 'Doe'}, {id:2, name: 'Jane', surname: 'Doe'}];
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

    it('should return 400 when invalid query parameters provided', async () => {
      // Mock DB Query
      findMany.withArgs({ skip: "invalid", take: "invalid" }).rejects();

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
      findMany.withArgs({ skip: undefined, take: undefined }).rejects();

      // API Call
      await axios.get(`${host}/api/v1/users`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 500);
        assert.equal(err.response.data, 'Server error: Could not get users');
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
      }).resolves(undefined);

      // API Call
      await axios.get(`${host}/api/v1/users/1`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 404);
        assert.equal(err.response.data, expected);
      });
    });

    it('should return an user in DB when an userId is given', async () => {
      // Fixture
      const dbOutput = {id:1, name: 'John', surname: 'Doe'};
      const expected = {id:1, name: 'John', surname: 'Doe'};

      // Mock DB Query
      findUnique.withArgs({
        where:{
          id: 1
        }
      }).resolves(dbOutput)

      // API Call
      await axios.get(`${host}/api/v1/users/1`).then(res => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.data, expected);
      });
    });

    it('should return 400 when a non integer userId is given', async () => {
      // Mock DB Query
      findMany.withArgs({ where: { id: 'invalid' } }).rejects();

      // API Call
      await axios.get(`${host}/api/v1/users/invalid`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 400);
        assert.equal(err.response.data, 'Invalid userId parameter. It must be an integer number');
      });
    });

    it('should return 500 when unexpected error throws getting the user', async () => {
      // Mock DB Query
      console.error = sinon.stub(); //avoid printing error to console
      findUnique.withArgs({
        where:{
          id: 1
        }
      }).rejects();

      // API Call
      await axios.get(`${host}/api/v1/users/1`).then(res => {
        console.log(res.data);
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 500);
        assert.equal(err.response.data, 'Server error: Could not get user');
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
      await axios.get(`${host}/api/v1/users/1/items`).then(res => {
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
      await axios.get(`${host}/api/v1/users/1/items`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 404);
        assert.equal(err.response.data, expected);
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
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/users/1/items`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 404);
        assert.equal(err.response.data, expected);
      });
    });

    it('should return 400 when trying to get items asociated to a non integer userId', async () => {
      // Mock DB Query
      findUnique.withArgs({
        where: {
          id: "invalid"
        },
        include: {
          items: {
            select: {
              type: true,
              dimensions: true
            },
          },
        },
      }).rejects();

      // API Call
      await axios.get(`${host}/api/v1/users/invalid/items`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 400);
        assert.equal(err.response.data, 'Invalid userId parameter. It must be an integer number');
      });
    });

    it('should return 500 when unexpected error throws getting the items of user', async () => {
      // Mock DB Query
      console.error = sinon.stub(); //avoid printing error to console
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
      }).rejects();

      // API Call
      await axios.get(`${host}/api/v1/users/1/items`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 500);
        assert.equal(err.response.data, 'Server error: Could not get items');
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
      await axios.get(`${host}/api/v1/users/1/items/1`).then(res => {
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
      await axios.get(`${host}/api/v1/users/1/items/1`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 404);
        assert.equal(err.response.data, expected);
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
      await axios.get(`${host}/api/v1/users/1/items/1`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 404);
        assert.equal(err.response.data, expected);
      });
    });

    it('should return 400 when trying to get an item with a non integer userId and/or itemId', async () => {
      // Mock DB Query
      findUnique.withArgs({
        where: {
          id: "invalid",
      },
        include: {
          items: {
            select: {
              type: true,
              dimensions: true,
            },
            where: {
              id: "invalid",
            },
          },
        },
      }).rejects();

      // API Call
      await axios.get(`${host}/api/v1/users/invalid/items/invalid`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 400);
        assert.equal(err.response.data, 'Invalid parameter. It must be an integer number');
      });
    });

    it('should return 500 unexpected error when trying to get an item of an user', async () => {
      // Mock DB Query
      console.error = sinon.stub(); //avoid printing error to console
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
      }).rejects()

      // API Call
      await axios.get(`${host}/api/v1/users/1/items/1`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 500);
        assert.equal(err.response.data, 'Server error: Could not get the item of the user.');
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

    it('should return rating asociated to an user giving an userId and ratingId', async () => {
      // Fixture
      const dbOutput = {id:1, name: 'John', surname: 'Doe', ratings: 
      [{id:1, title: 'rating', description: 'rating', rating: 5, reviewerId: 1, receiverId: 2}]};
      const expected = {id:1, title: 'rating', description: 'rating', rating: 5, reviewerId: 1, receiverId: 2};

      // Mock DB Query
      findUnique.withArgs({
        where: {
          id: 1,
        },
        include: {
          ratings: {
            select: {
              title: true,
              description: true,
              rating: true,
              reviewerId: true,
              receiverId: true
            },
            where: {
              id: 1,
            }
          }
        }
      }).resolves(dbOutput)

      // API Call
      await axios.get(`${host}/api/v1/users/1/ratings/1`).then(res => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.data, expected);
      });
    });

    it('should return 404 when trying to get a non-existing rating asociated to an user', async () => {
      // Fixture
      const dbOutput = {id:1, name: 'John', surname: 'Doe'};
      const expected = 'Rating not found';

      // Mock DB Query
      findUnique.withArgs({
        where: {
          id: 1,
        },
        include: {
          ratings: {
            select: {
              title: true,
              description: true,
              rating: true,
              reviewerId: true,
              receiverId: true
            },
            where: {
              id: 1,
            }
          }
        }
      }).resolves(dbOutput)

      // API Call
      await axios.get(`${host}/api/v1/users/1/ratings/1`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 404);
        assert.equal(err.response.data, expected);
      });
    });

    it('should return 404 when trying to get a rating asociated to a non-existing user', async () => {
      // Fixture
      const dbOutput = undefined;
      const expected = 'User not found';

      // Mock DB Query
      findUnique.withArgs({
        where: {
          id: 1,
        },
        include: {
          ratings: {
            select: {
              title: true,
              description: true,
              rating: true,
              reviewerId: true,
              receiverId: true
            },
            where: {
              id: 1,
            }
          }
        }
      }).resolves(dbOutput)

      // API Call
      await axios.get(`${host}/api/v1/users/1/ratings/1`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 404);
        assert.equal(err.response.data, expected);
      });
    });

    it('should return 400 when trying to get a rating with non integers userId and/or ratingId', async () => {
      // Fixture
      const expected = 'Invalid parameter. It must be an integer number';

      // Mock DB Query
      findUnique.withArgs({
        where: {
          id: "invalid",
        },
        include: {
          ratings: {
            select: {
              title: true,
              description: true,
              rating: true,
              reviewerId: true,
              receiverId: true
            },
            where: {
              id: "invalid",
            }
          }
        }
      }).rejects();

      // API Call
      await axios.get(`${host}/api/v1/users/invalid/ratings/invalid`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 400);
        assert.equal(err.response.data, expected);
      });
    });

    it('should return 500 unexpected error when trying to get the rating of an user', async () => {
      // Fixture
      const expected = 'Server error: Could not get the rating of the user.';

      // Mock DB Query
      findUnique.withArgs({
        where: {
          id: 1,
        },
        include: {
          ratings: {
            select: {
              title: true,
              description: true,
              rating: true,
              reviewerId: true,
              receiverId: true
            },
            where: {
              id: 1,
            }
          }
        }
      }).rejects();

      // API Call
      await axios.get(`${host}/api/v1/users/1/ratings/1`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 500);
        assert.equal(err.response.data, expected);
      });
    });

    it('should return an unic space that an user owns', async () => {
      // Fixture
      const dbOutput = {id:1, name: 'John', surname: 'Doe', spaces: 
      [{id:1, name: 'space1', description: 'space1', initialDate: '1970-01-01T00:00:00.000Z', location: 'Sevilla', dimensions: 'Big', shared: true, ownerId: 1}]};
      const expected = {id:1, name: 'space1', description: 'space1', initialDate: '1970-01-01T00:00:00.000Z', location: 'Sevilla', dimensions: 'Big', shared: true, ownerId: 1};

      // Mock DB Query
      findUnique.withArgs({
        where: {
          id: 1,
        },
        include: {
          spaces: {
            where: {
              id: 1,
            }
          }
        }
      }).resolves(dbOutput)

      // API Call
      await axios.get(`${host}/api/v1/users/1/spaces/1`).then(res => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.data, expected);
      });
    });

    it('should return 404 when trying to get a non-existing space that an user owns', async () => {
      // Fixture
      const dbOutput = {id:1, name: 'John', surname: 'Doe'};
      const expected = 'Space not found';

      // Mock DB Query
      findUnique.withArgs({
        where: {
          id: 1,
        },
        include: {
          spaces: {
            where: {
              id: 1,
            }
          }
        }
      }).resolves(dbOutput)

      // API Call
      await axios.get(`${host}/api/v1/users/1/spaces/1`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 404);
        assert.equal(err.response.data, expected);
      });
    });

    it('should return 404 when trying to get a existing space owned by a non-existing user', async () => {
      // Fixture
      const dbOutput = undefined;
      const expected = 'User not found';

      // Mock DB Query
      findUnique.withArgs({
        where: {
          id: 1,
        },
        include: {
          spaces: {
            where: {
              id: 1,
            }
          }
        }
      }).resolves(dbOutput)

      // API Call
      await axios.get(`${host}/api/v1/users/1/spaces/1`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 404);
        assert.equal(err.response.data, expected);
      });
    });

    it('should return 400 when trying to get a space with non integers userId and/or spaceId', async () => {
      // Fixture
      const expected = "Invalid parameter. It must be an integer number";

      // Mock DB Query
      findUnique.withArgs({
        where: {
          id: "invalid",
        },
        include: {
          spaces: {
            where: {
              id: "invalid",
            }
          }
        }
      }).rejects();

      // API Call
      await axios.get(`${host}/api/v1/users/invalid/spaces/invalid`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 400);
        assert.equal(err.response.data, expected);
      });
    });

    it('should return 500 unexpected error when trying to get a space of an user', async () => {
      // Fixture
      const expected = "Server error: Could not get space";

      // Mock DB Query
      findUnique.withArgs({
        where: {
          id: 1,
        },
        include: {
          spaces: {
            where: {
              id: 1,
            }
          }
        }
      }).rejects();

      // API Call
      await axios.get(`${host}/api/v1/users/1/spaces/1`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 500);
        assert.equal(err.response.data, expected);
      });
    });

    it('should return an concrete rental when a userId and rental Id is given', async () => {
      // Fixture
      const dbOutput = {id:1, name: 'John', surname: 'Doe', 
      rentals:[{id:1, initialDate: '2020-04-10T00:00:00.000Z', finalDate: '2021-03-17T00:00:00.000Z', 
      cost: 50, type: 'HOUR', meters: 100, spaceId: 1, renterId: 1}]};

      const expected = {id:1, initialDate: '2020-04-10T00:00:00.000Z', finalDate: '2021-03-17T00:00:00.000Z', 
      cost: 50, type: 'HOUR', meters: 100, spaceId: 1, renterId: 1};

      // Mock DB Query
      findUnique.withArgs({
        where:{
          id: 1
        },
        include: {
          rentals:{
            select: {
              initialDate:true,
              finalDate:true, 
              cost:true, 
              type: true,
              meters: true,
              spaceId: true,
              renterId: true
            },
            where: {
              id:1
            }
          }
        }
      }).resolves(dbOutput)

      // API Call
    await axios.get(`${host}/api/v1/users/1/rentals/1`).then(res => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.data, expected);
      });
    });

    it('should return 404 when is given a user with no rentals', async () => {
      // Fixture
      const dbOutput = {id:1, name: 'John', surname: 'Doe'};
      const expected = 'Rental not found';

      // Mock DB Query
      findUnique.withArgs({
        where:{
          id: 1
        },
        include: {
          rentals:{
            select: {
              initialDate:true,
              finalDate:true, 
              cost:true, 
              type: true,
              meters: true,
              spaceId: true,
              renterId: true
            },
            where: {
              id:1
            }
          }
        }
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/users/1/rentals/1`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 404);
        assert.equal(err.response.data, expected);
      });
    });

    it('should return 404 when is given a non-existing user with rentals', async () => {
      // Fixture
      const dbOutput = undefined;
      const expected = 'User not found';

      // Mock DB Query
      findUnique.withArgs({
        where:{
          id: 1
        },
        include: {
          rentals:{
            select: {
              initialDate:true,
              finalDate:true, 
              cost:true, 
              type: true,
              meters: true,
              spaceId: true,
              renterId: true
            },
            where: {
              id:1
            }
          }
        }
      }).resolves(dbOutput)

      // API Call
      await axios.get(`${host}/api/v1/users/1/rentals/1`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 404);
        assert.equal(err.response.data, expected);
      });
    });

    it('should return 400 when trying to get a rental with non integers userId and/or rentalId', async () => {
      const expected = 'Invalid parameter. It must be an integer number';

      // Mock DB Query
      findUnique.withArgs({
        where:{
          id: "invalid"
        },
        include: {
          rentals:{
            select: {
              initialDate:true,
              finalDate:true,
              cost:true,
              type: true,
              meters: true,
              spaceId: true,
              renterId: true
            },
            where: {
              id: "invalid"
            }
          }
        }
      }).rejects();

      // API Call
      await axios.get(`${host}/api/v1/users/invalid/rentals/invalid`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 400);
        assert.equal(err.response.data, expected);
      });
    });

    it('should return 500 unexpected error when trying to get a rental of an user', async () => {
      const expected = 'Server error: Could not get rental.';

      // Mock DB Query
      findUnique.withArgs({
        where:{
          id: 1
        },
        include: {
          rentals:{
            select: {
              initialDate:true,
              finalDate:true,
              cost:true,
              type: true,
              meters: true,
              spaceId: true,
              renterId: true
            },
            where: {
              id: 1
            }
          }
        }
      }).rejects();

      // API Call
      await axios.get(`${host}/api/v1/users/1/rentals/1`).then(res => {
        assert.fail();
      })
      .catch(err => {
        assert.equal(err.response.status, 500);
        assert.equal(err.response.data, expected);
      });
    });
  });
}
