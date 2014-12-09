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

Player.getPlayerScore = function(playerJSON) {
  var score = 0;
  _.each(playerJSON.board, function(card) {
    score += card.points;
  });
  _.each(playerJSON.nobles, function(noble) {
    score += noble.points;
  });
  return score;
};

Player.prototype.getScore = function() {
  return Player.getPlayerScore(this);
};

// map: color name string --> discount for that color
Player.prototype.getDiscountMap = function() {
  return Player.getDiscountMap(this);
};

Player.getDiscountMap = function(playerJSON) {
  return _.countBy(playerJSON.board, function(card) {
    return card.color;
  });
};

Player.prototype.canSelectNoble = function(noble) {
  var discount = this.getDiscountMap();
  return _.every(noble.cost, function(count, color) {
    return discount[color] >= count;
  });
};

Player.chipCountForPlayer = function(playerJSON) {
  var total_chips = 0;
  _.each(playerJSON.chips, function(count, color) {
    total_chips += count;
  });
  return total_chips;
};

Player.prototype.getChipCount = function() {
  return Player.chipCountForPlayer(this);
};

module.exports = Player;
