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
  DISCARD_CHIPS: 'discard_chips',
  NOBLE: 'noble',
};

var ActionStore = function(game, player_index) {
  this.playerIndex_ = player_index;
  this.game_ = game;
  this.listeners_ = [];

  this.clearSelection();
};

ActionStore.SelectionTypes = SelectionTypes;

var selection_type_from_selection = function(selection) {
  if (_.has(selection, 'cardID') && _.has(selection, 'level')) {
    return SelectionTypes.CARD;
  } else if (_.has(selection, 'cardID')) {
    return SelectionTypes.HAND_CARD;
  } else if (_.has(selection, 'level')) {
    return SelectionTypes.DECK;
  } else if (_.has(selection, 'chips') > 0) {
    return SelectionTypes.CHIPS;
  } else if (_.has(selection, 'discard_chips') > 0) {
    return SelectionTypes.DISCARD_CHIPS;
  } else if (_.has(selection, 'noble_index')) {
    return SelectionTypes.NOBLE;
  } else {
    return SelectionTypes.NONE;
  }
};

ActionStore.prototype.setSelection_ = function(selection, force) {
  if (!this.isPlayersTurn() && !force) {
    return;
  }
  var request = this.game_.currentRequest;
  var new_selection_type = selection_type_from_selection(selection);
  if (new_selection_type === SelectionTypes.NONE) {
    // nop
  } else if (request === RequestTypes.DISCARD_CHIPS &&
      new_selection_type !== SelectionTypes.DISCARD_CHIPS) {
    return;
  } else if (request === RequestTypes.SELECT_NOBLE &&
             new_selection_type !== SelectionTypes.NOBLE) {
    return;
  } else if (request === RequestTypes.ACTION &&
             new_selection_type !== SelectionTypes.CARD &&
             new_selection_type !== SelectionTypes.HAND_CARD &&
             new_selection_type !== SelectionTypes.DECK &&
             new_selection_type !== SelectionTypes.CHIPS) {
    return;
  }

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
  var old_request = this.game_.currentRequest;
  this.game_ = game;
  if (!this.isPlayersTurn() ||
      old_turn != game.turn ||
      old_request != game.currentRequest) {
    this.clearSelection();
  }
};

ActionStore.prototype.clearSelection = function() {
  this.setSelection_(null, true);
};

ActionStore.prototype.getSelectionType = function() {
  var selection = this.getSelection() || {};
  return selection_type_from_selection(selection);
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
ActionStore.prototype.didClickHandCard = function(cardID) {
  this.setSelection_({
    cardID: cardID,
  });
};
ActionStore.prototype.didClickDeck = function(level) {
  this.setSelection_({
    level: level,
  });
};

// Called while discarding chips.
ActionStore.prototype.didClickPlayerChip = function(clicked_color) {
  var chips = {};
  chips[clicked_color] = 1;
  this.setSelection_({discard_chips : chips});
}

ActionStore.prototype.didClickSupplyChip = function(clicked_color) {
  var supply_count = this.game_.chipSupply[clicked_color];
  if (supply_count == 0) {
    return;
  }

  if (this.getSelectionType() === SelectionTypes.CHIPS) {
    var existing_chips = this.selection_.chips;
    var new_chips = _.clone(existing_chips);
    if (existing_chips[clicked_color] > 0) {
      new_chips[clicked_color] = 0;
    } else {
      _.each(new_chips, function(count, color) {
        if (count > 1) {
          new_chips[color] = 1;
        }
      });
      new_chips[clicked_color] = 1;
    }
    var new_chip_count = 0;
    _.each(new_chips, function(count) {
      new_chip_count += count;
    });
    if (new_chip_count > 3) {
      return;
    } else if (new_chip_count == 0) {
      this.clearSelection();
    } else {
      this.setSelection_({ chips: new_chips });
    }
  } else {
    var count = supply_count >= 4 ? 2 : 1;
    var chips = {};
    chips[clicked_color] = count;
    this.setSelection_({ chips: chips });
  }
};

module.exports = ActionStore;
