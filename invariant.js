var invariant_violation = require('./invariant_violation');

var invariant = function(condition, message) {
  if (!condition) {
    invariant_violation(message);
  }
}

module.exports = invariant;
