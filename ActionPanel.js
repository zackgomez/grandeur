/**
 * @jsx React.DOM
 */
var React = require('react');
var Session = require('./Session');
var _ = require('underscore');

var ActionPanelOverviewItem = React.createClass({
  render: function () {
    var title = this.props.actionTitle;
    console.log(this.props);
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
  // activePlayer, session, and game are props
  propTypes : {
    localPlayer : React.PropTypes.any.isRequired,
    session : React.PropTypes.instanceOf(Session).isRequired,
    game : React.PropTypes.any.isRequired,
  },

  render: function() {
    console.log(this.props);

    var game = this.props.game;
    var localPlayer = this.props.localPlayer;
    var localPlayerIndex = _.indexOf(game.players, localPlayer);
    if (localPlayerIndex != game.currentPlayerIndex) {
      console.log("not the current player's turn: not displaying");
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
