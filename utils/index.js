'use-strict';

const { TagEnum } = require('@prisma/client');

module.exports.checkSpaceValidity = (space) => {
  const errors = [];

  _checkSpaceConstraints(space, errors);
  if (errors.length > 0) return errors;

  _checkSpaceBusinessLogic(space, errors);
  return errors;
};

function _checkSpaceConstraints (space, errors) {
  if (!space.name || !space.description || !space.initialDate || !space.location || !space.dimensions || space.shared === undefined) {
    errors.push('Missing required attributes');
  } else if (space.name.length < 3 || space.name.length > 50) {
    errors.push('Name must be between 2 and 50 characters');
  } else if (new Date(space.initialDate).toString() === 'Invalid Date') {
    errors.push('Initial date must be a Date');
  } else if (space.finalDate && new Date(space.finalDate).toString() === 'Invalid Date') {
    errors.push('Final date must be a Date');
  } else if (!space.location.match(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/)) {
    errors.push('Location must be a valid latitude,longitude pair');
  } else if (!space.dimensions.match(/^\d+(\.\d+)?x\d+(\.\d+)?$/)) {
    errors.push('Dimensions must be a valid width,height pair');
  } else if (space.priceHour && isNaN(space.priceHour)) {
    errors.push('PriceHour must be a number');
  } else if (space.priceDay && isNaN(space.priceDay)) {
    errors.push('PriceDay must be a number');
  } else if (space.priceMonth && isNaN(space.priceMonth)) {
    errors.push('PriceMonth must be a number');
  } else if (typeof (space.shared) !== 'boolean') {
    errors.push('Shared must be true or false');
  } else if (space.tags && !(space.tags instanceof Array)) {
    errors.push('Tags must be an array');
  } else if (space.tags && !space.tags.every(tag => Object.values(TagEnum).includes(tag))) {
    errors.push('Tags must be one of the following: ' + Object.values(TagEnum).join(', '));
  } else if (space.images && !space.images.every(image => image.indexOf('iVBORw0KGgo') === 0 || image.indexOf('/9j/') === 0)) {
    errors.push('Images must be jpeg or png');
  }
  return errors;
}

function _checkSpaceBusinessLogic (space, errors) {
  // RN03
  if ([space.priceHour, space.priceDay, space.priceMonth].every(price => !price)) {
    errors.push('You must defined at least one valid price greater than 0');
  }

  // RN04
  if (space.finalDate && space.finalDate < space.initialDate) {
    errors.push('Final date must be after initial date');
  }
  return errors;
}
