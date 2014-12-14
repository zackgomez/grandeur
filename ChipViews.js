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
    onChipEnter: React.PropTypes.func,
    onChipLeave: React.PropTypes.func,
  },
  handleMouseEnter: function() {
    this.props.onChipEnter && this.props.onChipEnter(this.props.color);
  },
  handleMouseLeave: function() {
    this.props.onChipLeave && this.props.onChipLeave(this.props.color);
  },
  render: function() {
    var class_string = 'chip ' + this.props.color;
    if (this.props.highlighted) {
      class_string += ' highlighted';
    }
    return (<span
      className={class_string}
      onMouseEnter={this.handleMouseEnter}
      onMouseLeave={this.handleMouseLeave}
    />);
  },
});

function generate_list_of_chips(chips_by_color) {
  return _.reduce(chips_by_color, function(memo, count, color) {
    _.times(count, function(i) {
      memo.push(<ChipView key={color + i} color={color} />);
    });
    return memo;
  }, []);
}

var ChipListView = React.createClass({
  propTypes: {
    chips: React.PropTypes.object.isRequired,
  },
  render: function() {
    var chips = generate_list_of_chips(this.props.chips);
    return (
      <div className="chip-list">
        {chips}
      </div>
    );
  },
});

var ChipPileView = React.createClass({
  propTypes: {
    color: React.PropTypes.oneOf(_.values(Colors)).isRequired,
    count: React.PropTypes.number.isRequired,
    onChipEnter: React.PropTypes.func,
    onChipLeave: React.PropTypes.func,
  },
  render: function() {
    var color = this.props.color;
    return (
      <div key={color}
        className={'chip-pile ' + color}
        onClick={this.props.onClick} >
        <ChipView color={color}
          highlighted={this.props.highlighted}
          onChipEnter={this.props.onChipEnter}
          onChipLeave={this.props.onChipLeave}
          />
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
  getInitialState: function() {
    return {hoveredColor: null};
  },
  onChipClick: function(color) {
    this.props.actionStore.didClickSupplyChip(color);
  },
  onChipEnter: function(color) {
    this.setState({hoveredColor: color});
  },
  onChipLeave: function(color) {
    this.setState({hoveredColor: null});
  },
  render: function() {
    var actionStore = this.props.actionStore;
    var selection = actionStore.getSelection();
    var chips = _.map(Colors, function (color) {
      var onClickFunc = _.partial(this.onChipClick, color);
      var highlight = actionStore.isPlayersTurn() &&
        (this.state.hoveredColor === color ||
         (selection && selection.chips && selection.chips[color] > 0));
      return (
        <ChipPileView
          key={color}
          color={color}
          highlighted={highlight}
          count={this.props.game.chipSupply[color]}
          onClick={onClickFunc}
          onChipEnter={this.onChipEnter}
          onChipLeave={this.onChipLeave}
        />
      );
    }, this);
    return (
      <div className="chip-supply">
        <span className="chip-supply-title">Chip Supply</span>
        <div className="chip-piles">
          {chips}
        </div>
      </div>
    );
  },
});

module.exports = {
  ChipView: ChipView,
  ChipListView: ChipListView,
  ChipSupplyView: ChipSupplyView,
  ChipPileView: ChipPileView,
};

