'use strict';

const utils = require('../utils');
const prisma = require('../prisma');

module.exports.getRentals = function getRentals (req, res, next) {
  prisma.rental.findMany({})
    .then(rentals => {
      res.send(rentals.map(rental =>utils.excludeNulls(rental)));
    })
    .catch(err =>{
      console.error(err);
      re.status(500).send("Server error: Could not get rentals.")
    });
};

module.exports.getRental = function getRental (req, res, next) {
  res.send({
    message: 'This is the mockup controller for getRental'
  });
};
