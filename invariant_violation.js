var invariant_violation = function(invariant_message) {
  throw new Error('invariant violation: ' + invariant_message);
}

module.exports = invariant_violation;
