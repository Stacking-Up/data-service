'use-strict';

module.exports = {
  smartSearch: require('./recommender'),
  commons: require('./commons'),
  space: require('./space'),
  user: require('./user')
};

const { RentalType } = require('@prisma/client');

module.exports.checkRentalValidity = (rental, space) => {
  const errors = [];

  _checkRentalConstraints(rental, errors);
  if (errors.length > 0) return errors;

  _checkRentalBusinessLogic(rental, space, errors);
  return errors;
};

function _checkRentalConstraints (rental, errors) {
  if (!rental.initialDate || !rental.finalDate || !rental.cost || !rental.type || !rental.meters) {
    errors.push('Missing required attributes');
  } else if (new Date(rental.initialDate).toString() === 'Invalid Date' || new Date(rental.initialDate) < new Date()) {
    errors.push('Initial date must be a Date after today');
  } else if (new Date(rental.finalDate).toString() === 'Invalid Date' || new Date(rental.finalDate) < new Date()) {
    errors.push('Final date must be a Date after today');
  } else if (isNaN(rental.cost)) {
    errors.push('Cost must be a number');
  } else if (isNaN(rental.meters)) {
    errors.push('Meters must be a number');
  } else if (!Object.values(RentalType).includes(rental.type)) {
    errors.push('Type must be one of the following: ' + Object.values(RentalType).join(', '));
  }
  return errors;
}

function _isSpaceAvailable (rentalInitialDateToBeCreated, rentalFinalDateToBeCreated, rentalMetersToBeCreated, space) {
  let res = true;

  if (!space.shared && space.rentals && space.rentals.length > 0) {
    space.rentals.filter(x => x.finalDate > new Date()).forEach(rental => {
      if (res) {
        if (rentalInitialDateToBeCreated >= rental.initialDate && rentalFinalDateToBeCreated <= rental.finalDate) {
          res = false;
        } else if (rentalInitialDateToBeCreated < rental.initialDate && rentalFinalDateToBeCreated <= rental.finalDate) {
          res = false;
        } else if (rentalInitialDateToBeCreated >= rental.initialDate && rentalFinalDateToBeCreated > rental.finalDate) {
          res = false;
        } else if (rentalInitialDateToBeCreated < rental.initialDate && rentalFinalDateToBeCreated > rental.finalDate) {
          res = false;
        }
      }
    });
  } else if (space.shared && space.rentals && space.rentals.length > 0) {
    let metersRented = 0;
    space.rentals.filter(x => x.finalDate > new Date()).forEach(rental => {
      if (res) {
        if (rentalInitialDateToBeCreated >= rental.initialDate && rentalFinalDateToBeCreated <= rental.finalDate) {
          metersRented += rental.meters;
        } else if (rentalInitialDateToBeCreated < rental.initialDate && rentalFinalDateToBeCreated <= rental.finalDate) {
          metersRented += rental.meters;
        } else if (rentalInitialDateToBeCreated >= rental.initialDate && rentalFinalDateToBeCreated > rental.finalDate) {
          metersRented += rental.meters;
        } else if (rentalInitialDateToBeCreated < rental.initialDate && rentalFinalDateToBeCreated > rental.finalDate) {
          metersRented += rental.meters;
        }
        res = (metersRented + rentalMetersToBeCreated) < module.exports.getMeters(space.dimensions);
      }
    });
  }
  return res;
}

function _checkRentalBusinessLogic (rentalToBeCreated, space, errors) {
  const rentalInitialDateToBeCreated = new Date(rentalToBeCreated.initialDate);
  const rentalFinalDateToBeCreated = new Date(rentalToBeCreated.finalDate);
  const rentalMetersToBeCreated = parseFloat(rentalToBeCreated.meters);

  // RN05 - RN06 junto a funcion para comprobar si el espacio esta disponible para alquilar - RN07
  if (rentalToBeCreated.finalDate < rentalToBeCreated.initialDate) {
    errors.push('Final date must be after initial date');
  } else if (rentalInitialDateToBeCreated < space.initialDate || rentalInitialDateToBeCreated > space.finalDate) {
    errors.push('Initial date must be between space dates');
  } else if (rentalFinalDateToBeCreated < space.initialDate || rentalFinalDateToBeCreated > space.finalDate) {
    errors.push('Final date must be between space dates');
  } else if (!_isSpaceAvailable(rentalInitialDateToBeCreated, rentalFinalDateToBeCreated, rentalMetersToBeCreated, space)) {
    errors.push('Space not available or space capacity exceeded');
  } else if (!space.shared && rentalToBeCreated.meters !== module.exports.getMeters(space.dimensions)) {
    errors.push('Meters must be equal to space meters');
  }
  return errors;
}
