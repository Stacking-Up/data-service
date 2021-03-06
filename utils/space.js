'use-strict';

const { default: axios } = require('axios');
const { TagEnum } = require('@prisma/client');

module.exports.getMeters = (obj) => {
  const splitted = obj.split('x');
  return parseFloat(splitted[0]) * parseFloat(splitted[1]);
};

module.exports.parseTags = (value) => {
  const tags = value.split(',');
  return tags;
};

module.exports.tagsToArray = (object) => {
  const res = [];
  if (object !== undefined) {
    object.map(x => res.push(x.tag));
  }

  return res;
};

module.exports.includesTags = (selectedTags, spaceTags) => {
  const enumTags = Object.values(require('@prisma/client').TagEnum);
  let res = true;
  if (selectedTags.length !== 0) {
    res = selectedTags.every(tag => enumTags.includes(tag) && spaceTags.includes(tag));
  }

  return res;
};

module.exports.inRange = (min, max, value) => {
  let res;
  if (value === null && min === 0 && max === Number.MAX_VALUE) {
    res = true;
  } else if (value === null && (min !== 0 || max !== Number.MAX_VALUE)) {
    res = false;
  } else {
    res = parseFloat(min) <= value && value <= parseFloat(max);
  }
  return res;
};

module.exports.isRentedPer = (value, price) => {
  let res = true;

  if (value === true && price === null) {
    res = false;
  } else if (value === false && price !== null) {
    res = false;
  }
  return res;
};

module.exports.checkSpaceValidity = (space) => {
  const errors = [];

  _checkSpaceConstraints(space, errors);
  if (errors.length > 0) return errors;

  _checkSpaceBusinessLogic(space, errors);
  return errors;
};

function _checkSpaceConstraints (space, errors) {
  if (!space.priceHour) {
    console.warn('Space priceHour not defined, start and end hour will be ignored');
    space.startHour = null;
    space.endHour = null;
  }

  if (space.startHour) {
    space.startHour = new Date(space.startHour);
    if (space.startHour.toString() === 'Invalid Date') {
      errors.push('Start hour must be a valid Time');
      return errors;
    } else {
      space.startHour.setFullYear(1970, 0, 1);
    }
  }

  if (space.endHour) {
    space.endHour = new Date(space.endHour);
    if (space.endHour.toString() === 'Invalid Date') {
      errors.push('End hour must be a valid Time');
      return errors;
    } else {
      space.endHour.setFullYear(1970, 0, 1);
    }
  }

  if (!space.name || !space.description || !space.initialDate || !space.location || !space.dimensions || !space.city || !space.province || !space.country || space.shared === undefined) {
    errors.push('Missing required attributes');
  } else if (space.name.length < 3 || space.name.length > 50) {
    errors.push('Name must be between 2 and 50 characters');
  } else if (new Date(space.initialDate).toString() === 'Invalid Date' || new Date(space.initialDate) < new Date()) {
    errors.push('Initial date must be a Date after today');
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
  if ([space.priceHour, space.priceDay, space.priceMonth].every(price => !price || price < 1)) {
    errors.push('You must defined at least one valid price greater than 1');
  }

  // RN04
  if (space.finalDate && new Date(space.finalDate) < new Date(space.initialDate)) {
    errors.push('Final date must be after initial date');
  }

  // RN10
  if (space.priceHour && (!space.startHour || !space.endHour)) {
    errors.push('You must defined all the required fields to rent per hour');
  }

  // RN09
  if (space.startHour && space.endHour && (space.endHour.getTime() - space.startHour.getTime()) < 60 * 60 * 1000) {
    errors.push('Space must be available between hours of the same day or at least with a difference of one hour');
  }

  return errors;
}

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

module.exports.getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
};

const mapBoxSearch = async (searchPlace, dimensions) => {
  let resBool = false;
  const [latitudDB, longitudDB] = dimensions.split(',');
  resBool = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${searchPlace}.json?access_token=${process.env.MAPBOX_API_KEY}&country=es&limit=1`)
    .then(res => {
      const latitudSearch = res.data.features[0].geometry.coordinates[1];
      const longitudSearch = res.data.features[0].geometry.coordinates[0];
      const euclideanDistance = this.getDistanceFromLatLonInKm(latitudSearch, longitudSearch, latitudDB, longitudDB);
      const resMap = euclideanDistance <= 15.0;
      return resMap;
    }).catch(err => {
      console.error(err);
    });
  return resBool;
};

const parseField = (field, searchValue) => {
  const values = field.split(/\s+/).map(value => value.length > 3 && value.toLowerCase());
  const res = values.includes(searchValue.toLowerCase());
  return res;
};

module.exports.fieldSearch = async (title, description, location, ciudad, provincia, pais, query) => {
  let res = true;
  if (query !== undefined) {
    const values = query.split(/\s+/);
    const mapQuery = await mapBoxSearch(values, location);
    res = values.some(value => parseField(title, value) || parseField(description, value) || parseField(ciudad, value) || parseField(provincia, value) || parseField(pais, value)) || mapQuery;
  }

  return res;
};

module.exports.spaceFilter = async (arr, predicate) => {
  const results = await Promise.all(arr.map(predicate));
  return arr.filter((_v, index) => results[index]);
};
module.exports.mediaRatings = (ratings) => {
  return ratings.length !== 0 ? ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length : 0;
};
