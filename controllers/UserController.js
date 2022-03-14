'use strict';

const varUserController = require('./UserControllerService');

module.exports.getUsers = function getUsers (req, res, next) {
  varUserController.getUsers(req.swagger.params, res, next);
};

module.exports.getUser = function getUser (req, res, next) {
  varUserController.getUser(req.swagger.params, res, next);
};

module.exports.getUserItems = function getUserItems (req, res, next) {
  varUserController.getUserItems(req.swagger.params, res, next);
};

module.exports.getUserItem = function getUserItem (req, res, next) {
  varUserController.getUserItem(req.swagger.params, res, next);
};

module.exports.getUserRatings = function getUserRatings (req, res, next) {
  varUserController.getUserRatings(req.swagger.params, res, next);
};

module.exports.getUserRating = function getUserRating (req, res, next) {
  varUserController.getUserRating(req.swagger.params, res, next);
};

module.exports.getUserSpaces = function getUserSpaces (req, res, next) {
  varUserController.getUserSpaces(req.swagger.params, res, next);
};

module.exports.getUserSpace = function getUserSpace (req, res, next) {
  varUserController.getUserSpace(req.swagger.params, res, next);
};

module.exports.getUserRentals = function getUserRentals (req, res, next) {
  varUserController.getUserRentals(req.swagger.params, res, next);
};

module.exports.getUserRental = function getUserRental (req, res, next) {
  varUserController.getUserRental(req.swagger.params, res, next);
};

module.exports.getUserAvatar = function getUserAvatar (req, res, next) {
  varUserController.getUserAvatar(req.swagger.params, res, next);
};
