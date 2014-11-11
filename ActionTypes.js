var _ = require('underscore');
var ActionTypes = {
  SEND_CHAT: false,
};
_.each(ActionTypes, function(value, key) {
  ActionTypes[key] = key;
});
module.exports = ActionTypes;
