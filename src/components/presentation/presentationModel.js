import mongoose from "mongoose";
import { BCRYPT_SALT, CODE_LENGTH, JWT_KEY } from "../../config";
import Counter from "../../lib/counterModel";
import { generateCode, NUMBERIC } from "../../utilities/string";

const DEFAULT_NAME = "Bản trình bày chưa có tiêu đề";

const PresentationSchema = new mongoose.Schema(
    {
        presentationID: {
            type: Number,
            default: 0,
        },
        name: {
            type: String,
            required: true,
            default: DEFAULT_NAME,
        },
        joinCode: {
            code: {
                type: String,
            },
        },
        currentSlideID: {
            type: Number,
            default: 0,
        },
        createdByAccountID: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
);

PresentationSchema.pre("save", async function (next) {
    const presentation = this;
    if (!presentation.presentationID) {
        const counter = await Counter.increase("PRESENTATION");
        presentation.presentationID = counter.value;
    }
    if (!presentation.joinCode || !presentation.joinCode.code) {
        const code = generateCode(
            presentation.presentationID,
            CODE_LENGTH,
            NUMBERIC
        );
        presentation.joinCode = {
            code,
        };
    }
    next();
});

const Presentation = mongoose.model("Presentation", PresentationSchema);

export default Presentation;
