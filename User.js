"use strict";
var _ = require('underscore');

var User = function(id, name) {
  this.id_ = id;
  this.name_ = name;
  return this;
};
User.prototype.getID = function() {
  return this.id_;
};
User.prototype.getName = function() {
  return this.name_;
};
User.prototype.toJSON = function() {
  return {
    id: this.id_,
    name: this.name_,
  };
};
User.prototype.isValidPassword = function(password) {
  return password === 'abc123';
};

User.loginUser = function(name) {
  var user = _.find(usersByID, function(user) {
    return user.getName() === name;
  });
  if (user) {
    return user;
  }
  user = new User(_.uniqueId('user'), name);
  usersByID[user.getID()] = user;
  return user;
};

User.getUser = function(userID) {
  var users = User.getUsers([userID]);
  return users[userID];
};

User.findOne = function(userID) {
  return this.getUser(userID);
};

User.getUsers = function(userIDs) {
  return _.indexBy(_.pick(usersByID, userIDs), function(user) {
    return user.getID();
  });
};

User.getDummyUserIDs = function() {
  return ['dummy1', 'dummy2', 'dummy3', 'dummy4'];
};

var usersByID = {
  'dummy1': new User('dummy1', 'Dummy 1'),
  'dummy2': new User('dummy2', 'Dummy 2'),
  'dummy3': new User('dummy3', 'Dummy 3'),
  'dummy4': new User('dummy4', 'Dummy 4'),
};

module.exports = User;
