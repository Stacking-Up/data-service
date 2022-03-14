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

module.exports.putSpace = function putSpace (req, res, next) {
  varSpaceController.putSpace(req, res, next);
};

module.exports.deleteSpace = function deleteSpace (req, res, next) {
  varSpaceController.deleteSpace(req, res, next);
};

module.exports.getSpaceImages = function getSpaceImages (req, res, next) {
  varSpaceController.getSpaceImages(req.swagger.params, res, next);
};
