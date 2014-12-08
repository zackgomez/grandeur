var _ = require('underscore');


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

Player.fromJSON = function(json) {
  var player = new Player(json.userID);
  player.hand = json.hand;
  player.board = json.board;
  player.nobles = json.nobles;
  player.chips = json.chips;
  return player;
}

Player.prototype.getScore = function() {
  var score = 0;
  _.each(this.board, function(card) {
    score += card.points;
  });
  _.each(this.nobles, function(noble) {
    score += noble.points;
  });
  return score;
};

// map: color name string --> discount for that color
Player.prototype.getDiscountMap = function() {
  return _.countBy(this.board, function(card) {
    return card.color;
  });
};

Player.prototype.canSelectNoble = function(noble) {
  var discount = this.getDiscountMap();
  return _.every(noble.cost, function(count, color) {
    return discount[color] >= count;
  });
};

Player.prototype.getChipCount = function() {
  var total_chips = 0;
  _.each(this.chips, function(count, color) {
    total_chips += count;
  });
  return total_chips;
}

module.exports = Player;
