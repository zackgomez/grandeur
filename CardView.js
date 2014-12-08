/**
 * @jsx React.DOM
 */
var React = require('react');
var _ = require('underscore');

var Colors = require('./Colors');
var GemView = require('./GemView');

var CardView = React.createClass({
  handleMouseEnter: function(e) {
    this.props.onCardEnter && this.props.onCardEnter(this.props.card);
  },
  handleMouseLeave: function(e) {
    this.props.onCardLeave && this.props.onCardLeave(this.props.card);
  },
  handleClick: function(e) {
    if (this.props.onClick) {
      this.props.onClick(this.props.card);
    }
  },
  handleDoubleClick: function(e) {
    this.props.onDoubleClick && this.props.onDoubleClick(this.props.card);
  },
  render: function() {
    var card = this.props.card;
    var costs = [];
    _.each(Colors, function(color) {
      var color_cost = card.cost[color];
      if (!color_cost) { return; }
      costs.push(<div key={color} className={'color-cost ' + color}>{color_cost}</div>);
    });
    return (
      <div className={'card card-color-'+this.props.card.color + (this.props.highlighted ? ' highlighted' : '')}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
        onClick={this.handleClick}
        onDoubleClick={this.handleDoubleClick}
        >
        <div className="card-header">
          <div className="card-points">{card.points || null}</div>
          <GemView color={card.color} />
        </div>
        <div className="card-cost">{costs}</div>
      </div>
    );
  },
});

module.exports = CardView;
