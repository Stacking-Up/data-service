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

module.exports.checkRatingValidity = (rating) => {
  const errors = [];

  if (!rating.title || !rating.description || !rating.rating) {
    errors.push('Missing required attributes');
  } else if (rating.title.length < 3 || rating.title.length > 50) {
    errors.push('Title must be between 2 and 50 characters');
  } else if (rating.description.length < 3 || rating.description.length > 100) {
    errors.push('Description must be between 2 and 100 characters');
  } else if (isNaN(rating.rating) || rating.rating > 5 || rating.rating < 0 || !rating.rating.toString().match(/^\d+$/)) {
    errors.push('Rating must be between 0 and 5 or must be a integer number');
  }
  return errors;
};
