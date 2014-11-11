var Colors = require('./Colors');

var nobles = [
  {cost: {Colors.BLACK: 4, Colors.WHITE: 4}, points: 3},
  {cost: {Colors.BLACK: 4, Colors.RED: 4}, points: 3},
  {cost: {Colors.GREEN: 4, Colors.RED: 4}, points: 3},
  {cost: {Colors.BLUE: 4, Colors.GREEN: 4}, points: 3},
  {cost: {Colors.BLUE: 4, Colors.WHITE: 4}, points: 3},

  {cost: {Colors.BLUE: 3, Colors.WHITE: 3, Colors.BLACK: 3}, points: 3},
  {cost: {Colors.GREEN: 3, Colors.RED: 3, Colors.BLACK: 3}, points: 3},
  {cost: {Colors.GREEN: 3, Colors.RED: 3, Colors.BLUE: 3}, points: 3},
  {cost: {Colors.RED: 3, Colors.WHITE: 3, Colors.BLACK: 3}, points: 3},
  {cost: {Colors.BLUE: 3, Colors.WHITE: 3, Colors.GREEN: 3}, points: 3},
];

var cards = [
  {level: 1, color: Colors.GREEN, points: 0, cost: {Colors.WHITE: 1, Colors.BLUE: 1, Colors.RED: 1, Colors.BLACK: 1}},
  {level: 1, color: Colors.GREEN, points: 0, cost: {Colors.WHITE: 1, Colors.BLUE: 1, Colors.RED: 1, Colors.BLACK: 2}},
  {level: 1, color: Colors.GREEN, points: 0, cost: {Colors.WHITE: 1, Colors.BLUE: 3, Colors.GREEN: 1}},
  {level: 1, color: Colors.GREEN, points: 0, cost: {Colors.BLUE: 1, Colors.RED: 2, Colors.BLACK: 2}},
  {level: 1, color: Colors.GREEN, points: 0, cost: {Colors.BLUE: 2, Colors.GREEN: 2}},
  {level: 1, color: Colors.GREEN, points: 0, cost: {Colors.WHITE: 2, Colors.BLUE: 1}},
  {level: 1, color: Colors.GREEN, points: 0, cost: {Colors.RED: 3}},
  {level: 1, color: Colors.GREEN, points: 1, cost: {Colors.BLACK: 4}},

  {level: 1, color: Colors.GREEN, points: 1, cost: {Colors.RED: 4}},
  {level: 1, color: Colors.GREEN, points: 0, cost: {Colors.BLACK: 3}},
  {level: 1, color: Colors.GREEN, points: 0, cost: {Colors.BLACK: 2, Colors.GREEN: 2}},
  {level: 1, color: Colors.GREEN, points: 0, cost: {Colors.BLACK: 2, Colors.WHITE: 1}},
  {level: 1, color: Colors.GREEN, points: 0, cost: {Colors.BLUE: 1, Colors.GREEN: 3, Colors.RED: 1}},
  {level: 1, color: Colors.GREEN, points: 0, cost: {Colors.WHITE: 1, Colors.GREEN: 2, Colors.RED: 2}},
  {level: 1, color: Colors.GREEN, points: 0, cost: {Colors.WHITE: 1, Colors.GREEN: 1, Colors.RED: 1, Colors.BLACK: 1}},
  {level: 1, color: Colors.GREEN, points: 0, cost: {Colors.WHITE: 1, Colors.GREEN: 1, Colors.RED: 2, Colors.BLACK: 1}},

  {level: 1, color: Colors.GREEN, points: 0, cost: {Colors.WHITE: 2, Colors.BLUE: 1, Colors.GREEN: 1, Colors.BLACK: 1}},
  {level: 1, color: Colors.GREEN, points: 0, cost: {Colors.WHITE: 1, Colors.BLUE: 1, Colors.GREEN: 1, Colors.BLACK: 1}},
  {level: 1, color: Colors.GREEN, points: 0, cost: {Colors.WHITE: 1, Colors.RED: 1, Colors.BLACK: 3}},
  {level: 1, color: Colors.GREEN, points: 0, cost: {Colors.WHITE: 2, Colors.GREEN: 1, Colors.BLACK: 2}},
  {level: 1, color: Colors.GREEN, points: 0, cost: {Colors.BLUE: 2, Colors.GREEN: 1}},
  {level: 1, color: Colors.GREEN, points: 0, cost: {Colors.WHITE: 2, Colors.RED: 2}},
  {level: 1, color: Colors.GREEN, points: 0, cost: {Colors.WHITE: 3}},
  {level: 1, color: Colors.GREEN, points: 1, cost: {Colors.WHITE: 4}},

  {level: 1, color: Colors.WHITE, points: 0, cost: {Colors.BLUE: 1, Colors.GREEN: 1, Colors.RED: 1, Colors.BLACK: 1}},
  {level: 1, color: Colors.WHITE, points: 0, cost: {Colors.BLUE: 1, Colors.GREEN: 2, Colors.RED: 1, Colors.BLACK: 1}},
  {level: 1, color: Colors.WHITE, points: 0, cost: {Colors.WHITE: 3, Colors.BLUE: 1, Colors.BLACK: 1}},
  {level: 1, color: Colors.WHITE, points: 0, cost: {Colors.BLUE: 2, Colors.GREEN: 2, Colors.BLACK: 1}},
  {level: 1, color: Colors.WHITE, points: 0, cost: {Colors.BLUE: 2, Colors.BLACK: 2}},
  {level: 1, color: Colors.WHITE, points: 0, cost: {Colors.RED: 2, Colors.BLACK: 1}},
  {level: 1, color: Colors.WHITE, points: 0, cost: {Colors.BLUE: 3}},
  {level: 1, color: Colors.WHITE, points: 1, cost: {Colors.GREEN: 4}},

  {level: 1, color: Colors.BLACK, points: 0, cost: {Colors.WHITE: 1, Colors.BLUE: 1, Colors.GREEN: 1, Colors.RED: 1}},
  {level: 1, color: Colors.BLACK, points: 0, cost: {Colors.WHITE: 1, Colors.BLUE: 2, Colors.GREEN: 1, Colors.RED: 1}},
  {level: 1, color: Colors.BLACK, points: 0, cost: {Colors.WHITE: 2, Colors.BLUE: 2, Colors.RED: 1}},
  {level: 1, color: Colors.BLACK, points: 0, cost: {Colors.GREEN: 1, Colors.RED: 3, Colors.BLACK: 1}},
  {level: 1, color: Colors.BLACK, points: 0, cost: {Colors.GREEN: 2, Colors.RED: 1}},
  {level: 1, color: Colors.BLACK, points: 0, cost: {Colors.WHITE: 2, Colors.GREEN: 2}},
  {level: 1, color: Colors.BLACK, points: 0, cost: {Colors.GREEN: 3}},
  {level: 1, color: Colors.BLACK, points: 1, cost: {Colors.GREEN: 4}},



  {level: 2, color: Colors.BLACK, points: 1, cost: {Colors.WHITE: 3, Colors.GREEN: 3, Colors.BLACK: 2}},
  {level: 2, color: Colors.BLACK, points: 1, cost: {Colors.WHITE: 3, Colors.BLUE: 2, Colors.GREEN: 2}},
  {level: 2, color: Colors.BLACK, points: 2, cost: {Colors.BLUE: 1, Colors.GREEN: 4, Colors.RED: 2}},
  {level: 2, color: Colors.BLACK, points: 2, cost: {Colors.GREEN: 5, Colors.RED: 3}},
  {level: 2, color: Colors.BLACK, points: 2, cost: {Colors.WHITE: 5}},
  {level: 2, color: Colors.BLACK, points: 3, cost: {Colors.BLACK: 6}},

  {level: 2, color: Colors.WHITE, points: 1, cost: {Colors.WHITE: 2, Colors.BLUE: 3, Colors.RED: 3}},
  {level: 2, color: Colors.WHITE, points: 1, cost: {Colors.GREEN: 3, Colors.RED: 2, Colors.BLACK: 2}},
  {level: 2, color: Colors.WHITE, points: 2, cost: {Colors.GREEN: 1, Colors.RED: 4, Colors.BLACK: 2}},
  {level: 2, color: Colors.WHITE, points: 2, cost: {Colors.RED: 5, Colors.BLACK: 3}},
  {level: 2, color: Colors.WHITE, points: 2, cost: {Colors.RED: 5}},
  {level: 2, color: Colors.WHITE, points: 3, cost: {Colors.WHITE: 6}},

  {level: 2, color: Colors.RED, points: 1, cost: {Colors.WHITE: 2, Colors.RED: 2, Colors.BLACK: 3}},
  {level: 2, color: Colors.RED, points: 1, cost: {Colors.BLUE: 3, Colors.RED: 2, Colors.BLACK: 3}},
  {level: 2, color: Colors.RED, points: 2, cost: {Colors.WHITE: 1, Colors.BLUE: 4, Colors.GREEN: 2}},
  {level: 2, color: Colors.RED, points: 2, cost: {Colors.WHITE: 3, Colors.BLACK: 5}},
  {level: 2, color: Colors.RED, points: 2, cost: {Colors.BLACK: 5}},
  {level: 2, color: Colors.RED, points: 3, cost: {Colors.RED: 6}},

  {level: 2, color: Colors.BLUE, points: 1, cost: {Colors.BLUE: 2, Colors.GREEN: 3, Colors.BLACK: 3}},
  {level: 2, color: Colors.BLUE, points: 1, cost: {Colors.BLUE: 2, Colors.GREEN: 2, Colors.RED: 3}},
  {level: 2, color: Colors.BLUE, points: 2, cost: {Colors.WHITE: 2, Colors.RED: 1, Colors.BLACK: 4}},
  {level: 2, color: Colors.BLUE, points: 2, cost: {Colors.WHITE: 5, Colors.BLUE: 3}},
  {level: 2, color: Colors.BLUE, points: 2, cost: {Colors.BLUE: 5}},
  {level: 2, color: Colors.BLUE, points: 3, cost: {Colors.BLUE: 6}},

  {level: 2, color: Colors.GREEN, points: 1, cost: {Colors.WHITE: 3, Colors.GREEN: 2, Colors.RED: 3}},
  {level: 2, color: Colors.GREEN, points: 1, cost: {Colors.WHITE: 2, Colors.BLUE: 3, Colors.BLACK: 2}},
  {level: 2, color: Colors.GREEN, points: 2, cost: {Colors.WHITE: 4, Colors.BLUE: 2, Colors.BLACK: 1}},
  {level: 2, color: Colors.GREEN, points: 2, cost: {Colors.BLUE: 5, Colors.GREEN: 3}},
  {level: 2, color: Colors.GREEN, points: 2, cost: {Colors.GREEN: 5}},
  {level: 2, color: Colors.GREEN, points: 3, cost: {Colors.GREEN: 6}},

  {level: 3, color: Colors.WHITE, points: 3, cost: {Colors.BLUE: 3, Colors.GREEN: 3, Colors.RED: 5, Colors.BLACK: 3}},
  {level: 3, color: Colors.WHITE, points: 4, cost: {Colors.WHITE: 3, Colors.RED: 3, Colors.BLACK: 6}},
  {level: 3, color: Colors.WHITE, points: 5, cost: {Colors.WHITE: 3, Colors.BLACK: 7}},
  {level: 3, color: Colors.WHITE, points: 4, cost: {Colors.BLACK: 7}},

  {level: 3, color: Colors.BLACK, points: 3, cost: {Colors.WHITE: 3, Colors.BLUE: 3, Colors.GREEN: 5, Colors.RED: 3}},
  {level: 3, color: Colors.BLACK, points: 4, cost: {Colors.GREEN: 3, Colors.RED: 6, Colors.BLACK: 3}},
  {level: 3, color: Colors.BLACK, points: 5, cost: {Colors.RED: 7, Colors.BLACK: 3}},
  {level: 3, color: Colors.BLACK, points: 4, cost: {Colors.RED: 7}},

  {level: 3, color: Colors.GREEN, points: 3, cost: {Colors.WHITE: 5, Colors.BLUE: 3, Colors.RED: 3, Colors.BLACK: 3}},
  {level: 3, color: Colors.GREEN, points: 4, cost: {Colors.WHITE: 3, Colors.RED: 6, Colors.GREEN: 3}},
  {level: 3, color: Colors.GREEN, points: 5, cost: {Colors.BLUE: 7, Colors.GREEN: 3}},
  {level: 3, color: Colors.GREEN, points: 4, cost: {Colors.BLUE: 7}},

  {level: 3, color: Colors.BLUE, points: 3, cost: {Colors.WHITE: 3, Colors.GREEN: 3, Colors.RED: 3, Colors.BLACK: 5}},
  {level: 3, color: Colors.BLUE, points: 4, cost: {Colors.WHITE: 6, Colors.BLUE: 3, Colors.BLACK: 3}},
  {level: 3, color: Colors.BLUE, points: 5, cost: {Colors.WHITE: 7, Colors.BLUE: 3}},
  {level: 3, color: Colors.BLUE, points: 4, cost: {Colors.WHITE: 7}},

  {level: 3, color: Colors.RED, points: 3, cost: {Colors.WHITE: 3, Colors.BLUE: 5, Colors.GREEN: 3, Colors.BLACK: 3}},
  {level: 3, color: Colors.RED, points: 4, cost: {Colors.BLUE: 3, Colors.GREEN: 6, Colors.RED: 3}},
  {level: 3, color: Colors.RED, points: 5, cost: {Colors.GREEN: 7, Colors.RED: 3}},
  {level: 3, color: Colors.RED, points: 4, cost: {Colors.GREEN: 7}},
];

module.exports = {
  Nobles: nobles,
  Cards: cards,
};
