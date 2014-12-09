var superagent = require('superagent');
var _ = require('underscore');

var ActionTypes = require('./ActionTypes');

var GameMutator = {
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
  draftChips: function(gameID, colorToCount) {
    this.sendAction(
      gameID,
      ActionTypes.DRAFT_CHIPS,
      {
        color_counts: colorToCount,
      }
    );
  },
  discardChips: function(gameID, colorToCountMap) {
    this.sendAction(
      gameID,
      ActionTypes.DISCARD_CHIPS,
      {
        chips: colorToCountMap
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

module.exports = GameMutator;
