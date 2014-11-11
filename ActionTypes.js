var _ = require('underscore');
var ActionTypes = {
  RESOURCE_CHANGE: false,
  SET_UP_AGE: false,
  SET_UP_TURN: false,
  SET_UP_PHASE: false,
  NEXT_AGE: false,
  NEXT_TURN: false,
  NEXT_PHASE: false,
  HANDLE_WAR: false,
  BUILD_CARD: false,
  BUILD_BASIC_CARD: false,
  BUILD_KNOWLEDGE_CARD: false,
  SELECT_CARD: false,
  PLAY_CARD: false,
  UNDO_GP_CARD: false,
  ACTIVATE_CARD: false,
  DISCARD_CARD: false,
  UNDISCARD_CARD:false,
  SET_CARD_NOTE: false,
  USE_GOD_ACTIVE: false,
  CHANGE_READY_STATE: false,
  SEND_CHAT: false,
  DRAW_CARD: false,
  DIE_ROLL: false,
  END_OF_PHASE: false,
};
_.each(ActionTypes, function(value, key) {
  ActionTypes[key] = key;
});
module.exports = ActionTypes;
