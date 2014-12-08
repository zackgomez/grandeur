/**
 * @jsx React.DOM
 */
"use strict";
var ActionTypes = require('./ActionTypes');
var React = require('react');
var ReactAsync = require('react-async');
var ReactRouter = require('react-router-component');
var CloudListener = require('./CloudListener');
var superagent = require('superagent');
var WebSocket = require('ws');
var _ = require('underscore');
var LobbyMutator = require('./LobbyMutator');
var AP = require('./ActionPanel');
var ActionPanel = AP.ActionPanel;
var LobbyStore = require('./LobbyStore');
var BaseURL = require('./BaseURL');
var UserFetcher = require('./UserFetcher');
var Session = require('./Session');
var Pages       = ReactRouter.Pages;
var Page        = ReactRouter.Page;
var NotFound    = ReactRouter.NotFound;
var Link        = ReactRouter.Link;
var GameStore = require('./GameStore');
var Immutable = require('immutable');
var Colors = require('./Colors');
var invariant = require('./invariant');


var navigateToHref = function(href, cb) {
  cb = cb || function() {};
  ReactRouter.environment.defaultEnvironment.navigate(href, cb);
};

var GameMutator = {
  sendChatMessage: function(gameID, userID, text) {
    this.sendAction(
      gameID,
      ActionTypes.SEND_CHAT,
      {
        text: text,
      }
    );
  },
  buildHandCard: function(gameID, cardID) {
    this.sendAction(
      gameID,
      ActionTypes.BUILD_HAND_CARD,
      {
        cardID: cardID,
      }
    );
  },
  buildTableCard: function(gameID, level, cardID) {
    this.sendAction(
      gameID,
      ActionTypes.BUILD_TABLE_CARD,
      {
        level: level,
        cardID: cardID,
      }
    );
  },
  reserveCard: function(gameID, level, cardID) {
    this.sendAction(
      gameID,
      ActionTypes.RESERVE_CARD,
      {
        level: level,
        cardID: cardID,
      }
    );
  },
  draftChips: function(gameID, colors) {
    var color_counts = {};
    _.each(colors, function(color) {
      color_counts[color] = 1 + (color_counts[color] || 0);
    });
    this.sendAction(
      gameID,
      ActionTypes.DRAFT_CHIPS,
      {
        color_counts: color_counts,
      }
    );
  },
  sendAction: function(gameID, action_type, payload) {
    var action = { type: action_type, payload: payload };
    superagent.post('/api/game/' + gameID + '/add_action')
      .send({action: action})
      .set('Accept', 'application/json')
      .end(function(res) {
        if (!res.ok) {
          console.log('error sending action', res.text);
          return;
        }
      });
  },
};


var Card = React.createClass({
  handleMouseEnter: function(e) {
    this.props.onCardEnter && this.props.onCardEnter(this.props.card);
  },
  handleMouseLeave: function(e) {
    this.props.onCardLeave && this.props.onCardLeave(this.props.card);
  },
  handleClick: function(e) {
    if (this.props.onClick) {
      this.props.onClick(this.props.card);
    }
  },
  handleDoubleClick: function(e) {
    this.props.onDoubleClick && this.props.onDoubleClick(this.props.card);
  },
  render: function() {
    var card = this.props.card;
    var costs = [];
    _.each(Colors, function(color) {
      var color_cost = card.cost[color];
      if (!color_cost) { return; }
      costs.push(<div key={color} className={'color-cost ' + color}>{color_cost}</div>);
    });
    return (
      <div className={'card card-color-'+this.props.card.color + (this.props.highlighted ? ' highlighted' : '')}
        onMouseEnter={this.handleMouseEnter} 
        onMouseLeave={this.handleMouseLeave}
        onClick={this.handleClick}
        onDoubleClick={this.handleDoubleClick}
        >
        <div className="card-header">
          <div className="card-points">{card.points || null}</div>
          <GemView color={card.color} />
        </div>
        <div className="card-cost">{costs}</div>
      </div>
    );
  },
});

var GemView = React.createClass({
  render: function() {
    return <span className={'gem gem-'+this.props.color}></span>;
  },
});

var ChipView = React.createClass({
  render: function() {
    return <span className={'chip ' + this.props.color + (this.props.highlighted ? ' highlighted' : '')} />;
  },
});

var ChipSupplyActionsView = React.createClass({
  onDraft: function() {
    this.props.onDraftChips && this.props.onDraftChips(this.props.selectedChips);
  },
  onDoubleDraft: function() {
    var selection = this.props.selectedChips;
    invariant(selection.length === 1);
    selection = selection.concat(selection[0]);
    this.props.onDraftChips && this.props.onDraftChips(selection);
  },
  onClearSelection: function() {
    this.props.onClearSelection && this.props.onClearSelection();
  },
  render: function() {
    var game = this.props.game;
    var selectedChips = this.props.selectedChips || [];
    var draft_string = 'Draft ...';
    var draft_two_string = 'Draft 2 ' + (selectedChips.length === 1 ? _.first(selectedChips) : '...');
    return (
      <div className="chip-supply-actions">
        <button
          disabled={selectedChips.length === 0 || selectedChips.length > 3}
          onClick={this.onDraft} >
          {draft_string}
        </button>
        <button
          disabled={selectedChips.length !== 1}
          onClick={this.onDoubleDraft} >
          {draft_two_string}
        </button>
        <button
          disabled={_.isEmpty(selectedChips)}
          onClick={this.onClearSelection} >
          Clear Selection
        </button>
      </div>
    );
  },
});

var ChipPileView = React.createClass({
  render: function() {
    var color = this.props.color;
    return (
      <div key={color}
           className={'chip-pile ' + color}
           onClick={this.props.onClick} >
        <ChipView color={color}
                  highlighted={this.props.highlighted} />
        <span className="chip-count">{this.props.count}</span>
      </div>
    );
  },
});

var ChipSupplyView = React.createClass({
  getInitialState: function() {
    return {selectedChips: []};
  },
  onDraftChips: function(chips) {
    GameMutator.draftChips(this.props.game.id, chips);
    this.onClearSelection();
  },
  onClearSelection: function() {
    this.setState({selectedChips: []});
  },
  onChipClick: function(color) {
    if (color === Colors.JOKER) {
      return;
    }
    if (_.contains(this.state.selectedChips, color)) {
      this.setState({selectedChips: _.without(this.state.selectedChips, color)});
    } else {
      this.setState({selectedChips: this.state.selectedChips.concat(color)});
    }
  },
  render: function() {
    var chips = _.map(Colors, function (color) {
      var onClickFunc = _.partial(this.onChipClick, color);
      return (
        <ChipPileView
          key={color}
          color={color}
          highlighted={_.contains(this.state.selectedChips, color)}
          count={this.props.game.chipSupply[color]}
          onClick={onClickFunc}
          />
      );
    }, this);
    return (
      <div className="chip-supply">
        <div className="chip-piles">
          {chips}
        </div>
        <ChipSupplyActionsView
          session={this.props.session}
          selectedChips={this.state.selectedChips}
          onDraftChips={this.onDraftChips}
          onClearSelection={this.onClearSelection}
          />
      </div>
    );
  },
});

var NobleView = React.createClass({
  render: function() {
    var noble = this.props.noble;
    var costs = [];
    _.each(Colors, function(color) {
      var color_cost = noble.cost[color];
      if (!color_cost) { return; }
      costs.push(<div key={color} className={'color-cost ' + color}>{color_cost}</div>);
    });
    return (
      <div className="noble-tile">
        <div className="noble-points-container"><div className="noble-points">{noble.points}</div></div>
        <div className="noble-cost">{costs}</div>
      </div>
    );
  },
});

var NobleSupplyView = React.createClass({
  render: function() {
    var nobles = _.map(this.props.game.nobles, function(noble, i) {
      return <NobleView key={i} noble={noble} />
    });
    return (
      <div className="noble-supply">
        {nobles}
      </div>
    );
  },
});

var DeckView = React.createClass({
  render: function() {
    var dots = _.times(this.props.level, function(n) {
      return <span key={n} className="level-dot" />;
    });
    return (
      <div
        className={'deck level-' + this.props.level + (this.props.highlighted ? ' highlighted' : '')}
        onClick={this.props.onClick}
      >
        <div className="deck-size">{this.props.size}</div>
        <div className="level-dots">{dots}</div>
      </div>
    );
  },
});

var DraftingActionsView = React.createClass({
  render: function() {
    var game = this.game;
    var has_selection = _.contains([1, 2, 3], this.props.selectedLevel);
    var has_card_selection = has_selection && this.props.selectedCardID;
    var selected_object_string = '...';
    if (has_card_selection) {
      selected_object_string = ' level ' + this.props.selectedLevel + ' card';
    } else if (has_selection) {
      selected_object_string = ' random level ' + this.props.selectedLevel + ' card';
    }
    return (
      <div className="drafting-action-view">
        <button
          disabled={!has_card_selection}
          onClick={this.props.onBuildCard}
        >
          Build {selected_object_string}
        </button>
        <button
          disabled={!has_selection}
          onClick={this.props.onReserveCard}
        >
          Reserve {selected_object_string}
        </button>
      </div>
    );
  },
});

var DraftingView = React.createClass({
  getInitialState: function() {
    return {
      selectedLevel:null,
      selectedCardID:null,
    };
  },
  setSelection: function(level, cardID) {
    this.setState({
      selectedLevel: level,
      selectedCardID: cardID,
    });
  },
  onDeckClick: function(level) {
    if (this.state.selectedLevel === level && this.state.selectedCardID === null) {
      this.setSelection(null, null);
    } else {
      this.setSelection(level, null);
    }
  },
  onCardClick: function(card, level) {
    if (this.state.selectedCardID === card.id) {
      this.setSelection(null, null);
    } else {
      this.setSelection(level, card.id);
    }
  },
  onCardDoubleClick: function(card) {
  },
  onBuildCard: function() {
    GameMutator.buildTableCard(this.props.game.id, this.state.selectedLevel, this.state.selectedCardID);
    this.setSelection(null, null);
  },
  onReserveCard: function() {
    GameMutator.reserveCard(this.props.game.id, this.state.selectedLevel, this.state.selectedCardID);
    this.setSelection(null, null);
  },
  render: function() {
    var game = this.props.game;
    var levels = _.map(game.boards, function(board, i) {
      var level = i + 1;
      var cards = _.map(board, function(card) {
        var onCardClick = _.partial(this.onCardClick, card, level);
        var card_props = {
          card:card,
          key:card.id,
          onClick:onCardClick,
          onDoubleClick:this.onCardDoubleClick,
          onCardEnter:this.onCardEnter,
          onCardLeave:this.onCardLeave,
          highlighted:(this.state.selectedCardID === card.id),
        };
        return Card(card_props);
      }, this);
      var is_deck_selected = this.state.selectedLevel === level && !this.state.selectedCardID;
      var onDeckClick = _.partial(this.onDeckClick, level);
      return (
        <div key={i} className="drafting-level">
          <DeckView
            level={level}
            size={game.decks[i].cards.length}
            highlighted={is_deck_selected}
            onClick={onDeckClick}
          />
          <div className="drafting-cards">{cards}</div>
        </div>
      );
    }, this);
    levels.reverse();
    return (
      <div className="drafting-view">
        <NobleSupplyView session={this.props.session} game={this.props.game} />
        <div className="card-area">
          <div className="drafting-levels">
            {levels}
          </div>
          <DraftingActionsView
            game={this.props.game}
            selectedLevel={this.state.selectedLevel}
            selectedCardID={this.state.selectedCardID}
            onBuildCard={this.onBuildCard}
            onReserveCard={this.onReserveCard}
          />
        </div>
        <ChipSupplyView session={this.props.session} game={this.props.game} />
      </div>
    );
  },
});

var PlayerView = React.createClass({
  render: function() {
    var game = this.props.game;
    var player = this.props.game.players[this.props.playerIndex];

    var thisPlayerWon = game.winningPlayerIndex == this.props.playerIndex;
    var chip_views = _.map(Colors, function(color) {
      return <ChipPileView
        key={color}
        color={color}
        count={player.chips[color] || 0}
      />;
    });
    var noble_views = _.map(player.nobles, function (noble) {
      return (<NobleView noble={noble}/>);
    });

    var playerNameString;
    var playerClassNames;
    if (thisPlayerWon) {
      playerNameString = player.userID + " (winner)";
      playerClassNames = "player-view winning-player";
    }
    else {
      playerNameString = player.userByID;
      playerClassNames = "player-view";
    }

    return (
      <div className={playerClassNames}>
        <div className="player-name">{playerNameString}</div>
        <PlayerHandView
          session={this.props.session}
          game={this.props.game}
          playerIndex={this.props.playerIndex}
        />
        <div className="player-chips">
          {chip_views}
        </div>
        <PlayerBoardView player={player} />
        <div className="noble-views">
          {noble_views}
        </div>
      </div>
    );
  },
});

var PlayerHandView = React.createClass({
  getInitialState: function() {
    return {
      selectedCardID: null,
    };
  },
  onCardClick: function(card) {
                 console.log('player hand card click', card);
    if (this.state.selectedCardID === card.id) {
      this.setState({selectedCardID: null});
    } else {
      this.setState({selectedCardID: card.id});
    }
  },
  onBuildCard: function() {
    GameMutator.buildHandCard(this.props.game.id, this.state.selectedCardID);
    this.setState({selectedCardID: null});
  },
  render: function() {
    var player = this.props.game.players[this.props.playerIndex];
    var cards = _.map(player.hand, function(card) {
      return <Card
        key={card.id}
        card={card}
        onClick={this.onCardClick}
        highlighted={card.id === this.state.selectedCardID}
      />;
    }, this);
    return (
      <div className="player-hand-view">
        <div className="player-hand-cards">
          {cards}
        </div>
        <div className="player-hand-actions">
          <button
            onClick={this.onBuildCard}
            disabled={!this.state.selectedCardID}
          >
            Build Card
          </button>
        </div>
      </div>
    );
  },
});

var PlayerBoardView = React.createClass({
  render: function() {
    var player = this.props.player;
    var piles = _.map(Colors, function(color) {
      var cards = _.filter(player.board, function(card) {
        return card.color === color;
      });
      var rendered_cards = _.map(cards, function(card) {
        return <Card
          key={card.id}
          card={card}
        />;
      });
      return (<div key={color} className="card-stack">{rendered_cards}</div>);
    });
    return (
      <div className="player-board-view">
        {piles}
      </div>
    );
  },
});

var GameLogView = React.createClass({
  logItemToDisplay: function(item) {
    var eventType = item[0];
    var payload = item[1];
    var userId = payload[0];
    var playerName = this.props.users[userId].name;

    return (
      <div className="game-log-item">
        {JSON.stringify(playerName) + ' ' + JSON.stringify(eventType)}
      </div>
    );
  },
  render: function() {
    var log_items = _.map(this.props.game.logItems, this.logItemToDisplay);
    return (
      <div className="game-log-view">
        <div className="game-log-items">
          {log_items}
        </div>
      </div>
    );
  },
});

var ChatLogItem = React.createClass({
  mixins: [ReactAsync.Mixin],

  getInitialStateAsync: function(cb) {
    UserFetcher.fetchUser(this.props.message.user, function (err, user) {
      cb(err, {user: user});
    });
  },

  render: function() {
    var message = this.props.message;
    var classes = 'chat-log-item';
    var content = null;
    if (this.props.message && this.state.user) {
      content = [
        <span className='user-name'>{this.state.user.name}</span>,
        ' ',
        <span className='message-text'>{message.text}</span>
      ];
    }
    return (
      <div className={classes}>
        {content}
      </div>
    );
  },
});

var ChatLogView = React.createClass({
  onChatSubmit: function() {
    var text = this.refs.message.getDOMNode().value;
    if (text == '') {
      return false;
    }
    var userID = this.props.user.id;
    var gameID = this.props.gameID;
    GameMutator.sendChatMessage(gameID, userID, text);
    this.refs.message.getDOMNode().value = '';
    return false;
  },
  render: function() {
    var log_items;
    var num_items = this.props.messages.length;
    log_items = _.chain(this.props.messages.slice())
      .reverse()
      .map(function(message, num) {
        return <ChatLogItem key={num_items - num} message={message} />;
      })
      .value();
    return (
      <div className="chat-log-view">
        <form className="chat-form" onSubmit={this.onChatSubmit}>
          Chat: <input type="text" ref="message" />
        </form>
        <div className="chat-log-items">
          {log_items}
        </div>
      </div>
    );
  },
});

var GamePage = React.createClass({
  mixins: [ReactAsync.Mixin],

  getInitialStateAsync: function(cb) {
    if (!this.props.session) {
        return cb(null);
    }
    var gameStore = this.props.session.GameStore();
    gameStore.syncGameState(this.props.gameID, null, function() {
      var game = gameStore.getGameState(this.props.gameID);
      if (!game) {
        cb(new Error('unable to fetch game', null));
        return;
      }
      var userIDs = _.pluck(game.players, 'userID');
      UserFetcher.fetchUsers(userIDs, function (err, userByID) {
        cb(err, {game: game, userByID: userByID});
      });
    }.bind(this));
  },

  onGameStateChange: function(changedGameIDs) {
    if (!this.state.game) {
      return;
    }
    if (!_.contains(changedGameIDs, this.props.gameID)) {
      return;
    }
    var game = this.props.session.GameStore().getGameState(this.props.gameID);
    if (game) {
      this.setState({game:  game});
    }
  },

  componentWillMount: function() {
    if (typeof window !== 'undefined') {
      this.props.session.GameStore().addListener(this.onGameStateChange);
    }
  },
  componentWillUnmount: function() {
    if (typeof window !== 'undefined') {
      this.props.session.GameStore().removeListener(this.onGameStateChange);
    }
  },

  render: function() {
    if (!this.state || _.size(this.state) === 0) {
      var loadingView = (<div className="game-loading-view">Loading...</div>);
      return loadingView;
    }
    if (this.state.error) {
      return <div>{'error: ' + this.state.error}</div>;
    }
    var localUser = this.props.session && this.props.session.getUser();
    if (!localUser) {
      return loadingView;
    }
    var game = this.state.game;
    var localPlayer = _.find(this.state.game.players, function(player) {
      return player.userID === localUser.id;
    });
    var player_views = _.map(game.players, function(player, i) {
      return <PlayerView key={player.userID} playerIndex={i} game={game} />
    });
    return (
      <div className="game-view">
        <div className="left-pane">
          <div className="global-view">
            <DraftingView
              session={this.props.session}
              game={this.state.game} />
            <ActionPanel
              localPlayer={localPlayer}
              session={this.props.session}
              game={game}
             />
          </div>
          <div className="player-views">
            {player_views}
          </div>
        </div>
        <div className="right-pane">
          <ChatLogView 
            gameID={this.state.game.id}
            user={this.state.userByID[localPlayer.id]}
            messages={this.state.game.messages} 
            player={localPlayer} />
          <GameLogView
            users={this.state.userByID}
            game={this.state.game}
            session={this.props.session} />
        </div>
      </div>
    );
  }
});

var LoginPage = React.createClass({
  getInitialState: function() {
    return { requestInProgess: false };
  },
  onLoginSubmit: function(event) {
    if (this.state.requestInProgress) {
      return false;
    }
    this.setState({requestInProgress: true});
    var username = this.refs.username.getDOMNode().value.trim();
    superagent.post('/login')
    .send({username: username, password: 'abc123'})
    .end(function(res) {
      this.setState({requestInProgress: false});
      if (!res.ok) {
        console.log('error logging in', res.text);
        return;
      }
      var user = res.body.user;
      var session = new Session(user);
      console.log('redirect to', res.body.redirect);
      navigateToHref(res.body.redirect);
      renderApp(session);
    }.bind(this));
    return false;
  },
  render: function() {
    return (
      <div className="login-container">
        <h1>Please log in to Splendor</h1>
        <form className="login-username-form" onSubmit={this.onLoginSubmit}>
          Username: <input className="login-username-input" type="text" ref="username" />
          <button className="lobby-button login-button" onClick={this.onLoginSubmit}> Log In </button>
        </form>
      </div>
    );
  },
});

var LobbyPage = React.createClass({
  mixins: [ReactAsync.Mixin],

  getInitialStateAsync: function(cb) {
    var lobbyStore = this.props.session.LobbyStore();
    lobbyStore.syncLobby(this.props.lobbyID, null, function(err) {
      if (err) {
        cb(null, {error: err});
        return;
      }
      var lobby = lobbyStore.getLobby(this.props.lobbyID);
      cb(null, {lobby: lobby});
    }.bind(this));
  },

  onLobbyStoreUpdate: function(changed_lobby_by_id) {
    var lobby = changed_lobby_by_id[this.props.lobbyID];
    if (lobby) {
      this.setState({lobby: lobby});
    }
  },

  componentWillMount: function() {
    if (typeof window !== 'undefined') {
      this.props.session.LobbyStore().addListener(this.onLobbyStoreUpdate);
    }
  },
  componentWillUnmount: function() {
    if (typeof window !== 'undefined') {
      this.props.session.LobbyStore().removeListener(this.onLobbyStoreUpdate);
    }
  },

  onAddBot: function() {
    var mutator = new LobbyMutator(this.props.session, this.props.lobbyID);
    mutator.addBot();
  },
  onStartGame: function() {
    var mutator = new LobbyMutator(this.props.session, this.props.lobbyID);
    mutator.startGame(function(err, gameID) {
      if (!err) {
        navigateToHref('/game/' + gameID);
      }
    });
  },

  render: function() {
    if (this.state.error) {
      return <div className="error">Lobby not found</div>;
    }
    if (this.state.lobby.gameID) {
      return <GamePage gameID={this.state.lobby.gameID} session={this.props.session} />;
    }
    var user_entries = _.map(this.state.lobby.players, function(user) {
      return <li className="lobby-player-entry" key={user.id}>{user.name}</li>;
    }, this);
    return (
      <div>
        <div className="ribbon">
          Splendor
        </div>
        <div className="lobby-container">
          <h1>Welcome to lobby {this.state.lobby.name}</h1>
          <button className="lobby-button start-game-button" onClick={this.onStartGame}>Start Game</button>
          <h3> Players </h3>
          <ul className="lobby-player-list">{user_entries}</ul>
          <button className="lobby-button add-bot-button" onClick={this.onAddBot}>Add a Bot</button>
        </div>
      </div>
    );
  },
});

var LobbyListEntry = React.createClass({
  onClick: function() {
    this.props.onClick(this.props.lobby);
  },
  render: function() {
    return (
      <button className="lobby-button lobby-list-entry" onClick={this.onClick}>{this.props.lobby.name}</button>
      );
  },
});


/* Lobby content */
var LobbyListView = React.createClass({
  getInitialState: function() {
    return {};
  },
  onCreateLobby: function() {
    if (this.state.requestInProgress) {
      return;
    }
    this.setState({requestInProgress: true});
    superagent.post('/api/lobby/create')
      .send({host_id: this.props.session.getUser().id})
      .end(function(res) {
        this.setState({requestInProgress: false});
        if (!res.ok) {
          alert('error creating lobby', res.text);
          return;
        }
        var lobby = res.body;
        navigateToHref('/lobby/' + lobby.id);
      }.bind(this));
  },

  onLobbyClick: function(lobby) {
    var mutator = new LobbyMutator(this.props.session, lobby.id);
    mutator.joinGame(function(err) {
      navigateToHref('/lobby/' + lobby.id);
    });
  },

  render: function() {
    var user = this.props.session && this.props.session.getUser();
    var lobbies = _.map(this.props.lobbies, function(lobby) {
      return <LobbyListEntry key={lobby.id} lobby={lobby} onClick={this.onLobbyClick} />;
    }, this);
    var chrome;
    if (user) {
      chrome = (
        <div>
          <h1>Welcome to Splendor</h1>
          <h2>Logged in as {user.name}</h2>
          <button className="lobby-button create-lobby-button" onClick={this.onCreateLobby}>Create Lobby</button>
        </div>
        );
    } else {
      chrome = (
        <div>
          <h1>Welcome to Splendor</h1>
          <Link href="/login">Login</Link>
        </div>
      );
    }

    return (
      <div className="home-container">
        <div className="lobby-list">
          {chrome}
          {lobbies}
        </div>
      </div>
    );
  },
});

var LobbyListPage = React.createClass({
  mixins: [ReactAsync.Mixin],

  getInitialStateAsync: function(cb) {
    this.props.session.LobbyStore().fetchLobbyList(function(err, lobbies) {
      cb(err, lobbies && {lobbies: lobbies});
    });
  },

  render: function() {
    return <LobbyListView lobbies={this.state.lobbies} session={this.props.session} />;
  },
});


var MainPage = React.createClass({
  onLogin: function() {
    this.forceUpdate();
  },

  render: function() {
    var session = this.props.session;
    var loginElement = !session ? (<LoginPage onLogin={this.onLogin} />) : (<LobbyListPage session={session} />);
    return (
      <div>
        <div className="ribbon">
          Splendor
        </div>
        {loginElement}
      </div>
    );
  }
});

var NotFoundHandler = React.createClass({
  render: function() {
    return (
      <p>Page not found</p>
    );
  }
});

var App = React.createClass({
  render: function() {
    var session = this.props.session;
    var session_data = session
        ? <script dangerouslySetInnerHTML={{__html: 'window.__session='+JSON.stringify(session.toJSON())}} />
        : null;
    return (
      <html>
        <head>
          {session_data}
          <link rel="stylesheet" href="/assets/style.css" />
          <link href='http://fonts.googleapis.com/css?family=Lato:100,300,400,700,100italic,300italic,400italic,700italic' rel='stylesheet' type='text/css' />
          <script src="/assets/bundle.js" />
        </head>
        <Pages className="App" path={this.props.path}>
          <Page path="/" handler={MainPage} session={session} />
          <Page path="/login" handler={LoginPage} />
          <Page path="/game/:gameID" handler={GamePage} session={session} />
          <Page path="/lobby/:lobbyID" handler={LobbyPage} session={session}/>
          <Page path="/lobby-list" handler={LobbyListPage} session={session}/>
          <NotFound handler={NotFoundHandler} />
        </Pages>
      </html>
    );
  }
});

module.exports = App;

var renderApp = function(session) {
  React.renderComponent(<App session={session} />, document);
};

var ws;
if (typeof window !== 'undefined') {
  window.onload = function() {
    var json_session = window.__session;
    var session = json_session ? Session.sessionFromJSON(json_session) : null;

    CloudListener.start();
    renderApp(session);
  };
}