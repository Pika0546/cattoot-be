import mongoose from "mongoose";

const CounterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    value: {
        type: Number,
        required: true,
        default: 0,
    },
});

CounterSchema.statics.increase = async (name) => {
    return await Counter.findOneAndUpdate(
        { name: name },
        { $inc: { value: 1 } },
        { upsert: true, new: true }
    );
};

const Counter = mongoose.model("Counter", CounterSchema);

export default Counter;
