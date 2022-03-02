'use strict';

const varRentalController = require('./RentalControllerService');

module.exports.getRentals = function getRentals (req, res, next) {
  varRentalController.getRentals(req.swagger.params, res, next);
};

module.exports.getRental = function getRental (req, res, next) {
  varRentalController.getRental(req.swagger.params, res, next);
};
