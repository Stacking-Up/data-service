const assert = require('assert');
const axios = require('axios');
const sinon = require('sinon');
const fs = require('fs');

const host = "http://localhost:4100";

module.exports = (prisma) => {
  let findMany = sinon.stub(prisma.image, 'findMany').rejects("Not implemented");
  let findUnique = sinon.stub(prisma.image, 'findUnique').rejects("Not implemented");

  before(() => {
    sinon.replace(prisma.image, 'findMany', findMany);
    sinon.replace(prisma.image, 'findUnique', findUnique);
  });

  /***************************************************************************
  * RENTAL UNIT TESTS
  ***************************************************************************/
    describe('GET Endpoint tests:', () => {
        it('should return avatar image when an userId given', async () => {
            // Fixture
            const dbOutput = {id: 1, image: fs.readFileSync(`${__dirname}/../assets/Test.png`), mimetype: 'image/png'};
            const expected = {image: fs.readFileSync(`${__dirname}/../assets/Test.png`).toString('base64'), mimetype: 'image/png'};
        
            // Mock DB Query
            findUnique.withArgs({
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
            findUnique.withArgs({
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
        findUnique.withArgs({
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
        findUnique.withArgs({
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
            findMany.withArgs({
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
            findMany.withArgs({
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
            findMany.withArgs({
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
            findMany.withArgs({
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
};