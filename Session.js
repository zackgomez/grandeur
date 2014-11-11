

var Session = function(sessionUser) {
  this.user_ = sessionUser;
  this.sessionScopedInstances_ = {};
};
Session.prototype.getUser = function() {
  return this.user_;
};
Session.prototype.getUserID = function() {
  return this.user_ && this.user_.id;
};
Session.prototype.toJSON = function() {
  return {
    user: this.user_,
  };
};
Session.prototype.getInstance = function(key, constructor) {
  if (!this.sessionScopedInstances_[key]) {
    var instance = new constructor(this);
    this.sessionScopedInstances_[key] = instance;
  }
  return this.sessionScopedInstances_[key];
};
// cb(err, session)
Session.fetchSession = function(payload, cb) {
  return cb(null, null);
};
// cb(err, session) session will be null if not logged in
Session.fetchServerSession = function(req, cb) {
  if (!req.isAuthenticated()) {
    return cb(null, null);
  }
  var user = req.user.toJSON();
  var session = new Session(user);
  return cb(null, session);
};
Session.sessionFromJSON = function(json) {
  return new Session(json.user);
};

module.exports = Session;
