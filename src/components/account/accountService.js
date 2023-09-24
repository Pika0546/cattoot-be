import Account from "./accountModel";
import bcrypt from "bcryptjs";
import {
    BCRYPT_SALT,
    JWT_KEY,
    REFRESH_TOKEN_EXPIRES_IN,
    TOKEN_EXPIRES_IN,
} from "../../config";
import { getRegextForSearchLike } from "../../utilities/string";
export const login = async ({ email, password }) => {
    return Account.findByCredentials(email, password);
};

export const googleLogin = async ({ email }) => {
    return Account.findOne({ email });
};

export const findAccount = async (data) => {
    if (data) {
        const { email, accountID } = data;
        return await Account.findOne({
            ...(email && { email }),
            ...(accountID && { accountID }),
        }).lean();
    }
    return null;
};

export const comparePassword = async ({ accountID, password }) => {
    const account = await findAccount({ accountID });
    if (account) {
        const isPasswordMatch = await bcrypt.compare(
            password,
            account.password
        );
        return isPasswordMatch;
    }
    return false;
};

export const findAccountByAccountId = async (accountID) => {
    if (accountID) {
        return await Account.findOne({
            accountID: parseInt(accountID),
        }).lean();
    }
    return null;
};

export const getAccoutList = async ({ offset, limit, email }) => {
    const o = offset || 0;
    const l = limit || 1000;
    return await Account.find({
        ...(email && {
            email: {
                $regex: getRegextForSearchLike(email),
            },
        }),
    })
        .lean()
        .skip(o)
        .limit(l);
};

export const createAccount = async (data) => {
    const newAccount = new Account(data);
    return newAccount.save();
};

export const findAccountByToken = async (id, token) => {
    return await Account.findOne({ _id: id, "tokens.token": token }).lean();
};

export const findAccountByRefreshToken = async (id, token) => {
    return await Account.findOne({
        _id: id,
        "refreshTokens.refreshToken": token,
    });
};

export const changePassword = async ({ accountID, newPassword }) => {
    return await Account.findOneAndUpdate(
        {
            accountID,
        },
        {
            password: newPassword,
        },
        {
            new: true,
        }
    ).lean();
};

export const accountVerified = async (accountID) => {
    return await Account.findOneAndUpdate(
        {
            accountID,
        },
        {
            verified: true,
        },
        {
            new: true,
        }
    ).lean();
};

export const updateInfo = async ({ accountID, fullname }) => {
    return Account.findOneAndUpdate(
        {
            accountID,
        },
        {
            fullname: fullname,
        },
        {
            new: true,
        }
    ).lean();
};

export const findAccountByEmail = async (email) => {
    return Account.findOne({ email });
};
