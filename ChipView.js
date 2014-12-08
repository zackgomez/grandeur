/**
 * @jsx React.DOM
 */
"use strict";
var React = require('react');
var _ = require('underscore');
var Colors = require('./Colors');

var ChipView = React.createClass({
  propTypes: {
    color: React.PropTypes.oneOf(_.values(Colors)).isRequired,
    highlighted: React.PropTypes.bool,
  },
  render: function() {
    return <span className={'chip ' + this.props.color + (this.props.highlighted ? ' highlighted' : '')} />;
  },
});

module.exports = ChipView;
