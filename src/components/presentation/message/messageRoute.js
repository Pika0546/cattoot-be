import express from "express";
import { getMe } from "../../../middleware/getMe";
import { getMessageList, sendMessage } from "./messageController";
const messageRoute = express.Router();

messageRoute.post("/", getMe, sendMessage);
messageRoute.get("/", getMe, getMessageList);

export default messageRoute;
