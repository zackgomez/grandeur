"use strict";

var ActionTypes = require('./ActionTypes');
var invariant_violation = require('./invariant_violation');
var invariant = require('./invariant');
var _ = require('underscore');
var fs = require('fs');

var TURNS_PER_AGE = 8;

var Colors = {
  RED: 'red',
  BLUE: 'blue',
  GREEN: 'green',
  BLACK: 'black',
  WHITE: 'white',
  JOKER: 'joker',
};

function Card(id, level, color, costs) {
  this.id = id;
  this.level = level;
  this.color = color;
  this.costs = costs;

  return this;
}
Card.prototype.toJSON = function() {
  return {
    id: this.id,
    level: this.level,
    color: this.color,
    costs: this.costs,
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
Deck.prototype.drawAll = function() {
  var ret = this.cards_;
  this.cards_ = [];
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
    chips: this.chips,
  };
};

function Game(players) {
  this.id_ = _.uniqueId('game_');
  this.players_ = players;

  this.lastCardID_ = 100;
  this.cardsByID_ = {};

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
  invariant_violation('unimplemented');
  var card = new Card(this.lastCardID_, card_def.name, card_def.type, card_def.cost, card_def.ages, card_def.effect);
  this.lastCardID_ += 1;
  this.cardsByID_[card.getID()] = card;
  return card;
};

Game.prototype.bumpSequenceID = function() {
  this.sequenceID_ += 1;
};

Game.prototype.setUpGame = function() {
  this.gameStartTimestamp_ = Date.now();
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
