export const getPaginationInfo = (req) => {
    const result = {
        offset: 0,
        limit: 1000,
        getTotal: true,
    };
    if (!req || !req.query) {
        return result;
    }

    const page = req.query.page || 1;
    const limit = req.query.limit || 1000;
    const getTotal = !!req.query.getTotal || false;

    result.offset = (page - 1) * limit;
    result.limit = limit;
    result.getTotal = getTotal;

    return result;
};
