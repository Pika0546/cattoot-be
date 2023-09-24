import Collab from "./collabModel";

export const getCollabList = async ({ presentationID }) => {
    return await Collab.find({
        presentationID,
    }).lean();
};

export const createCollab = async ({ presentationID, accountID }) => {
    const result = new Collab({ accountID, presentationID });
    return (await result.save()).toObject();
};

export const removeCollab = async ({ presentationID, accountID }) => {
    return await Collab.deleteOne({
        presentationID,
        accountID,
    }).lean();
};

export const findCollaborator = async ({ presentationID, accountID }) => {
    return await Collab.findOne({ presentationID, accountID }).lean();
};
