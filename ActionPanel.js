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
var ChipView = require('./ChipViews').ChipView;
var RequestTypes = require('./RequestTypes');

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
    return (
      <div className="action-panel">
        <ActionPanelOverviewItem actionTitle="Build" />
        <ActionPanelOverviewItem actionTitle="Draft" />
        <ActionPanelOverviewItem actionTitle="Reserve" />
      </div>
    );
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

var ActionPanelHandCardSelectionDetail = React.createClass({
  propTypes: {
    card: React.PropTypes.object.isRequired,
    onBuildCard: React.PropTypes.func,
  },
  render: function() {
    return (
      <div className="action-panel card-detail">
        <div className="detail-title">Build Card from Hand</div>
        <CardView card={this.props.card} />
        <button onClick={this.props.onBuildCard}>Build</button>
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

function generateChipViews(list_of_chips) {
  if (list_of_chips == null) {
    return (
      <script />
    );
  }
  return _.reduce(list_of_chips, function(memo, count, color) {
    _.times(count, function(i) {
      memo.push(<ChipView key={color + i} color={color} />);
    });
    return memo;
  }, []);
}

var ActionPanelChipSelectionDetail = React.createClass({
  propTypes: {
    chips: React.PropTypes.object.isRequired,
    onDraftChips: React.PropTypes.func,
  },
  render: function() {
    var chip_views = generateChipViews(this.props.chips);
    return (
      <div className="action-panel card-detail">
        <div className="detail-title">Selected Chips</div>
        <div className="chips">
          {chip_views}
        </div>
        <button onClick={this.props.onDraftChips}>
          Take Chips
        </button>
      </div>
    );
  },
});

var ActionPanelDiscardChipsDetail = React.createClass({
  propTypes: {
    discard_chips: React.PropTypes.object,
    player_chip_count: React.PropTypes.number.isRequired,
    onDiscardChipsClicked: React.PropTypes.func.isRequired,
  },
  render: function() {
    var chip_views = generateChipViews(this.props.discard_chips);
    var chip_surplus = this.props.player_chip_count - 10;
    var num_chips_to_discard;
    _.each(this.props.discard_chips, function(value) {
      num_chips_to_discard += value;
    });
    var num_chips_to_discard = chip_surplus - num_chips_to_discard;

    var text = chip_surplus + 'is too many chips.  Discard ' + num_chips_to_discard + ' chips to continue.';
    var submit_button = <button onClick={this.props.onDiscardChipsClicked}>OK, take 'em </button>;

    submit_button.enabled = num_chips_to_discard == 0;
    return (
      <div className="action-panel">
        {text}
        <div className="chips">
          {chip_views}
        </div>

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
  onBuildHandCard: function() {
    var selection = this.props.actionStore.getSelection();
    var selection_type = this.props.actionStore.getSelectionType();
    if (selection_type === ActionStore.SelectionTypes.HAND_CARD) {
      GameMutator.buildHandCard(this.props.game.id, selection.cardID);
    }
  },
  onDraftChips: function() {
    var selection = this.props.actionStore.getSelection();
    var selection_type = this.props.actionStore.getSelectionType();
    if (selection_type === ActionStore.SelectionTypes.CHIPS) {
      GameMutator.draftChips(this.props.game.id, selection.discard_chips);
    }
  },
  onDiscardChips: function() {
    var selection = this.props.actionStore.getSelection();
    GameMutator.discardChips(this.props.game.id, selection.discard_chips);
    // TODO  validate based on selection
  },
  renderDiscard: function() {
    var selection_or_null = this.props.actionStore.getSelection();
    if (selection_or_null != null) {
      selection_or_null = selection_or_null.discard_chips;
    }
    return (
      <ActionPanelDiscardChipsDetail
        discard_chips={selection_or_null}
        onDiscardChipsClicked={this.onDiscardChips}
      />);
  },

  render: function() {
    var game = this.props.game;
    var player = this.props.game.players[this.props.actionStore.getPlayerIndex()];
    var actionStore = this.props.actionStore;
    if (!actionStore.isPlayersTurn()) {
      return <script />;
    }
    var selection = actionStore.getSelection();
    var selection_type = actionStore.getSelectionType();

    var request_type = game.currentRequest;

    if (request_type == RequestTypes.DISCARD_CHIPS) {
      return this.renderDiscard();
    }
    if (request_type == RequestTypes.SELECT_NOBLE) {
      return <div className="action-panel">SELECT NOBLE TODO</div>;
    }

    if (selection_type === ActionStore.SelectionTypes.NONE) {
      if (request_type === RequestTypes.ACTION) {
        return (
          <ActionPanelOverview
          session={this.props.session}
          game={this.props.session}
          />
        );
      }
    } else if (selection_type === ActionStore.SelectionTypes.CARD) {
      var selected_card = game.cardsByID[selection.cardID];
      return <ActionPanelCardSelectionDetail
        card={selected_card}
        onBuildCard={this.onBuildCard}
        onReserveCard={this.onReserveCard}
      />;
    } else if (selection_type === ActionStore.SelectionTypes.HAND_CARD) {
      var selected_card = game.cardsByID[selection.cardID];
      return <ActionPanelHandCardSelectionDetail
        card={selected_card}
        onBuildCard={this.onBuildHandCard}
      />;
    } else if (selection_type === ActionStore.SelectionTypes.DECK) {
      return <ActionPanelDeckSelectionDetail
        level={selection.level}
        onReserveCard={this.onReserveCard}
      />;
    } else if (selection_type === ActionStore.SelectionTypes.CHIPS) {
      return <ActionPanelChipSelectionDetail
        chips={selection.chips}
        onDraftChips={this.onDraftChips}
      />;
    } else {
      return (
        <div className="action-panel">
          TODO DETAIL VIEW
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
