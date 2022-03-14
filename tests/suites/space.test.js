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
  describe('POST Endpoint tests:', () => {
    it('Should post an space', async () => {
    // Fixture
    const expected = 'Space created successfully';
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