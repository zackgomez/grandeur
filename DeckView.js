
/**
 * @jsx React.DOM
 */
var React = require('react');
var _ = require('underscore');

var DeckView = React.createClass({
  propTypes: {
    level: React.PropTypes.number.isRequired,
    size: React.PropTypes.number,
    highlighted: React.PropTypes.bool,
    onMouseEnter: React.PropTypes.func,
    onMouseLeave: React.PropTypes.func,
  },
  handleMouseEnter: function() {
    this.props.onMouseEnter && this.props.onMouseEnter(this.props.level);
  },
  handleMouseLeave: function() {
    this.props.onMouseLeave && this.props.onMouseLeave(this.props.level);
  },
  render: function() {
    var dots = _.times(this.props.level, function(n) {
      return <span key={n} className="level-dot" />;
    });
    var size_view = <div className="deck-size">{this.props.size || ''}</div>;
    return (
      <div
        className={'deck level-' + this.props.level + (this.props.highlighted ? ' highlighted' : '')}
        onClick={this.props.onClick}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
      >
        {size_view}
        <div className="level-dots">{dots}</div>
      </div>
    );
  },
});

module.exports = DeckView;
