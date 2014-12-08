/**
 * @jsx React.DOM
 */
var React = require('react');
var Session = require('./Session');
var _ = require('underscore');
var ActionStore = require('./ActionStore');
var CardView = require('./CardView');
var DeckView = require('./DeckView');
var GameMutator = require('./GameMutator');

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

var ActionPanelCardSelectionDetail = React.createClass({
  propTypes: {
    card: React.PropTypes.object.isRequired,
    onBuildCard: React.PropTypes.func,
    onReserveCard: React.PropTypes.func,
  },
  render: function() {
    return (
      <div className="action-panel card-detail">
        <div className="detail-title">Selected Card</div>
        <CardView card={this.props.card} />
        <button onClick={this.props.onBuildCard}>Build</button>
        <button onClick={this.props.onReserveCard}>Reserve</button>
      </div>
    );
  },
});

var ActionPanelDeckSelectionDetail = React.createClass({
  propTypes: {
    level: React.PropTypes.number.isRequired,
    onReserveCard: React.PropTypes.func,
  },
  render: function() {
    return (
      <div className="action-panel card-detail">
        <div className="detail-title">Selected Deck</div>
        <DeckView level={this.props.level} />
        <button onClick={this.props.onReserveCard}>
          Reserve random level {this.props.level} card
        </button>
      </div>
    );
  },
});

var ActionPanel = React.createClass({
  propTypes: {
    session: React.PropTypes.instanceOf(Session).isRequired,
    game: React.PropTypes.any.isRequired,
    actionStore: React.PropTypes.instanceOf(ActionStore).isRequired,
  },

  componentWillMount: function() {
    this.props.actionStore.addListener(this.onActionStoreChange);
  },
  componentWillUmount: function() {
    this.props.actionStore.removeListener(this.onActionStoreChange);
  },

  onActionStoreChange: function() {
    this.forceUpdate();
  },
  onReserveCard: function() {
    var selection = this.props.actionStore.getSelection();
    var selection_type = this.props.actionStore.getSelectionType();
    if (selection_type === ActionStore.SelectionTypes.CARD ||
        selection_type === ActionStore.SelectionTypes.DECK) {
      GameMutator.reserveCard(this.props.game.id, selection.level, selection.cardID);
    }
  },
  onBuildCard: function() {
    var selection = this.props.actionStore.getSelection();
    var selection_type = this.props.actionStore.getSelectionType();
    if (selection_type === ActionStore.SelectionTypes.CARD) {
      GameMutator.buildTableCard(this.props.game.id, selection.level, selection.cardID);
    }
  },

  render: function() {
    var game = this.props.game;
    var actionStore = this.props.actionStore;
    if (!actionStore.isPlayersTurn()) {
      return <div />
    }
    var selection = actionStore.getSelection();
    var selection_type = actionStore.getSelectionType();
    if (selection_type === ActionStore.SelectionTypes.NONE) {
      return (
        <ActionPanelOverview
        session={this.props.session}
        game={this.props.session}
        />
      );
    } else if (selection_type === ActionStore.SelectionTypes.CARD) {
      var selected_card = game.cardsByID[selection.cardID];
      return <ActionPanelCardSelectionDetail
        card={selected_card}
        onBuildCard={this.onBuildCard}
        onReserveCard={this.onReserveCard}
      />;
    } else if (selection_type === ActionStore.SelectionTypes.DECK) {
      return <ActionPanelDeckSelectionDetail
        level={selection.level}
        onReserveCard={this.onReserveCard}
      />;
    } else {
      return (
        <div className="action-panel">
          SELECTION TYPE: {selection_type}
          SELECTION: {JSON.stringify(actionStore.getSelection())}
        </div>
      );
    }
  }
});

module.exports = {
  ActionPanel: ActionPanel
};
