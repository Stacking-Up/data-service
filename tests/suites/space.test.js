const assert = require('assert');
const axios = require('axios');
const sinon = require('sinon');

const host = "http://localhost:4100";

module.exports = (prisma) => {
  let findMany = sinon.stub(prisma.space, 'findMany').rejects("Not implemented");

  before(() => {
    sinon.replace(prisma.space, 'findMany', findMany);
  });

  /***************************************************************************
    * SPACE UNIT TESTS
    ***************************************************************************/

  it('should return spaces that can not be shared', async () => {
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
      dimensions: "1x3", priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
    },
    {
      id: 2, name: "casa", description: "Esto es una casa", initialDate: "1970-01-01T00:00:00.000Z", location: "Sevilla",
      dimensions: "2x4", priceHour: 8, priceMonth: 760, shared: false, ownerId: 1, tags: [{ tag: "DRY" }]
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

  it('should return spaces that can be shared', async () => {
    // Fixture
    const dbOutput = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
    }
    ];

    const expected = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
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

  it('should return spaces which m2 are inside in the given range', async () => {
    // Fixture
    const dbOutput = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
    }
    ];

    const expected = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
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

  it('should return spaces which m2 are greater than minDim parameter', async () => {
    // Fixture
    const dbOutput = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
    }
    ];

    const expected = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
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

  it('should return spaces which m2 are lower than maxDim parameter', async () => {
    // Fixture
    const dbOutput = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
    }
    ];

    const expected = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
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

  it('should return spaces which priceHour are inside in the given range', async () => {
    // Fixture
    const dbOutput = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
    }
    ];

    const expected = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
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

  it('should return spaces which priceHour are greater than minPriceHour parameter', async () => {
    // Fixture
    const dbOutput = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
    }
    ];

    const expected = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
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

  it('should return spaces which priceHour are lower than maxPriceHour parameter', async () => {
    // Fixture
    const dbOutput = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
    }
    ];

    const expected = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
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

  it('should return spaces which priceDay are inside in the given range', async () => {
    // Fixture
    const dbOutput = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
    }
    ];

    const expected = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
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

  it('should return spaces which priceDay are greater than minPriceDay parameter', async () => {
    // Fixture
    const dbOutput = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
    }
    ];

    const expected = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
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

  it('should return spaces which priceDay are lower than maxPriceDay parameter', async () => {
    // Fixture
    const dbOutput = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
    }
    ];

    const expected = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
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

  it('should return spaces which priceMonth are inside in the given range', async () => {
    // Fixture
    const dbOutput = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
    }
    ];

    const expected = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
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

  it('should return spaces which priceMonth are greater than minPriceMonth parameter', async () => {
    // Fixture
    const dbOutput = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
    }
    ];

    const expected = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
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

  it('should return spaces which priceMonth are greater than maxPriceMonth parameter', async () => {
    // Fixture
    const dbOutput = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
    }
    ];

    const expected = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: 56, priceMonth: 456, shared: true, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
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

  it('should return spaces that can not be rented per hours', async () => {
    // Fixture
    const dbOutput = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: null, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
    }
    ];

    const expected = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
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

  it('should return spaces that can be rented per hours', async () => {
    // Fixture
    const dbOutput = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 10, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
    }
    ];

    const expected = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 10, priceDay: 56, priceMonth: 456, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
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

  it('should return spaces that can not be rented per days', async () => {
    // Fixture
    const dbOutput = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: null, priceMonth: 456, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
    }
    ];

    const expected = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceMonth: 456, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
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

  it('should return spaces that can be rented per days', async () => {
    // Fixture
    const dbOutput = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 456, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
    }
    ];

    const expected = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 456, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
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

  it('should return spaces that can not be rented per months', async () => {
    // Fixture
    const dbOutput = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: null, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
    }
    ];

    const expected = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: 55, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
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

  it('should return spaces that can be rented per months', async () => {
    // Fixture
    const dbOutput = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
    }
    ];

    const expected = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
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

  it('should return spaces that contains both selected tags', async () => {
    // Fixture
    const dbOutput = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
    }
    ];

    const expected = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
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

  it('should return spaces that contains selected tags', async () => {
    // Fixture
    const dbOutput = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
    }
    ];

    const expected = [{
      id: 1, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
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

  it('should return empty array of spaces because it does not contains selected tags', async () => {

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

  it('should return spaces sorted by priceHour asc', async () => {
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
      dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
    },
    {
      id: 2, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 8, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
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

  it('should return spaces sorted by priceHour desc', async () => {
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
      dimensions: "1x3", priceHour: 8, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
    },
    {
      id: 2, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
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

  it('should return spaces sorted by priceDay asc', async () => {
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
      dimensions: "1x3", priceHour: 8, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
    },
    {
      id: 2, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: 58, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
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

  it('should return spaces sorted by priceDay desc', async () => {
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
      dimensions: "1x3", priceHour: 8, priceDay: 58, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
    },
    {
      id: 2, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
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

  it('should return spaces sorted by priceMonth asc', async () => {
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
      dimensions: "1x3", priceHour: 8, priceDay: 58, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
    },
    {
      id: 2, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 440, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
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

  it('should return spaces sorted by priceMonth desc', async () => {
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
      dimensions: "1x3", priceHour: 8, priceDay: 58, priceMonth: 440, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
    },
    {
      id: 2, name: "sotano", description: "Esto es un sotano", initialDate: "1970-01-01T00:00:00.000Z", finalDate: "2023-01-01T00:00:00.000Z", location: "Cadiz",
      dimensions: "1x3", priceHour: 5, priceDay: 55, priceMonth: 430, shared: false, ownerId: 1, "tags": [{ tag: "GARAGE" }, { tag: "DRY" }]
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
}