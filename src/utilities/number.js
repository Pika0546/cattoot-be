export const isInteger = (n) => {
    try {
        parseInt(n);
        return true;
    } catch (error) {
        return false;
    }
};
