import express from "express";
import { auth } from "../../middleware/auth";
import { authRefreshToken } from "../../middleware/authResfreshToken";
import {
    getAccountList,
    getMe,
    login,
    logout,
    refreshToken,
    signup,
    changePassword,
    signupGoogle,
    googleLogin,
    verifyEmail,
    updateInfo,
    forgotPassword,
    verifyResetPassword,
    resetPassword,
} from "./accountController";
const accountRoute = express.Router();

/* body: {email: "", password:""} */
accountRoute.post("/login", login);

/* body: {email: "", fullname: "", token:""} */
accountRoute.post("/google-login", googleLogin);

/* body: {} */
accountRoute.post("logout", auth, logout);

/* query: {}*/
accountRoute.get("/me", auth, getMe);

/* body: {email: "", fullname: "", token: ""} */
accountRoute.post("/google-signup", signupGoogle);

/* body: {refreshToken: ""} */
accountRoute.post("/token-refresh", authRefreshToken, refreshToken);

/* query: {} */
accountRoute.get("/", auth, getAccountList);

/* body: {password: "", newPassword: ""} */
accountRoute.post("/me/change-password", auth, changePassword);

/* body: {fullname: ""} */
accountRoute.post("/me", auth, updateInfo);

/* body: {password:"", email: "", fullname: ""} */
accountRoute.post("/", signup);

/* body: {email: ""} */
accountRoute.post("/forgot_password", forgotPassword);

/* body: {accountID: 0, password: ""} */
accountRoute.post("/reset_password", resetPassword);

/* query: {} */
accountRoute.get("/:id/verify/:token", verifyEmail);

/* query: {} */
accountRoute.get("/:id/reset_password/:token", verifyResetPassword);

export default accountRoute;
