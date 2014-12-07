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

module.exports = Player;
