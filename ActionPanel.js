/**
 * @jsx React.DOM
 */
var React = require('react');

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
  render: function() {
    console.log(this.props);
    if (!this.props.activePlayer) {
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
