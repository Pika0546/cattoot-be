import express from "express";
import { createNewSlide } from "./slideController";

const slideRoute = express.Router();

slideRoute.post("/", createNewSlide);

export default slideRoute;
