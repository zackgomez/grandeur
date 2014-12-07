"use strict";

var ActionTypes = require('./ActionTypes');
var invariant_violation = require('./invariant_violation');
var invariant = require('./invariant');
var _ = require('underscore');
var Colors = require('./Colors');
var GameData = require('./GameData');
var RequestTypes = require('./RequestTypes');

var CARDS_PER_LEVEL = 4;
var MAX_CHIPS = 10;
var GAME_ENDING_SCORE = 15;

function Card(id, level, color, cost, points) {
  this.id = id;
  this.level = level;
  this.color = color;
  this.cost = cost;
  this.points = points;

  return this;
}
Card.prototype.toJSON = function() {
  return {
    id: this.id,
    level: this.level,
    color: this.color,
    cost: this.cost,
    points: this.points,
  };
};

function Deck() {
  this.cards_ = [];
  return this;
}
Deck.prototype.addCardsToTop = function(cards) {
  this.cards_ = this.cards_.concat(cards);
};
Deck.prototype.shuffle = function() {
  this.cards_ = _.shuffle(this.cards_);
};
Deck.prototype.count = function() {
  return this.cards_.length;
};
Deck.prototype.drawOne = function() {
  if (this.cards_.length > 0) {
    return this.cards_.pop();
  }
  return null;
};
Deck.prototype.drawN = function(n) {
  var cards = [];
  _.times(Math.min(n, this.count()), function(n) {
    cards.push(this.cards_.pop());
  }, this);
  return cards;
};
Deck.prototype.drawAll = function() {
  var ret = this.cards_;
  this.cards_ = [];
  ret.reverse();
  return ret;
};
Deck.prototype.toJSON = function() {
  return {
    cards: _.invoke(this.cards_, 'toJSON'),
  };
};

function Player(userID) {
  this.userID_ = userID;

  this.hand = [];
  this.board = [];
  this.nobles = [];
  this.chips = {};

  return this;
}
Player.prototype.getID = function () {
  return this.userID_;
};
Player.prototype.toJSON = function () {
  return {
    userID: this.userID_,
    hand: this.hand,
    board: this.board,
    nobles: this.nobles,
    chips: this.chips,
  };
};

function Game(players) {
  this.id_ = _.uniqueId('game_');
  this.players_ = _.shuffle(players);

  this.lastCardID_ = 100;
  this.cardsByID_ = {};

  this.decks_ = _.times(3, function(n) {
    return new Deck();
  });
  this.boards_ = _.times(3, function(n) {
    return [];
  });
  this.nobles_ = [];
  this.chipSupply_ = {};

  this.turn_ = 0;

  this.actions_ = [];
  this.messages_ = [];
  this.sequenceID_ = 0;

  return this;
}
Game.prototype.getID = function() {
  return this.id_;
};
Game.prototype.getSequenceID = function() {
  return this.sequenceID_;
};
Game.prototype.getPlayers = function() {
  return this.players_;
};
Game.prototype.getPlayerByID = function(userID) {
  return _.find(this.players_, function(player) {
    return player.getID() === userID;
  });
};
Game.prototype.spawnCard = function(card_def) {
  var card = new Card(this.lastCardID_, card_def.level, card_def.color, card_def.cost, card_def.points);
  this.lastCardID_ += 1;
  this.cardsByID_[card.id] = card;
  return card;
};

Game.prototype.bumpSequenceID = function() {
  this.sequenceID_ += 1;
};

Game.prototype.setUpGame = function() {
  this.gameStartTimestamp_ = Date.now();
  _.each(this.players_, function(player) {
    _.each(Colors, function(color) {
      player.chips[color] = 0;
    });
  });

  _.each(GameData.Cards, function(card_def) {
    var i = card_def.level - 1;
    invariant(i >= 0 && i < 3, 'invalid card level');
    this.decks_[i].addCardsToTop([this.spawnCard(card_def)]);
  }, this);

  _.each(this.decks_, function(deck, n) {
    deck.shuffle();
    this.boards_[n] = deck.drawN(CARDS_PER_LEVEL);
  }, this);

  this.nobles_ = _.sample(GameData.Nobles, this.players_.length + 1);

  var playerCountToChipCount = {
    2: 4,
    3: 5,
    4: 7,
  }
  _.each(Colors, function(color) {
    this.chipSupply_[color] = color === Colors.JOKER ?
      5 : (playerCountToChipCount[this.players_.length] || 7);
  }, this);

  this.currentPlayerIndex_ = this.players_.length - 1;
  this.currentRequest_ = RequestTypes.ACTION;
  this.winningPlayerIndex_ = -1;
  this.nextTurn();
};

Game.prototype.nextTurn = function() {
  var player = this.players_[this.currentPlayerIndex_];

  // check for chip overflow
  var total_chips = 0;
  _.each(player.chips, function(count, color) {
    total_chips += count;
  });
  if (total_chips > MAX_CHIPS) {
    // TODO reenable this when the UI is updated
    console.log('would make discard chips');
    //this.currentRequest_ = RequestTypes.DISCARD_CHIPS;
    return;
  }

  // check for noble visit
  var current_discount = discountForPlayer(player);
  var selectable_nobles = _.filter(this.nobles_, function(noble) {
    return _.every(noble.cost, function(count, color) {
      return current_discount[color] >= count;
    });
  });
  if (selectable_nobles.length == 1) {
    var noble = selectable_nobles[0];
    player.nobles = player.nobles.concat(noble);
    this.nobles_ = _.without(this.nobles_, noble);
  } else if (selectable_nobles.length > 1) {
    // TODO use request code when UI is updated
    //this.currentRequest_ = RequestTypes.SELECT_NOBLE;
    var noble = selectable_nobles[0];
    player.nobles = player.nobles.concat(noble);
    this.nobles_ = _.without(this.nobles_, noble);
    return;
  }
  
  this.currentPlayerIndex_ = (this.currentPlayerIndex_ + 1) % this.players_.length;
  this.currentRequest_ = RequestTypes.ACTION;

  if (this.currentPlayerIndex_ === 0) {
    this.turn_ += 1;

    // check for win condition
    var player_scores = _.map(this.players_, function(player) {
      return scoreForPlayer(player);
    });
    var is_game_over = _.some(player_scores, function(score) {
      return score > GAME_ENDING_SCORE;
    });
    if (is_game_over) {
      var winning_index = -1;
      var winning_score = -1;
      _.each(player_scores, function(score, index) {
        if (score > winning_score) {
          winning_score = score;
          winning_index = index;
        }
      });

      this.winningPlayerIndex_ = winning_index;
      this.currentPlayerIndex_ = -1;
      this.currentRequest_ = null;
      console.log('player index', this.winningPlayerIndex_, 'won');
    }
  }
};

Game.prototype.addActionHelper = function(userID, action) {
  action.timestamp = Date.now();
  action.userID = userID;
  this.actions_.push(action);
};

var isValidChipSelection = function(color_counts, supply) {
  var num_colors = _.size(color_counts);
  if (color_counts[Colors.JOKER] > 0) {
    return false;
  }
  if (num_colors <= 0 || num_colors > 3) {
    return false;
  }
  // handle double chip draft
  var first_count = _.head(_.values(color_counts));
  if (num_colors == 1 && first_count == 2) {
    return supply[_.keys(color_counts)[0]] >= 4;
  }

  // must be single chip draft and have enough resources
  return _.all(color_counts, function(count, color) {
    return supply[color] >= count;
  });
};
var discountForPlayer = function(player) {
  // map color --> discout
  return _.countBy(player.board, function(card) {
    return card.color;
  });
};
// returns the cost of a card given some supply of chips to pay with and some discount
var costForCard = function(card, supply, discount) {
  var cost = {};
  _.each(card.cost, function(count, color) {
    var discounted_count = Math.max(count - (discount[color] || 0), 0);
    var supply_count = supply[color];
    cost[color] = Math.min(discounted_count, supply_count);
    if (supply_count < discounted_count) {
      cost[Colors.JOKER] = (cost[Colors.JOKER] || 0) + (discounted_count - supply_count);
    }
  });
  return cost;
};
var canPayCost = function(cost, supply) {
  return _.all(cost, function(count, key) {
    return supply[key] >= count;
  });
};
var supplyAfterPayingCost = function(supply, cost) {
  var new_supply = _.clone(supply);
  _.each(cost, function(count, key) {
    new_supply[key] -= count;
  });
  return new_supply;
};
var supplyAfterGainingCost = function(supply, cost) {
  var new_supply = _.clone(supply);
  _.each(cost, function(count, key) {
    new_supply[key] += count;
  });
  return new_supply;
};
var canSelectNoble = function(player, noble) {
  var discount = discountForPlayer(player);
  return _.every(noble.cost, function(count, color) {
    return discount[color] >= count;
  });
};
var scoreForPlayer = function(player) {
  var score = 0;
  _.each(player.board, function(card) {
    score += card.points;
  });
  _.each(player.nobles, function(noble) {
    score += noble.points;
  });
  return score;
};

var RequestTypeByActionType = {};
RequestTypeByActionType[ActionTypes.BUILD_HAND_CARD] = RequestTypes.ACTION;
RequestTypeByActionType[ActionTypes.BUILD_TABLE_CARD] = RequestTypes.ACTION;
RequestTypeByActionType[ActionTypes.DRAFT_CHIPS] = RequestTypes.ACTION;
RequestTypeByActionType[ActionTypes.RESERVE_CARD] = RequestTypes.ACTION;
RequestTypeByActionType[ActionTypes.SELECT_NOBLE] = RequestTypes.SELECT_NOBLE;
RequestTypeByActionType[ActionTypes.DISCARD_CHIPS] = RequestTypes.DISCARD_CHIPS;

Game.prototype.addAction = function(userID, action) {
  var player = this.getPlayerByID(userID);
  if (!player) {
    console.log('could not find player', userID);
    return;
  }
  var player_index = this.players_.indexOf(player);
  if (player_index != this.currentPlayerIndex_) {
    throw new Error('not your turn');
  }
  var request_type = RequestTypeByActionType[action.type];
  if (request_type != this.currentRequest_) {
    throw new Error('invalid action for request');
  }
  switch (action.type) {
    case ActionTypes.DRAFT_CHIPS: {
      var chips = action.payload.color_counts;
      var valid_draft = isValidChipSelection(chips, this.chipSupply_);
      if (!valid_draft) {
        console.log('invalid draft: ', chips);
        throw new Error('invalid chip selection');
      }

      _.each(chips, function(count, color) {
        player.chips[color] += count;
        this.chipSupply_[color] -= count;
      }, this);
      break;
    }
    case ActionTypes.RESERVE_CARD: {
      var level = action.payload.level;
      var cardID = action.payload.cardID;
      if (!_.contains([1, 2, 3], level)) {
        throw new Error('invalid level');
      }
      if (player.hand.length >= 3) {
        throw new Error('not enough hand space');
      }
      var deck = this.decks_[level - 1];
      var drafted_card = null;
      if (!cardID) {
        if (!deck.count()) {
          throw new Error('not enough cards to draft from deck');
        }
        drafted_card = deck.drawOne();
      } else {
        var card = _.find(this.boards_[level - 1], function(card, i) {
          return card.id === cardID;
        });
        if (!card) {
          throw new Error('card not found');
        }
        drafted_card = card;
        var index = _.indexOf(this.boards_[level - 1], card);
        this.boards_[level - 1][index] = deck.drawOne();
      }
      player.hand.push(drafted_card);
      if (this.chipSupply_[Colors.JOKER] > 0) {
        player.chips[Colors.JOKER] += 1;
        this.chipSupply_[Colors.JOKER] -= 1;
      }
      break;
    }
    case ActionTypes.BUILD_TABLE_CARD: {
      var board = this.boards_[action.payload.level - 1];
      if (!board) {
        throw new Error('bad level param');
      }
      var index = -1;
      var card = _.find(board, function(card, i) {
        index = i;
        return card.id === action.payload.cardID;
      });
      if (!card) {
        throw new Error('bad card id');
      }
      var cost = costForCard(card, player.chips, discountForPlayer(player));
      if (!canPayCost(cost, player.chips)) {
        throw new Error('cannot afford card');
      }
      player.chips = supplyAfterPayingCost(player.chips, cost);
      this.chipSupply_ = supplyAfterGainingCost(this.chipSupply_, cost);
      player.board = player.board.concat(card);

      var deck = this.decks_[action.payload.level - 1];
      invariant(index < board.length, 'invalid card index');
      board[index] = deck.drawOne();

      break;
    }
    case ActionTypes.BUILD_HAND_CARD: {
      var card = _.find(player.hand, function(card, i) {
        return card.id === action.payload.cardID;
      });
      if (!card) {
        throw new Error('bad card id');
      }
      var cost = costForCard(card, player.chips, discountForPlayer(player));
      if (!canPayCost(cost, player.chips)) {
        throw new Error('cannot afford card');
      }
      player.chips = supplyAfterPayingCost(player.chips, cost);
      this.chipSupply_ = supplyAfterGainingCost(this.chipSupply_, cost);
      player.board = player.board.concat(card);

      player.hand = _.without(player.hand, card);

      break;
    }
    case ActionTypes.SELECT_NOBLE: {
      var noble_index = action.payload.index || -1;
      if (noble_index >= this.nobles_.length || noble_index < 0) {
        throw new Error('invalid noble index', noble_index);
      }
      var noble = this.nobles_[noble_index];
      if (!canSelectNoble(player, noble)) {
        throw new Error('cannot select noble');
      }
      player.nobles = player.nobles.concat(noble);
      this.nobles_ = _.without(this.nobles_, noble);
      break;
    }
    case ActionTypes.DISCARD_CHIPS: {
      var discarded_chips = action.payload.chips;
      if (!_.isObject(discarded_chips)) {
        throw new Error('invalid chips dictionary');
      }
      var has_chips = _.every(discarded_chips, function(count, color) {
        return player.chips[color] >= count;
      });
      if (!has_chips) {
        throw new Error('invalid chip selection');
      }
      var new_chips = {};
      var new_chips_count = 0;
      _.each(player.chips, function(count, color) {
        var new_count = count - (discarded_chips[color] || 0);
        new_chips[color] = new_count;
        new_chips_count += new_count;
      });
      if (new_count > MAX_CHIPS) {
        throw new Error('still too many chips');
      }
      player.chips = new_chips;
      break;
    }
    default:
      throw new Error('unknown action type ', action.type);
  }

  this.nextTurn();
  this.bumpSequenceID();
};

Game.prototype.toJSON = function() {
  return {
    id: this.id_,
    sequenceID: this.sequenceID_,
    turn: this.turn_,

    decks: _.invoke(this.decks_, 'toJSON'),
    boards: this.boards_,
    nobles: this.nobles_,
    chipSupply: this.chipSupply_,

    players: _.invoke(this.players_, 'toJSON'),
    currentPlayerIndex: this.currentPlayerIndex_,
    currentRequest: this.currentRequest_,
    winningPlayerIndex: this.winningPlayerIndex_,

    lastCardID: this.lastCardID_,
    cardsByID: this.cardsByID_,

    actions: this.actions_,
    messages: this.messages_,
  };
};

module.exports = {
  Game: Game,
  Card: Card,
  Deck: Deck,
  Player: Player,
  Colors: Colors,
};
