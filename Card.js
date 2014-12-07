
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

module.exports = Card;
