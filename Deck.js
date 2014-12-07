var _ = require('underscore');

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

module.exports = Deck;
