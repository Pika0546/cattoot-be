import { Strategy, ExtractJwt } from "passport-jwt";
import { JWT_KEY } from ".";
import passport from "passport";
import Account from "../components/account/accountModel";
import { API_STATUS } from "../lib/common";
import * as MESSAGE from "../resource/message";
import { mapUser } from "../utilities/user";
const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();

opts.secretOrKey = JWT_KEY;
opts.passReqToCallback = true;

passport.use(
    new Strategy(opts, function (request, jwt_payload, next) {
        Account.findOne({ _id: jwt_payload._id }, (err, user) => {
            if (err) {
                return next(err, false);
            }
            if (user) {
                return next(null, mapUser(user.toObject()), {});
            } else {
                return next(null, false);
            }
        });
    })
);

export default passport;
