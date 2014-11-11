"use strict";
var _ = require('underscore');

var lobbyByID = {};

var Lobby = function(host_id, name) {
  this.id_ = _.uniqueId('lobby');
  this.sequenceID_ = 1;
  this.hostID_ = host_id;
  this.name_ =  name;
  this.playerIDs_ = [host_id];

  this.gameID_ = null;
};
Lobby.prototype.getID = function() {
  return this.id_;
};
Lobby.prototype.getSequenceID = function() {
  return this.sequenceID_;
};
Lobby.prototype.getPlayerIDs = function() {
  return this.playerIDs_;
};
Lobby.prototype.getHostID = function() {
  return this.hostID_;
};
Lobby.prototype.isOpen = function() {
  return this.gameID_ === null;
};
Lobby.prototype.toJSON = function() {
  return {
    id: this.id_,
    sequenceID: this.sequenceID_,
    hostID: this.hostID_,
    name: this.name_,
    playerIDs: this.playerIDs_,
    gameID: this.gameID_,
  };
};

Lobby.prototype.addPlayer = function(player_id) {
  if (_.contains(this.playerIDs_, player_id)) {
    return null;
  }
  if (this.playerIDs_.length >= Lobby.MAX_PLAYERS) {
    return new Error('lobby full');
  }
  this.playerIDs_.push(player_id);
  this.sequenceID_ += 1;
  return null;
};
Lobby.prototype.startGame = function(game_id) {
  this.gameID_ = game_id;
  this.sequenceID_ += 1;
};

Lobby.createLobby = function(host_id, name) {
  var lobby = new Lobby(host_id, name);
  lobbyByID[lobby.getID()] = lobby;
  return lobby;
};
Lobby.getAllLobbies = function() {
  return _.filter(lobbyByID, function(lobby) {
    return lobby.isOpen();
  });
};
Lobby.getLobby = function(lobbyID) {
  return lobbyByID[lobbyID];
};
Lobby.getLobbyWithHostID = function(host_id) {
  return _.first(lobbyByID, function(lobby) {
    return lobby.getHostID() === host_id;
  });
};

Lobby.MAX_PLAYERS = 4;

module.exports = Lobby;
