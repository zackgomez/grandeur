var Colors = require('./Colors');

var nobles = [
  {cost: {black: 4, white: 4}, points: 3},
  {cost: {black: 4, red: 4}, points: 3},
  {cost: {green: 4, red: 4}, points: 3},
  {cost: {blue: 4, green: 4}, points: 3},
  {cost: {blue: 4, white: 4}, points: 3},

  {cost: {blue: 3, white: 3, black: 3}, points: 3},
  {cost: {green: 3, red: 3, black: 3}, points: 3},
  {cost: {green: 3, red: 3, blue: 3}, points: 3},
  {cost: {red: 3, white: 3, black: 3}, points: 3},
  {cost: {blue: 3, white: 3, green: 3}, points: 3},
];

var green = Colors.GREEN;
var red = Colors.RED;
var blue = Colors.BLUE;
var black = Colors.BLACK;
var white = Colors.WHITE;

var cards = [
  /* Level One Cards */
  {level: 1, color: green, points: 0, cost: {white: 1, blue: 1, red: 1, black: 1}},
  {level: 1, color: green, points: 0, cost: {white: 1, blue: 1, red: 1, black: 2}},
  {level: 1, color: green, points: 0, cost: {white: 1, blue: 3, green: 1}},
  {level: 1, color: green, points: 0, cost: {blue: 1, red: 2, black: 2}},
  {level: 1, color: green, points: 0, cost: {blue: 2, green: 2}},
  {level: 1, color: green, points: 0, cost: {white: 2, blue: 1}},
  {level: 1, color: green, points: 0, cost: {red: 3}},
  {level: 1, color: green, points: 1, cost: {black: 4}},

  {level: 1, color: blue, points: 1, cost: {red: 4}},
  {level: 1, color: blue, points: 0, cost: {black: 3}},
  {level: 1, color: blue, points: 0, cost: {black: 2, green: 2}},
  {level: 1, color: blue, points: 0, cost: {black: 2, white: 1}},
  {level: 1, color: blue, points: 0, cost: {blue: 1, green: 3, red: 1}},
  {level: 1, color: blue, points: 0, cost: {white: 1, green: 2, red: 2}},
  {level: 1, color: blue, points: 0, cost: {white: 1, green: 1, red: 1, black: 1}},
  {level: 1, color: blue, points: 0, cost: {white: 1, green: 1, red: 2, black: 1}},

  {level: 1, color: red, points: 0, cost: {white: 2, blue: 1, green: 1, black: 1}},
  {level: 1, color: red, points: 0, cost: {white: 1, blue: 1, green: 1, black: 1}},
  {level: 1, color: red, points: 0, cost: {white: 1, red: 1, black: 3}},
  {level: 1, color: red, points: 0, cost: {white: 2, green: 1, black: 2}},
  {level: 1, color: red, points: 0, cost: {blue: 2, green: 1}},
  {level: 1, color: red, points: 0, cost: {white: 2, red: 2}},
  {level: 1, color: red, points: 0, cost: {white: 3}},
  {level: 1, color: red, points: 1, cost: {white: 4}},

  {level: 1, color: white, points: 0, cost: {blue: 1, green: 1, red: 1, black: 1}},
  {level: 1, color: white, points: 0, cost: {blue: 1, green: 2, red: 1, black: 1}},
  {level: 1, color: white, points: 0, cost: {white: 3, blue: 1, black: 1}},
  {level: 1, color: white, points: 0, cost: {blue: 2, green: 2, black: 1}},
  {level: 1, color: white, points: 0, cost: {blue: 2, black: 2}},
  {level: 1, color: white, points: 0, cost: {red: 2, black: 1}},
  {level: 1, color: white, points: 0, cost: {blue: 3}},
  {level: 1, color: white, points: 1, cost: {green: 4}},

  {level: 1, color: black, points: 0, cost: {white: 1, blue: 1, green: 1, red: 1}},
  {level: 1, color: black, points: 0, cost: {white: 1, blue: 2, green: 1, red: 1}},
  {level: 1, color: black, points: 0, cost: {white: 2, blue: 2, red: 1}},
  {level: 1, color: black, points: 0, cost: {green: 1, red: 3, black: 1}},
  {level: 1, color: black, points: 0, cost: {green: 2, red: 1}},
  {level: 1, color: black, points: 0, cost: {white: 2, green: 2}},
  {level: 1, color: black, points: 0, cost: {green: 3}},
  {level: 1, color: black, points: 1, cost: {green: 4}},


  /* Level 2 Cards */
  {level: 2, color: black, points: 1, cost: {white: 3, green: 3, black: 2}},
  {level: 2, color: black, points: 1, cost: {white: 3, blue: 2, green: 2}},
  {level: 2, color: black, points: 2, cost: {blue: 1, green: 4, red: 2}},
  {level: 2, color: black, points: 2, cost: {green: 5, red: 3}},
  {level: 2, color: black, points: 2, cost: {white: 5}},
  {level: 2, color: black, points: 3, cost: {black: 6}},

  {level: 2, color: white, points: 1, cost: {white: 2, blue: 3, red: 3}},
  {level: 2, color: white, points: 1, cost: {green: 3, red: 2, black: 2}},
  {level: 2, color: white, points: 2, cost: {green: 1, red: 4, black: 2}},
  {level: 2, color: white, points: 2, cost: {red: 5, black: 3}},
  {level: 2, color: white, points: 2, cost: {red: 5}},
  {level: 2, color: white, points: 3, cost: {white: 6}},

  {level: 2, color: red, points: 1, cost: {white: 2, red: 2, black: 3}},
  {level: 2, color: red, points: 1, cost: {blue: 3, red: 2, black: 3}},
  {level: 2, color: red, points: 2, cost: {white: 1, blue: 4, green: 2}},
  {level: 2, color: red, points: 2, cost: {white: 3, black: 5}},
  {level: 2, color: red, points: 2, cost: {black: 5}},
  {level: 2, color: red, points: 3, cost: {red: 6}},

  {level: 2, color: blue, points: 1, cost: {blue: 2, green: 3, black: 3}},
  {level: 2, color: blue, points: 1, cost: {blue: 2, green: 2, red: 3}},
  {level: 2, color: blue, points: 2, cost: {white: 2, red: 1, black: 4}},
  {level: 2, color: blue, points: 2, cost: {white: 5, blue: 3}},
  {level: 2, color: blue, points: 2, cost: {blue: 5}},
  {level: 2, color: blue, points: 3, cost: {blue: 6}},

  {level: 2, color: green, points: 1, cost: {white: 3, green: 2, red: 3}},
  {level: 2, color: green, points: 1, cost: {white: 2, blue: 3, black: 2}},
  {level: 2, color: green, points: 2, cost: {white: 4, blue: 2, black: 1}},
  {level: 2, color: green, points: 2, cost: {blue: 5, green: 3}},
  {level: 2, color: green, points: 2, cost: {green: 5}},
  {level: 2, color: green, points: 3, cost: {green: 6}},

  /* Level 3 Cards */
  {level: 3, color: white, points: 3, cost: {blue: 3, green: 3, red: 5, black: 3}},
  {level: 3, color: white, points: 4, cost: {white: 3, red: 3, black: 6}},
  {level: 3, color: white, points: 5, cost: {white: 3, black: 7}},
  {level: 3, color: white, points: 4, cost: {black: 7}},

  {level: 3, color: black, points: 3, cost: {white: 3, blue: 3, green: 5, red: 3}},
  {level: 3, color: black, points: 4, cost: {green: 3, red: 6, black: 3}},
  {level: 3, color: black, points: 5, cost: {red: 7, black: 3}},
  {level: 3, color: black, points: 4, cost: {red: 7}},

  {level: 3, color: green, points: 3, cost: {white: 5, blue: 3, red: 3, black: 3}},
  {level: 3, color: green, points: 4, cost: {white: 3, red: 6, green: 3}},
  {level: 3, color: green, points: 5, cost: {blue: 7, green: 3}},
  {level: 3, color: green, points: 4, cost: {blue: 7}},

  {level: 3, color: blue, points: 3, cost: {white: 3, green: 3, red: 3, black: 5}},
  {level: 3, color: blue, points: 4, cost: {white: 6, blue: 3, black: 3}},
  {level: 3, color: blue, points: 5, cost: {white: 7, blue: 3}},
  {level: 3, color: blue, points: 4, cost: {white: 7}},

  {level: 3, color: red, points: 3, cost: {white: 3, blue: 5, green: 3, black: 3}},
  {level: 3, color: red, points: 4, cost: {blue: 3, green: 6, red: 3}},
  {level: 3, color: red, points: 5, cost: {green: 7, red: 3}},
  {level: 3, color: red, points: 4, cost: {green: 7}},
];

module.exports = {
  Nobles: nobles,
  Cards: cards,
};
