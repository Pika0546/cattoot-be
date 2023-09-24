import express from "express";
import { getMe } from "../../middleware/getMe";
import { joinPresentation, submitAnswer } from "./joinController";

const presentationRoute = express.Router();

presentationRoute.post("/submit", getMe, submitAnswer);
presentationRoute.get("/:inviteCode", getMe, joinPresentation);
export default presentationRoute;
