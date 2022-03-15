'use strict';

const utils = require('../utils');
const prisma = require('../prisma');

module.exports.getRentals = function getRentals (req, res, next) {
  prisma.rental.findMany({
    skip: req.offset.value,
    take: req.limit.value
  })
    .then(rentals => {
      res.send(rentals.map(rental => utils.excludeNulls(rental)));
    })
    .catch(err => {
      if ([req.offset.value, req.limit.value].some(s => s && !s.toString().match(/^\d+$/))) {
        res.status(400).send('Invalid parameter. It must be an integer number');
      } else {
        console.error(err);
        res.status(500).send('Server error: Could not get rentals.');
      }
    });
};

module.exports.getRental = function getRental (req, res, next) {
  prisma.rental.findUnique({
    where: {
      id: parseInt(req.rentalId.value)
    }
  })
    .then(rental => {
      if (!rental) {
        res.status(404).send('Rental not found');
      } else {
        res.send(utils.excludeNulls(rental));
      }
    })
    .catch(err => {
      if (!req.rentalId.value || !req.rentalId.value.toString().match(/^\d+$/)) {
        res.status(400).send('Invalid rentalId. It must be an integer number');
      } else {
        console.error(err);
        res.status(500).send('Server error: Could not get rentals.');
      }
    });
};
