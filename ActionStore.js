var Immutable = require('immutable');
var ActionTypes = require('./ActionTypes');
var _ = require('underscore');
var RequestTypes = require('./RequestTypes');

var SelectionTypes = {
  NONE: 'none',
  CARD: 'card',
  HAND_CARD: 'hand_card',
  DECK: 'deck',
  CHIPS: 'draft_chips',
  NOBLE: 'noble',
};

var ActionStore = function(game, player_index) {
  this.playerIndex_ = player_index;
  this.game_ = game;
  this.listeners_ = [];

  this.clearSelection();
};

ActionStore.SelectionTypes = SelectionTypes;

ActionStore.prototype.setSelection_ = function(selection, force) {
  if (!this.isPlayersTurn() && !force) {
    return;
  }
  // TODO validate seleciton based on game request type
  this.selection_ = selection;

  _.each(this.listeners_, function(listener) {
    listener();
  });
};

ActionStore.prototype.addListener = function(callback) {
  this.listeners_.push(callback);
};
ActionStore.prototype.removeListener = function(callback) {
  this.listeners_ = _.without(this.listeners_, callback);
};

ActionStore.prototype.setGame = function(game) {
  var old_turn = this.game_.turn;
  this.game_ = game;
  if (!this.isPlayersTurn() || old_turn != game.turn) {
    this.clearSelection();
  }
};

ActionStore.prototype.clearSelection = function() {
  this.setSelection_(null, true);
};

ActionStore.prototype.getSelectionType = function() {
  var selection = this.getSelection() || {};
  if (_.has(selection, 'cardID')) {
    return SelectionTypes.CARD;
  } else if (_.has(selection, 'level')) {
    return SelectionTypes.DECK;
  } else if (_.size(selection.chips) > 0) {
    return SelectionTypes.CHIPS;
  } else if (_.has(selection, 'noble_index')) {
    return SelectionTypes.NOBLE;
  } else {
    return SelectionTypes.NONE;
  }
};
ActionStore.prototype.getSelection = function() {
  if (!this.isPlayersTurn()) {
    return null;
  }
  return this.selection_;
};
ActionStore.prototype.isPlayersTurn = function() {
  return this.game_ && this.playerIndex_ === this.game_.currentPlayerIndex;
};
ActionStore.prototype.getPlayerIndex = function() {
  return this.playerIndex_;
};


ActionStore.prototype.didClickDraftingCard = function(level, cardID) {
  this.setSelection_({
    level: level,
    cardID: cardID,
  });
};
ActionStore.prototype.didClickDeck = function(level) {
  this.setSelection_({
    level: level,
  });
};

module.exports = ActionStore;
