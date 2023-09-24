import express from "express";
import { auth } from "../../middleware/auth";
import collabRoute from "./collab/collabRoute";
import messageRoute from "./message/messageRoute";
import {
    createPresentation,
    getMyPresentation,
    getPresentationDetail,
    updatePresentation,
    changeCurrentSlideID,
    deletePresentation,
} from "./presentationController";
import questionRoute from "./question/questionRoute";
import slideRoute from "./slide/slideRoute";

const presentationRoute = express.Router();

presentationRoute.use("/slide", auth, slideRoute);

presentationRoute.use("/message", messageRoute);

presentationRoute.use("/question", questionRoute);

presentationRoute.use("/collab", collabRoute);

presentationRoute.get("/", auth, getMyPresentation);

/* body: {} */
presentationRoute.post("/", auth, createPresentation);

presentationRoute.post("/delete", auth, deletePresentation);

presentationRoute.post("/next-slide", auth, changeCurrentSlideID);

presentationRoute.get("/:presentationID", auth, getPresentationDetail);

/* body: {name: "", slides: [{slideID: 0, type: "", slideOrder: 0, content:, } */
presentationRoute.post("/:presentationID", auth, updatePresentation);

export default presentationRoute;
