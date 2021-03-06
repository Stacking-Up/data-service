const assert = require('assert');
const axios = require('axios');
const sinon = require('sinon');
const fs = require('fs');
const { ItemType, Dimensions } = require('@prisma/client');

const host = "http://localhost:4100";

module.exports = (prisma, jwt) => {
  let verify = sinon.stub(jwt, 'verify').rejects('Not Implemented');
  let create = sinon.stub(prisma.space, 'create').rejects("Not implemented");
  let update = sinon.stub(prisma.space, 'update').rejects("Not implemented");
  let findMany = sinon.stub(prisma.space, 'findMany').rejects("Not implemented");
  let findUnique = sinon.stub(prisma.space, 'findUnique').rejects("Not implemented");
  let updateUser = sinon.stub(prisma.user, 'update').rejects("Not implemented");
  let createRental = sinon.stub(prisma.rental, 'create').rejects("Not implemented");
  let createRating = sinon.stub(prisma.rating, 'findUnique').rejects("Not implemented");
  let findUniqueUser = sinon.stub(prisma.user, 'findUnique').rejects("Not implemented");
  let findUniqueRating = sinon.stub(prisma.rating, 'findUnique').rejects("Not implemented");
  let findManyImage = sinon.stub(prisma.image, 'findMany').rejects("Not implemented");
  let findUniqueImage = sinon.stub(prisma.image, 'findUnique').rejects("Not implemented");

  before(() => {
    console.warn = sinon.stub();
    sinon.replace(prisma.space, 'create', create);
    sinon.replace(prisma.space, 'update', update);
    sinon.replace(prisma.space, 'findMany', findMany);
    sinon.replace(prisma.space, 'findUnique', findUnique);
    sinon.replace(prisma.user, 'update', updateUser);
    sinon.replace(prisma.rental, 'create', createRental);
    sinon.replace(prisma.rating, 'create', createRating);
    sinon.replace(prisma.user, 'findUnique', findUniqueUser);
    sinon.replace(prisma.rating, 'findUnique', findUniqueRating);
    sinon.replace(prisma.image, 'findMany', findManyImage);
    sinon.replace(prisma.image, 'findUnique', findUniqueImage);
  });

  /***************************************************************************
    * SPACE UNIT TESTS
    ***************************************************************************/
  describe('GET Endpoint tests:', () => {

    it('should return 404 when a non-existing userId is given', async () => {
      // Fixture
      const dbOutput = undefined;
      const expected = 'User not found';

      // Mock DB Query
      findUniqueUser.withArgs({
        where: {
          id: 1
        }, include: {
            auth: {
              select: {
                role: true
              }
            }
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

    it('should return 400 when userID in path not a integer', async () => {
      // Fixture
      const expected = 'Invalid userId parameter. It must be an integer number';
      // API Call
      await axios.get(`${host}/api/v1/users/eo`).then(res => {
        assert.fail();
      })
        .catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('should return an user in DB when an userId is given', async () => {
      // Fixture
      const dbOutput = { id: 1, name: 'John', surname: 'Doe' };
      const expected = { id: 1, name: 'John', surname: 'Doe' };

      // Mock DB Query
      findUniqueUser.withArgs({
        where: {
          id: 1
        }, include: {
              auth: {
                select: {
                  role: true
                }
              }
            }
      }).resolves(dbOutput)

      // API Call
      await axios.get(`${host}/api/v1/users/1`).then(res => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.data, expected);
      });
    });

    it('should return 500 when unexpected error throws getting the user', async () => {
      // Mock DB Query
      console.error = sinon.stub(); //avoid printing error to console
      findUniqueUser.withArgs({
        where: {
          id: 1
        }, include: {
              auth: {
                select: {
                  role: true
                }
              }
            }
      }).rejects();

      // API Call
      await axios.get(`${host}/api/v1/users/1`).then(res => {
        assert.fail();
      })
        .catch(err => {
          assert.equal(err.response.status, 500);
          assert.equal(err.response.data, 'Server error: Could not get user');
        });
    });

    it('should return items asociated to a user when giving an userId', async () => {
      // Fixture
      const dbOutput = {
        id: 1, name: 'John', surname: 'Doe', items:
          [{ id: 1, amount: 30, item: { type: 'ELECTRONICS', dimensions: 'SMALL' } }, { id: 2, amount: 30, item: { type: 'ELECTRONICS', dimensions: 'MEDIUM' } }]
      };
      const expected = [{ amount: 30, type: 'ELECTRONICS', dimensions: 'SMALL' }, { amount: 30, type: 'ELECTRONICS', dimensions: 'MEDIUM' }];

      // Mock DB Query
      findUniqueUser.resolves(dbOutput)

      // API Call
      await axios.get(`${host}/api/v1/users/1/items`).then(res => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.data, expected);
      });
    });

    it('should return 404 when trying to get non-existing items asociated to a user giving an userId', async () => {
      // Fixture
      const dbOutput = { id: 1, name: 'John', surname: 'Doe' };
      const expected = 'Items not found';

      // Mock DB Query
      findUniqueUser.resolves(dbOutput)

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
      findUniqueUser.resolves(dbOutput);

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
      findUniqueUser.rejects();

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
      findUniqueUser.rejects();

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
      const dbOutput = {
        id: 1, name: 'John', surname: 'Doe', items:
          [{ id: 1, amount: 10, item: { type: 'ELECTRONICS', dimensions: 'SMALL' } }, { id: 2, amount: 4, item: { type: 'ELECTRONICS', dimensions: 'MEDIUM' } }]
      };
      const expected = { amount: 10, type: 'ELECTRONICS', dimensions: 'SMALL' };

      // Mock DB Query
      findUniqueUser.resolves(dbOutput)

      // API Call
      await axios.get(`${host}/api/v1/users/1/items/1`).then(res => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.data, expected);
      });
    });

    it('should return 404 when trying to get a non-existing item asociated to an user giving an userId and itemId', async () => {
      // Fixture
      const dbOutput = { id: 1, name: 'John', surname: 'Doe' };
      const expected = 'Item not found';

      // Mock DB Query
      findUniqueUser.resolves(dbOutput)

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
      findUniqueUser.resolves(dbOutput)

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
      findUniqueUser.rejects();

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
      findUniqueUser.rejects()

      // API Call
      await axios.get(`${host}/api/v1/users/1/items/1`).then(res => {
        assert.fail();
      })
        .catch(err => {
          assert.equal(err.response.status, 500);
          assert.equal(err.response.data, 'Server error: Could not get the item of the user.');
        });
    });

    it('should return rating asociated to an user giving an userId and ratingId', async () => {
      // Fixture
      const dbOutput = {
        id: 1, name: 'John', surname: 'Doe', ratings:
          [{ id: 1, title: 'rating', description: 'rating', rating: 5, reviewerId: 1, receiverId: 2 }]
      };
      const expected = { id: 1, title: 'rating', description: 'rating', rating: 5, reviewerId: 1, receiverId: 2 };

      // Mock DB Query
      findUniqueUser.withArgs({
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
      const dbOutput = { id: 1, name: 'John', surname: 'Doe' };
      const expected = 'Rating not found';

      // Mock DB Query
      findUniqueUser.withArgs({
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
      findUniqueUser.withArgs({
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
      findUniqueUser.withArgs({
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
      findUniqueUser.withArgs({
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
      const dbOutput = {
        id: 1, name: 'John', surname: 'Doe', spaces:
          [{ id: 1, name: 'space1', description: 'space1', initialDate: '1970-01-01T00:00:00.000Z', location: 'Sevilla', dimensions: 'Big', shared: true, ownerId: 1 }]
      };
      const expected = { id: 1, name: 'space1', description: 'space1', initialDate: '1970-01-01T00:00:00.000Z', location: 'Sevilla', dimensions: 'Big', shared: true, ownerId: 1 };

      // Mock DB Query
      findUniqueUser.withArgs({
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
      const dbOutput = { id: 1, name: 'John', surname: 'Doe' };
      const expected = 'Space not found';

      // Mock DB Query
      findUniqueUser.withArgs({
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
      findUniqueUser.withArgs({
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
      findUniqueUser.withArgs({
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
      findUniqueUser.withArgs({
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
      const dbOutput = {
        id: 1, name: 'John', surname: 'Doe',
        rentals: [{
          id: 1, initialDate: '2020-04-10T00:00:00.000Z', finalDate: '2021-03-17T00:00:00.000Z',
          cost: 50, type: 'HOUR', meters: 100, spaceId: 1, renterId: 1
        }]
      };

      const expected = {
        id: 1, initialDate: '2020-04-10T00:00:00.000Z', finalDate: '2021-03-17T00:00:00.000Z',
        cost: 50, type: 'HOUR', meters: 100, spaceId: 1, renterId: 1
      };

      // Mock DB Query
      findUniqueUser.withArgs({
        where: {
          id: 1
        },
        include: {
          rentals: {
            select: {
              initialDate: true,
              finalDate: true,
              cost: true,
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
      }).resolves(dbOutput)

      // API Call
      await axios.get(`${host}/api/v1/users/1/rentals/1`).then(res => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.data, expected);
      });
    });

    it('should return 404 when is given a user with no rentals', async () => {
      // Fixture
      const dbOutput = { id: 1, name: 'John', surname: 'Doe' };
      const expected = 'Rental not found';

      // Mock DB Query
      findUniqueUser.withArgs({
        where: {
          id: 1
        },
        include: {
          rentals: {
            select: {
              initialDate: true,
              finalDate: true,
              cost: true,
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
      findUniqueUser.withArgs({
        where: {
          id: 1
        },
        include: {
          rentals: {
            select: {
              initialDate: true,
              finalDate: true,
              cost: true,
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
      findUniqueUser.withArgs({
        where: {
          id: "invalid"
        },
        include: {
          rentals: {
            select: {
              initialDate: true,
              finalDate: true,
              cost: true,
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
      findUniqueUser.withArgs({
        where: {
          id: 1
        },
        include: {
          rentals: {
            select: {
              initialDate: true,
              finalDate: true,
              cost: true,
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

    it('should return a space in DB when a spaceId is given', async () => {
      // Fixture
      const dbOutput = {
        id: 1, name: 'Space 1', description: 'So much space',
        initialDate: '2020-03-10T00:00:00.000Z', finalDate: '2022-03-17T00:00:00.000Z',
        location: 'Sevilla', dimensions: '2x2', priceHour: null, priceDay: '4', priceMonth: '45', ownerId: 1
      };

      const expected = {
        id: 1, name: 'Space 1', description: 'So much space',
        initialDate: '2020-03-10T00:00:00.000Z', finalDate: '2022-03-17T00:00:00.000Z',
        location: 'Sevilla', dimensions: '2x2', priceDay: '4', priceMonth: '45', ownerId: 1
      };

      // Mock DB Query
      findUnique.withArgs({
        where: {
          id: 1
        },
        include: {
          tags: true
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
      const dbOutput = undefined;

      const expected = "Space not found"

      // Mock DB Query
      findUnique.withArgs({
        where: {
          id: 1
        },
        include: {
          tags: true
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
        where: {
          id: 1
        },
        include: {
          tags: true
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
        where: {
          id: 1
        },
        include: {
          tags: true
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
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: new Date(1111111), endHour: new Date(1111112), location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      },
      {
        id: 2, name: "casa", description: "Esto es una casa", initialDate: "1970-01-01T00:00:00.000Z", finalDate: null,
        publishDate: "1970-01-01T00:00:00.000Z", startHour: new Date(11111111), endHour: new Date(11111113), location: "Sevilla", city: "Sevilla", province: "Provincia de Sevilla", country: "Espa??a",
        dimensions: "2x4", priceHour: 8, priceDay: null, priceMonth: 760, shared: false, ownerId: 1, tags: [{ tag: "DRY" }], owner: { id: 1, ratings: [] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z", location: "Cadiz",
        city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a", startHour: 1111111, endHour: 1111112,
        dimensions: "1x3", priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      },
      {
        id: 2, name: "casa", description: "Esto es una casa", initialDate: "1970-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z", location: "Sevilla",
        city: "Sevilla", province: "Provincia de Sevilla", country: "Espa??a", startHour: 11111111, endHour: 11111113,
        dimensions: "2x4", priceHour: 8, priceMonth: 760, shared: false, ownerId: 1, tags: ["DRY"], owner: { id: 1, ratings: [] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
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
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }, images: [{ image: fs.readFileSync(`${__dirname}/../assets/Test.png`, 'base64'), mimetype: "image/png" }]
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z", location: "Cadiz",
        city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: [{ image: fs.readFileSync(`${__dirname}/../assets/Test.png`, 'base64'), mimetype: "image/png" }]
      }];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
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
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z", location: "Cadiz",
        city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, "tags": ["GARAGE", "DRY"], images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
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
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z", location: "Cadiz",
        city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
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
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z", location: "Cadiz",
        city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
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
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z", location: "Cadiz",
        city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
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
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z", location: "Cadiz",
        city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
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
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z", location: "Cadiz",
        city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
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
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z", location: "Cadiz",
        city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
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
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z", location: "Cadiz",
        city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
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
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z", location: "Cadiz",
        city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
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
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] },
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z", location: "Cadiz",
        city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
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
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z", location: "Cadiz",
        city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
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
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z", location: "Cadiz",
        city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
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

    it('Should not return spaces which price is undefined and therefore outside the price range filter', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: null, priceDay: 56, priceMonth: null, shared: true, ownerId: 1, tags: [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      }
      ];

      const expected = [];

      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?maxPriceMonth=460`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 0);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces that can not be rented per hours', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] },
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z", location: "Cadiz",
        city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
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
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] },
      },
      {
        id: 2, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
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
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: null, priceDay: null, priceMonth: 456, shared: false, ownerId: 1, tags: [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      },
      {
        id: 2, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 8, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceMonth: 456, shared: false, ownerId: 1, tags: ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
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
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z", location: "Cadiz",
        city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
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
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: null, priceDay: 56, priceMonth: null, shared: false, ownerId: 1, tags: [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z", location: "Cadiz",
        city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceDay: 56, shared: false, ownerId: 1, tags: ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
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
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z", location: "Cadiz",
        city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
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
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z", location: "Cadiz",
        city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?tag=DRY,GARAGE`).then(res => {
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
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z", location: "Cadiz",
        city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, tags: ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?tag=DRY`).then(res => {
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
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

    it('Should return all spaces beacause tag is undefined', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z", location: "Cadiz",
        city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 1);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces sorted by priceHour asc', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      },
      {
        id: 2, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 8, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      },
      {
        id: 2, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 8, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);


      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: { priceHour: 'asc' }
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
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 8, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      },
      {
        id: 2, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 8, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      },
      {
        id: 2, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);


      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: { priceHour: 'desc' }
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
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      },
      {
        id: 2, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 8, priceDay: 58, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      },
      {
        id: 2, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 8, priceDay: 58, priceMonth: 430, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);


      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: { priceDay: 'asc' }
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
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 58, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      },
      {
        id: 2, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 58, priceMonth: 430, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      },
      {
        id: 2, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);


      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: { priceDay: 'desc' }
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
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 450, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      },
      {
        id: 2, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 450, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      },
      {
        id: 2, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);


      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: { priceMonth: 'asc' }
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
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      },
      {
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 450, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      },
      {
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 450, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        
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
        }
        , include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: { priceMonth: 'desc' }
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
        id: 1, name: "sotano", description: "Esto es una guarida", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es una guarida", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
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
        id: 1, name: "sotano", description: "Esto es una guarida", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es una guarida", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
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

    it('Should return spaces which contains search text in city', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es una guarida", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es una guarida", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?search=Cadiz`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 1);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces which contains search text in province', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es una guarida", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Ayamonte", city: "Ayamonte", province: "Provincia de Huelva", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es una guarida", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", location: "Ayamonte", city: "Ayamonte", province: "Provincia de Huelva", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?search=huelva`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 1);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces which contains search text in country', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es una guarida", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "Do Dragao", city: "Do Dragao", province: "Provincia de Lisboa", country: "Portugal",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es una guarida", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", location: "Do Dragao", city: "Do Dragao", province: "Provincia de Lisboa", country: "Portugal",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?search=portugal`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 1);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces which contains search text in mapQuery', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Eso es una guarida", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", startHour: null, endHour: null, location: "36.8551,-5.32362", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 8, priceDay: 58, priceMonth: 440, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Eso es una guarida", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z",
        publishDate: "1970-01-01T00:00:00.000Z", location: "36.8551,-5.32362", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 8, priceDay: 58, priceMonth: 440, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY"], images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      let sandbox = sinon.createSandbox();
      sandbox.stub(axios, 'get').resolves({ data: { features: [{ geometry: { coordinates: [-5.32362, 36.8551] } }] } });
      findMany.withArgs({
        
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
        }
        , include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}

      }).resolves(dbOutput);

      // API Call
      await axios({ method: 'GET', url: `${host}/api/v1/spaces?search=esto` }).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 1);
        assert.deepEqual(res.data, expected);
        sandbox.restore();
      }).catch(() => {
        sandbox.restore();
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return empty array because search filter is not contained in title, description, city, province and country', async () => {

      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);

      // Mock DB Query
      findMany.withArgs({
        
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
        }
        , include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}

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

    it('Should return spaces sorted by publishDate asc', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 450, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      },
      {
        id: 2, name: "habitacion", description: "Esto es una habitacion", initialDate: "2022-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "2022-01-01T00:00:00.000Z",
        startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 450, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      },
      {
        id: 2, name: "habitacion", description: "Esto es una habitacion", initialDate: "2022-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "2022-01-01T00:00:00.000Z",
        location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);


      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: { publishDate: 'asc' }
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?orderBy=publishDate-asc`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 2);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces sorted by publishDate desc', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "2022-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "2022-01-01T00:00:00.000Z",
        startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 450, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      },
      {
        id: 2, name: "habitacion", description: "Esto es una habitacion", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }], owner: { id: 1, ratings: [] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "2022-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "2022-01-01T00:00:00.000Z",
        location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 450, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      },
      {
        id: 2, name: "habitacion", description: "Esto es una habitacion", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY"], owner: { id: 1, ratings: [] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);


      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: { publishDate: 'desc' }
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?orderBy=publishDate-desc`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 2);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces sorted by ratings asc', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 450, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }], "owner": { id: 1, ratings: [] }
      },
      {
        id: 2, name: "habitacion", description: "Esto es una habitacion", initialDate: "2022-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "2022-01-01T00:00:00.000Z",
        startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }], "owner": { id: 1, ratings: [{ receiverId: 1, rating: 5 }, { receiverId: 1, rating: 5 }] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 450, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY"], "owner": { id: 1, ratings: [] }, images: []
      },
      {
        id: 2, name: "habitacion", description: "Esto es una habitacion", initialDate: "2022-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "2022-01-01T00:00:00.000Z",
        location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY"], "owner": { id: 1, ratings: [{ receiverId: 1, rating: 5 }, { receiverId: 1, rating: 5 }] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);


      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?orderByRatings=asc`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 2);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces sorted by ratings desc', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "2022-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "2022-01-01T00:00:00.000Z",
        startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 450, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }], "owner": { id: 1, ratings: [{ receiverId: 1, rating: 5 }, { receiverId: 1, rating: 5 }] }
      },
      {
        id: 2, name: "habitacion", description: "Esto es una habitacion", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        startHour: null, endHour: null, location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }], "owner": { id: 1, ratings: [{ receiverId: 1, rating: 2 }, { receiverId: 1, rating: 5 }] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "2022-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "2022-01-01T00:00:00.000Z",
        location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 450, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY"], "owner": { id: 1, ratings: [{ receiverId: 1, rating: 5 }, { receiverId: 1, rating: 5 }] }, images: []
      },
      {
        id: 2, name: "habitacion", description: "Esto es una habitacion", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        location: "Cadiz", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY"], "owner": { id: 1, ratings: [{ receiverId: 1, rating: 2 }, { receiverId: 1, rating: 5 }] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);


      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?orderByRatings=desc`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 2);
        assert.deepEqual(res.data, expected);
      }).catch(() => {
        assert.fail("Server error: Could not get spaces");
      });
    });

    it('Should return spaces sorted by user proximity', async () => {
      // Fixture
      const dbOutput = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "2022-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "2022-01-01T00:00:00.000Z",
        startHour: null, endHour: null, location: "36.8551,-5.32362", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 450, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }], "owner": { id: 1, ratings: [{ receiverId: 1, rating: 5 }, { receiverId: 1, rating: 5 }] }
      },
      {
        id: 2, name: "habitacion", description: "Esto es una habitacion", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        startHour: null, endHour: null, location: "36.8809,-5.40577", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }], "owner": { id: 1, ratings: [{ receiverId: 1, rating: 2 }, { receiverId: 1, rating: 5 }] }
      }
      ];

      const expected = [{
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "2022-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "2022-01-01T00:00:00.000Z",
        location: "36.8551,-5.32362", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 450, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY"], "owner": { id: 1, ratings: [{ receiverId: 1, rating: 5 }, { receiverId: 1, rating: 5 }] }, images: []
      },
      {
        id: 2, name: "habitacion", description: "Esto es una habitacion", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", publishDate: "1970-01-01T00:00:00.000Z",
        location: "36.8809,-5.40577", city: "Cadiz", province: "Provincia de Cadiz", country: "Espa??a",
        dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": ["GARAGE", "DRY"], "owner": { id: 1, ratings: [{ receiverId: 1, rating: 2 }, { receiverId: 1, rating: 5 }] }, images: []
      }
      ];
      //Set Actual Date
      let actualDate = new Date();
      actualDate.setMilliseconds(0);


      // Mock DB Query
      findMany.withArgs({
        
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
      }).resolves(dbOutput);

      // API Call
      await axios.get(`${host}/api/v1/spaces?orderByLocation=36.8551,-5.32362`).then(res => {
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 2);
        assert.deepEqual(res.data, expected);
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
        }, include: {
          tags: true,
          images: true,
          owner: {
            select: {
              id: true,
              ratings: { select: { receiverId: true, rating: true } }
            }
          }
        },
        orderBy: {}
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
      const dbOutput = [{ id: 1, name: 'space1', description: 'space1', initialDate: '1970-01-01T00:00:00.000Z', finalDate: '1971-01-01T00:00:00.000Z', location: '44.4,45.3', dimensions: '2x2', priceHour: 33, priceDay: 345, priceMonth: 3444, shared: true, ownerId: 1 },
      {
        id: 2, name: 'space2', description: 'space2', initialDate: '1970-01-01T00:00:00.000Z', finalDate: '1971-01-01T00:00:00.000Z', location: '44.4,45.3', dimensions: '2x2', priceHour: 33, priceDay: 345, priceMonth: 3444, shared: false, ownerId: 1,
        images: [{ image: fs.readFileSync(`${__dirname}/../assets/Test.png`, 'base64'), mimetype: 'image/png' }], tags: [{ tag: 'FLOOR_1' }]
      }];
      const expected = [{ id: 1, name: 'space1', description: 'space1', initialDate: '1970-01-01T00:00:00.000Z', finalDate: '1971-01-01T00:00:00.000Z', location: '44.4,45.3', dimensions: '2x2', priceHour: 33, priceDay: 345, priceMonth: 3444, shared: true, ownerId: 1, images: [] },
      {
        id: 2, name: 'space2', description: 'space2', initialDate: '1970-01-01T00:00:00.000Z', finalDate: '1971-01-01T00:00:00.000Z', location: '44.4,45.3', dimensions: '2x2', priceHour: 33, priceDay: 345, priceMonth: 3444, shared: false, ownerId: 1,
        images: [{ image: fs.readFileSync(`${__dirname}/../assets/Test.png`, 'base64'), mimetype: 'image/png' }], tags: ['FLOOR_1']
      }];

      // Mock DB Query
      findMany.withArgs({
        skip: undefined,
        take: undefined,
        where: {
          ownerId: 1
        },
        include: {
          tags: true,
          images: true
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
          tags: true,
          images: true
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
          tags: true,
          images: true
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
        initialDate: new Date("2099-03-10T18:18:14.049Z"),
        finalDate: new Date("3923-03-10T18:18:14.049Z"),
        location: "44.43,43.21",
        city: "test",
        country: "test",
        province: "test",
        dimensions: "2x2",
        shared: true,
        ownerId: 1,
        priceHour: 33.2,
        startHour: 111111,
        endHour: 2222222222,
        tags: ['ELEVATOR', 'WET'],
        images: [fs.readFileSync(`${__dirname}/../assets/Test.png`, 'base64'), fs.readFileSync(`${__dirname}/../assets/Test.jpg`, 'base64')]
      }
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      create.resolves();

      // API Call
      await axios.post(`${host}/api/v1/spaces`, spaceToBePublished, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(res => {
          assert.equal(res.status, 201);
          assert.equal(res.data, expected);
        }).catch(() => assert.fail());
    });

    it('Should return 401 when token is missing', async () => {
      // Fixture
      const expected = 'Unauthorized';

      // API Call
      await axios.post(`${host}/api/v1/spaces`, {})
        .then(() => {
          assert.fail();
        }).catch(err => {
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
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
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
      await axios.post(`${host}/api/v1/spaces`, { ownerId: 1 }, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
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
      await axios.post(`${host}/api/v1/spaces`, { ownerId: 2 }, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
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
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when a required field is missing', async () => {
      // Fixture
      const expected = 'Bad Request: Missing required attributes';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const testSpace = { name: 'test', description: 'test', initialDate: new Date(), location: '1,1', dimensions: '1x1', shared: true }

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);

      // API Call
      Object.keys(testSpace).forEach(async key => {
        let spaceToPublish = Object.keys(testSpace).filter(k => k !== key).reduce((obj, k) => { obj[k] = testSpace[k]; return obj }, { ownerId: 1 });
        await axios.post(`${host}/api/v1/spaces`, spaceToPublish,
          {
            withCredentials: true,
            headers: { Cookie: 'authToken=testToken;' }
          })
          .then(() => {
            assert.fail();
          }).catch(err => {
            assert.equal(err.response.status, 400);
            assert.equal(err.response.data, expected);
          });
      });
    });

    it('Should return 400 when space name is shorter than two chars or longer than 50', async () => {
      // Fixture
      const expected = 'Bad Request: Name must be between 2 and 50 characters';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      let spaceToPublish = { ownerId: 1, name: 'test', description: 'test', initialDate: new Date(), location: '1,1', country: "test", province: "test", city: "test", dimensions: '1x1', shared: true };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);

      // API Call
      spaceToPublish.name = 't';
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });

      spaceToPublish.name = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when providing a space with an invalid initial date', async () => {
      // Fixture
      const expected = 'Bad Request: Initial date must be a Date after today';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const spaceToPublish = { ownerId: 1, name: 'test', description: 'test', initialDate: 'not_a_date', location: '1,1', country: "test", province: "test", city: "test", dimensions: '1x1', shared: true };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);

      // API Call
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when providing a space with an invalid final date', async () => {
      // Fixture
      const expected = 'Bad Request: Final date must be a Date';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const spaceToPublish = { ownerId: 1, name: 'test', description: 'test', initialDate: "3923-03-10T18:18:14.049Z", finalDate: 'not_a_date', location: '1,1', country: "test", province: "test", city: "test", dimensions: '1x1', shared: true };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);

      // API Call
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when providing an invalid lat-lon pair', async () => {
      // Fixture
      const expected = 'Bad Request: Location must be a valid latitude,longitude pair';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const spaceToPublish = { ownerId: 1, name: 'test', description: 'test', initialDate: "3923-03-10T18:18:14.049Z", location: '1,180.1', country: "test", province: "test", city: "test", dimensions: '1x1', shared: true };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);

      // API Call
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when providing an invalid dimensions pair', async () => {
      // Fixture
      const expected = 'Bad Request: Dimensions must be a valid width,height pair';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const spaceToPublish = { ownerId: 1, name: 'test', description: 'test', initialDate: "3923-03-10T18:18:14.049Z", location: '1,1', country: "test", province: "test", city: "test", dimensions: '1', shared: true };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);

      // API Call
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when providing a non-numeric priceHour', async () => {
      // Fixture
      const expected = 'Bad Request: PriceHour must be a number';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const spaceToPublish = { ownerId: 1, name: 'test', description: 'test', priceHour: 'not_num', initialDate: "3923-03-10T18:18:14.049Z", location: '1,1', country: "test", province: "test", city: "test", dimensions: '1x1', shared: true };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);

      // API Call
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when providing a non-numeric priceDay', async () => {
      // Fixture
      const expected = 'Bad Request: PriceDay must be a number';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const spaceToPublish = { ownerId: 1, name: 'test', description: 'test', priceDay: 'not_num', initialDate: "3923-03-10T18:18:14.049Z", location: '1,1', country: "test", province: "test", city: "test", dimensions: '1x1', shared: true };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);

      // API Call
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when providing a non-numeric priceMonth', async () => {
      // Fixture
      const expected = 'Bad Request: PriceMonth must be a number';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const spaceToPublish = { ownerId: 1, name: 'test', description: 'test', city: "test", province: "test", country: "test", priceMonth: 'not_num', initialDate: "3923-03-10T18:18:14.049Z", location: '1,1', dimensions: '1x1', shared: true };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);

      // API Call
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when providing an invalid startHour', async () => {
      // Fixture
      const expected = 'Bad Request: Start hour must be a valid Time';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const spaceToPublish = { ownerId: 1, name: 'test', description: 'test', city: "test", province: "test", country: "test", priceHour: 12, startHour: "invalid", endHour: 11111, initialDate: "3923-03-10T18:18:14.049Z", location: '1,1', dimensions: '1x1', shared: true };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);

      // API Call
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when providing an invalid endHour', async () => {
      // Fixture
      const expected = 'Bad Request: End hour must be a valid Time';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const spaceToPublish = { ownerId: 1, name: 'test', description: 'test', city: "test", province: "test", country: "test", priceHour: 12, startHour: 222222, endHour: "invalid", initialDate: "3923-03-10T18:18:14.049Z", location: '1,1', dimensions: '1x1', shared: true };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);

      // API Call
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when attribute shared is not a boolean', async () => {
      // Fixture
      const expected = 'Bad Request: Shared must be true or false';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const spaceToPublish = { ownerId: 1, name: 'test', description: 'test', priceMonth: 1, initialDate: "3923-03-10T18:18:14.049Z", location: '1,1', country: "test", province: "test", city: "test", dimensions: '1x1', shared: 'not_true' };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);

      // API Call
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when attribute tags is not an array', async () => {
      // Fixture
      const expected = 'Bad Request: Tags must be an array';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const spaceToPublish = { ownerId: 1, name: 'test', description: 'test', priceMonth: 1, initialDate: "3923-03-10T18:18:14.049Z", location: '1,1', country: "test", province: "test", city: "test", dimensions: '1x1', shared: true, tags: 'not_array' };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);

      // API Call
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when invalid tags provided', async () => {
      // Fixture
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const spaceToPublish = { ownerId: 1, name: 'test', description: 'test', priceMonth: 1, initialDate: "3923-03-10T18:18:14.049Z", location: '1,1', country: "test", province: "test", city: "test", dimensions: '1x1', shared: true, tags: ['INVALID_TAG'] };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);

      // API Call
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.match(err.response.data, /(?:Tags must be one of the following).*/);
        });
    });

    it('Should return 400 when invalid images provided', async () => {
      // Fixture
      const expected = 'Bad Request: Images must be jpeg or png';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const spaceToPublish = { ownerId: 1, name: 'test', description: 'test', city: "test", province: "test", country: "test", priceMonth: 1, initialDate: "3923-03-10T18:18:14.049Z", location: '1,1', dimensions: '1x1', shared: true, images: ['invalid_img'] };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);

      // API Call
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('RN03: Should return 400 when no price is set', async () => {
      // Fixture
      const expected = 'Bad Request: You must defined at least one valid price greater than 0';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const spaceToPublish = { ownerId: 1, name: 'test', description: 'test', initialDate: "3923-03-10T18:18:14.049Z", location: '1,1', country: "test", province: "test", city: "test", dimensions: '1x1', shared: true };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);

      // API Call
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
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
      const spaceToPublish = { ownerId: 1, name: 'test', description: 'test', priceDay: 1, initialDate: "3923-03-10T18:18:14.049Z", finalDate: bad_date, location: '1,1', country: "test", province: "test", city: "test", dimensions: '1x1', shared: true };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);

      // API Call
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('RN10: Should return 400 when not defining all the required fields to rent per hour', async () => {
      // Fixture
      const expected = 'Bad Request: You must defined all the required fields to rent per hour';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const spaceToPublish = { ownerId: 1, name: 'test', description: 'test', priceHour: 1, initialDate: "3923-03-10T18:18:14.049Z", finalDate: "3925-03-10T18:18:14.049Z", location: '1,1', country: "test", province: "test", city: "test", dimensions: '1x1', shared: true };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);

      // API Call
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('RN09: Should return 400 when space is not available between hours of the same day', async () => {
      // Fixture
      const expected = 'Bad Request: Space must be available between hours of the same day or at least with a difference of one hour';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const spaceToPublish = { ownerId: 1, name: 'test', description: 'test', priceHour: 1, initialDate: "3923-03-10T18:18:14.049Z", finalDate: "3925-03-10T18:18:14.049Z", startHour: 11111, endHour: 1111, location: '1,1', country: "test", province: "test", city: "test", dimensions: '1x1', shared: true };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);

      // API Call
      await axios.post(`${host}/api/v1/spaces`, spaceToPublish, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
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
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
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
        initialDate: "3923-03-10T18:18:14.049Z",
        location: "44.43,43.21",
        country: "test",
        province: "test",
        city: "test",
        dimensions: "2x2",
        shared: true,
        ownerId: 1,
        priceDay: 33.2,
        tags: ['ELEVATOR', 'WET'],
        images: [fs.readFileSync(`${__dirname}/../assets/Test.png`, 'base64'), fs.readFileSync(`${__dirname}/../assets/Test.jpg`, 'base64')]
      }
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      create.rejects();

      // API Call
      await axios.post(`${host}/api/v1/spaces`, spaceToBePublished, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 500);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should post items', async () => {
      // Fixture
      const expected = 'User items created successfully';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const itemToBePublished = [{
        type: 'ELECTRONICS',
        dimensions: 'SMALL',
        amount: 5
      }]
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      updateUser.resolves();

      // API Call
      await axios.post(`${host}/api/v1/items`, itemToBePublished, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(res => {
          assert.equal(res.status, 201);
          assert.equal(res.data, expected);
        }).catch(() => assert.fail());
    });

    it('Should return 401 when token is missing posting items', async () => {
      // Fixture
      const expected = 'Unauthorized';

      // API Call
      await axios.post(`${host}/api/v1/items`, {})
        .then(res => {
          assert.fail();
        }).catch((err) => {
          assert.equal(err.response.status, 401);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when invalid itemtype posting items', async () => {
      // Fixture
      const expected = 'Invalid item type. It must be one of the following: ' + Object.values(ItemType).join(', ');
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const itemToBePublished = [{
        type: 'INVALID',
        dimensions: 'SMALL'
      }]
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      updateUser.rejects();

      // API Call
      await axios.post(`${host}/api/v1/items`, itemToBePublished, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(res => {
          assert.fail();
        }).catch((err) => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when invalid dimensions posting items', async () => {
      // Fixture
      const expected = 'Invalid item dimensions. It must be one of the following: ' + Object.values(Dimensions).join(', ');
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const itemToBePublished = [{
        type: 'ELECTRONICS',
        dimensions: 'INVALID'
      }]
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      updateUser.rejects();

      // API Call
      await axios.post(`${host}/api/v1/items`, itemToBePublished, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(res => {
          assert.fail();
        }).catch((err) => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 500 when trying to update items of user', async () => {
      // Fixture
      const expected = 'Internal Server Error';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const itemToBePublished = [{
        type: 'ELECTRONICS',
        dimensions: 'SMALL',
        amount: 44
      }]
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      updateUser.rejects();

      // API Call
      await axios.post(`${host}/api/v1/items`, itemToBePublished, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(res => {
          assert.fail();
        }).catch((err) => {
          assert.equal(err.response.status, 500);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 401 when invalid token when posting items', async () => {
      // Fixture
      const expected = 'Unauthorized: Invalid token';

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').throws(new jwt.JsonWebTokenError('Invalid token'));

      // API Call
      await axios.post(`${host}/api/v1/items`, {}, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(res => {
          assert.fail();
        }).catch((err) => {
          assert.equal(err.response.status, 401);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when sending a non integer amount', async () => {
      // Fixture
      const expected = 'Invalid item amount. It must be a positive integer number greater than 1';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const itemToBePublished = [{
        type: 'ELECTRONICS',
        dimensions: 'SMALL',
        amount: 4.4
      },
      {
        type: 'ELECTRONICS',
        dimensions: 'SMALL',
        amount: undefined
      },
      {
        type: 'ELECTRONICS',
        dimensions: 'SMALL',
        amount: ''
      }
      ]
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      updateUser.rejects();

      // API Call
      await axios.post(`${host}/api/v1/items`, itemToBePublished, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(res => {
          assert.fail();
        }).catch((err) => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when duplicated items send', async () => {
      // Fixture
      const expected = 'Duplicate item type and dimensions';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const itemToBePublished = [{
        type: 'ELECTRONICS',
        dimensions: 'SMALL',
        amount: 5
      },
      {
        type: 'ELECTRONICS',
        dimensions: 'SMALL',
        amount: 4
      }
      ]
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      updateUser.rejects();

      // API Call
      await axios.post(`${host}/api/v1/items`, itemToBePublished, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(res => {
          assert.fail();
        }).catch((err) => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 500 when unexpected error posting items', async () => {
      // Fixture
      const expected = 'Internal Server Error';

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').throws(new Error('Unexpected Error'));

      // API Call
      await axios.post(`${host}/api/v1/items`, {}, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(res => {
          assert.fail();
        }).catch((err) => {
          assert.equal(err.response.status, 500);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should validate a rental of a space (shared, not overlapping)', async () => {
      //Fixture
      const spaceToAddRental = {
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "3000-01-01T00:00:00.000Z", location: "41.2,45.3",
        dimensions: "100x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: true, ownerId: 2, rentals:
          [{
            initialDate: new Date("2125-01-01T00:00:00.000Z"), finalDate: new Date("2130-01-01T00:00:00.000Z"),
            cost: 456, type: "HOUR", meters: 299, spaceId: 1, renterId: 3
          }]
      }
      const decodedJwt = { userId: 1, role: 'SUBSCRIBED', email: 'test@test.com' };

      const rentalToBeCreated = {
        initialDate: new Date("2900-04-01T00:00:00.000Z"),
        finalDate: new Date("2900-05-01T23:59:59.000Z"),
        cost: 456,
        type: 'MONTH',
        meters: 0.00000000000000000001,
        spaceId: 1,
        renterId: 1
      };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.withArgs({
        where: {
          id: 1
        }, include: {
          rentals: true
        }
      }).resolves(spaceToAddRental)
      
      //API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToBeCreated, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(res => {
          assert.equal(res.status, 200);
        })
    });

    it('Should validate a rental of a space (shared, overlapping)', async () => {
      //Fixture
      const spaceToAddRental = {
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "3000-01-01T00:00:00.000Z", location: "41.2,45.3",
        dimensions: "100x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: true, ownerId: 2, rentals:
          [{
            initialDate: new Date("2125-01-01T00:00:00.000Z"), finalDate: new Date("2130-01-01T00:00:00.000Z"),
            cost: 456, type: "HOUR", meters: 200, spaceId: 1, renterId: 3
          }]
      }
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };

      const rentalToBeCreated = {
        initialDate: new Date("2900-04-01T00:00:00.000Z"),
        finalDate: new Date("2900-05-01T00:00:00.000Z"),
        cost: 456,
        type: 'DAY',
        meters: 5,
        spaceId: 1,
        renterId: 1
      };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.withArgs({
        where: {
          id: 1
        }, include: {
          rentals: true
        }
      }).resolves(spaceToAddRental)
      
      //API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToBeCreated, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(res => {
          assert.equal(res.status, 200);
        })
    });

    it('Should validate a rental of a space (not shared, not overlapping)', async () => {
      //Fixture
      const spaceToAddRental = {
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "3000-01-01T00:00:00.000Z", location: "41.2,45.3",
        dimensions: "100x3", priceHour: 33, startHour: new Date('1970-01-01T01:00:00.000Z'), endHour: new Date('1970-01-01T23:00:00.000Z'), shared: false, ownerId: 2, rentals:
          [{
            initialDate: new Date("2125-01-01T00:00:00.000Z"), finalDate: new Date("2130-01-01T00:00:00.000Z"),
            cost: 456, type: "HOUR", meters: 299, spaceId: 1, renterId: 3
          }]
      }
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };

      const rentalToBeCreated = {
        initialDate: new Date("2900-04-01T10:00:00.000Z"),
        finalDate: new Date("2900-05-01T15:00:00.000Z"),
        cost: 456,
        type: 'HOUR',
        meters: 300,
        spaceId: 1,
        renterId: 1
      };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.withArgs({
        where: {
          id: 1
        }, include: {
          rentals: true
        }
      }).resolves(spaceToAddRental)
      
      //API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToBeCreated, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(res => {
          assert.equal(res.status, 200);
        })
    });

    it('Should return 401 when token is missing', async () => {
      // Fixture
      const expected = 'Unauthorized';

      // API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, {})
        .then(() => {
          assert.fail();
        }).catch(err => {
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
      await axios.post(`${host}/api/v1/spaces/1/rentals`, {}, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 401);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when renterId does not exists', async () => {
      // Fixture
      const expected = 'Invalid renterId. It must be an integer number';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);

      // API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, { renterId: undefined }, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when spaceId does not exists', async () => {
      // Fixture
      const expected = 'Invalid spaceId. It must be an integer number';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const rentalToBeCreated = {
        initialDate: new Date("2021-03-10T18:18:14.049Z"),
        finalDate: new Date("2022-03-10T20:18:14.049Z"),
        cost: 456,
        type: 'MONTH',
        meters: 5,
        renterId: 1
      };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);

      // API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToBeCreated, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when spaceId is not a number', async () => {
      // Fixture
      const expected = 'Invalid spaceId. It must be an integer number';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const rentalToBeCreated = {
        initialDate: new Date("2021-03-10T18:18:14.049Z"),
        finalDate: new Date("2022-03-10T20:18:14.049Z"),
        cost: 456,
        type: 'MONTH',
        meters: 5,
        spaceId: "invalid_id",
        renterId: 1
      };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);

      // API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToBeCreated, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when spaceId of a rental is not the same as the spaceId given in the path', async () => {
      // Fixture
      const expected = 'Invalid spaceId. spaceId parameter and spaceId rental value must be the same';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const rentalToBeCreated = {
        initialDate: new Date("2021-03-10T18:18:14.049Z"),
        finalDate: new Date("2022-03-10T20:18:14.049Z"),
        cost: 456,
        type: 'MONTH',
        meters: 5,
        spaceId: 1,
        renterId: 1
      };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);

      // API Call
      await axios.post(`${host}/api/v1/spaces/2/rentals`, rentalToBeCreated, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when spaceId is not a number', async () => {
      // Fixture
      const expected = 'Invalid spaceId parameter. It must be an integer number';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const rentalToBeCreated = {
        initialDate: new Date("2021-03-10T18:18:14.049Z"),
        finalDate: new Date("2022-03-10T20:18:14.049Z"),
        cost: 456,
        type: 'MONTH',
        meters: 5,
        spaceId: 1,
        renterId: 1
      };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);

      // API Call
      await axios.post(`${host}/api/v1/spaces/invalid/rentals`, rentalToBeCreated, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 403 when someone pretends to rent in name of another user', async () => {
      // Fixture
      const expected = 'Cannot rent space in name of another user';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const rentalToBeCreated = {
        initialDate: new Date("2021-03-10T18:18:14.049Z"),
        finalDate: new Date("2022-03-10T20:18:14.049Z"),
        cost: 456,
        type: 'MONTH',
        meters: 5,
        spaceId: 1,
        renterId: 3
      };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);

      // API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToBeCreated, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 403);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when the space given in the path does not exist', async () => {
      const spaceToAddRental = undefined
      const expected = 'No space found with this Id';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };

      const rentalToBeCreated = {
        initialDate: "2900-01-01T00:00:00.000Z",
        finalDate: "2999-01-01T00:00:00.000Z",
        cost: 456,
        type: 'MONTH',
        meters: 5,
        spaceId: 1,
        renterId: 1
      };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.withArgs({
        where: {
          id: 1
        }, include: {
          rentals: true
        }
      }).resolves(spaceToAddRental)
      createRental.resolves();


      //API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToBeCreated, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when an user want to rent a space twice', async () => {
      const spaceToAddRental = {
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "3000-01-01T00:00:00.000Z", location: "41.2,45.3",
        dimensions: "100x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1,
        rentals: [{
          id: 1, initialDate: "2799-01-01T00:00:00.000Z",
          finalDate: "2800-01-01T00:00:00.000Z",
          cost: 456,
          type: 'MONTH',
          meters: 5,
          spaceId: 1,
          renterId: 2
        }]
      }
      const expected = 'Cannot rent space twice. Please update or delete your previous rental of this space';
      const decodedJwt = { userId: 2, role: 'USER', email: 'test@test.com' };

      const rentalToBeCreated = {
        initialDate: "2900-01-01T00:00:00.000Z",
        finalDate: "2999-01-01T00:00:00.000Z",
        cost: 456,
        type: 'MONTH',
        meters: 5,
        spaceId: 1,
        renterId: 2
      };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.withArgs({
        where: {
          id: 1
        }, include: {
          rentals: true
        }
      }).resolves(spaceToAddRental)
      createRental.resolves();


      //API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToBeCreated, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when an user want to rent his own space', async () => {
      const spaceToAddRental = {
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "3000-01-01T00:00:00.000Z", location: "41.2,45.3",
        dimensions: "100x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: true, ownerId: 2
      }
      const expected = 'Cannot rent your own space';
      const decodedJwt = { userId: 2, role: 'USER', email: 'test@test.com' };

      const rentalToBeCreated = {
        initialDate: "2900-01-01T00:00:00.000Z",
        finalDate: "2999-01-01T00:00:00.000Z",
        cost: 456,
        type: 'MONTH',
        meters: 5,
        spaceId: 1,
        renterId: 2
      };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.withArgs({
        where: {
          id: 1
        }, include: {
          rentals: true
        }
      }).resolves(spaceToAddRental)
      createRental.resolves();


      //API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToBeCreated, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 500 when an unexpected error is thrown while creating a rental', async () => {
      // Fixture
      const expected = 'Internal Server Error';

      // Mock Auth and DB Query
      console.error = sinon.stub(); // Avoid logging intentionally provoked error
      verify.withArgs('testToken', 'stackingupsecretlocal').throws(new Error('Unexpected Error'));

      // API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, {}, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 500);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when a required field is missing in rental', async () => {
      // Fixture
      const expected = 'Bad Request: Missing required attributes';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const testRental = {
        initialDate: "2900-01-01T00:00:00.000Z",
        finalDate: "2999-01-01T00:00:00.000Z",
        cost: 456,
        type: 'MONTH',
        meters: 5,
        spaceId: 1,
        renterId: 1
      };
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);

      // API Call
      Object.keys(testRental).forEach(async key => {
        let rentalToPublish = Object.keys(testRental).filter(k => k !== key).reduce((obj, k) => { obj[k] = testRental[k]; return obj }, { spaceId: 1, renterId: 1 });
        await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToPublish,
          {
            withCredentials: true,
            headers: { Cookie: 'authToken=testToken;' }
          })
          .then(() => {
            assert.fail();
          }).catch(err => {
            assert.equal(err.response.status, 400);
            assert.equal(err.response.data, expected);
          });
      });
    });

    it('Should return 400 when trying to rent a space by hours without having pricehour', async () => {
      // Fixture

      const spaceToAddRental = {
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "3000-01-01T00:00:00.000Z", location: "41.2,45.3",
        dimensions: "100x3", priceDay: 56, priceMonth: 456, shared: false, ownerId: 2
      }

      const expected = 'Bad Request: Space must have a price per hour, start and end hour to rent per hour';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const rentalToPublish = {
        initialDate: "2900-01-01T00:00:00.000Z",
        finalDate: "2999-01-01T00:00:00.000Z",
        cost: 44.2,
        type: 'HOUR',
        meters: 5,
        spaceId: 1,
        renterId: 1
      };
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.withArgs({
        where: {
          id: 1
        }, include: {
          rentals: true
        }
      }).resolves(spaceToAddRental)

      // API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToPublish,
        {
          withCredentials: true,
          headers: { Cookie: 'authToken=testToken;' }
        })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when trying to rent a space by days without having priceday', async () => {
      // Fixture

      const spaceToAddRental = {
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "3000-01-01T00:00:00.000Z", location: "41.2,45.3",
        dimensions: "100x3", priceMonth: 456, shared: false, ownerId: 2
      }

      const expected = 'Bad Request: Space must have a price per day to rent per day';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const rentalToPublish = {
        initialDate: "2900-01-01T00:00:00.000Z",
        finalDate: "2999-01-01T00:00:00.000Z",
        cost: 44.2,
        type: 'DAY',
        meters: 5,
        spaceId: 1,
        renterId: 1
      };
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.withArgs({
        where: {
          id: 1
        }, include: {
          rentals: true
        }
      }).resolves(spaceToAddRental)

      // API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToPublish,
        {
          withCredentials: true,
          headers: { Cookie: 'authToken=testToken;' }
        })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when trying to rent a space by month without having pricemonth', async () => {
      // Fixture

      const spaceToAddRental = {
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "3000-01-01T00:00:00.000Z", location: "41.2,45.3",
        dimensions: "100x3", priceDay: 56, shared: false, ownerId: 2
      }

      const expected = 'Bad Request: Space must have a price per month to rent per month';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const rentalToPublish = {
        initialDate: "2900-01-01T00:00:00.000Z",
        finalDate: "2999-01-01T00:00:00.000Z",
        cost: 44.2,
        type: 'MONTH',
        meters: 5,
        spaceId: 1,
        renterId: 1
      };
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.withArgs({
        where: {
          id: 1
        }, include: {
          rentals: true
        }
      }).resolves(spaceToAddRental)

      // API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToPublish,
        {
          withCredentials: true,
          headers: { Cookie: 'authToken=testToken;' }
        })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when trying to rent a space before 24 hours', async () => {
      // Fixture
      let dateTest = new Date();
      dateTest.setHours(dateTest.getHours() + 3);

      const spaceToAddRental = {
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "3000-01-01T00:00:00.000Z", location: "41.2,45.3",
        dimensions: "100x3", priceDay: 56, shared: false, ownerId: 2
      }

      const expected = 'Bad Request: Initial date must be after 24 hours from now';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const rentalToPublish = {
        initialDate: dateTest,
        finalDate: "2999-01-01T00:00:00.000Z",
        cost: 44.2,
        type: 'DAY',
        meters: 5,
        spaceId: 1,
        renterId: 1
      };
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.withArgs({
        where: {
          id: 1
        }, include: {
          rentals: true
        }
      }).resolves(spaceToAddRental)

      // API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToPublish,
        {
          withCredentials: true,
          headers: { Cookie: 'authToken=testToken;' }
        })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when Initial hour is not between space hours', async () => {
      // Fixture

      const spaceToAddRental = {
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "3000-01-01T00:00:00.000Z", location: "41.2,45.3",
        dimensions: "100x3", priceHour: 56, startHour: new Date("1970-01-01T20:00:00.000Z"), endHour: new Date("1970-01-01T23:00:00.000Z"), shared: true, ownerId: 2
      }

      const expected = 'Bad Request: Initial hour must be between space hours';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const rentalToPublish = {
        initialDate: "2900-01-01T15:00:00.000Z",
        finalDate: "2999-01-01T00:00:00.000Z",
        cost: 44.2,
        type: 'HOUR',
        meters: 5,
        spaceId: 1,
        renterId: 1
      };
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.withArgs({
        where: {
          id: 1
        }, include: {
          rentals: true
        }
      }).resolves(spaceToAddRental)

      // API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToPublish,
        {
          withCredentials: true,
          headers: { Cookie: 'authToken=testToken;' }
        })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when Final hour is not between space hours', async () => {
      // Fixture

      const spaceToAddRental = {
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "3000-01-01T00:00:00.000Z", location: "41.2,45.3",
        dimensions: "100x3", priceHour: 56, startHour: new Date("1970-01-01T17:00:00.000Z"), endHour: new Date("1970-01-01T19:00:00.000Z"), shared: true, ownerId: 2
      }

      const expected = 'Bad Request: Final hour must be between space hours';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const rentalToPublish = {
        initialDate: "2900-01-01T18:00:00.000Z",
        finalDate: "2999-01-01T22:00:00.000Z",
        cost: 44.2,
        type: 'HOUR',
        meters: 5,
        spaceId: 1,
        renterId: 1
      };
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.withArgs({
        where: {
          id: 1
        }, include: {
          rentals: true
        }
      }).resolves(spaceToAddRental)

      // API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToPublish,
        {
          withCredentials: true,
          headers: { Cookie: 'authToken=testToken;' }
        })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when trying to rent a space for 0 hours at the same day', async () => {
      // Fixture

      const spaceToAddRental = {
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "3000-01-01T00:00:00.000Z", location: "41.2,45.3",
        dimensions: "100x3", priceHour: 56, startHour: new Date("1970-01-01T17:00:00.000Z"), endHour: new Date("1970-01-01T20:00:00.000Z"), shared: true, ownerId: 2
      }

      const expected = 'Bad Request: Cannot rent a space for 0 hours at the same day';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const rentalToPublish = {
        initialDate: "2900-01-01T18:00:00.000Z",
        finalDate: "2900-01-01T18:00:00.000Z",
        cost: 44.2,
        type: 'HOUR',
        meters: 5,
        spaceId: 1,
        renterId: 1
      };
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.withArgs({
        where: {
          id: 1
        }, include: {
          rentals: true
        }
      }).resolves(spaceToAddRental)

      // API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToPublish,
        {
          withCredentials: true,
          headers: { Cookie: 'authToken=testToken;' }
        })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when meters are not a number', async () => {
      // Fixture
      const expected = 'Bad Request: Meters must be a number';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const rentalToPublish = {
        initialDate: "2900-01-01T00:00:00.000Z",
        finalDate: "2999-01-01T00:00:00.000Z",
        cost: 456,
        type: 'MONTH',
        meters: "invalid",
        spaceId: 1,
        renterId: 1
      };
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);

      // API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToPublish,
        {
          withCredentials: true,
          headers: { Cookie: 'authToken=testToken;' }
        })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when type is not valid', async () => {
      // Fixture
      const expected = 'Bad Request: Type must be one of the following: HOUR, DAY, MONTH';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const rentalToPublish = {
        initialDate: "2900-01-01T00:00:00.000Z",
        finalDate: "2999-01-01T00:00:00.000Z",
        cost: 456,
        type: "TEST",
        meters: 5,
        spaceId: 1,
        renterId: 1
      };
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);

      // API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToPublish,
        {
          withCredentials: true,
          headers: { Cookie: 'authToken=testToken;' }
        })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when trying to rent a space for 0 months', async () => {
      // Fixture
      const expected = 'Bad Request: Cannot rent a space for 0 months';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const rentalToPublish = {
        initialDate: "2900-01-01T00:00:00.000Z",
        finalDate: "2900-01-26T23:59:00.000Z",
        cost: 456,
        type: "MONTH",
        meters: 5,
        spaceId: 1,
        renterId: 1
      };
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);

      // API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToPublish,
        {
          withCredentials: true,
          headers: { Cookie: 'authToken=testToken;' }
        })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when finalDate of a rental is before initialDate', async () => {
      // Fixture

      const spaceToAddRental = {
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "3000-01-01T00:00:00.000Z", location: "41.2,45.3",
        dimensions: "100x3", priceDay: 56, shared: false, ownerId: 2
      }

      const expected = 'Bad Request: Final date must be after initial date';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const rentalToPublish = {
        initialDate: new Date("2900-04-01T00:00:00.000Z"),
        finalDate: new Date("2900-02-01T00:00:00.000Z"),
        cost: 456,
        type: "DAY",
        meters: 5,
        spaceId: 1,
        renterId: 1
      };
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.withArgs({
        where: {
          id: 1
        }, include: {
          rentals: true
        }
      }).resolves(spaceToAddRental)

      // API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToPublish,
        {
          withCredentials: true,
          headers: { Cookie: 'authToken=testToken;' }
        })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when initialDate is before today', async () => {
      // Fixture
      const spaceToAddRental = {
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "3000-01-01T00:00:00.000Z", location: "41.2,45.3",
        dimensions: "100x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: true, ownerId: 2
      }
      const expected = 'Bad Request: Initial date must be a Date after today';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const rentalToPublish = {
        initialDate: "2020-01-01T00:00:00.000Z",
        finalDate: "2900-01-01T00:00:00.000Z",
        cost: 456,
        type: "HOUR",
        meters: 5,
        spaceId: 1,
        renterId: 1
      };
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.withArgs({
        where: {
          id: 1
        }, include: {
          rentals: true
        }
      }).resolves(spaceToAddRental)
      createRental.resolves()
      // API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToPublish,
        {
          withCredentials: true,
          headers: { Cookie: 'authToken=testToken;' }
        })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when finalDate is before today', async () => {
      // Fixture

      const spaceToAddRental = {
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "3000-01-01T00:00:00.000Z", location: "41.2,45.3",
        dimensions: "100x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: true, ownerId: 2
      }
      const expected = 'Bad Request: Final date must be a Date after today';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const rentalToPublish = {
        initialDate: "2900-01-01T00:00:00.000Z",
        finalDate: "2021-01-01T00:00:00.000Z",
        cost: 456,
        type: "HOUR",
        meters: 5,
        spaceId: 1,
        renterId: 1
      };
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.withArgs({
        where: {
          id: 1
        }, include: {
          rentals: true
        }
      }).resolves(spaceToAddRental)
      createRental.resolves()

      // API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToPublish,
        {
          withCredentials: true,
          headers: { Cookie: 'authToken=testToken;' }
        })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when space finalDate is before today', async () => {
      // Fixture

      const spaceToAddRental = {
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: new Date("1970-01-01T00:00:00.000Z"), finalDate: new Date("2021-01-01T00:00:00.000Z"), location: "41.2,45.3",
        dimensions: "100x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: true, ownerId: 2
      }
      const expected = 'Space cannot be rented after its final date';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const rentalToPublish = {
        initialDate: new Date("2900-01-01T00:00:00.000Z"),
        finalDate: new Date("3001-01-01T00:00:00.000Z"),
        cost: 456,
        type: "HOUR",
        meters: 5,
        spaceId: 1,
        renterId: 1
      };
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.withArgs({
        where: {
          id: 1
        }, include: {
          rentals: true
        }
      }).resolves(spaceToAddRental)
      createRental.rejects()

      // API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToPublish,
        {
          withCredentials: true,
          headers: { Cookie: 'authToken=testToken;' }
        })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when newRentalInitialDate >= existingRentalIntialDate and newRentalFinalDate <= existingRentalFinalDate', async () => {
      // Fixture

      const spaceToAddRental = {
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: new Date("1970-01-01T00:00:00.000Z"), finalDate: new Date("3000-01-01T00:00:00.000Z"), location: "41.2,45.3",
        dimensions: "100x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: false, ownerId: 2, rentals: [{
          initialDate: new Date("2023-01-01T00:00:00.000Z"), finalDate: new Date("2030-01-01T00:00:00.000Z"),
          cost: 456, type: "DAY", meters: 300, spaceId: 1, renterId: 3
        },
        {
          initialDate: new Date("2031-01-01T00:00:00.000Z"), finalDate: new Date("2040-01-01T00:00:00.000Z"),
          cost: 456, type: "DAY", meters: 300, spaceId: 1, renterId: 3
        }]
      }
      const expected = 'Bad Request: Space not available or space capacity exceeded';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const rentalToPublish = {
        initialDate: new Date("2024-01-01T00:00:00.000Z"),
        finalDate: new Date("2029-01-01T00:00:00.000Z"),
        cost: 456,
        type: "DAY",
        meters: 1,
        spaceId: 1,
        renterId: 1
      };
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.withArgs({
        where: {
          id: 1
        }, include: {
          rentals: true
        }
      }).resolves(spaceToAddRental)
      createRental.rejects()

      // API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToPublish,
        {
          withCredentials: true,
          headers: { Cookie: 'authToken=testToken;' }
        })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when newRentalInitialDate < existingRentalInitialDate and newRentalFinalDate <= existingRentalFinalDate', async () => {
      // Fixture

      const spaceToAddRental = {
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: new Date("1970-01-01T00:00:00.000Z"), finalDate: new Date("3000-01-01T00:00:00.000Z"), location: "41.2,45.3",
        dimensions: "100x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: false, ownerId: 2, rentals: [{
          initialDate: new Date("2025-01-01T00:00:00.000Z"), finalDate: new Date("2030-01-01T00:00:00.000Z"),
          cost: 456, type: "DAY", meters: 300, spaceId: 1, renterId: 3
        }]
      }
      const expected = 'Bad Request: Space not available or space capacity exceeded';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const rentalToPublish = {
        initialDate: new Date("2024-01-01T00:00:00.000Z"),
        finalDate: new Date("2029-01-01T00:00:00.000Z"),
        cost: 456,
        type: "DAY",
        meters: 1,
        spaceId: 1,
        renterId: 1
      };
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.withArgs({
        where: {
          id: 1
        }, include: {
          rentals: true
        }
      }).resolves(spaceToAddRental)
      createRental.rejects()

      // API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToPublish,
        {
          withCredentials: true,
          headers: { Cookie: 'authToken=testToken;' }
        })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when newRentalInitialDate >= existingRentalInitialDate and newRentalFinalDate > existingRentalFinalDate', async () => {
      // Fixture

      const spaceToAddRental = {
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: new Date("1970-01-01T00:00:00.000Z"), finalDate: new Date("3000-01-01T00:00:00.000Z"), location: "41.2,45.3",
        dimensions: "100x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: false, ownerId: 2, rentals: [{
          initialDate: new Date("2025-01-01T00:00:00.000Z"), finalDate: new Date("2030-01-01T00:00:00.000Z"),
          cost: 456, type: "DAY", meters: 300, spaceId: 1, renterId: 3
        }]
      }
      const expected = 'Bad Request: Space not available or space capacity exceeded';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const rentalToPublish = {
        initialDate: new Date("2026-01-01T00:00:00.000Z"),
        finalDate: new Date("2031-01-01T00:00:00.000Z"),
        cost: 456,
        type: "DAY",
        meters: 1,
        spaceId: 1,
        renterId: 1
      };
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.withArgs({
        where: {
          id: 1
        }, include: {
          rentals: true
        }
      }).resolves(spaceToAddRental)
      createRental.rejects()

      // API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToPublish,
        {
          withCredentials: true,
          headers: { Cookie: 'authToken=testToken;' }
        })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when newRentalInitialDate < existingRentalInitialDate and newRentalFinalDate > existingRentalFinalDate', async () => {
      // Fixture

      const spaceToAddRental = {
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: new Date("1970-01-01T00:00:00.000Z"), finalDate: new Date("3000-01-01T00:00:00.000Z"), location: "41.2,45.3",
        dimensions: "100x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: false, ownerId: 2, rentals: [{
          initialDate: new Date("2025-01-01T00:00:00.000Z"), finalDate: new Date("2030-01-01T00:00:00.000Z"),
          cost: 456, type: "DAY", meters: 300, spaceId: 1, renterId: 3
        }]
      }
      const expected = 'Bad Request: Space not available or space capacity exceeded';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const rentalToPublish = {
        initialDate: new Date("2024-01-01T00:00:00.000Z"),
        finalDate: new Date("2031-01-01T00:00:00.000Z"),
        cost: 456,
        type: "DAY",
        meters: 1,
        spaceId: 1,
        renterId: 1
      };
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.withArgs({
        where: {
          id: 1
        }, include: {
          rentals: true
        }
      }).resolves(spaceToAddRental)
      createRental.rejects()

      // API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToPublish,
        {
          withCredentials: true,
          headers: { Cookie: 'authToken=testToken;' }
        })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when the rental meters are higher than space dimensions', async () => {
      // Fixture

      const spaceToAddRental = {
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: new Date("1970-01-01T00:00:00.000Z"), finalDate: new Date("3000-01-01T00:00:00.000Z"), location: "41.2,45.3",
        dimensions: "100x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: false, ownerId: 2, rentals: [{
          initialDate: new Date("2025-01-01T00:00:00.000Z"), finalDate: new Date("2030-01-01T00:00:00.000Z"),
          cost: 456, type: "DAY", meters: 300, spaceId: 1, renterId: 3
        }]
      }
      const expected = 'Bad Request: Space not available or space capacity exceeded';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const rentalToPublish = {
        initialDate: new Date("2024-01-01T00:00:00.000Z"),
        finalDate: new Date("2031-01-01T00:00:00.000Z"),
        cost: 456,
        type: "DAY",
        meters: 500,
        spaceId: 1,
        renterId: 1
      };
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.withArgs({
        where: {
          id: 1
        }, include: {
          rentals: true
        }
      }).resolves(spaceToAddRental)
      createRental.rejects()

      // API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToPublish,
        {
          withCredentials: true,
          headers: { Cookie: 'authToken=testToken;' }
        })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when rental initial date is not between space dates', async () => {
      // Fixture

      const spaceToAddRental = {
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: new Date("2030-01-01T00:00:00.000Z"), finalDate: new Date("3000-01-01T00:00:00.000Z"), location: "41.2,45.3",
        dimensions: "100x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: true, ownerId: 2
      }
      const expected = 'Bad Request: Initial date must be between space dates';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const rentalToPublish = {
        initialDate: new Date("2025-01-01T00:00:00.000Z"),
        finalDate: new Date("3001-01-01T00:00:00.000Z"),
        cost: 456,
        type: "DAY",
        meters: 1,
        spaceId: 1,
        renterId: 1
      };
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.withArgs({
        where: {
          id: 1
        }, include: {
          rentals: true
        }
      }).resolves(spaceToAddRental)
      createRental.rejects()

      // API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToPublish,
        {
          withCredentials: true,
          headers: { Cookie: 'authToken=testToken;' }
        })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when rental final date is not between space dates', async () => {
      // Fixture

      const spaceToAddRental = {
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: new Date("2030-01-01T00:00:00.000Z"), finalDate: new Date("3000-01-01T00:00:00.000Z"), location: "41.2,45.3",
        dimensions: "100x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: true, ownerId: 2
      }
      const expected = 'Bad Request: Final date must be between space dates';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const rentalToPublish = {
        initialDate: new Date("2031-01-01T00:00:00.000Z"),
        finalDate: new Date("3001-01-01T00:00:00.000Z"),
        cost: 456,
        type: "DAY",
        meters: 1,
        spaceId: 1,
        renterId: 1
      };
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.withArgs({
        where: {
          id: 1
        }, include: {
          rentals: true
        }
      }).resolves(spaceToAddRental)
      createRental.rejects()

      // API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToPublish,
        {
          withCredentials: true,
          headers: { Cookie: 'authToken=testToken;' }
        })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when rental meters are not equal to non-shared space meters', async () => {
      // Fixture

      const spaceToAddRental = {
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: new Date("2030-01-01T00:00:00.000Z"), finalDate: new Date("3000-01-01T00:00:00.000Z"), location: "41.2,45.3",
        dimensions: "100x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: false, ownerId: 2
      }
      const expected = 'Bad Request: Meters must be equal to space meters';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const rentalToPublish = {
        initialDate: new Date("2031-01-01T00:00:00.000Z"),
        finalDate: new Date("2040-01-01T00:00:00.000Z"),
        cost: 456,
        type: "DAY",
        meters: 200,
        spaceId: 1,
        renterId: 1
      };
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.withArgs({
        where: {
          id: 1
        }, include: {
          rentals: true
        }
      }).resolves(spaceToAddRental)
      createRental.rejects()

      // API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToPublish,
        {
          withCredentials: true,
          headers: { Cookie: 'authToken=testToken;' }
        })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when newRental meters exceed and newRentalInitialDate >= existingRentalIntialDate and newRentalFinalDate <= existingRentalFinalDate', async () => {
      // Fixture

      const spaceToAddRental = {
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: new Date("1970-01-01T00:00:00.000Z"), finalDate: new Date("3000-01-01T00:00:00.000Z"), location: "41.2,45.3",
        dimensions: "100x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: true, ownerId: 2, rentals: [{
          initialDate: new Date("2023-01-01T00:00:00.000Z"), finalDate: new Date("2030-01-01T00:00:00.000Z"),
          cost: 456, type: "DAY", meters: 100, spaceId: 1, renterId: 3
        },
        {
          initialDate: new Date("2031-01-01T00:00:00.000Z"), finalDate: new Date("2040-01-01T00:00:00.000Z"),
          cost: 456, type: "DAY", meters: 100, spaceId: 1, renterId: 3
        }]
      }
      const expected = 'Bad Request: Space not available or space capacity exceeded';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const rentalToPublish = {
        initialDate: new Date("2024-01-01T00:00:00.000Z"),
        finalDate: new Date("2029-01-01T00:00:00.000Z"),
        cost: 456,
        type: "DAY",
        meters: 300,
        spaceId: 1,
        renterId: 1
      };
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.withArgs({
        where: {
          id: 1
        }, include: {
          rentals: true
        }
      }).resolves(spaceToAddRental)
      createRental.rejects()

      // API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToPublish,
        {
          withCredentials: true,
          headers: { Cookie: 'authToken=testToken;' }
        })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when newRental meters exceed and newRentalInitialDate < existingRentalIntialDate and newRentalFinalDate <= existingRentalFinalDate', async () => {
      // Fixture

      const spaceToAddRental = {
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: new Date("1970-01-01T00:00:00.000Z"), finalDate: new Date("3000-01-01T00:00:00.000Z"), location: "41.2,45.3",
        dimensions: "100x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: true, ownerId: 2, rentals: [{
          initialDate: new Date("2024-01-01T00:00:00.000Z"), finalDate: new Date("2030-01-01T00:00:00.000Z"),
          cost: 456, type: "DAY", meters: 100, spaceId: 1, renterId: 3
        }]
      }
      const expected = 'Bad Request: Space not available or space capacity exceeded';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const rentalToPublish = {
        initialDate: new Date("2023-01-01T00:00:00.000Z"),
        finalDate: new Date("2028-01-01T00:00:00.000Z"),
        cost: 456,
        type: "DAY",
        meters: 300,
        spaceId: 1,
        renterId: 1
      };
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.withArgs({
        where: {
          id: 1
        }, include: {
          rentals: true
        }
      }).resolves(spaceToAddRental)
      createRental.rejects()

      // API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToPublish,
        {
          withCredentials: true,
          headers: { Cookie: 'authToken=testToken;' }
        })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when newRental meters exceed and newRentalInitialDate >= existingRentalIntialDate and newRentalFinalDate > existingRentalFinalDate', async () => {
      // Fixture

      const spaceToAddRental = {
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: new Date("1970-01-01T00:00:00.000Z"), finalDate: new Date("3000-01-01T00:00:00.000Z"), location: "41.2,45.3",
        dimensions: "100x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: true, ownerId: 2, rentals: [{
          initialDate: new Date("2023-01-01T00:00:00.000Z"), finalDate: new Date("2030-01-01T00:00:00.000Z"),
          cost: 456, type: "DAY", meters: 100, spaceId: 1, renterId: 3
        }]
      }
      const expected = 'Bad Request: Space not available or space capacity exceeded';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const rentalToPublish = {
        initialDate: new Date("2024-01-01T00:00:00.000Z"),
        finalDate: new Date("2031-01-01T00:00:00.000Z"),
        cost: 456,
        type: "DAY",
        meters: 300,
        spaceId: 1,
        renterId: 1
      };
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.withArgs({
        where: {
          id: 1
        }, include: {
          rentals: true
        }
      }).resolves(spaceToAddRental)
      createRental.rejects()

      // API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToPublish,
        {
          withCredentials: true,
          headers: { Cookie: 'authToken=testToken;' }
        })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when newRental meters exceed and newRentalInitialDate < existingRentalIntialDate and newRentalFinalDate > existingRentalFinalDate', async () => {
      // Fixture

      const spaceToAddRental = {
        id: 1, name: "sotano", description: "Esto es un sotano", initialDate: new Date("1970-01-01T00:00:00.000Z"), finalDate: new Date("3000-01-01T00:00:00.000Z"), location: "41.2,45.3",
        dimensions: "100x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: true, ownerId: 2, rentals: [{
          initialDate: new Date("2024-01-01T00:00:00.000Z"), finalDate: new Date("2030-01-01T00:00:00.000Z"),
          cost: 456, type: "DAY", meters: 100, spaceId: 1, renterId: 3
        }]
      }
      const expected = 'Bad Request: Space not available or space capacity exceeded';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const rentalToPublish = {
        initialDate: new Date("2023-01-01T00:00:00.000Z"),
        finalDate: new Date("2031-01-01T00:00:00.000Z"),
        cost: 456,
        type: "DAY",
        meters: 300,
        spaceId: 1,
        renterId: 1
      };
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.withArgs({
        where: {
          id: 1
        }, include: {
          rentals: true
        }
      }).resolves(spaceToAddRental)
      createRental.rejects()

      // API Call
      await axios.post(`${host}/api/v1/spaces/1/rentals`, rentalToPublish,
        {
          withCredentials: true,
          headers: { Cookie: 'authToken=testToken;' }
        })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should post a rental of a space (shared, not overlapping)', async () => {      
      //Fixture
      const expected = { rentalId: 1 };
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const decodedRentalToken = {
        initialDate: new Date("2900-04-01T00:00:00.000Z"),
        finalDate: new Date("2900-05-01T00:00:00.000Z"),
        cost: 456,
        type: 'MONTH',
        meters: 5,
        spaceId: 1,
        renterId: 1
      }

      const rentalAdded = {
        id: 1,
        initialDate: new Date("2900-04-01T00:00:00.000Z"),
        finalDate: new Date("2900-05-01T00:00:00.000Z"),
        cost: 456,
        type: 'MONTH',
        meters: 5,
        spaceId: 1,
        renterId: 1
      }

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      verify.withArgs('rentalTestToken', 'stackingupsecretlocal').returns(decodedRentalToken);
      
      createRental.resolves(rentalAdded);

      //API Call
      await axios.post(`${host}/api/v1/spaces/rentals/confirmation`, {rentalToken: 'rentalTestToken'}, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(res => {
          assert.equal(res.status, 201);
          assert.deepEqual(res.data, expected);
        })      
    });

    it('Should return 400 when token already used', async () => {
      //Fixture
      const expected = 'Rental token already used';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const decodedRentalToken = {
        initialDate: new Date("2900-04-01T00:00:00.000Z"),
        finalDate: new Date("2900-05-01T00:00:00.000Z"),
        cost: 456,
        type: 'MONTH',
        meters: 5,
        spaceId: 1,
        renterId: 1
      }

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      verify.withArgs('rentalTestToken', 'stackingupsecretlocal').returns(decodedRentalToken);
      
      //API Call
      await axios.post(`${host}/api/v1/spaces/rentals/confirmation`, {rentalToken: 'rentalTestToken'}, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err =>{
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });      
    });

    it('Should return a 500 error when trying to post a rental', async () => {      
      //Fixture
      const expected = 'Internal Server Error';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const decodedRentalToken = {
        initialDate: new Date("2900-04-01T00:00:00.000Z"),
        finalDate: new Date("2900-05-01T00:00:00.000Z"),
        cost: 456,
        type: 'MONTH',
        meters: 5,
        spaceId: 1,
        renterId: 1
      }

      const rentalAdded = {
        id: 1,
        initialDate: new Date("2900-04-01T00:00:00.000Z"),
        finalDate: new Date("2900-05-01T00:00:00.000Z"),
        cost: 456,
        type: 'MONTH',
        meters: 5,
        spaceId: 1,
        renterId: 1
      }

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      verify.withArgs('rentalTestToken2', 'stackingupsecretlocal').returns(decodedRentalToken);
      
      createRental.rejects();

      //API Call
      await axios.post(`${host}/api/v1/spaces/rentals/confirmation`, {rentalToken: 'rentalTestToken2'}, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        })
        .catch(err => {
          assert.equal(err.response.status, 500);
          assert.equal(err.response.data, expected)
        });      
    });

    it('Should return a 401 error when trying to verify a token', async () => {      
      //Fixture
      const expected = 'Token error: jwt malformed';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const decodedRentalToken = {
        initialDate: new Date("2900-04-01T00:00:00.000Z"),
        finalDate: new Date("2900-05-01T00:00:00.000Z"),
        cost: 456,
        type: 'MONTH',
        meters: 5,
        spaceId: 1,
        renterId: 1
      }

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').throws(new jwt.JsonWebTokenError('jwt malformed'));
      verify.withArgs('rentalTestToken3', 'stackingupsecretlocal').returns(decodedRentalToken);
      
      //API Call
      await axios.post(`${host}/api/v1/spaces/rentals/confirmation`, {rentalToken: 'rentalTestToken3'}, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        })
        .catch(err => {
          assert.equal(err.response.status, 401);
          assert.equal(err.response.data, expected)
        });      
    });

    it('Should return a 500 error when trying to verify a token', async () => {      
      //Fixture
      const expected = 'Internal Server Error';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const decodedRentalToken = {
        initialDate: new Date("2900-04-01T00:00:00.000Z"),
        finalDate: new Date("2900-05-01T00:00:00.000Z"),
        cost: 456,
        type: 'MONTH',
        meters: 5,
        spaceId: 1,
        renterId: 1
      }

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').throws(new Error('Internal Server Error'));
      verify.withArgs('rentalTestToken4', 'stackingupsecretlocal').returns(decodedRentalToken);
      
      //API Call
      await axios.post(`${host}/api/v1/spaces/rentals/confirmation`, {rentalToken: 'rentalTestToken4'}, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        })
        .catch(err => {
          assert.equal(err.response.status, 500);
          assert.equal(err.response.data, expected)
        });      
    });

    it('Should return a 401 error when invalid tokens provided ', async () => {      
      //Fixture
      const expected = 'Unauthorized or missing rental token';
      
      //API Call
      await axios.post(`${host}/api/v1/spaces/rentals/confirmation`, {})
        .then(() => {
          assert.fail();
        })
        .catch(err => {
          assert.equal(err.response.status, 401);
          assert.equal(err.response.data, expected)
        });      
    });

    it('Should post a rating', async () => {
      // Fixture
      const expected = 'Rating created successfully';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const userToBeRated = { id: 2, name: 'John', surname: 'Doe' };
      const ratingToBePublished = {
        title: "Increible trato",
        description: "El arrendador fue muy atento y todo fue correcto.",
        rating: 4,
      }
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      createRating.resolves();

      findUniqueUser.withArgs({
        where: {
          id: 2
        }
      }).resolves(userToBeRated);

      // API Call
      await axios.post(`${host}/api/v1/users/2/rate`, ratingToBePublished, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(res => {
          assert.equal(res.status, 201);
          assert.equal(res.data, expected);
        }).catch(() => assert.fail());
    });

    it('Should return 401 when token is missing', async () => {
      // Fixture
      const expected = 'Unauthorized';

      // API Call
      await axios.post(`${host}/api/v1/users/2/rate`, {})
        .then(() => {
          assert.fail();
        }).catch(err => {
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
      await axios.post(`${host}/api/v1/users/2/rate`, {}, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 401);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when receiverID or Token reviewerID are missing', async () => {
      // Fixture
      const expected = 'Missing required attributes';
      const decodedJwt = { userId: undefined, role: 'VERIFIED', email: 'test@test.com' };
      const userToBeRated = { id: 2, name: 'John', surname: 'Doe' };
      const ratingToBePublished = {
        title: "Increible trato",
        description: "El arrendador fue muy atento y todo fue correcto.",
        rating: 4,
      }
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUniqueUser.withArgs({
        where: {
          id: 2
        }
      }).resolves(userToBeRated);

      // API Call
      await axios.post(`${host}/api/v1/users/2.5/rate`, ratingToBePublished, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when receiverID in PATH is not an integer', async () => {
      // Fixture
      const expected = 'IDs must be integers';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const userToBeRated = { id: 2, name: 'John', surname: 'Doe' };
      const ratingToBePublished = {
        title: "Increible trato",
        description: "El arrendador fue muy atento y todo fue correcto.",
        rating: 4,
      }
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUniqueUser.withArgs({
        where: {
          id: 2
        }
      }).resolves(userToBeRated);

      // API Call
      await axios.post(`${host}/api/v1/users/2.5/rate`, ratingToBePublished, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when an user want to rate himself', async () => {
      // Fixture
      const expected = 'Can not rate yourself';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const userToBeRated = { id: 1, name: 'John', surname: 'Doe' };
      const ratingToBePublished = {
        title: "Increible trato",
        description: "El arrendador fue muy atento y todo fue correcto.",
        rating: 5,
      }
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUniqueUser.withArgs({
        where: {
          id: 2
        }
      }).resolves(userToBeRated);
      // API Call
      await axios.post(`${host}/api/v1/users/1/rate`, ratingToBePublished, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 404 when the given userId in path does not exist in DB', async () => {
      // Fixture
      const expected = 'The user to rate does not exist';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const ratingToBePublished = {
        title: "Increible trato",
        description: "El arrendador fue muy atento y todo fue correcto.",
        rating: 5,
      }
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUniqueUser.withArgs({
        where: {
          id: 2
        }
      }).resolves(undefined);
      // API Call
      await axios.post(`${host}/api/v1/users/2/rate`, ratingToBePublished, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 404);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when title or description are missing', async () => {
      // Fixture
      const expected = 'Bad Request: Missing required attributes';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const userToBeRated = { id: 2, name: 'John', surname: 'Doe' };
      const ratingToBePublished = {
        title: undefined,
        description: undefined,
        rating: 4,
      }
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUniqueUser.withArgs({
        where: {
          id: 2
        }
      }).resolves(userToBeRated);

      // API Call
      await axios.post(`${host}/api/v1/users/2/rate`, ratingToBePublished, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when title is lower than 3 characters', async () => {
      // Fixture
      const expected = 'Bad Request: Title must be between 2 and 50 characters';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const userToBeRated = { id: 2, name: 'John', surname: 'Doe' };
      const ratingToBePublished = {
        title: 'te',
        description: 'description',
        rating: 4,
      }
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUniqueUser.withArgs({
        where: {
          id: 2
        }
      }).resolves(userToBeRated);

      // API Call
      await axios.post(`${host}/api/v1/users/2/rate`, ratingToBePublished, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when title is greater than 50 characters', async () => {
      // Fixture
      const expected = 'Bad Request: Title must be between 2 and 50 characters';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const userToBeRated = { id: 2, name: 'John', surname: 'Doe' };
      const ratingToBePublished = {
        title: 'this title is too long,too long ,too long ,too long ,too long ,too long ,too long  ',
        description: 'description',
        rating: 4,
      }
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUniqueUser.withArgs({
        where: {
          id: 2
        }
      }).resolves(userToBeRated);

      // API Call
      await axios.post(`${host}/api/v1/users/2/rate`, ratingToBePublished, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when description is lower than 3 characters', async () => {
      // Fixture
      const expected = 'Bad Request: Description must be between 2 and 100 characters';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const userToBeRated = { id: 2, name: 'John', surname: 'Doe' };
      const ratingToBePublished = {
        title: 'titlte',
        description: 'de',
        rating: 4,
      }
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUniqueUser.withArgs({
        where: {
          id: 2
        }
      }).resolves(userToBeRated);

      // API Call
      await axios.post(`${host}/api/v1/users/2/rate`, ratingToBePublished, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when description is greater than 100 characters', async () => {
      // Fixture
      const expected = 'Bad Request: Description must be between 2 and 100 characters';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const userToBeRated = { id: 2, name: 'John', surname: 'Doe' };
      const ratingToBePublished = {
        title: 'this title',
        description: 'description is too long,too long ,too long ,too long ,too long ,too long ,too long, ,too long,,too long,,too long,,too long,,too long,,too long,,too long  ',
        rating: 4,
      }
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUniqueUser.withArgs({
        where: {
          id: 2
        }
      }).resolves(userToBeRated);

      // API Call
      await axios.post(`${host}/api/v1/users/2/rate`, ratingToBePublished, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when rating is lower than 0', async () => {
      // Fixture
      const expected = 'Bad Request: Rating must be between 1 and 5 or must be a integer number';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const userToBeRated = { id: 2, name: 'John', surname: 'Doe' };
      const ratingToBePublished = {
        title: 'title',
        description: 'description',
        rating: -1,
      }
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUniqueUser.withArgs({
        where: {
          id: 2
        }
      }).resolves(userToBeRated);

      // API Call
      await axios.post(`${host}/api/v1/users/2/rate`, ratingToBePublished, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when rating is greater than 5', async () => {
      // Fixture
      const expected = 'Bad Request: Rating must be between 1 and 5 or must be a integer number';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const userToBeRated = { id: 2, name: 'John', surname: 'Doe' };
      const ratingToBePublished = {
        title: 'title',
        description: 'description',
        rating: 6,
      }
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUniqueUser.withArgs({
        where: {
          id: 2
        }
      }).resolves(userToBeRated);

      // API Call
      await axios.post(`${host}/api/v1/users/2/rate`, ratingToBePublished, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when rating is NaN', async () => {
      // Fixture
      const expected = 'Bad Request: Rating must be between 1 and 5 or must be a integer number';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const userToBeRated = { id: 2, name: 'John', surname: 'Doe' };
      const ratingToBePublished = {
        title: 'title',
        description: 'description',
        rating: 'rating',
      }
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUniqueUser.withArgs({
        where: {
          id: 2
        }
      }).resolves(userToBeRated);

      // API Call
      await axios.post(`${host}/api/v1/users/2/rate`, ratingToBePublished, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when rating is not an integer', async () => {
      // Fixture
      const expected = 'Bad Request: Rating must be between 1 and 5 or must be a integer number';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const userToBeRated = { id: 2, name: 'John', surname: 'Doe' };
      const ratingToBePublished = {
        title: 'title',
        description: 'description',
        rating: 3.6,
      }
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUniqueUser.withArgs({
        where: {
          id: 2
        }
      }).resolves(userToBeRated);

      // API Call
      await axios.post(`${host}/api/v1/users/2/rate`, ratingToBePublished, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
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
      await axios.post(`${host}/api/v1/users/2/rate`, {}, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 500);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 500 when prisma create fails', async () => {
      // Fixture
      const expected = 'Internal Server Error';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const userToBeRated = { id: 2, name: 'John', surname: 'Doe' };
      const ratingToBePublished = {
        title: 'title',
        description: 'description',
        rating: 3,
      }
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUniqueUser.withArgs({
        where: {
          id: 2
        }
      }).resolves(userToBeRated);
      createRating.rejects();

      // API Call
      await axios.post(`${host}/api/v1/users/2/rate`, ratingToBePublished, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
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
        initialDate: "3923-03-10T18:18:14.049Z",
        finalDate: "3999-03-10T18:18:14.049Z",
        location: "44.43,43.21",
        dimensions: "2x2",
        shared: true,
        ownerId: 1,
        priceHour: 33.2,
        startHour: 60*60*1000,
        endHour: 60*60*1000*3,
        city: "test",
        province: "test",
        country: "test",
        tags: ['ELEVATOR', 'WET'],
        images: [fs.readFileSync(`${__dirname}/../assets/Test.png`, 'base64'), fs.readFileSync(`${__dirname}/../assets/Test.jpg`, 'base64')]
      }
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      update.resolves();

      // API Call
      await axios.put(`${host}/api/v1/spaces/1`, spaceToBeUpdated, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(res => {
          assert.equal(res.status, 201);
          assert.equal(res.data, expected);
        }).catch(() => assert.fail());
    });

    it('Should return 401 when token is missing', async () => {
      // Fixture
      const expected = 'Unauthorized';

      // API Call
      await axios.put(`${host}/api/v1/spaces/1`, {})
        .then(() => {
          assert.fail();
        }).catch(err => {
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
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
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
      await axios.put(`${host}/api/v1/spaces/1`, { ownerId: 1 }, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
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
      await axios.put(`${host}/api/v1/spaces/1`, { ownerId: 2 }, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
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
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
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
      await axios.put(`${host}/api/v1/spaces/invalid_spaceId`, { ownerId: 1 }, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
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
      await axios.put(`${host}/api/v1/spaces/1`, { ownerId: 1 }, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
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
        initialDate: "3923-03-10T18:18:14.049Z",
        location: "44.43,43.21",
        dimensions: "2x2",
        shared: true,
        ownerId: 1,
        priceDay: 33.2,
        city: "test",
        province: "test",
        country: "test",
        tags: ['ELEVATOR', 'WET'],
        images: [fs.readFileSync(`${__dirname}/../assets/Test.png`, 'base64'), fs.readFileSync(`${__dirname}/../assets/Test.jpg`, 'base64')]
      }
      // Mock Auth and DB Query
      const error = new (require('@prisma/client/runtime').PrismaClientKnownRequestError)('No space records found', 'P2025');
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      update.rejects(error);

      // API Call
      await axios.put(`${host}/api/v1/spaces/1`, spaceToBeUpdated, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
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
        initialDate: "3923-03-10T18:18:14.049Z",
        location: "44.43,43.21",
        dimensions: "2x2",
        shared: true,
        ownerId: 1,
        priceDay: 33.2,
        city: "test",
        province: "test",
        country: "test",
        tags: ['ELEVATOR', 'WET'],
        images: [fs.readFileSync(`${__dirname}/../assets/Test.png`, 'base64'), fs.readFileSync(`${__dirname}/../assets/Test.jpg`, 'base64')]
      }
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      update.rejects('Unknown error');

      // API Call
      await axios.put(`${host}/api/v1/spaces/1`, spaceToBeUpdated, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
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
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 500);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should update an user', async () => {
      // Fixture
      const expected = 'User updated successfully';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const userToBeUpdated = {
        name: "updated",
        surname: "updated",
        birthDate: "2000-03-30T09:49:30.610Z",
        sex: "MALE",
        idCard: "12345678Z",
        phoneNumber: "+34666777888",
        location: "Sevilla",
        avatar: fs.readFileSync(`${__dirname}/../assets/Test.png`, 'base64')
      }
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUniqueUser.withArgs({
        where: {
          id: 1
        },
        include: {
          auth: true
        }
      }).resolves({auth: {role: 'VERIFIED'}});
      findUniqueImage.resolves();
      updateUser.resolves();
      
      // API Call
      await axios.put(`${host}/api/v1/users/1`, userToBeUpdated, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( res => {
          assert.equal(res.status, 201);
          assert.equal(res.data, expected);
        }).catch( err => {
          assert.fail()
        });
    });

    it('User with ADMIN role should update a user with a different userId', async () => {
      // Fixture
      const expected = 'User updated successfully';
      const decodedJwt = { userId: 1, role: 'ADMIN', email: 'test@test.com' };
      const userToBeUpdated = {
        name: "updated",
        surname: "updated",
        birthDate: "2000-03-30T09:49:30.610Z",
        sex: "MALE",
        idCard: "12345678Z",
        phoneNumber: "+34666777888",
        location: "Sevilla",
        auth: {id: 1, email: 'test@tes.com', password: 'Password123', role: 'VERIFIED', userId: 1},
        ratings: [{id: 1, title: "test", description: "test", rating: 5, receiverId: 1, reviewerId: 2}],
        reviews: [{id: 1, title: "test", description: "test", rating: 5, receiverId: 2, reviewerId: 1}],
        avatar: fs.readFileSync(`${__dirname}/../assets/Test.png`, 'base64')
      }
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUniqueImage.resolves();
      findUniqueUser.withArgs({
        where: {
          id: 2
        },
        include: {
          auth: true
        }
      }).resolves({auth: {role: 'USER'}});
      updateUser.resolves();
      
      // API Call
      await axios.put(`${host}/api/v1/users/2`, userToBeUpdated, { 
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
      await axios.put(`${host}/api/v1/users/1`, {})
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
      await axios.put(`${host}/api/v1/users/1`, {}, { 
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

    it('Should return 403 when someone tries to update an user with another userId', async () => {
      // Fixture
      const expected = 'Forbidden';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const userToBeUpdated = {
          id: 2,
          name: "name",
          surname: "surname"
      }

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
    
      // API Call
      await axios.put(`${host}/api/v1/users/2`, userToBeUpdated, { 
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

    it('Should return 400 when an invalid userId is provided in path', async () => {
      // Fixture
      const expected = 'Invalid userId. It must be an integer number';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const userToBeUpdated = {
          name: 'updated', 
          surname: 'updated',
          phoneNumber: '+34666777888'
      }

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
    
      // API Call
      await axios.put(`${host}/api/v1/users/invalid_userId`, userToBeUpdated, { 
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

    it('Should return 400 when trying to update an user without name', async () => {
      // Fixture
      const expected = 'Bad Request: Missing required attributes: name, surname or phone number';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const userToBeUpdated = {
          name: null,
          surname: 'updated',
          phoneNumber: '+34666777888'
      }

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
    
      // API Call
      await axios.put(`${host}/api/v1/users/1`, userToBeUpdated, { 
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

    it('Should return 400 when trying to update an user without surname', async () => {
      // Fixture
      const expected = 'Bad Request: Missing required attributes: name, surname or phone number';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const userToBeUpdated = {
          name: 'updated',
          surname: null,
          phoneNumber: '+34666777888'
      }

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
    
      // API Call
      await axios.put(`${host}/api/v1/users/1`, userToBeUpdated, { 
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

    it('Should return 400 when trying to update a VERIFIED user without phone number', async () => {
      // Fixture
      const expected = 'Bad Request: Missing required attributes: name, surname or phone number';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const userToBeUpdated = {
          name: 'updated',
          surname: 'updated',
          phoneNumber: null
      }

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
    
      // API Call
      await axios.put(`${host}/api/v1/users/1`, userToBeUpdated, { 
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

    it('Should return 400 when trying to update a SUBSCRIBED user without phone number', async () => {
      // Fixture
      const expected = 'Bad Request: Missing required attributes: name, surname or phone number';
      const decodedJwt = { userId: 1, role: 'SUBSCRIBED', email: 'test@test.com' };
      const userToBeUpdated = {
          name: 'updated',
          surname: 'updated',
          phoneNumber: null
      }

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
    
      // API Call
      await axios.put(`${host}/api/v1/users/1`, userToBeUpdated, { 
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

    it('Should update an user giving no phone number and a jpeg avatar', async () => {
      // Fixture
      const expected = 'User updated successfully';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };
      const userToBeUpdated = {
        name: "updated",
        surname: "updated",
        birthDate: "2000-03-30T09:49:30.610Z",
        sex: "MALE",
        idCard: "12345678Z",
        location: "Sevilla",
        avatar: fs.readFileSync(`${__dirname}/../assets/Test.jpeg`, 'base64')
      }
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUniqueUser.withArgs({
        where: {
          id: 1
        },
        include: {
          auth: true
        }
      }).resolves({auth: {role: 'USER'}});
      updateUser.resolves();
      findUniqueImage.resolves();
      updateUser.resolves();
      
      // API Call
      await axios.put(`${host}/api/v1/users/1`, userToBeUpdated, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( res => {
          assert.equal(res.status, 201);
          assert.equal(res.data, expected);
        }).catch( err => {
          assert.fail()
        });
    });

    it('Should return 400 when not finding any user by the userId given', async () => {
      // Fixture
      const expected = 'User not found';
      const decodedJwt = { userId: 1, role: 'ADMIN', email: 'test@test.com' };
      const userToBeUpdated = {
        name: "updated",
        surname: "updated",
        birthDate: "2000-03-30T09:49:30.610Z",
        sex: "MALE",
        idCard: "12345678Z",
        location: "Sevilla",
        avatar: fs.readFileSync(`${__dirname}/../assets/Test.jpeg`, 'base64')
      }
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      const error = new (require('@prisma/client/runtime').PrismaClientKnownRequestError)('User not found', 'P2025');
      findUniqueUser.withArgs({
        where: {
          id: 88
        },
        include: {
          auth: true
        }
      }).rejects(error);
      updateUser.resolves();
      findUniqueImage.resolves();
      updateUser.resolves();
      
      // API Call
      await axios.put(`${host}/api/v1/users/88`, userToBeUpdated, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( res => {
          assert.fail()
        }).catch( err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when trying to update an user with a name length lower than 3 characters', async () => {
      // Fixture
      const expected = 'Bad Request: Name must contain at least 3 characters';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const userToBeUpdated = {
          name: 'up',
          surname: 'updated',
          phoneNumber: '+34666777888'
      }

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
    
      // API Call
      await axios.put(`${host}/api/v1/users/1`, userToBeUpdated, { 
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

    it('Should return 400 when trying to update an user with a surname length lower than 3 characters', async () => {
      // Fixture
      const expected = 'Bad Request: Surname must contain at least 3 characters';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const userToBeUpdated = {
          name: 'updated',
          surname: 'up',
          phoneNumber: '+34666777888'
      }

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
    
      // API Call
      await axios.put(`${host}/api/v1/users/1`, userToBeUpdated, { 
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

    it('Should return 400 when trying to update an user with an invalid date format', async () => {
      // Fixture
      const expected = 'Bad Request: Invalid date format';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const userToBeUpdated = {
          name: 'updated',
          surname: 'updated',
          birthDate: 'updated',
          phoneNumber: '+34666777888'
      }

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
    
      // API Call
      await axios.put(`${host}/api/v1/users/1`, userToBeUpdated, { 
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

    it('Should return 400 when trying to update an user with a birthday date after today', async () => {
      // Fixture
      const expected = 'Bad Request: Birthday date cannot be after today';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const userToBeUpdated = {
          name: 'updated',
          surname: 'updated',
          birthDate: '2030-04-01T16:26:14.912Z',
          phoneNumber: '+34666777888'
      }

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
    
      // API Call
      await axios.put(`${host}/api/v1/users/1`, userToBeUpdated, { 
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

    it('Should return 400 when trying to update an user with an invalid sex', async () => {
      // Fixture
      const expected = 'Bad Request: Invalid sex, must be MALE, FEMALE or OTHER';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const userToBeUpdated = {
          name: 'updated',
          surname: 'updated',
          birthDate: '2000-04-01T16:26:14.912Z',
          sex: 'updated',
          phoneNumber: '+34666777888'
      }

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
    
      // API Call
      await axios.put(`${host}/api/v1/users/1`, userToBeUpdated, { 
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

    it('Should return 400 when trying to update an user with an invalid ID card format', async () => {
      // Fixture
      const expected = 'Bad Request: Invalid ID card format';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const userToBeUpdated = {
          name: 'updated',
          surname: 'updated',
          birthDate: '2000-04-01T16:26:14.912Z',
          sex: 'MALE',
          idCard: 'updated',
          phoneNumber: '+34666777888'
      }

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
    
      // API Call
      await axios.put(`${host}/api/v1/users/1`, userToBeUpdated, { 
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

    it('Should return 400 when trying to update an user with a correct ID format but an incorrect ID card character', async () => {
      // Fixture
      const expected = 'Bad Request: Invalid ID card format';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const userToBeUpdated = {
          name: 'updated',
          surname: 'updated',
          birthDate: '2000-04-01T16:26:14.912Z',
          sex: 'MALE',
          idCard: '12345678A',
          phoneNumber: '+34666777888'
      }

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
    
      // API Call
      await axios.put(`${host}/api/v1/users/1`, userToBeUpdated, { 
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

    it('Should return 400 when trying to update an user with an invalid phone number', async () => {
      // Fixture
      const expected = 'Bad Request: Invalid phone number, must be +34XXXXXXXXX';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const userToBeUpdated = {
          name: 'updated',
          surname: 'updated',
          phoneNumber: 'updated'
      }

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
    
      // API Call
      await axios.put(`${host}/api/v1/users/1`, userToBeUpdated, { 
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

    it('Should return 400 when trying to update an user with an invalid avatar', async () => {
      // Fixture
      const expected = 'Bad Request: Avatar must be jpeg or png';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const userToBeUpdated = {
          name: 'updated',
          surname: 'updated',
          phoneNumber: '+34666777888',
          avatar: fs.readFileSync(`${__dirname}/../assets/Test.gif`, 'base64')
      }

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
    
      // API Call
      await axios.put(`${host}/api/v1/users/1`, userToBeUpdated, { 
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

    it('Should return 400 when trying to update a non-existing user', async () => {
      // Fixture
      const expected = 'User not found';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const userToBeUpdated = {
        name: 'updated',
        surname: 'updated',
        phoneNumber: '+34666777888'
      }
      // Mock Auth and DB Query
      const error = new (require('@prisma/client/runtime').PrismaClientKnownRequestError)('User not found', 'P2025');
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      updateUser.rejects(error);
      
      // API Call
      await axios.put(`${host}/api/v1/users/1`, userToBeUpdated, { 
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

    it('Should return 400 when trying to update an user with name length bigger than 20 characters', async () => {
      // Fixture
      const expected = 'Attributes length exceeded. Name max length is 20. Surname max length is 80. Location max length is 80';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const userToBeUpdated = {
        name: 'updatedupdatedupdatedupdatedupdatedupdatedupdatedupdatedupdatedupdated',
        surname: 'updated',
        phoneNumber: '+34666777888'
      }
      // Mock Auth and DB Query
      const error = new (require('@prisma/client/runtime').PrismaClientKnownRequestError)('Attributes length exceeded. Name max length is 20. Surname max length is 80. Location max length is 80', 'P2000');
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      updateUser.rejects(error);
      
      // API Call
      await axios.put(`${host}/api/v1/users/1`, userToBeUpdated, { 
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

    it('Should return 400 when trying to update an user with a repeated idCard', async () => {
      // Fixture
      const expected = 'idCard must be unique';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };
      const userToBeUpdated = {
        name: 'updated',
        surname: 'updated',
        phoneNumber: '+34666777888',
        idCard: '12345678Z'
      }
      // Mock Auth and DB Query
      const error = new (require('@prisma/client/runtime').PrismaClientKnownRequestError)('idCard must be unique', 'P2002');
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      updateUser.rejects(error);
      
      // API Call
      await axios.put(`${host}/api/v1/users/1`, userToBeUpdated, { 
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
      const userToBeUpdated = {
          name: 'updated',
          surname: 'updated',
          phoneNumber: '+34666777888'
      }
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      updateUser.rejects('Unknown error');
      
      // API Call
      await axios.put(`${host}/api/v1/users/1`, userToBeUpdated, { 
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

    it('Should return 500 when trying to get an user of db', async () => {
      // Fixture
      const expected = 'Server error: Could not get the role of the user.';
      const decodedJwt = { userId: 1, role: 'ADMIN', email: 'test@test.com' };
      const userToBeUpdated = {
        name: "updated",
        surname: "updated",
        birthDate: "2000-03-30T09:49:30.610Z",
        sex: "MALE",
        idCard: "12345678Z",
        location: "Sevilla",
        avatar: fs.readFileSync(`${__dirname}/../assets/Test.jpeg`, 'base64')
      }
      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUniqueUser.withArgs({
        where: {
          id: 1
        },
        include: {
          auth: true
        }
      }).rejects('Unknown error');
      updateUser.resolves();
      findUniqueImage.resolves();
      updateUser.resolves();
      
      // API Call
      await axios.put(`${host}/api/v1/users/1`, userToBeUpdated, { 
          withCredentials: true, 
          headers: {Cookie: 'authToken=testToken;'}
        })
        .then( res => {
          assert.fail()
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
      await axios.put(`${host}/api/v1/users/1`, {}, { 
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

    it('Should delete a rating', async () => {
      // Fixture
      const ratingToBeDeleted = { receiverId: 2, reviewerId: 1 };
      const expected = 'Rating deleted successfully';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };

      // Mock Auth and DB Queries
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUniqueRating.withArgs({
        where: {
          id: 1
        }
      }).resolves(ratingToBeDeleted);
      updateUser.resolves();

      // API Call
      await axios.delete(`${host}/api/v1/ratings/1`, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(res => {
          assert.equal(res.status, 200);
          assert.equal(res.data, expected);
        }).catch(() => assert.fail());
    });

    it('Should return 401 when token is missing', async () => {
      // Fixture
      const expected = 'Unauthorized';

      // API Call
      await axios.delete(`${host}/api/v1/ratings/1`)
        .then(() => {
          assert.fail();
        }).catch(err => {
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
      await axios.delete(`${host}/api/v1/ratings/1`, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 401);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 403 when reviewerID is not equal to userID logged in', async () => {
      // Fixture
      const ratingToBeDeleted = { receiverId: 2, reviewerId: 1 };
      const expected = 'Forbidden';
      const decodedJwt = { userId: 2, role: 'USER', email: 'test@test.com' };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUniqueRating.withArgs({
        where: {
          id: 1
        }
      }).resolves(ratingToBeDeleted);
      // API Call
      await axios.delete(`${host}/api/v1/ratings/1`, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 403);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when no rating has found with the given ID', async () => {
      // Fixture
      const expected = 'No rating records found';
      const decodedJwt = { userId: 1, role: 'USER', email: 'test@test.com' };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUniqueRating.withArgs({
        where: {
          id: 1
        }
      }).resolves();
      // API Call
      await axios.delete(`${host}/api/v1/ratings/1`, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 400 when provided invalid ratingId in path', async () => {
      // Fixture
      const expected = 'Invalid ratingId. It must be an integer number';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };

      // Mock Auth and DB Queries
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);

      // API Call
      await axios.delete(`${host}/api/v1/ratings/sdsdss`, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 500 when prisma delete fails', async () => {
      // Fixture
      const ratingToBeDeleted = { receiverId: 2, reviewerId: 1 };
      const expected = 'Internal Server Error';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };

      // Mock Auth and DB Queries
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUniqueRating.withArgs({
        where: {
          id: 1
        }
      }).resolves(ratingToBeDeleted);
      updateUser.rejects('Unknown error');

      // API Call
      await axios.delete(`${host}/api/v1/ratings/1`, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
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
      await axios.delete(`${host}/api/v1/ratings/1`, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 500);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should delete a space', async () => {
      // Fixture
      const spaceToBeDeleted = { ownerId: 1 };
      const expected = 'Space deleted successfully';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };

      // Mock Auth and DB Queries
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.withArgs({
        where: {
          id: 1
        },
        include: {
          rentals: true
        }
      }).resolves(spaceToBeDeleted);
      updateUser.resolves();

      // API Call
      await axios.delete(`${host}/api/v1/spaces/1`, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(res => {
          assert.equal(res.status, 200);
          assert.equal(res.data, expected);
        }).catch(() => assert.fail());
    });

    it('Should return 401 when token is missing', async () => {
      // Fixture
      const expected = 'Unauthorized';

      // API Call
      await axios.delete(`${host}/api/v1/spaces/1`)
        .then(() => {
          assert.fail();
        }).catch(err => {
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
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
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
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 403);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 403 when someone tries to delete a space with another userId', async () => {
      // Fixture
      const spaceToBeDeleted = { ownerId: 2 };
      const expected = 'Forbidden';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };

      // Mock Auth and DB Query
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.withArgs({
        where: {
          id: 1
        },
        include: {
          rentals: true
        }
      }).resolves(spaceToBeDeleted);

      // API Call
      await axios.delete(`${host}/api/v1/spaces/1`, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
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
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
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
      findUnique.withArgs({
        where: {
          id: 1
        },
        include: {
          rentals: true
        }
      }).resolves(null);

      // API Call
      await axios.delete(`${host}/api/v1/spaces/1`, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('RN09: Should return 400 when trying to delete a space containing rentals', async () => {
      // Fixture
      const spaceToBeDeleted = { ownerId: 1, rentals: [{ id: 1 }] };
      const expected = 'Cannot delete space containing rentals';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };

      // Mock Auth and DB Queries
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.withArgs({
        where: {
          id: 1
        },
        include: {
          rentals: true
        }
      }).resolves(spaceToBeDeleted);

      // API Call
      await axios.delete(`${host}/api/v1/spaces/1`, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 400);
          assert.equal(err.response.data, expected);
        });
    });

    it('Should return 500 when prisma delete fails', async () => {
      // Fixture
      const spaceToBeDeleted = { ownerId: 1 };
      const expected = 'Internal Server Error';
      const decodedJwt = { userId: 1, role: 'VERIFIED', email: 'test@test.com' };

      // Mock Auth and DB Queries
      verify.withArgs('testToken', 'stackingupsecretlocal').returns(decodedJwt);
      findUnique.withArgs({
        where: {
          id: 1
        },
        include: {
          rentals: true
        }
      }).resolves(spaceToBeDeleted);
      updateUser.rejects('Unknown error');

      // API Call
      await axios.delete(`${host}/api/v1/spaces/1`, {
        withCredentials: true,
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
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
        headers: { Cookie: 'authToken=testToken;' }
      })
        .then(() => {
          assert.fail();
        }).catch(err => {
          assert.equal(err.response.status, 500);
          assert.equal(err.response.data, expected);
        });
    });
  });

  describe('GET Image endpoint tests:', () => {
    it('should return avatar image when an userId given', async () => {
        // Fixture
        const dbOutput = {id: 1, image: fs.readFileSync(`${__dirname}/../assets/Test.png`), mimetype: 'image/png'};
        const expected = {image: fs.readFileSync(`${__dirname}/../assets/Test.png`).toString('base64'), mimetype: 'image/png'};
    
        // Mock DB Query
        findUniqueImage.withArgs({
            where:{
                userId: 1
            }
        }).resolves(dbOutput);
    
        // API Call
        await axios.get(`${host}/api/v1/users/1/avatar`).then(res => {
            assert.equal(res.status, 200);
            assert.deepEqual(res.data, expected);
        });
    });

    it('should return 404 when not found image for an userId', async () => {
        // Fixture
        const dbOutput = null;
        const expected = 'No image found for this userdId';
    
        // Mock DB Query
        findUniqueImage.withArgs({
            where:{
            userId: 1
            }
        }).resolves(dbOutput);
    
        // API Call
        await axios.get(`${host}/api/v1/users/1/avatar`).then(res => {
            assert.fail();
        })
        .catch(err => {
            assert.equal(err.response.status, 404);
            assert.equal(err.response.data, expected);
        });
    });
  
    it('should return 400 when trying to get an image with non integer userId', async () => {
    // Fixture
    const expected = 'Invalid userId parameter. It must be an integer number';

    // Mock DB Query
    findUniqueImage.withArgs({
        where:{
        userId: "invalid"
        }
    }).rejects();

    // API Call
    await axios.get(`${host}/api/v1/users/invalid/avatar`).then(res => {
        assert.fail();
    })
    .catch(err => {
        assert.equal(err.response.status, 400);
        assert.equal(err.response.data, expected);
    });
    });
  
    it('should return 500 unexpected error when trying to get an image of an user', async () => {
    // Fixture
    const expected = 'Server error: Could not get user avatar.';

    // Mock DB Query
    findUniqueImage.withArgs({
        where:{
        userId: 1
        }
    }).rejects();

    // API Call
    await axios.get(`${host}/api/v1/users/1/avatar`).then(res => {
        assert.fail();
    })
    .catch(err => {
        assert.equal(err.response.status, 500);
        assert.equal(err.response.data, expected);
    });
    });

    it('should return list of images when an spaceId given', async () => {
        // Fixture
        const dbOutput = [{id: 1, image: fs.readFileSync(`${__dirname}/../assets/Test.png`), mimetype: 'image/png'}];
        const expected = [{image: fs.readFileSync(`${__dirname}/../assets/Test.png`).toString('base64'), mimetype: 'image/png'}];
    
        // Mock DB Query
        findManyImage.withArgs({
            skip: undefined,
            take: undefined,
            where: {
              spaceId: 1
            }
        }).resolves(dbOutput);
    
        // API Call
        await axios.get(`${host}/api/v1/spaces/1/images`).then(res => {
            assert.equal(res.status, 200);
            assert.deepEqual(res.data, expected);
        });
    });

    it('should return 404 when no image found for a spaceId', async () => {
        // Fixture
        const dbOutput = undefined;
        const expected = 'Images not found or non existing space with this Id.';
    
        // Mock DB Query
        findManyImage.withArgs({
            skip: undefined,
            take: undefined,
            where: {
              spaceId: 1
            }
        }).resolves(dbOutput);
    
        // API Call
        await axios.get(`${host}/api/v1/spaces/1/images`).then(res => {
            assert.fail();
        })
        .catch(err => {
            assert.equal(err.response.status, 404);
            assert.equal(err.response.data, expected);
        });
    });

    it('should return 400 when a non integer spaceId given', async () => {
        // Fixture
        const expected = 'Invalid parameter. It must be an integer number';
    
        // Mock DB Query
        findManyImage.withArgs({
            skip: undefined,
            take: undefined,
            where: {
              spaceId: "invalid"
            }
        }).rejects();
    
        // API Call
        await axios.get(`${host}/api/v1/spaces/invalid/images`).then(res => {
            assert.fail();
        })
        .catch(err => {
            assert.equal(err.response.status, 400);
            assert.equal(err.response.data, expected);
        });
    });

    it('should return 500 unexpected error trying to get an image given a spaceId', async () => {
        // Fixture
        const expected = 'Server error: Could not get spaces.';
    
        // Mock DB Query
        findManyImage.withArgs({
            skip: undefined,
            take: undefined,
            where: {
              spaceId: 1
            }
        }).rejects();
    
        // API Call
        await axios.get(`${host}/api/v1/spaces/1/images`).then(res => {
            assert.fail();
        })
        .catch(err => {
            assert.equal(err.response.status, 500);
            assert.equal(err.response.data, expected);
        });
    });

  });
}