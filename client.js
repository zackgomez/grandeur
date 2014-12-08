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
var GameMutator = require('./GameMutator');
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
var ActionStore = require('./ActionStore');
var CardView = require('./CardView');
var GemView = require('./GemView');
var DeckView = require('./DeckView');
var ChipView = require('./ChipView');

var navigateToHref = function(href, cb) {
  cb = cb || function() {};
  ReactRouter.environment.defaultEnvironment.navigate(href, cb);
};


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
  propTypes: {
    actionStore: React.PropTypes.instanceOf(ActionStore).isRequired,
    game: React.PropTypes.object.isRequired,
    onChipClick: React.PropTypes.func,
  },
  onChipClick: function(color) {
    if (color === Colors.JOKER) {
      return;
    }
    this.props.actionStore.didClickChip(color);
  },
  render: function() {
    var chips = _.map(Colors, function (color) {
      var onClickFunc = _.partial(this.onChipClick, color);
      var highlight = false;
      return (
        <ChipPileView
          key={color}
          color={color}
          highlighted={highlight}
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

var DraftingView = React.createClass({
  propTypes: {
    session: React.PropTypes.instanceOf(Session).isRequired,
    game: React.PropTypes.object.isRequired,
    actionStore: React.PropTypes.instanceOf(ActionStore).isRequired,
  },
  onDeckClick: function(level) {
    this.props.actionStore.didClickDeck(level);
  },
  onCardClick: function(card, level) {
    this.props.actionStore.didClickDraftingCard(level, card.id);
  },
  onCardDoubleClick: function(card) {
  },
  render: function() {
    var game = this.props.game;
    var levels = _.map(game.boards, function(board, i) {
      var level = i + 1;
      var cards = _.map(board, function(card) {
        var onCardClick = _.partial(this.onCardClick, card, level);
        var highlighted = false;
        var card_props = {
          card:card,
          key:card.id,
          onClick:onCardClick,
          onDoubleClick:this.onCardDoubleClick,
          onCardEnter:this.onCardEnter,
          onCardLeave:this.onCardLeave,
          highlighted:highlighted,
        };
        return CardView(card_props);
      }, this);
      var is_deck_selected = false;
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
        </div>
        <ChipSupplyView
          session={this.props.session}
          game={this.props.game}
          actionStore={this.props.actionStore}
        />
      </div>
    );
  },
});

var PlayerView = React.createClass({
  render: function() {
    var game = this.props.game;
    var player = this.props.game.players[this.props.playerIndex];

    var chip_views = _.map(Colors, function(color) {
      return <ChipPileView
        key={color}
        color={color}
        count={player.chips[color] || 0}
      />;
    });
    var noble_views = _.map(player.nobles, function (noble, i) {
      return (<NobleView key={i} noble={noble}/>);
    });

    var user = this.props.userByID[player.userID];
    var player_name = user ? user.name : player.userID;
    var container_class_name = 'player-view';
    if (game.winningPlayerIndex == this.props.playerIndex) {
      player_name += ' (winner)';
      container_class_name += ' winning-player';
    }

    return (
      <div className={container_class_name}>
        <div className="player-name">{player_name}</div>
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
      return <CardView
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
        return <CardView
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

var GamePage = React.createClass({
  mixins: [ReactAsync.Mixin],

  getInitialStateAsync: function(cb) {
    var session = this.props.session;
    if (!session) {
        return cb(null);
    }
    var gameStore = session.GameStore();
    gameStore.syncGameState(this.props.gameID, null, function() {
      var game = gameStore.getGameState(this.props.gameID);
      if (!game) {
        return cb(new Error('unable to fetch game', null));
      }
      var userIDs = _.pluck(game.players, 'userID');
      UserFetcher.fetchUsers(userIDs, function (err, userByID) {
        if (err) {
          return cb(err, null);
        }
        var player_index = -1;
        _.find(game.players, function(player, i) {
          if (player.userID === session.getUser().id) {
            player_index = i;
            return true;
          }
        });
        return cb(null, {
          game: game,
          userByID: userByID,
          actionStore: new ActionStore(game, player_index),
        });
      });
    }.bind(this));
  },

  stateToJSON: function(state) {
    return {
      game: state.game,
      userByID: state.userByID,
      playerIndex: state.actionStore.getPlayerIndex(),
    };
  },
  stateFromJSON: function(state) {
    return {
      game: state.game,
      userByID: state.userByID,
      actionStore: new ActionStore(state.game, state.playerIndex),
    };
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
      this.state.actionStore.setGame(game);
      this.setState({game: game});
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
    var userByID = this.state.userByID || {};
    var localPlayer = _.find(this.state.game.players, function(player) {
      return player.userID === localUser.id;
    });
    var player_views = _.map(game.players, function(player, i) {
      return <PlayerView key={player.userID} playerIndex={i} game={game} userByID={userByID} />;
    });
    return (
      <div className="game-view">
        <div className="left-pane">
          <div className="global-view">
            <DraftingView
              session={this.props.session}
              game={this.state.game}
              actionStore={this.state.actionStore}
              />
            <ActionPanel
              session={this.props.session}
              game={game}
              actionStore={this.state.actionStore}
             />
          </div>
          <div className="player-views">
            {player_views}
          </div>
        </div>
        <div className="right-pane">
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
