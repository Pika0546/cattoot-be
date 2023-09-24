import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import { myCors } from "./middleware/cors";
import { router } from "./route";
import { connectDB } from "./config/database";
import http from "http";
import SocketIO from "socket.io";
import passport from "./config/passport";
dotenv.config();
const port = 3330;
const app = express();

app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(myCors());
app.use(passport.initialize());

router(app);

const server = http.createServer(app);
const io = new SocketIO.Server(server, {
    transports: ["websocket"],
    cors: {
        origin: "*",
    },
});
io.on("connection", (socket) => {
    console.log("new client connected", socket.id);
});

connectDB()
    .then((result) => {
        server.listen(process.env.PORT || port, () => {
            console.log(
                `Cattoot listening at http://localhost:${
                    process.env.PORT || port
                }`
            );
        });
    })
    .catch((e) => {
        console.log(e);
    });

export const socket = io;
