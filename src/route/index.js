import accountRoute from "../components/account/accountRoute";
import groupRoute from "../components/group/groupRoute";
import presentationRoute from "../components/presentation/presentationRoute";
import presentationJoinRouter from "../components/presentation-join/joinRoute";
import { API_STATUS } from "../lib/common";
import { auth } from "../middleware/auth";

export const router = (app) => {
    app.use("/account", accountRoute);
    app.use("/group", auth, groupRoute);
    app.use("/presentation", presentationRoute);
    app.use("/presentation-join", presentationJoinRouter);
    app.use("/", async (req, res, next) => {
        try {
            res.status(200).json({
                status: API_STATUS.OK,
                message: "a",
                data: [],
            });
        } catch (error) {
            res.status(500).json({
                status: API_STATUS.INTERNAL_ERROR,
                message: error.message,
            });
        }
    });
};
