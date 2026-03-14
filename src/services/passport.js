import dotenv from "dotenv";
dotenv.config();
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK } = process.env;
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK) {
  throw new Error("Missing Google OAuth environment variables");
}

async function findOrCreate(profile, provider, done) {
  try {
    const { default: User } = await import("./User.js");
    const query = { [`${provider}Id`]: profile.id };

    let user = await User.findOne(query);
    if (user) return done(null, user);

    const email = profile.emails?.[0]?.value || null;
    const [firstName = "User", lastName = ""] = (profile.displayName || "").split(" ");
    user = new User({ ...query, firstName, lastName, email });
    await user.save();
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}

passport.use(
  new GoogleStrategy(
    { clientID: GOOGLE_CLIENT_ID, clientSecret: GOOGLE_CLIENT_SECRET, callbackURL: GOOGLE_CALLBACK },
    (accessToken, refreshToken, profile, done) => findOrCreate(profile, "google", done)
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const { default: User } = await import("./User.js");
    done(null, await User.findById(id));
  } catch (err) {
    done(err, null);
  }
});

export default passport;