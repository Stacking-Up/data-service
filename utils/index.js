'use-strict';

module.exports.excludeNulls = (obj) => {
  const res = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (obj[key]) res[key] = value;
  });
  return res;
};

module.exports.filterRatings = (ratings, req) => {
  let res = {};
  switch (req.filter.value) {
    case 'given':
      res = ratings.filter(rating => rating.reviewerId === req.userId.value);
      break;
    case 'received':
      res = ratings.filter(rating => rating.receiverId === req.userId.value);
      break;
    case 'all':
      res = ratings;
      break;
  }
  return res;
};
