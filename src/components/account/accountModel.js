import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
    BCRYPT_SALT,
    JWT_KEY,
    REFRESH_TOKEN_EXPIRES_IN,
    TOKEN_EXPIRES_IN,
} from "../../config";
import * as MESSAGE from "../../resource/message";
import Counter from "../../lib/counterModel";
const AccountSchema = new mongoose.Schema(
    {
        accountID: {
            type: Number,
            default: 0,
        },
        password: {
            type: String,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        fullname: {
            type: String,
            required: true,
        },
        gender: {
            type: String,
        },
        tokens: [
            {
                token: {
                    type: String,
                    required: true,
                },
            },
        ],
        refreshTokens: [
            {
                refreshToken: {
                    type: String,
                    required: true,
                },
            },
        ],
        verified: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

//hash pwd
AccountSchema.pre("save", async function (next) {
    const user = this;
    if (user.isModified("password") && user.password) {
        user.password = await bcrypt.hash(user.password, BCRYPT_SALT);
    }
    if (!user.accountID) {
        const counter = await Counter.increase("ACCOUNT");
        user.accountID = counter.value;
    }
    next();
});

AccountSchema.methods.generateAuthToken = async function () {
    // Generate an auth token for the user
    const user = this;
    const token = jwt.sign({ _id: user._id }, JWT_KEY, {
        expiresIn: TOKEN_EXPIRES_IN,
    });
    user.tokens = user.tokens.concat({ token });
    await user.save();
    return token;
};

AccountSchema.methods.generateAuthRefreshToken = async function () {
    // Generate an auth token for the user
    const user = this;
    const refreshToken = jwt.sign({ _id: user._id }, JWT_KEY, {
        expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    });
    user.refreshTokens = user.refreshTokens.concat({ refreshToken });
    await user.save();
    return refreshToken;
};

AccountSchema.statics.findByCredentials = async (email, password) => {
    // Search for a user by email and password.
    const account = await Account.findOne({ email });
    if (!account) {
        return {
            data: null,
            message: MESSAGE.NOT_FOUND_ACCOUNT,
        };
    }
    const isPasswordMatch = await bcrypt.compare(password, account.password);
    if (!isPasswordMatch) {
        return {
            data: null,
            message: MESSAGE.INCORRECT_PASSWORD,
        };
    }
    return {
        data: account,
    };
};

const Account = mongoose.model("Account", AccountSchema);

export default Account;
