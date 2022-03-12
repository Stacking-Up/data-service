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
      console.error(err);
      res.status(500).send('Server error: Could not get rentals.');
    });
};

module.exports.getRental = function getRental (req, res, next) {
  prisma.rental.findUnique({
    where: {
      id: parseInt(req.rentalId.value)
    }
  })
    .then(rental => {
      if (!rental) { res.status(404).send('Rental not found'); } else { res.send(utils.excludeNulls(rental)); }
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Server error: Could not get rentals.');
    });
};
