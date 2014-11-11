var superagent = require('superagent');
var BaseURL = require('./BaseURL');
var _ = require('underscore');
var UserFetcher = require('./UserFetcher');
var CloudListener = require('./CloudListener');
var Session = require('./Session');

var LobbyStore = function (session) {
  this.session_ = session;

  this.lobbyByID_ = {};
  this.listeners_ = [];

  this.cloudSubscription_ = CloudListener.subscribeCallback(function(subscription, message) {
    if (message.type === 'sync' && message.objectType === 'lobby') {
      this.syncLobby(message.objectID, message.sequenceID);
    }
  }.bind(this));
};

LobbyStore.prototype.getLobby = function(lobbyID) {
  return this.lobbyByID_[lobbyID];
};
// listener is function(changedLobbyByID)
LobbyStore.prototype.addListener = function(listener) {
  this.listeners_ = _.union(this.listeners_, [listener]);
};
LobbyStore.prototype.removeListener = function(listener) {
  this.listeners_ = _.difference(this.listeners_, [listener]);
};

// cb(err, lobbies)
LobbyStore.prototype.fetchLobbyList = function(cb) {
  superagent.get(BaseURL + '/api/lobby-list')
  .end(function(res) {
    if (!res.ok) {
      return cb(new Error('error fetching lobbies: ' + res.text), null);
    }
    return cb(null, res.body);
  });
};
// completion(error)
LobbyStore.prototype.syncLobby = function(lobbyID, sequenceID, completion) {
  completion = completion || function() {};
  var existing = this.lobbyByID_[lobbyID];
  if (existing && (sequenceID === null || sequenceID <= existing.sequenceID)) {
    completion(null);
    return;
  }
  console.log('sync lobby', lobbyID, 'target sequence', sequenceID);
  superagent.get(BaseURL + '/api/lobby/' + lobbyID)
  .end(function(res) {
    if (!res.ok) {
      completion(res.text);
      return;
    }
    var lobby = res.body;
    UserFetcher.fetchUsers(lobby.playerIDs, function(err, userByID) {
      if (err) {
        completion(err);
        return;
      }
      lobby.players = _.map(lobby.playerIDs, function(userID) {
        return userByID[userID];
      });

      this.lobbyByID_[lobbyID] = lobby;

      var changed_lobby_by_id = {};
      changed_lobby_by_id[lobby.id] = lobby;
      _.each(this.listeners_, function(listener) {
        listener(changed_lobby_by_id);
      });

      completion(null);
    }.bind(this));
  }.bind(this));
};

Session.prototype.LobbyStore = function() {
  return this.getInstance('lobbystore', LobbyStore);
};

module.exports = LobbyStore;
