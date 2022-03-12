'use strict';

const utils = require('../utils');
const prisma = require('../prisma');

module.exports.getSpaces = function getSpaces (req, res, next) {
  prisma.space.findMany({
    skip: req.offset.value,
    take: req.limit.value
  })
    .then(spaces => {
      res.send(spaces.map(space => utils.excludeNulls(space)));
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Server error: Could not get spaces.');
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
