'use strict';

const jwt = require('jsonwebtoken');
const utils = require('../utils');
const prisma = require('../prisma');
const { Prisma } = require('@prisma/client');

module.exports.getSpaces = async function getSpaces (req, res, next) {
  // Get tags selected for tag filtering
  const tagsFilter = req.tag.value !== undefined ? utils.parseTags(req.tag.value) : [];

  // Get max and min values for dimensions filtering
  const minDimension = req.minDim.value || 0;
  const maxDimension = req.maxDim.value || Number.MAX_VALUE;

  // Get max and min values for priceHour filtering
  const minPriceHour = req.minPriceHour.value || 0;
  const maxPriceHour = req.maxPriceHour.value || Number.MAX_VALUE;

  // Get max and min values for priceDay filtering
  const minPriceDay = req.minPriceDay.value || 0;
  const maxPriceDay = req.maxPriceDay.value || Number.MAX_VALUE;

  // Get max and min values for priceMonth filtering
  const minPriceMonth = req.minPriceMonth.value || 0;
  const maxPriceMonth = req.maxPriceMonth.value || Number.MAX_VALUE;

  const sort = {};
  if (req.orderBy.value?.match(/(?:price(?:Hour|Day|Month)|initialDate)-(?:asc|desc)/)) {
    const [key, value] = req.orderBy.value.split('-');
    sort[key] = value || 'desc';
  }

  const actualDate = new Date();
  actualDate.setMilliseconds(0);
  await prisma.space.findMany({
    take: req.limit.value,
    skip: req.offset.value,
    where: {
      AND: [
        { shared: { equals: req.shared.value } },
        {
          OR: [
            { finalDate: { gte: actualDate } },
            { finalDate: { equals: null } }
          ]
        }
      ]
    },
    include: {
      tags: true
    },
    orderBy: sort
  })
    .then(spaces => {
      res.send(spaces.filter(space =>
        utils.inRange(minDimension, maxDimension, utils.getMeters(space.dimensions)) &&
        utils.includesTags(tagsFilter, utils.tagsToArray(space.tags)) &&
        utils.inRange(minPriceHour, maxPriceHour, space.priceHour) &&
        utils.inRange(minPriceDay, maxPriceDay, space.priceDay) &&
        utils.inRange(minPriceMonth, maxPriceMonth, space.priceMonth) &&
        utils.isRentedPer(req.isRentPerHour.value, space.priceHour) &&
        utils.isRentedPer(req.isRentPerDay.value, space.priceDay) &&
        utils.isRentedPer(req.isRentPerMonth.value, space.priceMonth)
      ).map(space => utils.notNulls(space)));
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Server error: Could not get spaces');
    });
};

module.exports.getSpace = function getSpace (req, res, next) {
  prisma.space.findUnique({
    where: {
      id: parseInt(req.spaceId.value)
    }
  })
    .then(space => {
      if (!space) { res.status(404).send('Space not found'); } else { res.send(utils.excludeNulls(space)); }
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Server error: Could not get spaces.');
    });
};

module.exports.getSpaceRentals = function getSpaceRentals (req, res, next) {
  prisma.rental.findMany({
    skip: req.offset.value,
    take: req.limit.value,
    where: {
      spaceId: parseInt(req.spaceId.value)
    }
  })

    .then(rentals => {
      if (!rentals) { res.status(404).send('Rentals not found'); } else if (rentals.length === 0) { res.status(404).send('Rentals not found or non existing space with this Id.'); } else { res.send(rentals.map(rental => utils.excludeNulls(rental))); }
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Server error: Could not get rentals.');
    });
};

module.exports.postSpace = async function postSpace (req, res, next) {
  const authToken = req.cookies?.authToken;
  const spaceToBePublished = req.swagger.params.body.value;

  if (authToken) {
    try {
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET || 'stackingupsecretlocal');
      if (!spaceToBePublished.ownerId) {
        res.status(400).send('Missing required attributes');
        return;
      }

      if (decoded.role === 'USER' || parseInt(decoded.userId) !== parseInt(spaceToBePublished.ownerId)) {
        res.status(403).send('Forbidden');
        return;
      }

      const errors = utils.checkSpaceValidity(spaceToBePublished);
      if (errors.length > 0) {
        res.status(400).send(`Bad Request: ${errors[0]}`);
        return;
      }

      await prisma.space.create({
        data: {
          name: spaceToBePublished.name,
          description: spaceToBePublished.description,
          initialDate: new Date(spaceToBePublished.initialDate),
          finalDate: spaceToBePublished.finalDate ? new Date(spaceToBePublished.finalDate) : null,
          location: spaceToBePublished.location,
          dimensions: spaceToBePublished.dimensions,
          priceHour: parseFloat(spaceToBePublished.priceHour),
          priceDay: parseFloat(spaceToBePublished.priceDay),
          priceMonth: parseFloat(spaceToBePublished.priceMonth),
          shared: spaceToBePublished.shared,
          owner: {
            connect: {
              id: parseInt(spaceToBePublished.ownerId)
            }
          },
          tags: {
            connectOrCreate: spaceToBePublished.tags?.map(tag => {
              return {
                where: { tag: String(tag) },
                create: { tag: String(tag) }
              };
            })
          },
          images: {
            create: spaceToBePublished.images?.map(base64 => {
              return { image: Buffer.from(base64, 'base64'), mimetype: base64.indexOf('/9j/') === 0 ? 'image/jpeg' : 'image/png' };
            })
          }
        }
      }).then(() => {
        res.status(201).send('Space created successfully');
      }).catch((err) => {
        console.error(err);
        res.status(500).send('Internal Server Error');
      });
    } catch (err) {
      if (err instanceof jwt.JsonWebTokenError) {
        res.status(401).send(`Unauthorized: ${err.message}`);
      } else {
        console.error(err);
        res.status(500).send('Internal Server Error');
      }
    }
  } else {
    res.status(401).send('Unauthorized');
  }
};

module.exports.putSpace = async function putSpace (req, res, next) {
  const authToken = req.cookies?.authToken;
  const spaceId = req.swagger.params.spaceId.value;
  const spaceToBeUpdated = req.swagger.params.body.value;

  if (authToken) {
    try {
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET || 'stackingupsecretlocal');
      if (!spaceToBeUpdated.ownerId) {
        res.status(400).send('Missing required attributes');
        return;
      }

      if (decoded.role === 'USER' || parseInt(decoded.userId) !== parseInt(spaceToBeUpdated.ownerId)) {
        res.status(403).send('Forbidden');
        return;
      }

      if (!spaceId.match(/^\d+$/)) {
        res.status(400).send('Invalid spaceId. It must be an integer number');
        return;
      }

      const errors = utils.checkSpaceValidity(spaceToBeUpdated);
      if (errors.length > 0) {
        res.status(400).send(`Bad Request: ${errors[0]}`);
        return;
      }

      await prisma.space.update({
        where: {
          id: parseInt(spaceId)
        },
        data: {
          name: spaceToBeUpdated.name,
          description: spaceToBeUpdated.description,
          initialDate: new Date(spaceToBeUpdated.initialDate),
          finalDate: spaceToBeUpdated.finalDate ? new Date(spaceToBeUpdated.finalDate) : null,
          location: spaceToBeUpdated.location,
          dimensions: spaceToBeUpdated.dimensions,
          priceHour: parseFloat(spaceToBeUpdated.priceHour),
          priceDay: parseFloat(spaceToBeUpdated.priceDay),
          priceMonth: parseFloat(spaceToBeUpdated.priceMonth),
          shared: spaceToBeUpdated.shared,
          owner: {
            connect: {
              id: parseInt(spaceToBeUpdated.ownerId)
            }
          },
          tags: {
            set: [],
            connectOrCreate: spaceToBeUpdated.tags?.map(tag => {
              return {
                where: { tag: String(tag) },
                create: { tag: String(tag) }
              };
            })
          },
          images: {
            deleteMany: {},
            create: spaceToBeUpdated.images?.map(base64 => {
              return { image: Buffer.from(base64, 'base64'), mimetype: base64.indexOf('/9j/') === 0 ? 'image/jpeg' : 'image/png' };
            })
          }
        }
      }).then(() => {
        res.status(201).send('Space updated successfully');
      }).catch((err) => {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
          res.status(400).send('No space records found');
        } else {
          console.error(err);
          res.status(500).send('Internal Server Error');
        }
      });
    } catch (err) {
      if (err instanceof jwt.JsonWebTokenError) {
        res.status(401).send(`Unauthorized: ${err.message}`);
      } else {
        console.error(err);
        res.status(500).send('Internal Server Error');
      }
    }
  } else {
    res.status(401).send('Unauthorized');
  }
};

module.exports.deleteSpace = async function deleteSpace (req, res, next) {
  const authToken = req.cookies?.authToken;
  const spaceId = req.swagger.params.spaceId.value;

  if (authToken) {
    try {
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET || 'stackingupsecretlocal');

      if (!spaceId.match(/^\d+$/)) {
        res.status(400).send('Invalid spaceId. It must be an integer number');
        return;
      }

      const space = await prisma.space.findUnique({
        where: {
          id: parseInt(spaceId)
        },
        include: {
          rentals: true
        }
      });

      if (space) {
        if (decoded.role === 'USER' || parseInt(decoded.userId) !== parseInt(space.ownerId)) {
          res.status(403).send('Forbidden');
          return;
        }
        // Check RN09
        if (space.rentals && space.rentals.length > 0) {
          res.status(400).send('Cannot delete space containing rentals');
          return;
        }
      } else {
        res.status(400).send('No space records found');
        return;
      }

      await prisma.user.update({
        where: {
          id: parseInt(space.ownerId)
        },
        data: {
          spaces: {
            delete: {
              id: parseInt(spaceId)
            }
          }
        }
      }).then(() => {
        res.status(200).send('Space deleted successfully');
      }).catch((err) => {
        console.error(err);
        res.status(500).send('Internal Server Error');
      });
    } catch (err) {
      if (err instanceof jwt.JsonWebTokenError) {
        res.status(401).send(`Unauthorized: ${err.message}`);
      } else {
        console.error(err);
        res.status(500).send('Internal Server Error');
      }
    }
  } else {
    res.status(401).send('Unauthorized');
  }
};

module.exports.getSpaceImages = async function getSpaceImages (req, res, next) {
  await prisma.image.findMany({
    skip: req.offset.value,
    take: req.limit.value,
    where: {
      spaceId: req.spaceId.value
    }
  })
    .then(images => {
      if (!images || images.length === 0) { 
        res.status(404).send('Images not found or non existing space with this Id.'); 
      } else { 
        res.send(images.map(img => img.image.toString('base64'))); 
      }
    })
    .catch(err => {
      if ([req.spaceId.value, req.offset.value, req.limit.value].some(s => s && !s.toString().match(/^\d+$/))) {
        res.status(400).send('Invalid parameter. It must be an integer number');
      } else {
        console.error(err);
        res.status(500).send('Server error: Could not get spaces.');
      }
    });
}
