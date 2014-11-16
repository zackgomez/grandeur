var _ = require('underscore');
var ActionTypes = {
  SEND_CHAT: false,
  BUILD_CARD: false,
  DRAFT_CARD: false,
  DRAFT_CHIPS: false,
  DRAFT_NOBLE: false,
};
_.each(ActionTypes, function(value, key) {
  ActionTypes[key] = key;
});
module.exports = ActionTypes;
