import express from "express";
import { auth } from "../../../middleware/auth";
import { addCollab, getCollabList, removeCollab } from "./collabController";
const collabRoute = express.Router();

collabRoute.get("/", auth, getCollabList);
collabRoute.post("/", auth, addCollab);
collabRoute.post("/remove", auth, removeCollab);

export default collabRoute;
