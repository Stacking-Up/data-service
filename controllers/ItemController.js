'use strict';

const varItemController = require('./ItemControllerService');

module.exports.getItemsTypes = function getItemsTypes (req, res, next) {
  varItemController.getItemsTypes(req.swagger.params, res, next);
};

module.exports.getItemsDimensions = function getItemsDimensions (req, res, next) {
  varItemController.getItemsDimensions(req.swagger.params, res, next);
};

module.exports.postItems = function postItems (req, res, next) {
  varItemController.postItems(req, res, next);
};