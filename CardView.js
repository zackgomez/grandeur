/**
 * @jsx React.DOM
 */
var React = require('react');
var _ = require('underscore');

var Colors = require('./Colors');
var GemView = require('./GemView');
var DeckView = require('./DeckView');

var CardView = React.createClass({
  propTypes: {
    card: React.PropTypes.object.isRequired,
    faceDown: React.PropTypes.bool,
    highlighted: React.PropTypes.bool,
    initialPosition: React.PropTypes.shape({
      x: React.PropTypes.number.isRequired,
      y: React.PropTypes.number.isRequired,
    }),
    onCardEnter: React.PropTypes.func,
    onCardLeave: React.PropTypes.func,
    onClick: React.PropTypes.func,
    onDoubleClick: React.PropTypes.func,
    onCardRendered: React.PropTypes.func,
  },
  wasRendered_: function() {
    this.props.onCardRendered && this.props.onCardRendered(
      this.props.card,
      this.getDOMNode()
    );
  },
  getInitialState: function() {
    return {};
  },
  componentDidMount: function() {
    this.wasRendered_();
  },
  componentWillUnmount: function() {
    this.wasRendered_();
  },
  componentDidUpdate: function() {
    this.wasRendered_();
  },
  componentWillEnter: function(callback) {
    if (this.props.initialPosition) {
      var rect = this.getDOMNode().getBoundingClientRect();
      var current_position = {
        x: rect.left + window.pageXOffset,
        y: rect.top + window.pageYOffset,
      };
      var translation = {
        x: this.props.initialPosition.x - current_position.x,
        y: this.props.initialPosition.y - current_position.y,
      };
      console.log('will enter', this.props.card.id);
      console.log('initial position', this.props.initialPosition);
      console.log('current position', rect, current_position);
      this.setState({style: {
        transform: 'translate('+translation.x+'px,'+translation.y+'px)',
      }});
      setTimeout(function() {
        callback();
      }, 16);
    } else {
      callback();
    }
  },
  componentDidEnter: function() {
    this.setState({style: {
      transition: 'transform .5s ease-in',
    }});
    this.wasRendered_();
  },
  componentWillLeave: function(callback) {
    callback();
  },
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
    if (this.props.faceDown) {
      return <DeckView level={this.props.card.level} highlighted={this.props.highlighted} />;
    }
    var style = {
    };
    style = _.extend(style, this.state.style || {});
    return (
      <div style={style} className={'card card-color-'+this.props.card.color + (this.props.highlighted ? ' highlighted' : '')}
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
