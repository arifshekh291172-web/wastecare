const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

let users = {}; // replace with DB later

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback"
    },
    (accessToken, refreshToken, profile, done) => {
      const email = profile.emails[0].value;

      if (!users[email]) {
        users[email] = {
          name: profile.displayName,
          email,
          provider: "google"
        };
      }

      return done(null, users[email]);
    }
  )
);

passport.serializeUser((user, done) => done(null, user.email));
passport.deserializeUser((email, done) => done(null, users[email]));
