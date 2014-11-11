'use strict';

var path        = require('path');
var url         = require('url');
var express     = require('express');
var browserify  = require('connect-browserify');
var ReactAsync  = require('react-async');
var nodejsx     = require('node-jsx').install();
var App         = require('./client');
var api         = require('./api');
var Session = require('./Session');
var morgan = require('morgan');
var User = require('./User');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;


var development = process.env.NODE_ENV !== 'production';

function renderApp(req, res, next) {
  var path = url.parse(req.url).pathname;
  var session = Session.fetchServerSession(req, function(err, session) {
    if (err) {
      return next(err);
    }
    var app = App({path: path, session: session});
    ReactAsync.renderComponentToStringWithAsyncState(app, function(err, markup) {
      if (err) {
        return next(err);
      }
      res.send('<!doctype html>\n' + markup);
    });
  });
}

var app = express();

if (development) {
  app.get('/assets/bundle.js',
    browserify('./client', {
      debug: true,
      watch: true
    }));
}

var error_handler = function(err, req, res, next) {
};

api.createApi(function (api) {

  passport.use(new LocalStrategy(
    function(username, password, done) {
      var user = User.loginUser(username);
      return done(null, user);
      /*
        if (err) { return done(err); }
        if (!user) {
          return done(null, false, { message: 'Incorrect username.' });
        }
        if (!user.validPassword(password)) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
        */
    }));
  passport.serializeUser(function(user, done) {
    done(null, user.getID());
  });

  passport.deserializeUser(function(user_id, done) {
    var user = User.getUser(user_id);
    var err = !user ? new Error('user not found') : null;
    done(err, user);
  });

  var ensureAuthorized = function(req, res, next) {
    if (!req.isAuthenticated()) {
      var err = new Error('Unauthorized');
      err.status = 403;
      return next(err);
    }
    return next();
  };
      
  app
    .use(cookieParser())
    .use(session({ secret: 'lj209nasdnfpvuadsfnvp' }))
    .use(bodyParser.urlencoded({ extended: false }))
    .use(bodyParser.json())
    .use(passport.initialize())
    .use(passport.session());
  
  
  app.post('/login',
      passport.authenticate('local', {
        failureRedirect: '../login',
        failureFlash: false,
      }),
      function(req, res, next) {
        console.log('User', req.user);
        res.send({user: req.user, redirect: '/'});
      });

  app
    .use(morgan('short'))
    .use('/assets', express.static(path.join(__dirname, 'assets')))
    .use('/api', api)
    .use(renderApp)
    .listen(3000, function() {
      console.log('Point your browser at http://localhost:3000');
    });
});
