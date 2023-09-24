import cors from "cors";

export const myCors = (arrayOfOrigin) => {
    if (!arrayOfOrigin) {
        return cors();
    }
    return cors({
        origin: arrayOfOrigin || [],
        optionsSuccessStatus: 200,
    });
};
