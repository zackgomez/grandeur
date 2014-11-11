"use strict";

var Game = require('./game');
var Lobby = require('./Lobby');
var User = require('./User');
var express = require('express');
var WebSocketServer = require('ws').Server;
var _ = require('underscore');

var gameByID = {};

var createApi = function(cb) {
  var app = express();

  var wss = new WebSocketServer({ port: 3001, path: '/game_state_socket'});
  wss.on('connection', function(ws) {
    ws.on('message', function(data, flags) {
      console.log('got data from socket:', data);
    });
  });
  var onObjectChange = function(object_type, object) {
    _.each(wss.clients, function(client) {
      var message = {
        type: 'sync',
        objectType: object_type,
        objectID: object.getID(),
        sequenceID: object.getSequenceID(),
      };
      client.send(JSON.stringify(message));
    });
  };
  var onGameChange = function(game) {
    onObjectChange('game', game);
  };
  var onLobbyChange = function(lobby) {
    onObjectChange('lobby', lobby);
  };
  var ensureAuthorized = function(req, res, next) {
    if (!req.isAuthenticated()) {
      var err = new Error('Unauthorized');
      err.status = 403;
      return next(err);
    }
    return next();
  };

  app.get('/game/:game_id/state', function(req, res, next) {
    var game_id = req.param('game_id');
    var game = gameByID[game_id];
    if (!game) {
      next(new Error('game not found'));
      return;
    }

    var serialized = game.toJSON();
    res.send(serialized);
  });
  
  app.post('/game/:game_id/add_action', ensureAuthorized, function(req, res, next) {
    var game_id = req.param('game_id');
    var game = gameByID[game_id];
    if (!game) {
      next(new Error('game not found'));
      return;
    }
    var action = req.param('action');
    game.addAction(action);
    if (req.param('includeGameState')) {
      res.send(game.toJSON());
    } else {
      res.send('success');
    }
    onGameChange(game);
  });

  app.get('/user/:user_ids', function(req, res) {
    var userIDs = req.params.user_ids.split(',');
    var userByID = User.getUsers(userIDs);
    res.send(userByID);
  });

  app.get('/lobby-list', function(req, res) {
    var encoded_lobbies = _.invoke(Lobby.getAllLobbies(), 'toJSON');
    res.send(encoded_lobbies);
  });
  app.get('/lobby/:lobby_id', function(req, res, next) {
    var lobby_id = req.param('lobby_id');
    var lobby = Lobby.getLobby(lobby_id);
    if (!lobby) {
      next(new Error('lobby not found'));
      return;
    }
    res.send(lobby.toJSON());
  });
  app.post('/lobby/create', ensureAuthorized, function(req, res, next) {
    var host_id = req.param('host_id');
    var host = User.getUser(host_id);
    if (!host) {
      var error = new Error('unknown host id');
      next(error);
      return;
    }
    var lobby_name = host.getName() + "'s Lobby";
    var lobby = Lobby.createLobby(host_id, lobby_name);
    res.send(lobby.toJSON());
  });
  app.post('/lobby/:lobby_id/add_bot', ensureAuthorized, function(req, res, next) {
    var lobby_id = req.param('lobby_id');
    var lobby = Lobby.getLobby(lobby_id);
    if (!lobby) {
      next(new Error('lobby not found'));
      return;
    }
    var eligible_bots = _.difference(User.getDummyUserIDs(), lobby.getPlayerIDs());
    if (eligible_bots.length === 0) {
      next(new Error('no remaining bots'));
      return;
    }
    var err = lobby.addPlayer(_.first(eligible_bots));
    if (err) {
      next(err);
      return;
    }
    onLobbyChange(lobby);
    res.send({lobbyID: lobby.getID(), sequenceID: lobby.getSequenceID()});
  });
  app.post('/lobby/:lobby_id/join', ensureAuthorized, function(req, res, next) {
    var lobby_id = req.param('lobby_id');
    var lobby = Lobby.getLobby(lobby_id);
    if (!lobby) {
      next(new Error('lobby not found'));
      return;
    }
    var user_id = req.param('user_id');
    var user = User.getUser(user_id);
    if (!user) {
      next(new Error('user not found:', user_id));
      return;
    }
    lobby.addPlayer(user_id);
    onLobbyChange(lobby);
    res.send({lobbyID: lobby.getID(), sequenceID: lobby.getSequenceID()});
  });
  app.post('/lobby/:lobby_id/start', function(req, res, next) {
    var lobby_id = req.param('lobby_id');
    var lobby = Lobby.getLobby(lobby_id);
    if (!lobby) {
      next(new Error('lobby not found'));
      return;
    }
    var playerIDs = lobby.getPlayerIDs();
    if (playerIDs.count < 2) {
      next(new Error('not enough players'));
      return;
    }
    var players = _.map(playerIDs, function(userID) {
      return new Game.Player(userID);
    });
    var game = new Game.Game(players);
    game.setUpGame();
    gameByID[game.getID()] = game;

    lobby.startGame(game.getID());
    onLobbyChange(lobby);

    var data = {gameID: game.getID()};
    res.send(data);
  });
  
  app.use('/', function(req, res, next) {
    next(new Error('Page not Found'));
  });

  app.use(function(err, req, res, next) {
    console.log('api error:', err);
    res.status(err.status || 400).send(err.message);
  });

  cb(app);
};

module.exports = {
  createApi: createApi,
};
