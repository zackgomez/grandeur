/**
 * @jsx React.DOM
 */
var React = require('react');
var Session = require('./Session');
var _ = require('underscore');

var ActionPanelOverviewItem = React.createClass({
  render: function () {
    var title = this.props.actionTitle;
    return (<div className="ap-overview-element">
      {this.props.actionTitle} 
    </div>);
  }
});

var ActionPanelOverview = React.createClass({
  render: function() {
    return (<div className="action-panel">
      <ActionPanelOverviewItem actionTitle="Build" />
      <ActionPanelOverviewItem actionTitle="Draft" />
      <ActionPanelOverviewItem actionTitle="Reserve" />
    </div>);
  }
});

var ActionPanel = React.createClass({
  propTypes : {
    localPlayer : React.PropTypes.any.isRequired,
    session : React.PropTypes.instanceOf(Session).isRequired,
    game : React.PropTypes.any.isRequired,
  },

  render: function() {
    var game = this.props.game;
    var localPlayer = this.props.localPlayer;
    var localPlayerIndex = _.indexOf(game.players, localPlayer);
    if (localPlayerIndex != game.currentPlayerIndex) {
      return <div />
    }
    return (<ActionPanelOverview 
      session = {this.props.session}
      game = {this.props.session} />);
  }
});

module.exports = {
  ActionPanel: ActionPanel
};
