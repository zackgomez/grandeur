var _ = require('underscore');

var ActionTypes = {
  BUILD_HAND_CARD: false,
  BUILD_TABLE_CARD: false,
  DRAFT_CHIPS: false,
  RESERVE_CARD: false,
  SELECT_NOBLE: false,
  DISCARD_CHIPS: false,
};

_.each(ActionTypes, function(value, key) {
  ActionTypes[key] = key;
});
module.exports = ActionTypes;
