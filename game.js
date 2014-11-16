"use strict";

var ActionTypes = require('./ActionTypes');
var invariant_violation = require('./invariant_violation');
var invariant = require('./invariant');
var _ = require('underscore');
var Colors = require('./Colors');
var GameData = require('./GameData');

var CARDS_PER_LEVEL = 4;

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
  this.nextTurn();
};

Game.prototype.nextTurn = function() {
  this.currentPlayerIndex_ = (this.currentPlayerIndex_ + 1) % this.players_.length;

  // TODO check for chip overflow

  // TODO check for noble visit

  if (this.currentPlayerIndex_ === 0) {
    this.turn_ += 1;
    // TODO check for win condition
  }

  var currentPlayer = this.players_[this.currentPlayerIndex_];
  this.addActionHelper(currentPlayer.getID(), {
    type: ActionTypes.START_TURN,
    payload: {},
  });
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
  // TODO
  return {};
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

Game.prototype.addAction = function(userID, action) {
  var player = this.getPlayerByID(userID);
  if (!player) {
    console.log('could not find player', userID);
    return;
  }
  switch (action.type) {
    case ActionTypes.SEND_CHAT: {
      this.messages_.push(
        {
          user: userID,
          text: action.payload.text,
        }
      );
      break;
    }
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
      this.nextTurn();
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
      this.nextTurn();
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
      player.board = player.board.concat(card);

      var deck = this.decks_[action.payload.level - 1];
      invariant(index < board.length, 'invalid card index');
      board[index] = deck.drawOne();

      this.nextTurn();
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
      player.board = player.board.concat(card);

      player.hand = _.without(player.hand, card);

      this.nextTurn();
      break;
    }
    default:
      console.log('unknown action: ', action);
      return;
  }
  if (action.type !== ActionTypes.SEND_CHAT) {
    this.addActionHelper(userID, action);
  }
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
