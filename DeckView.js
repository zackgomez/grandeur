
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
  },
  render: function() {
    var dots = _.times(this.props.level, function(n) {
      return <span key={n} className="level-dot" />;
    });
    var size_view = _.has(this.props, 'size') ?
        <div className="deck-size">{this.props.size}</div> :
         null;
    return (
      <div
        className={'deck level-' + this.props.level + (this.props.highlighted ? ' highlighted' : '')}
        onClick={this.props.onClick}
      >
        {size_view}
        <div className="level-dots">{dots}</div>
      </div>
    );
  },
});

module.exports = DeckView;
