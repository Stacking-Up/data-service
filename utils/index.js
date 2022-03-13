'use-strict';

module.exports.notNulls = (obj) => {
  const res = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (obj[key] !== null) res[key] = value;
  });
  return res;
};

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
  const enumTags = Object.values(require("@prisma/client").TagEnum);
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
