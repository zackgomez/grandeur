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
        userID: userID,
        text: text,
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
    var cost = card.cost;
    return (
      <div className={'card card-color-'+this.props.card.color}
        onMouseEnter={this.handleMouseEnter} 
        onMouseLeave={this.handleMouseLeave}
        onClick={this.handleClick}
        onDoubleClick={this.handleDoubleClick}
        >
        <div className="card-cost">{cost}</div>
        <div className="card-points">{card.points || null}</div>
        <div className="card-color">{card.color}</div>
        <div className="card-level">{card.level}</div>
      </div>
    );
  },
});

var DraftingView = React.createClass({
  render: function() {
    var game = this.props.game;
    var levels = _.map(game.boards, function(board, i) {
      var cards = _.map(board, function(card) {
        var card_props = {
          card:card,
          key:card.id,
          onClick:this.props.onCardClick,
          onDoubleClick:this.props.onCardDoubleClick,
          onCardEnter:this.onCardEnter,
          onCardLeave:this.onCardLeave,
        };
        return Card(card_props);
      }, this);
      return (
        <div className="drafting-level">
          <div className="deck-size">{game.decks[i].cards.length}</div>
          <div className="drafting-cards">{cards}</div>
        </div>
      );
    }, this);
    return (
      <div className="drafting-view">
        {levels}
      </div>
    );
  },
});

var GameLogView = React.createClass({
  render: function() {
    var log_items = [];
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
    var sessionPlayer = this.props.session && this.props.session.getUser();
    if (!sessionPlayer) {
      return loadingView;
    }
    var thisPlayer = _.find(this.state.game.players, function(player) {
      return player.userID === sessionPlayer.id;
    });
    return (
      <div className="game-view">
        <div className="left-pane">
          <DraftingView
            session={this.props.session}
            game={this.state.game} />
        </div>
        <div className="right-pane">
          <ChatLogView 
            gameID={this.state.game.id}
            user={this.state.userByID[sessionPlayer.id]}
            messages={this.state.game.messages} 
            player={thisPlayer} />
          <GameLogView
            actions={this.state.game.actions}
            cardsByID={this.state.game.cardsByID}
            session={this.props.session} />
        </div>
      </div>
    );
  }
});

/** TODO: come up with a more modular way of making unique tab views **/
var PlayerTabs = React.createClass({
  getInitialState: function() {
    return {
      /*tabs: [
        {title: 'first', content: 'Content 1'},
        {title: 'second', content: 'Content 2'}
      ],*/
      active: 0
    };
  },
  render: function() {
    return <div>
      <PlayerTabsSwitcher items={this.props.tabs} active={this.state.active} onTabClick={this.handleTabClick}/>
      <TabsContent items={this.props.tabs} active={this.state.active}/>
    </div>;
  },
  handleTabClick: function(index) {
    this.setState({active: index})
  }
});

var PlayerTabsSwitcher = React.createClass({
  render: function() {
    var active = this.props.active;
    var items = _.map(this.props.items,function(item, index) {
      return <button href="#" className={'tab ' + (active === index ? 'tab_selected' : '')} onClick={this.onClick.bind(this, index)}>
        {item.user.name} <span className="tab-god_name">{item.player.god.name}</span>
      </button>;
    }.bind(this));
    return <div className="tabs-switcher">{items}</div>;
  },
  onClick: function(index) {
    this.props.onTabClick(index);
  }
});

var GodPowersTabs = React.createClass({
  getInitialState: function() {
    return {
      active: 0
    };
  },
  render: function() {
    return <div>
      <GodPowersTabsSwitcher items={this.props.tabs} active={this.state.active} onTabClick={this.handleTabClick}/>
      <TabsContent items={this.props.tabs} active={this.state.active}/>
    </div>;
  },
  handleTabClick: function(index) {
    this.setState({active: index})
  }
});

var GodPowersTabsSwitcher = React.createClass({
  render: function() {
    var active = this.props.active;
    var items = _.map(this.props.items,function(item, index) {
      return <button href="#" className={'tab ' + (active === index ? 'tab_selected' : '')} onClick={this.onClick.bind(this, index)}>
        {item.title}
      </button>;
    }.bind(this));
    return <div className="tabs-switcher">{items}</div>;
  },
  onClick: function(index) {
    this.props.onTabClick(index);
  }
});

var TabsContent = React.createClass({
  render: function() {
    var active = this.props.active;
    var items = _.map(this.props.items, function(item, index) {
      return <div className={'tabs-panel ' + (active === index ? 'tabs-panel_selected' : '')}>{item.content}</div>;
    });
    return <div>{items}</div>;
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
    console.log('lobby update', changed_lobby_by_id, this.props.lobbyID, lobby);
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
