'use-strict';

module.exports.filterRatings = (ratings, req) => {
  let res = [];
  switch (req.filter.value) {
    case 'given':
      res = ratings.filter(rating => rating.reviewerId === req.userId.value);
      break;
    case 'received':
      res = ratings.filter(rating => rating.receiverId === req.userId.value);
      break;
    case undefined:
    case 'all':
      res = ratings;
      break;
  }
  return res;
};
