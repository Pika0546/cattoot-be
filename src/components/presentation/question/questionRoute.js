import express from "express";
import { getMe } from "../../../middleware/getMe";
import { auth } from "../../../middleware/auth";
import {
    getQuestionList,
    markAnsweredQuestion,
    sendQuestion,
    upvoteQuestion,
} from "./questionController";
const questionRoute = express.Router();

questionRoute.post("/", getMe, sendQuestion);
questionRoute.get("/", getMe, getQuestionList);

/* body: {questionID: 0, presentationID: 0} */
questionRoute.post("/upvote", getMe, upvoteQuestion);

/* body: {questionID: 0, presentationID: 0} */
questionRoute.post("/mark-answered", auth, markAnsweredQuestion);

export default questionRoute;
