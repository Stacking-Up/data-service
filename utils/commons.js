'use-strict';

module.exports.excludeNulls = (obj) => {
  const res = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (obj[key] || typeof (obj[key]) === 'boolean') res[key] = value;
  });
  return res;
};

module.exports.notNulls = (obj) => {
  const res = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (obj[key] !== null) res[key] = value;
  });
  return res;
};
