import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import geoip from "geoip-lite";
import User from "#models/User";
import { generateTempUsername } from "#utils/usernameGenerator";

function getClientIp(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0].trim() ?? req.ip ?? null;
}

// Export the configuration function
export const configurePassport = () => {
  // Serialize user into the session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from the session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  // Google Strategy setup
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ||
          "http://localhost:5001/api/auth/google/callback",
        // Pass the request object so we can read the IP in the verify callback
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });

          if (!user) {
            // Resolve geo from the request IP
            const ip = getClientIp(req);
            const geo = ip ? geoip.lookup(ip) : null;
            const countryCode = geo?.country || null;

            // Generate a temporary username the user can later claim permanently
            const tempUsernameValue = await generateTempUsername();

            user = await User.create({
              googleId: profile.id,
              email: profile.emails[0].value,
              name: profile.displayName,
              avatar: profile.photos[0].value,
              isVerified: true,
              username: tempUsernameValue,
              tempUsername: true,
              registrationIp: ip,
              lastIp: ip,
              countryCode,
              countryName: countryCode
                ? new Intl.DisplayNames(["en"], { type: "region" }).of(
                    countryCode,
                  )
                : null,
            });
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      },
    ),
  );
};
