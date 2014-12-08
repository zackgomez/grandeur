var _ = require('underscore')
  , superagent = require('superagent')
  , CloudListener = require('./CloudListener')
  , BaseURL = require('./BaseURL')
  , Session = require('./Session');
var Player = require('./Player');

var GameStore = function (session) {
  this.session_ = session;
  this.gameStateByID_ = {};
  this.listeners_ = [];
  this.cloudSubscription_ = CloudListener.subscribeCallback(this.onCloudMessage_.bind(this));
};
  // null if uninitialized
GameStore.prototype.getGameState = function(gameID) {
  return this.gameStateByID_[gameID];
};
  // a listener is a function of 1 argument, an array of changed gameIDs
GameStore.prototype.addListener = function(listener) {
  this.listeners_.push(listener);
};
GameStore.prototype.removeListener = function(listener) {
  this.listeners_ = _.without(this.listeners_, listener);
};

GameStore.prototype.syncGameState = function(gameID, sequenceID, completion) {
  completion = completion || _.identity;
  var existingState = this.gameStateByID_[gameID];
  if (sequenceID && existingState && existingState.sequenceID >= sequenceID) {
    completion();
    return;
  }
  superagent.get(BaseURL + '/api/game/' + gameID + '/state')
  .end(function(res) {
    if (!res.ok) {
      console.log('error syncing state', res.text);
      completion();
      return;
    }
    this.setGameState_(res.body);
    completion();
  }.bind(this));
};

// internal
GameStore.prototype.setGameState_ = function(game_state) {
  if (!game_state) {
    return;
  }
  game_state.players = _.map(game_state.players, function(jsonPlayer) {
    return Player.fromJSON(jsonPlayer);
  });
  this.gameStateByID_[game_state.id] = game_state;
  _.each(this.listeners_, function(listener) {
    listener([game_state.id]);
  });
};

GameStore.prototype.onCloudMessage_ = function(subscription, message) {
  if (message.type === 'sync' && message.objectType === 'game') {
    this.syncGameState(message.objectID, message.sequenceID);
  }
};

Session.prototype.GameStore = function() {
  return this.getInstance('gamestore', GameStore);
};

module.exports = GameStore;
