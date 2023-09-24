import { API_STATUS } from "../lib/common";
import jwt from "jsonwebtoken";
import { JWT_KEY } from "../config";
import Account from "../components/account/accountModel";
import { findAccountByToken } from "../components/account/accountService";
import * as MESSAGE from "../resource/message";

import passport from "../config/passport";

const getToken = (headers) => {
    if (headers && headers.authorization) {
        const parted = headers.authorization.split(" ");
        if (parted.length === 2) {
            return parted[1];
        } else {
            return null;
        }
    } else {
        return null;
    }
};

export const auth = (req, res, next) => {
    return passport.authenticate(
        "jwt",
        { session: false },
        function (err, user, info) {
            if (user) {
                req.user = {
                    ...user,
                    token: getToken(req.headers),
                };
                next();
            } else {
                console.log(info);
                if (info && info.name === "TokenExpiredError") {
                    return res.status(401).json({
                        status: API_STATUS.TOKEN_EXPIRED,
                        message: MESSAGE.AUTHENTICATE_FAILED,
                    });
                } else {
                    return res.status(401).json({
                        status: API_STATUS.AUTHENTICATE,
                        message: MESSAGE.AUTHENTICATE_FAILED,
                    });
                }
            }
        }
    )(req, res, next);
};
