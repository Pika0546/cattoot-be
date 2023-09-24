import mongoose from "mongoose";
import { BCRYPT_SALT, CODE_LENGTH, JWT_KEY } from "../../../config";
import Counter from "../../../lib/counterModel";
import { generateCode, NUMBERIC } from "../../../utilities/string";

const MessageSchema = new mongoose.Schema(
    {
        messageID: {
            type: Number,
            default: 0,
        },
        presentationID: {
            type: Number,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        createdByAccountID: {
            type: Number,
            default: null,
        },
    },
    { timestamps: true }
);

MessageSchema.pre("save", async function (next) {
    const message = this;
    if (!message.messageID) {
        const counter = await Counter.increase("MESSAGE");
        message.messageID = counter.value;
    }
    next();
});

const Message = mongoose.model("Message", MessageSchema);

export default Message;
