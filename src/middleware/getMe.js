import jwt from "jsonwebtoken";
import { JWT_KEY } from "../config";
import { findAccountByToken } from "../components/account/accountService";

import { mapUser } from "../utilities/user";

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

export const getMe = async (req, res, next) => {
    const token = getToken(req.headers); //abc123
    if (!token) {
        req.user = null;
        next();
    } else {
        try {
            const data = jwt.verify(token, JWT_KEY);
            const user = await findAccountByToken(data._id, token);
            if (!user) {
                req.user = null;
            } else {
                req.user = mapUser(user);
                req.token = token;
            }
        } catch (error) {
            console.log(error);
            req.user = null;
        }
        next();
    }
};
