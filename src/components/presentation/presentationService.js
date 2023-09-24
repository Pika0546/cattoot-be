import Presentation from "./presentationModel";
export const getMyPresentation = ({ accountID, title, offset, limit }) => {
    // return Presentation.find({
    //     ...(title && { name: title }),
    //     createdByAccountID: accountID,
    // })
    //     .skip(offset)
    //     .limit(limit)
    //     .lean();
    return Presentation.aggregate([
        {
            $lookup: {
                from: "collabs",
                localField: "presentationID",
                foreignField: "presentationID",
                as: "collabs",
            },
        },
        {
            $match: {
                $or: [
                    {
                        createdByAccountID: accountID,
                    },
                    {
                        "collabs.accountID": accountID,
                    },
                ],
                ...(title && { name: title }),
            },
        },
        {
            $project: {
                follower: 0,
            },
        },
    ])
        .skip(offset)
        .limit(limit)
        .sort({ createdAt: "descending" });
};

export const countMyPresentation = ({ accountID, title }) => {
    return Presentation.count({
        ...(title && { name: title }),
        createdByAccountID: accountID,
    });
};

export const getPresentationByID = ({ presentationID, accountID }) => {
    return Presentation.findOne({
        presentationID,
        ...(accountID && { createdByAccountID: accountID }),
    }).lean();
};

export const getPresentationbyCode = ({ code }) => {
    return Presentation.findOne({
        "joinCode.code": code,
    }).lean();
};

export const create = async ({ createdByAccountID }) => {
    const presentation = new Presentation({
        createdByAccountID,
    });
    return (await presentation.save()).toObject();
};

export const deletePresentation = async ({ presentationID }) => {
    return Presentation.deleteOne({ presentationID });
};

export const updatePresentationInfo = async ({
    presentationID,
    name,
    currentSlideID,
}) => {
    return Presentation.findOneAndUpdate(
        {
            presentationID,
        },
        {
            name,
            currentSlideID,
        },
        {
            new: true,
        }
    ).lean();
};

export const changeCurrentSlideID = ({ presentationID, slideID }) => {
    return Presentation.findOneAndUpdate(
        {
            presentationID,
        },
        {
            currentSlideID: slideID,
        },
        {
            new: true,
        }
    ).lean();
};
