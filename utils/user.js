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

module.exports.checkIdCard = (user) => {
  const dniChars = ['T', 'R', 'W', 'A', 'G', 'M', 'Y', 'F', 'P', 'D', 'X', 'B', 'N', 'J', 'Z', 'S', 'Q', 'V', 'H', 'L', 'C', 'K', 'E'];

  if (!user.idCard.toString().match(/^\d{8}[A-Z]$/)) {
    return false;
  } else {
    const rest = parseInt(user.idCard.slice(0, 8)) % 23;
    if (user.idCard[8] !== dniChars[rest]) {
      return false;
    }
  }
  return true;
};
module.exports.checkUserConstraints = (user, userId, role) => {
  const errors = [];

  if (!user.name || !user.surname || (!user.phoneNumber && (role === 'VERIFIED' || role === 'SUBSCRIBED'))) {
    errors.push('Missing required attributes: name, surname or phone number');
  }

  if (user.name && user.name.length < 3) {
    errors.push('Name must contain at least 3 characters');
  }

  if (user.surname && user.surname.length < 3) {
    errors.push('Surname must contain at least 3 characters');
  }

  if (user.birthDate && new Date(user.birthDate).toString() === 'Invalid Date') {
    errors.push('Invalid date format');
  }

  if (user.birthDate && new Date(user.birthDate) > new Date()) {
    errors.push('Birthday date cannot be after today');
  }

  if (user.sex && !['MALE', 'FEMALE', 'OTHER'].includes(user.sex)) {
    errors.push('Invalid sex, must be MALE, FEMALE or OTHER');
  }

  if (user.idCard) {
    const idCardCheck = this.checkIdCard(user);
    if (!idCardCheck) {
      errors.push('Invalid ID card format');
    }
  }

  if (user.phoneNumber && !user.phoneNumber.toString().match(/^\+?([0-9]{2})\d{9}$/)) {
    errors.push('Invalid phone number, must be +34XXXXXXXXX');
  }
  if (user.avatar) {
    if (!(user.avatar.indexOf('iVBORw0KGgo') === 0) && !(user.avatar.indexOf('/9j/') === 0)) {
      errors.push('Avatar must be jpeg or png');
    }
  }

  return errors;
};
