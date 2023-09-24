import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { BCRYPT_SALT, CODE_LENGTH, JWT_KEY } from "../../config";
import * as MESSAGE from "../../resource/message";
import Counter from "../../lib/counterModel";
import { generateCode } from "../../utilities/string";

export const GROUP_MEMBER_ROLE = {
    OWNER: "OWNER",
    COOWNER: "COOWNER",
    MEMBER: "MEMBER",
};

const GroupSchema = new mongoose.Schema(
    {
        groupID: {
            type: Number,
            default: 0,
        },
        name: {
            type: String,
            required: true,
        },
        code: {
            type: String,
        },
        description: {
            type: String,
        },
        members: {
            type: Array,
            default: [
                {
                    accountID: {
                        type: Number,
                        required: true,
                    },
                    role: {
                        type: String,
                        required: true,
                        enum: Object.keys(GROUP_MEMBER_ROLE).filter(
                            (item) => item
                        ),
                    },
                },
            ],
        },
        createdByAccountID: {
            type: Number,
            required: true,
        },
        sharedPresentationID: {
            type: Number,
        },
    },
    { timestamps: true }
);

GroupSchema.pre("save", async function (next) {
    const group = this;
    if (!group.groupID) {
        const counter = await Counter.increase("GROUP");
        group.groupID = counter.value;
    }
    if (!group.code) {
        const code = generateCode(group.groupID, CODE_LENGTH);
        group.code = code;
    }
    next();
});

const Group = mongoose.model("Group", GroupSchema);

export default Group;
