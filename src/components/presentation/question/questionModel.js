import mongoose from "mongoose";
import { BCRYPT_SALT, CODE_LENGTH, JWT_KEY } from "../../../config";
import Counter from "../../../lib/counterModel";
import { generateCode, NUMBERIC } from "../../../utilities/string";

const QuestionSchema = new mongoose.Schema(
    {
        questionID: {
            type: Number,
            default: 0,
        },
        presentationID: {
            type: Number,
            required: true,
        },
        question: {
            type: String,
            required: true,
        },
        voted: {
            type: [
                {
                    accountID: {
                        type: Number,
                    },
                },
            ],
        },
        totalVoted: {
            type: Number,
            default: 0,
        },
        isAnswered: {
            type: Boolean,
            default: false,
        },
        createdByAccountID: {
            type: Number,
            default: null,
        },
    },
    { timestamps: true }
);

QuestionSchema.pre("save", async function (next) {
    const question = this;
    if (!question.questionID) {
        const counter = await Counter.increase("QUESTION");
        question.questionID = counter.value;
    }
    next();
});

const Question = mongoose.model("Question", QuestionSchema);

export default Question;
