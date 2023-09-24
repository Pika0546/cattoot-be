import mongoose from "mongoose";
import Counter from "../../../lib/counterModel";

const CollabSchema = new mongoose.Schema(
    {
        collabID: {
            type: Number,
            default: 0,
        },
        presentationID: {
            type: Number,
            required: true,
        },
        accountID: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
);

CollabSchema.pre("save", async function (next) {
    const collab = this;
    if (!collab.collabID) {
        const counter = await Counter.increase("COLLAB");
        collab.collabID = counter.value;
    }
    next();
});

const Collab = mongoose.model("Collab", CollabSchema);

export default Collab;
