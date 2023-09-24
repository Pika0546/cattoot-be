export const queryParamToBool = (value) => {
    if (!value) {
        return value;
    }
    if (value === true) {
        return value;
    }
    return (value + "").toLowerCase() === "true";
};
