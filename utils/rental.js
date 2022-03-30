'use-strict';

const { RentalType } = require('@prisma/client');
const { getMeters } = require('./space');
const { differenceInCalendarMonths, differenceInCalendarDays, differenceInHours } = require('date-fns');

module.exports.checkRentalValidity = (rental, space) => {
  const errors = [];

  _checkRentalConstraints(rental, errors);
  if (errors.length > 0) return errors;

  _checkRentalBusinessLogic(rental, space, errors);
  return errors;
};

module.exports.calculateCost = (rental, space) => {
  return _calculateCost(rental, space);
};

function _checkRentalConstraints (rental, errors) {
  if (!rental.initialDate || !rental.finalDate || !rental.type || !rental.meters) {
    errors.push('Missing required attributes');
  } else if (new Date(rental.initialDate).toString() === 'Invalid Date' || new Date(rental.initialDate) < new Date()) {
    errors.push('Initial date must be a Date after today');
  } else if (new Date(rental.finalDate).toString() === 'Invalid Date' || new Date(rental.finalDate) < new Date()) {
    errors.push('Final date must be a Date after today');
  } else if (isNaN(rental.meters)) {
    errors.push('Meters must be a number');
  } else if (!Object.values(RentalType).includes(rental.type)) {
    errors.push('Type must be one of the following: ' + Object.values(RentalType).join(', '));
  }
  return errors;
}

function _isSpaceAvailable (rentalInitialDateToBeCreated, rentalFinalDateToBeCreated, rentalMetersToBeCreated, space) {
  let res = true;

  if (rentalMetersToBeCreated > getMeters(space.dimensions)) {
    res = false;
  } else if (!space.shared && space.rentals && space.rentals.length > 0) {
    space.rentals.filter(x => x.finalDate > new Date()).forEach(rental => {
      if (res) {
        if (rentalInitialDateToBeCreated >= rental.initialDate && rentalInitialDateToBeCreated <= rental.finalDate) {
          res = false;
        } else if (rentalFinalDateToBeCreated >= rental.initialDate && rentalFinalDateToBeCreated <= rental.finalDate) {
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
        if (rentalInitialDateToBeCreated >= rental.initialDate && rentalInitialDateToBeCreated <= rental.finalDate) {
          metersRented += rental.meters;
        } else if (rentalFinalDateToBeCreated >= rental.initialDate && rentalFinalDateToBeCreated <= rental.finalDate) {
          metersRented += rental.meters;
        } else if (rentalInitialDateToBeCreated < rental.initialDate && rentalFinalDateToBeCreated > rental.finalDate) {
          metersRented += rental.meters;
        }
        res = (metersRented + rentalMetersToBeCreated) < getMeters(space.dimensions);
      }
    });
  }
  return res;
}

function _checkRentalBusinessLogic (rentalToBeCreated, space, errors) {
  const rentalInitialDateToBeCreated = new Date(rentalToBeCreated.initialDate);
  const rentalFinalDateToBeCreated = new Date(rentalToBeCreated.finalDate);
  const rentalMetersToBeCreated = parseFloat(rentalToBeCreated.meters);

  const tomorrow = new Date();
  tomorrow.setHours(tomorrow.getHours() + 24);

  const rentalInitialHour = new Date(rentalInitialDateToBeCreated);
  const rentalFinalHour = new Date(rentalFinalDateToBeCreated);

  rentalInitialHour.setFullYear(1970, 0, 1);
  rentalFinalHour.setFullYear(1970, 0, 1);

  // RN05 - RN06 junto a funcion para comprobar si el espacio esta disponible para alquilar - RN07
  if (rentalToBeCreated.type === 'HOUR' && !space.priceHour) {
    errors.push('Space must have a price per hour to rent per hour');
  } else if (rentalToBeCreated.type === 'DAY' && !space.priceDay) {
    errors.push('Space must have a price per day to rent per day');
  } else if (rentalToBeCreated.type === 'MONTH' && !space.priceMonth) {
    errors.push('Space must have a price per month to rent per month');
  } else if (rentalToBeCreated.finalDate < rentalToBeCreated.initialDate) {
    errors.push('Final date must be after initial date');
  } else if (rentalInitialDateToBeCreated < space.initialDate || (space.finalDate && rentalInitialDateToBeCreated > space.finalDate)) {
    errors.push('Initial date must be between space dates');
  } else if (rentalFinalDateToBeCreated < space.initialDate || (space.finalDate && rentalFinalDateToBeCreated > space.finalDate)) {
    errors.push('Final date must be between space dates');
  } else if (rentalInitialDateToBeCreated < tomorrow) {
    errors.push('Initial date must be after 24 hours from now');
  } else if (!_isSpaceAvailable(rentalInitialDateToBeCreated, rentalFinalDateToBeCreated, rentalMetersToBeCreated, space)) {
    errors.push('Space not available or space capacity exceeded');
  } else if (!space.shared && rentalMetersToBeCreated !== getMeters(space.dimensions)) {
    errors.push('Meters must be equal to space meters');
  } else if (rentalToBeCreated.type === 'HOUR' && ((space.startHour && rentalInitialHour < space.startHour) || (space.endHour && rentalInitialHour > space.endHour))) {
    errors.push('Initial hour must be between space hours');
  } else if (rentalToBeCreated.type === 'HOUR' && ((space.startHour && rentalFinalHour < space.startHour) || (space.endHour && rentalFinalHour > space.endHour))) {
    errors.push('Final hour must be between space hours');
  } else if (rentalToBeCreated.type === 'MONTH' && differenceInCalendarDays(rentalFinalDateToBeCreated, rentalInitialDateToBeCreated) % 30 !== 0) {
    errors.push('Monthly rentals must be made in 30 days');
  }
  return errors;
}

function _calculateCost (rentalToBeCreated, space) {
  const rentalInitialDateToBeCreated = new Date(rentalToBeCreated.initialDate);
  const rentalFinalDateToBeCreated = new Date(rentalToBeCreated.finalDate);

  let costs = 0;
  switch (rentalToBeCreated.type) {
    case 'HOUR':
      /* istanbul ignore next */
      costs = (differenceInHours(rentalFinalDateToBeCreated, rentalInitialDateToBeCreated, { roundingMethod: 'ceil' }) || 1) * space.priceHour; break;
    case 'DAY':
      /* istanbul ignore next */
      costs = (differenceInCalendarDays(rentalFinalDateToBeCreated, rentalInitialDateToBeCreated) || 1) * space.priceDay; break;
    case 'MONTH':
      /* istanbul ignore next */
      costs = (differenceInCalendarMonths(rentalFinalDateToBeCreated, rentalInitialDateToBeCreated) || 1) * space.priceMonth; break;
  }

  if (space.shared) {
    return costs * (rentalToBeCreated.meters / getMeters(space.dimensions));
  }

  return costs;
}
