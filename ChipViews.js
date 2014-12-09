/**
 * @jsx React.DOM
 */
"use strict";
var React = require('react');
var _ = require('underscore');
var Colors = require('./Colors');
var ActionStore = require('./ActionStore');

var ChipView = React.createClass({
  propTypes: {
    color: React.PropTypes.oneOf(_.values(Colors)).isRequired,
    highlighted: React.PropTypes.bool,
  },
  render: function() {
    return <span className={'chip ' + this.props.color + (this.props.highlighted ? ' highlighted' : '')} />;
  },
});


var ChipPileView = React.createClass({
  propTypes: {
    color: React.PropTypes.oneOf(_.values(Colors)).isRequired,
    count: React.PropTypes.number.isRequired,
  },
  render: function() {
    var color = this.props.color;
    return (
      <div key={color}
        className={'chip-pile ' + color}
        onClick={this.props.onClick} >
        <ChipView color={color}
          highlighted={this.props.highlighted} />
        <span className="chip-count">{this.props.count}</span>
      </div>
    );
  },
});

var ChipSupplyView = React.createClass({
  propTypes: {
    actionStore: React.PropTypes.instanceOf(ActionStore).isRequired,
    game: React.PropTypes.object.isRequired,
  },
  onChipClick: function(color) {
    this.props.actionStore.didClickSupplyChip(color);
  },
  render: function() {
    var chips = _.map(Colors, function (color) {
      var onClickFunc = _.partial(this.onChipClick, color);
      var highlight = false;
      return (
        <ChipPileView
          key={color}
          color={color}
          highlighted={highlight}
          count={this.props.game.chipSupply[color]}
          onClick={onClickFunc}
        />
      );
    }, this);
    return (
      <div className="chip-supply">
        <div className="chip-piles">
          {chips}
        </div>
      </div>
    );
  },
});

module.exports = {
  ChipView: ChipView,
  ChipSupplyView: ChipSupplyView,
  ChipPileView: ChipPileView,
};

