import { getRegextForSearchLike } from "../../utilities/string";
import Group, { GROUP_MEMBER_ROLE } from "./groupModel";

export const create = ({ name, description, createdByAccountID, members }) => {
    const group = new Group({
        name,
        description,
        createdByAccountID,
        members,
    });
    return group.save();
};

export const addMember = async ({ groupID, accountID, role }) => {
    const group = await getGroupByGroupID(groupID);
    group.members = group.members.concat({ accountID, role });
    await group.save();
    return { accountID, role };
};

export const getGroupByName = ({ name }) => {
    return Group.findOne({ name }).lean();
};

export const getGroupByID = ({ groupID }) => {
    return Group.findOne({ groupID }).lean();
};

export const getGroupByGroupID = ({ groupID, accountID, creatorID }) => {
    return Group.findOne({
        groupID,
        ...(accountID && {
            "members.accountID": accountID,
        }),
        ...(creatorID && {
            createdByAccountID: creatorID,
        }),
    }).lean();
};

export const getListGroup = async ({ offset, limit, name, accountID }) => {
    const searchRgx = getRegextForSearchLike(name);
    return Group.find({
        name: {
            $regex: searchRgx,
        },
        "members.accountID": accountID,
    })
        .skip(offset)
        .limit(limit)
        .lean()
        .sort({ createdAt: "descending" });
};

export const getTotal = ({ name }) => {
    const searchRgx = getRegextForSearchLike(name);
    return Group.count({
        name: {
            $regex: searchRgx,
        },
    }).lean();
};

export const updateGroupInfo = async ({
    groupID,
    name,
    description,
    accountID,
}) => {
    return Group.findOneAndUpdate(
        {
            groupID,
            ...(accountID && {
                "members.accountID": accountID,
            }),
        },
        {
            name,
            description,
        },
        {
            new: true,
        }
    ).lean();
};

export const updateGroupMember = async ({
    groupID,
    members,
    createdByAccountID,
}) => {
    return Group.findOneAndUpdate(
        {
            groupID,
        },
        {
            members: members,
            ...(createdByAccountID && { createdByAccountID }),
        },
        {
            new: true,
        }
    ).lean();
};

export const getMyListGroup = async ({ accountID }) => {
    return Group.find({
        $or: [
            {
                createdByAccountID: accountID,
            },
            {
                members: {
                    accountID: accountID,
                    role: GROUP_MEMBER_ROLE.COOWNER,
                },
            },
        ],
    })
        .lean()
        .sort({ name: 1 });
};

export const sharePresentationToGroup = async ({
    groupID,
    presentationID,
    accountID,
}) => {
    return Group.findOneAndUpdate(
        {
            groupID,
            $or: [
                {
                    createdByAccountID: accountID,
                },
                {
                    members: {
                        accountID: accountID,
                        role: GROUP_MEMBER_ROLE.COOWNER,
                    },
                },
            ],
        },
        {
            sharedPresentationID: presentationID,
        },
        {
            new: true,
        }
    ).lean();
};

export const unSharePresentationToGroup = async ({ groupID, accountID }) => {
    return Group.findOneAndUpdate(
        {
            groupID,
            $or: [
                {
                    createdByAccountID: accountID,
                },
                {
                    members: {
                        accountID: accountID,
                        role: GROUP_MEMBER_ROLE.COOWNER,
                    },
                },
            ],
        },
        {
            sharedPresentationID: null,
        },
        {
            new: true,
        }
    ).lean();
};

export const removePresentationFromGroup = async ({ groupID }) => {
    return Group.findOneAndUpdate(
        {
            groupID: groupID,
        },
        {
            sharedPresentationID: null,
        },
        {
            new: true,
        }
    ).lean();
};

export const getSharedPresentationGroup = async ({
    presentationID,
    accountID,
}) => {
    return Group.find({
        sharedPresentationID: presentationID,
        $or: [
            {
                createdByAccountID: accountID,
            },
            {
                members: {
                    accountID: accountID,
                    role: GROUP_MEMBER_ROLE.COOWNER,
                },
            },
        ],
    }).lean();
};

export const findGroup = async ({ groupID, sharedPresentationID }) => {
    return Group.find({
        ...(groupID && { groupID }),
        ...(sharedPresentationID && { sharedPresentationID }),
    }).lean();
};

export const getOwnerGroup = async ({ groupID, accountID }) => {
    return Group.findOne({
        ...(groupID && { groupID }),
        ...(accountID && { createdByAccountID: accountID }),
    }).lean();
};

export const deleteGroup = async ({ groupID }) => {
    return Group.deleteOne({ groupID });
};
