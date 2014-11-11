var superagent = require('superagent');
var LobbyStore = require('./LobbyStore');

// cb is (err, body)
var callLobbyApi = function(lobby_id, method, params, cb) {
  superagent.post('/api/lobby/' + lobby_id + '/' + method)
  .send(params)
  .set('Accept', 'application/json')
  .end(function(res) {
    var error = null;
    if (!res.ok) {
      console.log('Error adding calling lobby ' + method + ': ', res.text);
      error = res.text;
    }
    cb(error, res.body);
  });
};

var LobbyMutator = function (session, lobby_id) {
  this.session_ = session;
  this.lobbyID_ = lobby_id;
};
// cb(err)
LobbyMutator.prototype.setGod = function(god_name, cb) {
  cb = cb || function() {};
  callLobbyApi(this.lobbyID_, 'set_god', {god_name: god_name}, function(err, body) {
    if (err) {
      cb(err);
      return;
    }
    this.session_.LobbyStore().syncLobby(body.lobbyID, body.sequenceID, function(err) {
      cb(err);
    });
  }.bind(this));
};
// cb(err)
LobbyMutator.prototype.addBot = function(cb) {
  cb = cb || function() {};
  callLobbyApi(this.lobbyID_, 'add_bot', {}, function(err, body) {
    if (err) {
      cb(err);
      return;
    }
    this.session_.LobbyStore().syncLobby(body.lobbyID, body.sequenceID, function(err) {
      cb(err);
    });
  }.bind(this));
};
// cb(err, gameID)
LobbyMutator.prototype.startGame = function(cb) {
  cb = cb || function() {};
  callLobbyApi(this.lobbyID_, 'start', {}, function(err, body) {
    cb(err, body && body.gameID);
  });
};
// cb(err)
LobbyMutator.prototype.joinGame = function(cb) {
  cb = cb || function() {};
  callLobbyApi(
    this.lobbyID_,
    'join',
    {user_id: this.session_.getUser().id},
    function(err, body) {
      if (err) {
        cb(err);
        return;
      }
      this.session_.LobbyStore().syncLobby(body.lobbyID, body.sequenceID, cb);
    }.bind(this));
};

module.exports = LobbyMutator;
