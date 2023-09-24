import mongoose from "mongoose";
import { API_STATUS } from "../lib/common";

const connection = {};
export const connectDB = async () => {
    if (connection.isConnected) {
        return;
    }
    try {
        const db = await mongoose.connect(process.env.DB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        connection.isConnected = db.connections[0].readyState;
        return {
            status: API_STATUS.OK,
            message: "Connected to mongoDB",
            data: db,
        };
    } catch (error) {
        return {
            status: API_STATUS.DB_ERROR,
            message: error.message,
            data: [error],
        };
    }
};
