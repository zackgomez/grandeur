/**
 * @jsx React.DOM
 */
var Colors = require('./Colors');
var _ = require('underscore');
var React = require('react');

var NobleView = React.createClass({
  propTypes: {
    noble: React.PropTypes.object.isRequired,
    onClick: React.PropTypes.func,
  },
  render: function() {
    var noble = this.props.noble;
    var costs = [];
    _.each(Colors, function(color) {
      var color_cost = noble.cost[color];
      if (!color_cost) { return; }
      costs.push(<div key={color} className={'color-cost ' + color}>{color_cost}</div>);
    });
    var theCallback = this.props.onClick;
    var f = function() {
      theCallback();
    }
    return (
      <div className="noble-tile" onClick={f}>
        <div className="noble-points-container"><div className="noble-points">{noble.points}</div></div>
        <div className="noble-cost">{costs}</div>
      </div>
    );
  },
});


module.exports = NobleView;
