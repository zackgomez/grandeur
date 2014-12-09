var _ = require('underscore');

var subscriptions = [];

var notifySubscribers = function(message) {
  _.each(subscriptions, function(sub) {
    sub.callback(sub, message);
  });
};

var CloudListener = {
  // cb(subscription, message)
  subscribeCallback: function(cb) {
    var subscription = {
      callback: cb,
    }
    subscriptions.push(subscription);
    return subscription;
  },
  unsubscribe: function(subscription) {
    subscriptions = _.without(subscriptions, subscription);
  },

  start: function() {
    if (typeof window === 'undefined') {
      return;
    }
    ws = new WebSocket('ws://' + window.location.hostname + ':3001/game_state_socket');
    ws.onerror = function(evt) {
      console.log('websocket error: ', evt.data);
    };
    ws.onopen = function() {
      console.log('connected to game state socket');
    };
    ws.onmessage = function(evt) {
      var data = evt.data;
      console.log('web socket data', data);
      var message = JSON.parse(data);
      notifySubscribers(message);
    };
  },
};

module.exports = CloudListener;
