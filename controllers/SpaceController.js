'use strict';

const varSpaceController = require('./SpaceControllerService');

module.exports.getSpaces = function getSpaces (req, res, next) {
  varSpaceController.getSpaces(req.swagger.params, res, next);
};

module.exports.getSpace = function getSpace (req, res, next) {
  varSpaceController.getSpace(req.swagger.params, res, next);
};

module.exports.getSpaceRentals = function getSpaceRentals (req, res, next) {
  varSpaceController.getSpaceRentals(req.swagger.params, res, next);
};

module.exports.postSpace = function postSpace (req, res, next) {
  varSpaceController.postSpace(req, res, next);
};
