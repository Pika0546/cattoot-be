import { API_STATUS } from "../lib/common";
import jwt from "jsonwebtoken";
import { JWT_KEY } from "../config";
import Account from "../components/account/accountModel";
import {
    findAccountByRefreshToken,
    findAccountByToken,
} from "../components/account/accountService";
import * as MESSAGE from "../resource/message";
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

export const authRefreshToken = async (req, res, next) => {
    const token = req.body.refreshToken;
    if (!token) {
        return res.status(403).send({
            status: API_STATUS.AUTHENTICATE,
            message: MESSAGE.UNAUTHORIZED,
        });
    }
    try {
        const data = jwt.verify(token, JWT_KEY);
        const user = await findAccountByRefreshToken(data._id, token);
        if (!user) {
            res.status(403).send({
                status: API_STATUS.AUTHENTICATE,
                message: MESSAGE.UNAUTHORIZED,
            });
        } else {
            req.refreshToken = token;
            req.user = user;
            next();
        }
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(403).send({
                status: API_STATUS.TOKEN_EXPIRED,
                message: MESSAGE.UNAUTHORIZED,
                error,
            });
        }
        return res.status(403).send({
            status: API_STATUS.AUTHENTICATE,
            message: MESSAGE.UNAUTHORIZED,
            error,
        });
    }
};
