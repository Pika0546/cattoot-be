const nodemailer = require("nodemailer");
import {
    MAIL_HOST,
    MAIL_PORT,
    MAIL_SECURE,
    ADMIN_MAIL_USER,
    ADMIN_MAIL_PASS,
} from "../config";

export const sendEmail = async (email, subject, text, url) => {
    try {
        const transporter = nodemailer.createTransport({
            host: MAIL_HOST,
            port: MAIL_PORT,
            secure: MAIL_SECURE,
            auth: {
                user: ADMIN_MAIL_USER,
                pass: ADMIN_MAIL_PASS,
            },
        });
        await transporter.sendMail({
            from: ADMIN_MAIL_USER,
            to: email,
            subject: subject,
            text: text + url,
        });
        console.log("Email sent Successfully");
    } catch (error) {
        console.log("Email not sent");
        console.log(error);
    }
};
