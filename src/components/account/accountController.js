import bcrypt from "bcryptjs";

import { API_STATUS } from "../../lib/common";
import * as AccountService from "./accountService";
import * as MESSAGE from "../../resource/message";
import { BCRYPT_SALT } from "../../config";
import { validateGoogleToken } from "./accountUtil";
import { sendEmail } from "../../utilities/sendEmail";
import { mapUser } from "../../utilities/user";

export const logout = async (req, res, next) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token != req.token;
        });
        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const loginRes = await AccountService.login({ email, password });
        if (loginRes.data) {
            const token = await loginRes.data.generateAuthToken();
            const refreshToken = await loginRes.data.generateAuthRefreshToken();
            if (!loginRes.data.verified) {
                const text =
                    "Vui lòng xác minh email tài khoản thông qua liên kết dưới đây:\n";
                const verifyUrl = `${process.env.BASE_URL}account/${loginRes.data.accountID}/verify/${token}`;
                await sendEmail(
                    loginRes.data.email,
                    "Xác minh email tài khoản",
                    text,
                    verifyUrl
                );
                return res.status(401).json({
                    status: API_STATUS.NOT_VERIFIED,
                    message: MESSAGE.SEND_VERIFY_EMAIL(loginRes.data.email),
                });
            }
            return res.status(200).json({
                status: API_STATUS.OK,
                data: [
                    {
                        account: mapUser(loginRes.data),
                        token: token,
                        refreshToken: refreshToken,
                    },
                ],
                message: MESSAGE.POST_SUCCESS("Đăng nhập"),
            });
        } else {
            return res.status(401).json({
                status: API_STATUS.AUTHENTICATE,
                message: loginRes.message,
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

export const googleLogin = async (req, res, next) => {
    try {
        const { email, fullname, token } = req.body;
        //Validate google token
        const verifiedTokenResponse = await validateGoogleToken(token);
        if (verifiedTokenResponse.error) {
            return res.status(400).json({
                message: MESSAGE.INVALID_INPUT("TOKEN"),
                status: API_STATUS.INVALID_INPUT,
                error: verifiedTokenResponse.error,
            });
        }

        const loginRes = await AccountService.googleLogin({ email });
        if (loginRes) {
            const token = await loginRes.generateAuthToken();
            const refreshToken = await loginRes.generateAuthRefreshToken();
            return res.status(200).json({
                status: API_STATUS.OK,
                data: [
                    {
                        account: mapUser(loginRes),
                        token: token,
                        refreshToken: refreshToken,
                    },
                ],
                message: MESSAGE.POST_SUCCESS("Đăng nhập"),
            });
        } else {
            // return res.status(401).json({
            //     status: API_STATUS.NOT_FOUND,
            //     message: MESSAGE.NOT_FOUND_ACCOUNT,
            // });

            //not found account to login, so signup instead
            const account = await AccountService.createAccount({
                email,
                fullname,
            });
            const token = await account.generateAuthToken();
            const refreshToken = await account.generateAuthRefreshToken();
            const verified = await AccountService.accountVerified(
                account.accountID
            );
            res.status(200).json({
                status: API_STATUS.OK,
                data: [
                    {
                        account: mapUser(account),
                        token: token,
                        refreshToken,
                    },
                ],
                message: MESSAGE.POST_SUCCESS("Đăng kí"),
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

export const signup = async (req, res, next) => {
    try {
        const { password, email, fullname } = req.body;
        if (!password || !email || !fullname) {
            const message = (() => {
                let result = [];
                if (!password) {
                    result.push(MESSAGE.MISSING_INPUT("Mật khẩu"));
                }
                if (!email) {
                    result.push(MESSAGE.MISSING_INPUT("Email"));
                }
                if (!fullname) {
                    result.push(MESSAGE.MISSING_INPUT("Họ tên"));
                }
                return result.join(", ");
            })();

            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: message,
            });
        }

        const oldEmail = await AccountService.findAccount({ email: email });
        if (oldEmail) {
            return res.status(400).json({
                status: API_STATUS.EXISTED,
                message: MESSAGE.EXISTED_EMAIL,
            });
        }
        const account = await AccountService.createAccount({
            password,
            email,
            fullname,
        });
        const token = await account.generateAuthToken();
        const refreshToken = await account.generateAuthRefreshToken();
        const text =
            "Vui lòng xác minh email tài khoản thông qua liên kết dưới đây:\n";
        const verifyUrl = `${process.env.BASE_URL}account/${account.accountID}/verify/${token}`;
        await sendEmail(
            account.email,
            "Xác minh email tài khoản",
            text,
            verifyUrl
        );
        res.status(200).json({
            status: API_STATUS.OK,
            data: [
                {
                    account: mapUser(account),
                    token: token,
                    refreshToken,
                },
            ],
            message: MESSAGE.POST_SUCCESS("Đăng kí"),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

export const signupGoogle = async (req, res, next) => {
    try {
        const { token: ggToken, email, fullname } = req.body;
        if (!ggToken || !email || !fullname) {
            const message = (() => {
                let result = [];
                if (!ggToken) {
                    result.push(MESSAGE.MISSING_INPUT("GG Token"));
                }
                if (!email) {
                    result.push(MESSAGE.MISSING_INPUT("Email"));
                }
                if (!fullname) {
                    result.push(MESSAGE.MISSING_INPUT("Họ tên"));
                }
                return result.join(", ");
            })();

            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: message,
            });
        }

        //Validate google token
        const verifiedTokenResponse = await validateGoogleToken(ggToken);
        if (verifiedTokenResponse.error) {
            return res.status(400).json({
                message: MESSAGE.INVALID_INPUT("TOKEN"),
                status: API_STATUS.INVALID_INPUT,
                error: verifiedTokenResponse.error,
            });
        }

        const oldEmail = await AccountService.findAccount({ email: email });
        if (oldEmail) {
            // return res.status(400).json({
            //     status: API_STATUS.EXISTED,
            //     message: MESSAGE.EXISTED_EMAIL,
            // });

            //sign up to an existed email, so login instead
            const loginRes = await AccountService.googleLogin({ email });
            const token = await loginRes.generateAuthToken();
            const refreshToken = await loginRes.generateAuthRefreshToken();
            return res.status(200).json({
                status: API_STATUS.OK,
                data: [
                    {
                        account: mapUser(loginRes),
                        token: token,
                        refreshToken: refreshToken,
                    },
                ],
                message: MESSAGE.POST_SUCCESS("Đăng nhập"),
            });
        }

        const account = await AccountService.createAccount({ email, fullname });
        const token = await account.generateAuthToken();
        const refreshToken = await account.generateAuthRefreshToken();
        const verified = await AccountService.accountVerified(
            account.accountID
        );
        res.status(200).json({
            status: API_STATUS.OK,
            data: [
                {
                    account: mapUser(account),
                    token: token,
                    refreshToken,
                },
            ],
            message: MESSAGE.POST_SUCCESS("Đăng kí"),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

export const getAccountList = async (req, res, next) => {
    try {
        const { email } = req.query;
        const data = await AccountService.getAccoutList({ email });
        res.status(200).json({
            status: API_STATUS.OK,
            data: [...data].map((item) => mapUser(item)),
            message: MESSAGE.QUERY_SUCCESS("account"),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

export const getMe = async (req, res, next) => {
    try {
        res.status(200).json({
            status: API_STATUS.OK,
            data: [req.user],
            message: MESSAGE.QUERY_SUCCESS("account"),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

export const refreshToken = async (req, res, next) => {
    try {
        const token = await req.user.generateAuthToken();
        res.status(200).json({
            status: API_STATUS.OK,
            data: [token],
            message: MESSAGE.POST_SUCCESS("Refresh token"),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

export const changePassword = async (req, res, next) => {
    try {
        const user = req.user;
        const accountID = user.accountID;
        const { password, newPassword } = req.body;
        if (!newPassword || !password) {
            let message = [];
            if (!newPassword) {
                message.push(MESSAGE.MISSING_INPUT("Mật khẩu mới"));
            }
            if (!password) {
                message.push(MESSAGE.MISSING_INPUT("Mật khẩu"));
            }
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: message.join(", "),
            });
        }

        if (await AccountService.comparePassword({ accountID, password })) {
        } else {
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: MESSAGE.INVALID_INPUT("Mật khẩu"),
            });
        }

        const hashPassword = await bcrypt.hash(newPassword, BCRYPT_SALT);
        const newAccount = await AccountService.changePassword({
            accountID,
            newPassword: hashPassword,
        });
        if (!newAccount) {
            return res.status(404).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.QUERY_NOT_FOUND("Tài khoản"),
            });
        }
        return res.status(200).json({
            status: API_STATUS.OK,
            message: MESSAGE.POST_SUCCESS("Đổi mật khẩu"),
            data: [mapUser(newAccount)],
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

export const verifyEmail = async (req, res, next) => {
    try {
        const accountID = req.params.id;
        const token = req.params.token;
        const account = await AccountService.findAccountByAccountId(accountID);
        if (!account) {
            return res.status(400).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.QUERY_NOT_FOUND("account"),
            });
        }
        if (account.tokens[account.tokens.length - 1].token !== token) {
            return res.status(400).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.QUERY_NOT_FOUND("token"),
            });
        }
        await AccountService.accountVerified(accountID);
        return res.status(200).json({
            status: API_STATUS.OK,
            data: [mapUser(account)],
            message: MESSAGE.POST_SUCCESS("Xác minh tài khoản"),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

export const updateInfo = async (req, res, next) => {
    try {
        const { fullname } = req.body;
        if (!fullname) {
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: MESSAGE.MISSING_INPUT("Tên"),
            });
        }
        const user = req.user;
        const newUser = await AccountService.updateInfo({
            accountID: user.accountID,
            fullname,
        });
        if (!newUser) {
            return res.status(404).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.NOT_FOUND_ACCOUNT,
            });
        }
        return res.status(200).json({
            status: API_STATUS.OK,
            data: [newUser],
            message: MESSAGE.POST_SUCCESS("Cập nhật thông tin cá nhân"),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

export const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const account = await AccountService.findAccountByEmail(email);
        if (account) {
            const token = await account.generateAuthToken();
            const refreshToken = await account.generateAuthRefreshToken();
            const text =
                "Vui lòng đặt lại mật khẩu tài khoản thông qua liên kết dưới đây:\n";
            const resetPasswordUrl = `${process.env.BASE_URL}account/${account.accountID}/reset_password/${token}`;
            await sendEmail(
                account.email,
                "Đặt lại mật khẩu tài khoản",
                text,
                resetPasswordUrl
            );
            return res.status(200).json({
                status: API_STATUS.OK,
                data: [
                    {
                        account: mapUser(account),
                        token: token,
                        refreshToken: refreshToken,
                    },
                ],
                message: MESSAGE.POST_SUCCESS("Xác nhận tài khoản"),
            });
        } else {
            return res.status(401).json({
                status: API_STATUS.AUTHENTICATE,
                message: MESSAGE.NOT_FOUND_ACCOUNT,
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

export const verifyResetPassword = async (req, res, next) => {
    try {
        const accountID = req.params.id;
        const token = req.params.token;
        const account = await AccountService.findAccountByAccountId(accountID);
        if (!account) {
            return res.status(400).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.QUERY_NOT_FOUND("account"),
            });
        }
        if (account.tokens[account.tokens.length - 1].token !== token) {
            return res.status(400).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.QUERY_NOT_FOUND("token"),
            });
        }
        return res.status(200).json({
            status: API_STATUS.OK,
            data: [mapUser(account)],
            message: MESSAGE.POST_SUCCESS("Xác nhận tài khoản"),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

export const resetPassword = async (req, res, next) => {
    try {
        const { accountID, password } = req.body;
        if (!password) {
            let message = [];
            if (!password) {
                message.push(MESSAGE.MISSING_INPUT("Mật khẩu"));
            }
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: message.join(", "),
            });
        }
        const hashPassword = await bcrypt.hash(password, BCRYPT_SALT);
        const newAccount = await AccountService.changePassword({
            accountID,
            newPassword: hashPassword,
        });
        if (!newAccount) {
            return res.status(404).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.QUERY_NOT_FOUND("Tài khoản"),
            });
        }
        return res.status(200).json({
            status: API_STATUS.OK,
            message: MESSAGE.POST_SUCCESS("Đổi mật khẩu"),
            data: [mapUser(newAccount)],
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};
