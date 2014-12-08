/**
 * @jsx React.DOM
 */

var React = require('react');

var GemView = React.createClass({
  render: function() {
    return <span className={'gem gem-'+this.props.color}></span>;
  },
});

module.exports = GemView;
