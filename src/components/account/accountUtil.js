import { OAuth2Client } from "google-auth-library";
import { findAccountByToken } from "./accountService";
import jwt from "jsonwebtoken";
import { JWT_KEY } from "../../config";
import { mapUser } from "../../utilities/user";
export const validateGoogleToken = async (token) => {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const client = new OAuth2Client(GOOGLE_CLIENT_ID);

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        });
        return { payload: ticket.getPayload() };
    } catch (error) {
        return { error: error };
    }

}

export const getMe = async (req) => {
    const token = getToken(req.headers); //abc123
    if (!token) {
        return null;
    }
    try {
        jwt
        const data = jwt.verify(token, JWT_KEY);
        const user = await findAccountByToken(data.accountID, token);
        if (!user) {
            return null;
        } else {
            return mapUser(user);
        }
    } catch (error) {
        return null;
    }
}