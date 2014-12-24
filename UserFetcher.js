/* @flow */
var _ = require('underscore');
var BaseURL = require('./BaseURL');
var superagent = require('superagent');

var UserFetcher = {
  // callback(err, user)
  fetchUser: function(userID, callback) {
    this.fetchUsers([userID], function(err, usersByID) {
      callback(err, usersByID ? usersByID[userID] : null);
    });
  },
  // callback(err, userByID)
  fetchUsers: function(userIDs, callback) {
    var results = {};
    var userIDsToFetch = [];
    _.each(userIDs, function(userID) {
      var cachedUser = this.userCache_[userID];
      if (cachedUser) {
        results[userID] = cachedUser;
      } else {
        userIDsToFetch.push(userID);
      }
    }, this);
    if (_.isEmpty(userIDsToFetch)) {
      callback(null, results);
      return;
    }
    this.fetchUsersFromServer(userIDsToFetch, function(err, usersByID) {
      if (err) {
        callback(err, null);
        return;
      }
      this.userCache_ = _.extend(this.userCache_, usersByID);
      results = _.extend(results, usersByID);
      callback(null, results);
    }.bind(this));
  },
  getUsers: function(userIDs) {
    var userByID = {};
    _.each(userIDs, function(userID) {
      var user = this.userCache_[userID];
      if (user) {
        userByID[userID] = user;
      }
    }, this);
    return userByID;
  },
  ensureUsers: function(userIDs) {
    this.fetchUsers(userIDs, function() {});
  },

  // private
  userCache_: {},
  fetchUsersFromServer: function(userIDs, callback) {
    var encodedUserIDs = userIDs.join(',');
    superagent.get(BaseURL + '/api/user/' + encodedUserIDs)
      .end(function(res) {
        if (!res.ok) {
          console.log('error fetching users: ', res.text);
          callback(res.text || '', null);
          return;
        }
        callback(null, res.body);
      });
  },
};

module.exports = UserFetcher;
