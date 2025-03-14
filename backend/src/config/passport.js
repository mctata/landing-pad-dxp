const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const logger = require('../utils/logger');

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
    passReqToCallback: true
  },
  function(req, accessToken, refreshToken, profile, done) {
    // Pass profile to controller for handling
    return done(null, profile);
  }
));

// Facebook Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3001/api/auth/facebook/callback',
    profileFields: ['id', 'emails', 'name', 'displayName', 'photos'],
    passReqToCallback: true
  },
  function(req, accessToken, refreshToken, profile, done) {
    // Pass profile to controller for handling
    return done(null, profile);
  }
));

// LinkedIn Strategy
passport.use(new LinkedInStrategy({
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: process.env.LINKEDIN_CALLBACK_URL || 'http://localhost:3001/api/auth/linkedin/callback',
    scope: ['r_emailaddress', 'r_liteprofile'],
    passReqToCallback: true
  },
  function(req, accessToken, refreshToken, profile, done) {
    // Pass profile to controller for handling
    return done(null, profile);
  }
));

// Serialization and deserialization - session is disabled so these aren't used much
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

logger.info('Passport strategies initialized');