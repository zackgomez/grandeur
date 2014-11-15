"use strict";

var ActionTypes = require('./ActionTypes');
var invariant_violation = require('./invariant_violation');
var invariant = require('./invariant');
var _ = require('underscore');
var Colors = require('./Colors');
var GameData = require('./GameData');

var CARDS_PER_LEVEL = 4;

function Card(id, level, color, cost) {
  this.id = id;
  this.level = level;
  this.color = color;
  this.cost = cost;

  return this;
}
Card.prototype.toJSON = function() {
  return {
    id: this.id,
    level: this.level,
    color: this.color,
    cost: this.cost,
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
  var card = new Card(this.lastCardID_, card_def.level, card_def.color, card_def.cost);
  this.lastCardID_ += 1;
  this.cardsByID_[card.id] = card;
  return card;
};

Game.prototype.bumpSequenceID = function() {
  this.sequenceID_ += 1;
};

Game.prototype.setUpGame = function() {
  this.gameStartTimestamp_ = Date.now();

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

  this.currentPlayerID_ = this.players_[0].getID();
};

Game.prototype.addActionHelper = function(action) {
  action.timestamp = Date.now();
  this.actions_.push(action);
};

Game.prototype.addAction = function(action) {
  switch (action.type) {
    case ActionTypes.SEND_CHAT: {
      var player = this.getPlayerByID(action.payload.userID);
      if (!player) {
        console.log('could not find player', action.payload.userID);
        return;
      }
      this.messages_.push(
        {
          user: action.payload.userID,
          text: action.payload.text,
        }
      );
      break;
    }
    default:
      console.log('unknown action: ', action);
      return;
  }
  if (action.type !== ActionTypes.SEND_CHAT) {
    this.addActionHelper(action);
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
    currentPlayerID: this.currentPlayerID_,

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
