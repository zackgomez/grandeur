var Immutable = require('immutable');
var ActionTypes = require('./ActionTypes');
var _ = require('underscore');
var RequestTypes = require('./RequestTypes');
var Colors = require('./Colors');

var SelectionTypes = {
  NONE: 'none',
  CARD: 'card',
  HAND_CARD: 'hand_card',
  DECK: 'deck',
  CHIPS: 'draft_chips',
  DISCARD_CHIPS: 'discard_chips',
  NOBLE: 'noble',
};
SelectionTypes = Object.freeze(SelectionTypes);

var RequestTypeToValidSelectionType = {};
RequestTypeToValidSelectionType[RequestTypes.ACTION] = [
  SelectionTypes.CARD,
  SelectionTypes.HAND_CARD,
  SelectionTypes.DECK,
  SelectionTypes.CHIPS
];
RequestTypeToValidSelectionType[RequestTypes.DISCARD_CHIPS] = [
  SelectionTypes.DISCARD_CHIPS
];
RequestTypeToValidSelectionType[RequestTypes.SELECT_NOBLE] = [
  SelectionTypes.NOBLE
];
RequestTypeToValidSelectionType = Object.freeze(RequestTypeToValidSelectionType);

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

var ActionStore = {
  init: function(game, player_index) {
    this.playerIndex_ = player_index;
    this.game_ = game;
    this.listeners_ = [];

    this.clearSelection();
  },

  SelectionTypes: SelectionTypes,

  setSelection_: function(selection, force) {
    if (!this.isPlayersTurn() && !force) {
      return;
    }
    var request = this.game_.currentRequest;
    var new_selection_type = selection_type_from_selection(selection);
    if (new_selection_type === SelectionTypes.NONE) {
      // nop
    } else if (!_.contains(RequestTypeToValidSelectionType[request],
                          new_selection_type)) {
      return;
    }

    this.selection_ = selection;

    _.each(this.listeners_, function(listener) {
      listener();
    });
  },

  addListener: function(callback) {
    this.listeners_.push(callback);
  },
  removeListener: function(callback) {
    this.listeners_ = _.without(this.listeners_, callback);
  },

  setGame: function(game) {
    var old_turn = this.game_.turn;
    var old_request = this.game_.currentRequest;
    this.game_ = game;
    if (!this.isPlayersTurn() ||
        old_turn != game.turn ||
          old_request != game.currentRequest) {
      this.clearSelection();
    }
  },

  clearSelection: function() {
    this.setSelection_(null, true);
  },

  getSelectionType: function() {
    var selection = this.getSelection() || {};
    return selection_type_from_selection(selection);
  },
  getSelection: function() {
    if (!this.isPlayersTurn()) {
      return null;
    }
    return this.selection_;
  },
  isPlayersTurn: function() {
    return this.game_ && this.playerIndex_ === this.game_.currentPlayerIndex;
  },
  getPlayerIndex: function() {
    return this.playerIndex_;
  },
  isActionRequest: function() {
    return this.isPlayersTurn()
    && this.game_.currentRequest === RequestTypes.ACTION;
  },
  isDiscardChipsRequest: function() {
    return this.isPlayersTurn()
    && this.game_.currentRequest === RequestTypes.DISCARD_CHIPS;
  },
  isSelectNoblesRequest: function() {
    return this.isPlayersTurn()
    && this.game_.currentRequest === RequestTypes.SELECT_NOBLE;
  },

  didClickDraftingCard: function(level, cardID) {
    this.setSelection_({
      level: level,
      cardID: cardID,
    });
  },
  didClickHandCard: function(cardID) {
    this.setSelection_({
      cardID: cardID,
    });
  },
  didClickDeck: function(level) {
    this.setSelection_({
      level: level,
    });
  },

  // Called while discarding chips.
  didClickPlayerChip: function(clicked_color) {
    var to_discard = {};
    if (this.selection_) {
      to_discard = this.selection_.discard_chips || {};
    }
    if (_.has(to_discard, clicked_color)) {
      to_discard[clicked_color]++;
    }
    else {
      to_discard[clicked_color] = 1;
    }
    this.setSelection_({discard_chips: to_discard});
  },

  didClickSupplyChip: function(clicked_color) {
    if (clicked_color === Colors.JOKER) {
      return;
    }
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
  },
}

module.exports = ActionStore;
