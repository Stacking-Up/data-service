'use strict';

const jwt = require('jsonwebtoken');
const utils = require('../utils');
const prisma = require('../prisma');
const fs = require('fs');
const { Prisma } = require('@prisma/client');
const path = require('path');

module.exports.getSpaces = async function getSpaces (req, res, next) {
  // Get tags selected for tag filtering
  const tagsFilter = req.tag.value !== undefined ? utils.space.parseTags(req.tag.value) : [];

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
  if (req.orderBy.value?.match(/(?:price(?:Hour|Day|Month)|initialDate|publishDate)-(?:asc|desc)/)) {
    const [key, value] = req.orderBy.value.split('-');
    sort[key] = value;
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
      tags: true,
      images: true,
      owner: {
        select: {
          id: true,
          ratings: { select: { receiverId: true, rating: true } }
        }
      }
    },
    orderBy: sort
  })
    .then(spaces => {
      utils.space.spaceFilter(spaces, async (space) => {
        const inRangeDimension = utils.space.inRange(minDimension, maxDimension, utils.space.getMeters(space.dimensions));
        const fieldSearch = await utils.space.fieldSearch(space.name, space.description, space.location, space.city, space.province, space.country, req.search.value);
        const includeTags = utils.space.includesTags(tagsFilter, utils.space.tagsToArray(space.tags));
        const inRangePriceHour = utils.space.inRange(minPriceHour, maxPriceHour, space.priceHour);
        const inRangePriceDay = utils.space.inRange(minPriceDay, maxPriceDay, space.priceDay);
        const inRangePriceMonth = utils.space.inRange(minPriceMonth, maxPriceMonth, space.priceMonth);
        const isRentPerHour = utils.space.isRentedPer(req.isRentPerHour.value, space.priceHour);
        const isRentedPerDay = utils.space.isRentedPer(req.isRentPerDay.value, space.priceDay);
        const isRentedPerMonth = utils.space.isRentedPer(req.isRentPerMonth.value, space.priceMonth);

        return inRangeDimension && fieldSearch && includeTags && inRangePriceHour && inRangePriceDay && inRangePriceMonth && isRentPerHour && isRentedPerDay && isRentedPerMonth;
      }).then(spacesFiltered => {
        const spacesNotSorted = spacesFiltered.map(space => utils.commons.notNulls(space));
        if (req.orderByRatings.value) {
          const sortingPerRatings = req.orderByRatings.value.toLowerCase() === 'asc'
            ? (a, b) => utils.space.mediaRatings(a.owner.ratings) - utils.space.mediaRatings(b.owner.ratings)
            : (a, b) => utils.space.mediaRatings(b.owner.ratings) - utils.space.mediaRatings(a.owner.ratings);
          spacesNotSorted.sort(sortingPerRatings);
        }
        if (req.orderByLocation.value) {
          const [userLatitude, userLongitude] = req.orderByLocation.value.split(',');
          const sortingPerLocations = (a, b) => utils.space.getDistanceFromLatLonInKm(parseFloat(userLatitude), parseFloat(userLongitude), parseFloat(a.location.split(',')[0]), parseFloat(a.location.split(',')[1])) -
            utils.space.getDistanceFromLatLonInKm(parseFloat(userLatitude), parseFloat(userLongitude), parseFloat(b.location.split(',')[0]), parseFloat(b.location.split(',')[1]));
          spacesNotSorted.sort(sortingPerLocations);
        }
        res.send(spacesNotSorted.reduce((acc, space) => {
          if (space.startHour) space.startHour = space.startHour.getTime();
          if (space.endHour) space.endHour = space.endHour.getTime();
          space.tags = space.tags?.map(tag => tag.tag);
          space.images = (space.images && space.images.length !== 0) ? [{ image: space.images[0].image.toString('base64'), mimetype: space.images[0].mimetype }] : [];
          return [...acc, space];
        }, []));
      });
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
    },
    include: {
      tags: true
    }
  })
    .then(space => {
      if (!space) {
        res.status(404).send('Space not found');
      } else {
        space.startHour = space.startHour?.getTime();
        space.endHour = space.endHour?.getTime();
        res.send(utils.commons.excludeNulls(space));
      }
    })
    .catch(err => {
      if (!req.spaceId.value || !req.spaceId.value.toString().match(/^\d+$/)) {
        res.status(400).send('Invalid parameter. It must be an integer number');
      } else {
        console.error(err);
        res.status(500).send('Server error: Could not get space');
      }
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
      if (!rentals || rentals.length === 0) {
        res.status(404).send('Rentals not found');
      } else {
        res.send(rentals.map(rental => utils.commons.excludeNulls(rental)));
      }
    })
    .catch(err => {
      if ([req.spaceId.value, req.offset.value, req.limit.value].some(s => s && !s.toString().match(/^\d+$/))) {
        res.status(400).send('Invalid parameter. It must be an integer number');
      } else {
        console.error(err);
        res.status(500).send('Server error: Could not get rentals.');
      }
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

      const errors = utils.space.checkSpaceValidity(spaceToBePublished);
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
          startHour: spaceToBePublished.startHour ? spaceToBePublished.startHour : null,
          endHour: spaceToBePublished.endHour ? spaceToBePublished.endHour : null,
          publishDate: new Date(),
          location: spaceToBePublished.location,
          city: spaceToBePublished.city,
          province: spaceToBePublished.province,
          country: spaceToBePublished.country,
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

      if (decoded.role === 'USER' || (decoded.role !== 'ADMIN' && parseInt(decoded.userId) !== parseInt(spaceToBeUpdated.ownerId))) {
        res.status(403).send('Forbidden');
        return;
      }

      if (!spaceId || !spaceId.toString().match(/^\d+$/)) {
        res.status(400).send('Invalid spaceId. It must be an integer number');
        return;
      }

      const errors = utils.space.checkSpaceValidity(spaceToBeUpdated);
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
          startHour: spaceToBeUpdated.startHour ? spaceToBeUpdated.startHour : null,
          endHour: spaceToBeUpdated.endHour ? spaceToBeUpdated.endHour : null,
          publishDate: new Date(),
          location: spaceToBeUpdated.location,
          city: spaceToBeUpdated.city,
          province: spaceToBeUpdated.province,
          country: spaceToBeUpdated.country,
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

      if (!spaceId || !spaceId.toString().match(/^\d+$/)) {
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
        if (decoded.role === 'USER' || (decoded.role !== 'ADMIN' && parseInt(decoded.userId) !== parseInt(space.ownerId))) {
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
        res.send(images.map(img => {
          return { image: img.image.toString('base64'), mimetype: img.mimetype };
        }));
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
};

module.exports.postSpaceRental = async function postSpaceRental (req, res, next) {
  const authToken = req.cookies?.authToken;
  const spaceId = req.swagger.params.spaceId.value;
  const rentalToBeCreated = req.swagger.params.body.value;

  // RN001
  if (authToken) {
    try {
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET || 'stackingupsecretlocal');

      if (!rentalToBeCreated.renterId || !rentalToBeCreated.renterId.toString().match(/^\d+$/)) {
        res.status(400).send('Invalid renterId. It must be an integer number');
        return;
      }

      if (!rentalToBeCreated.spaceId || !rentalToBeCreated.spaceId.toString().match(/^\d+$/)) {
        res.status(400).send('Invalid spaceId. It must be an integer number');
        return;
      }

      if (!spaceId || !spaceId.toString().match(/^\d+$/)) {
        res.status(400).send('Invalid spaceId parameter. It must be an integer number');
        return;
      }

      if (parseInt(decoded.userId) !== parseInt(rentalToBeCreated.renterId)) {
        res.status(403).send('Cannot rent space in name of another user');
        return;
      }

      if (parseInt(spaceId) !== parseInt(rentalToBeCreated.spaceId)) {
        res.status(400).send('Invalid spaceId. spaceId parameter and spaceId rental value must be the same');
        return;
      }

      const spaceToAddRental = await prisma.space.findUnique({
        where: {
          id: parseInt(spaceId)
        },
        include: {
          rentals: true
        }
      });

      if (!spaceToAddRental) {
        res.status(400).send('No space found with this Id');
        return;
      }

      if (spaceToAddRental.finalDate && spaceToAddRental.finalDate <= new Date()) {
        res.status(400).send('Space cannot be rented after its final date');
        return;
      }

      if (parseInt(decoded.userId) === parseInt(spaceToAddRental.ownerId)) {
        res.status(400).send('Cannot rent your own space');
        return;
      }

      if (spaceToAddRental.rentals && spaceToAddRental.rentals.length > 0 && spaceToAddRental.rentals.some(rental => parseInt(rental.renterId) === parseInt(decoded.userId))) {
        res.status(400).send('Cannot rent space twice. Please update or delete your previous rental of this space');
        return;
      }
      const errors = utils.rental.checkRentalValidity(rentalToBeCreated, spaceToAddRental);
      if (errors.length > 0) {
        res.status(400).send(`Bad Request: ${errors[0]}`);
        return;
      }

      const costes = utils.rental.calculateCost(rentalToBeCreated, spaceToAddRental);
      rentalToBeCreated.cost = costes;

      const rentalToken = jwt.sign(rentalToBeCreated, process.env.JWT_SECRET || 'stackingupsecretlocal', {
        expiresIn: '24h'
      });

      return res.status(200).send(rentalToken.toString());
    } catch (err) {
      if (err instanceof jwt.JsonWebTokenError) {
        res.status(401).send(`Unauthorized: ${err.message}`);
      } else {
        res.status(500).send('Internal Server Error');
      }
    }
  } else {
    res.status(401).send('Unauthorized');
  }
};

module.exports.postSpaceRentalVerify = async function postSpaceRentalVerify (req, res, next) {
  const authToken = req.cookies?.authToken;
  const rentalToken = req.swagger.params.body.value.rentalToken;

  // RN001
  if (authToken && rentalToken) {
    try {
      jwt.verify(authToken, process.env.JWT_SECRET || 'stackingupsecretlocal');
      const rentalToBeCreated = jwt.verify(rentalToken, process.env.JWT_SECRET || 'stackingupsecretlocal');

      /* istanbul ignore next */
      if (!fs.existsSync(path.join(__dirname, '/../storedData/rentalTokens.txt'))) {
        /* istanbul ignore next */
        if (!fs.existsSync(path.join(__dirname, '/../storedData'))) {
          fs.mkdirSync(path.join(__dirname, '/../storedData'), { recursive: true });
        }
        /* istanbul ignore next */
        fs.writeFileSync(path.join(__dirname, '/../storedData/rentalTokens.txt'), '', { flag: 'w' });
      }

      const rentalTokensTxt = fs.readFileSync(path.join(__dirname, '/../storedData/rentalTokens.txt')).toString();
      const rentalTokens = rentalTokensTxt.split('\n');

      for (let i = 0; i < rentalTokens.length; i++) {
        if (rentalTokens[i] === rentalToken) {
          res.status(400).send('Rental token already used');
          return;
        }
      }
      fs.writeFileSync(path.join(__dirname, '/../storedData/rentalTokens.txt'), rentalToken.toString() + '\n', { flag: 'a' });

      await prisma.rental.create({
        data: {
          initialDate: new Date(rentalToBeCreated.initialDate),
          finalDate: new Date(rentalToBeCreated.finalDate),
          cost: rentalToBeCreated.cost,
          type: rentalToBeCreated.type,
          meters: parseFloat(rentalToBeCreated.meters),
          space: {
            connect: {
              id: parseInt(rentalToBeCreated.spaceId)
            }
          },
          renter: {
            connect: {
              id: parseInt(rentalToBeCreated.renterId)
            }
          }
        }
      }).then((rentalCreated) => {
        res.status(201).send({ rentalId: rentalCreated.id });
      }).catch((err) => {
        console.error(err);
        res.status(500).send('Internal Server Error');
      });
    } catch (err) {
      if (err instanceof jwt.JsonWebTokenError) {
        res.status(401).send(`Token error: ${err.message}`);
      } else {
        res.status(500).send('Internal Server Error');
      }
    }
  } else {
    res.status(401).send('Unauthorized or missing rental token');
  }
};
