import { API_STATUS } from "../../lib/common";
import * as MESSAGE from "../../resource/message";
import * as GroupService from "./groupService";
import * as AccountService from "../account/accountService";
import * as PresentationService from "../presentation/presentationService";
import { GROUP_MEMBER_ROLE } from "./groupModel";
import { getPaginationInfo } from "../../utilities/pagination";
import { mapUser } from "../../utilities/user";
import { isInteger } from "../../utilities/number";
import {
    getGroupCreator,
    getGroupCurrentPresentation,
    getGroupMembers,
} from "./groupUtil";
import { sendEmail } from "../../utilities/sendEmail";
import jwt from "jsonwebtoken";
import { emitMessage, SOCKET_TYPE } from "../../config/socket";

export const createGroup = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: MESSAGE.MISSING_INPUT("Tên nhóm"),
            });
        }
        if (!description) {
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: MESSAGE.MISSING_INPUT("Mô tả nhóm"),
            });
        }
        const old = await GroupService.getGroupByName({ name });
        if (old) {
            return res.status(400).json({
                status: API_STATUS.EXISTED,
                message: MESSAGE.EXISTED_GROUP,
            });
        }
        const creator = req.user;
        const members = [
            {
                accountID: creator.accountID,
                role: GROUP_MEMBER_ROLE.OWNER,
            },
        ];
        let group = await GroupService.create({
            name,
            description,
            createdByAccountID: parseInt(creator.accountID),
            members,
        });
        group = await getGroupCreator(group);
        group = await getGroupMembers(group);
        group = await getGroupCurrentPresentation(group);

        return res.status(200).json({
            status: API_STATUS.OK,
            data: [group],
            message: MESSAGE.POST_SUCCESS("Tạo nhóm"),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

export const getListGroup = async (req, res, next) => {
    try {
        const { offset, limit, getTotal } = getPaginationInfo(req);
        const name = req.query ? req.query.name || "" : "";
        const user = req.user;
        const list = await GroupService.getListGroup({
            offset,
            limit,
            name,
            accountID: user.accountID,
        });
        let total = -1;
        if (getTotal) {
            total = await GroupService.getTotal({ name });
        }
        if (list.length) {
            const data = [...list];
            const arr = list.map((item) => {
                return AccountService.findAccount({
                    accountID: item.createdByAccountID,
                });
            });

            const userData = await Promise.all(arr);
            const n = data.length;
            const m = userData.length;
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < m; j++) {
                    if (data[i].createdByAccountID === userData[j].accountID) {
                        data[i].createdBy = mapUser(userData[j]);
                    }
                }
                data[i] = await getGroupMembers(data[i]);
            }
            return res.status(200).json({
                status: API_STATUS.OK,
                message: MESSAGE.QUERY_SUCCESS("Nhóm"),
                data: data,
                ...(total >= 0 && { total }),
            });
        } else {
            return res.status(404).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.QUERY_NOT_FOUND("Nhóm"),
                data: [],
                ...(total >= 0 && { total }),
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

export const getGroupByID = async (req, res, next) => {
    try {
        const groupID = req.params ? req.params.groupID || null : null;
        const user = req.user;
        if (!(groupID && isInteger(groupID))) {
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: MESSAGE.MISSING_INPUT("groupID"),
            });
        }

        let group = await GroupService.getGroupByGroupID({
            groupID: parseInt(groupID),
            accountID: user.accountID,
        });
        if (!group) {
            return res.status(404).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.QUERY_NOT_FOUND("Nhóm"),
            });
        }
        group = await getGroupCreator(group);
        group = await getGroupMembers(group);
        group = await getGroupCurrentPresentation(group);
        // const creator = await AccountService.findAccount({ accountID: group.createdByAccountID });
        // if(creator){
        //     group.createdBy = mapUser(creator);
        // }

        return res.status(200).json({
            status: API_STATUS.OK,
            message: MESSAGE.QUERY_SUCCESS("Nhóm"),
            data: [group],
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

export const updateGroup = async (req, res, next) => {
    try {
        const newName = req.body ? req.body.name || "" : "";
        const newDescription = req.body ? req.body.description || "" : "";
        const groupID = req.params ? req.params.groupID || null : null;
        const user = req.user;
        if (!(groupID && isInteger(groupID))) {
            return res.status(400).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.QUERY_NOT_FOUND("Nhóm"),
            });
        }

        if (!newName || !newDescription) {
            const message = [];
            if (!newName) {
                message.push(MESSAGE.MISSING_INPUT("Tên nhóm"));
            }
            if (!newDescription) {
                message.push(MESSAGE.MISSING_INPUT("Mô tả nhóm"));
            }
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: message.join(", "),
            });
        }
        let group = await GroupService.updateGroupInfo({
            groupID: parseInt(groupID),
            name: newName,
            description: newDescription,
            accountID: user.accountID,
        });
        if (!group) {
            return res.status(404).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.QUERY_NOT_FOUND("Nhóm"),
            });
        }
        group = await getGroupCreator(group);
        group = await getGroupMembers(group);
        group = await getGroupCurrentPresentation(group);

        // const creator = await AccountService.findAccount({ accountID: group.createdByAccountID });
        // if(creator){
        //     group.createdBy = mapUser(creator);
        // }
        return res.status(200).json({
            status: API_STATUS.OK,
            message: MESSAGE.POST_SUCCESS("Cập nhật thông tin"),
            data: [group],
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

export const updateRole = async (req, res, next) => {
    try {
        const { accountID, groupID, role } = req.body;
        const me = req.user;
        if (!accountID || !groupID || !role) {
            const message = [];
            if (!accountID) {
                message.push(MESSAGE.MISSING_INPUT("accountID"));
            }
            if (!groupID) {
                message.push(MESSAGE.MISSING_INPUT("groupID"));
            }
            if (!role) {
                message.push(MESSAGE.MISSING_INPUT("Vai trò"));
            }
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: message.join(", "),
            });
        }

        const user = await AccountService.findAccount({ accountID });
        if (!user) {
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: MESSAGE.NOT_FOUND_ACCOUNT,
            });
        }
        let group = await GroupService.getGroupByGroupID({
            groupID,
            accountID: accountID,
            creatorID: me.accountID,
        });
        if (!group) {
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: MESSAGE.NOT_FOUND_GROUP,
            });
        }

        if (!GROUP_MEMBER_ROLE[role.toUpperCase()]) {
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: MESSAGE.INVALID_INPUT("Vai trò"),
            });
        }

        const members = [...group.members];
        const n = members.length;
        for (let i = 0; i < n; i++) {
            if (members[i].accountID == me.accountID) {
                if (members[i].role !== GROUP_MEMBER_ROLE.OWNER) {
                    return res.status(403).json({
                        status: API_STATUS.PERMISSION_DENIED,
                        message: MESSAGE.PERMISSION_NOT_FOUND,
                    });
                } else if (role.toUpperCase() === GROUP_MEMBER_ROLE.OWNER) {
                    members[i].role = GROUP_MEMBER_ROLE.MEMBER;
                }
                break;
            }
        }
        for (let i = 0; i < n; i++) {
            if (members[i].accountID == accountID) {
                members[i].role = GROUP_MEMBER_ROLE[role.toUpperCase()];
                break;
            }
        }
        let result = await GroupService.updateGroupMember({
            groupID,
            members,
            createdByAccountID:
                role.toUpperCase() === GROUP_MEMBER_ROLE.OWNER
                    ? accountID
                    : null,
        });
        if (!result) {
            return res.status(404).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.QUERY_NOT_FOUND("Nhóm"),
            });
        }
        result = await getGroupCreator(result);
        result = await getGroupMembers(result);
        group = await getGroupCurrentPresentation(group);

        return res.status(200).json({
            status: API_STATUS.OK,
            message: MESSAGE.POST_SUCCESS("Cập nhật vai trò"),
            data: [result],
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

export const removeMember = async (req, res, next) => {
    try {
        const { accountID, groupID } = req.body;
        const me = req.user;
        if (!accountID || !groupID) {
            const message = [];
            if (!accountID) {
                message.push(MESSAGE.MISSING_INPUT("accountID"));
            }
            if (!groupID) {
                message.push(MESSAGE.MISSING_INPUT("groupID"));
            }
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: message.join(", "),
            });
        }

        const user = await AccountService.findAccount({ accountID });
        if (!user) {
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: MESSAGE.NOT_FOUND_ACCOUNT,
            });
        }
        let group = await GroupService.getGroupByGroupID({
            groupID,
            accountID: accountID,
            creatorID: me.accountID,
        });
        if (!group) {
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: MESSAGE.NOT_FOUND_GROUP,
            });
        }

        const members = [...group.members];
        const n = members.length;
        for (let i = 0; i < n; i++) {
            if (members[i].accountID == me.accountID) {
                if (members[i].role !== GROUP_MEMBER_ROLE.OWNER) {
                    return res.status(403).json({
                        status: API_STATUS.PERMISSION_DENIED,
                        message: MESSAGE.PERMISSION_NOT_FOUND,
                    });
                }
                break;
            }
        }
        const newMembers = members.filter(
            (item) => item.accountID != accountID
        );
        let result = await GroupService.updateGroupMember({
            groupID,
            members: newMembers,
        });
        if (!result) {
            return res.status(404).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.QUERY_NOT_FOUND("Nhóm"),
            });
        }
        result = await getGroupCreator(result);
        result = await getGroupMembers(result);
        group = await getGroupCurrentPresentation(group);

        emitMessage(SOCKET_TYPE.REMOVE_MEMBER, {
            groupID,
            accountID,
        });
        return res.status(200).json({
            status: API_STATUS.OK,
            message: MESSAGE.POST_SUCCESS("Cập nhật thành viên"),
            data: [result],
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

export const sendEmailInviteGroup = async (req, res, next) => {
    try {
        const me = req.user;
        const { email, groupName, inviteLink } = req.body;
        const text = `${me.fullname} đã mời bạn vào nhóm ${groupName}. Tham gia nhóm thông qua liên kết dưới đây:\n`;
        await sendEmail(
            email,
            `${me.fullname} đã mời bạn vào nhóm ${groupName}`,
            text,
            inviteLink
        );
        return res.status(200).json({
            status: API_STATUS.OK,
            message: MESSAGE.SEND_EMAIL_SUCCESS,
            data: [],
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

export const joinGroup = async (req, res, next) => {
    try {
        const user = req.user;
        const inviteCode = req.params.inviteCode;
        const groupID = jwt.decode(inviteCode);
        const group = await GroupService.getGroupByID({ groupID });
        if (!group) {
            return res.status(400).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.QUERY_NOT_FOUND("group"),
            });
        }
        const newMembers = [...group.members];
        const n = newMembers.length;
        for (let i = 0; i < n; i++) {
            if (newMembers[i].accountID == user.accountID) {
                return res.status(200).json({
                    status: API_STATUS.OK,
                    data: [{ groupID }],
                    message: MESSAGE.POST_SUCCESS("Tham gia group"),
                });
            }
        }
        newMembers.push({
            accountID: user.accountID,
            role: GROUP_MEMBER_ROLE.MEMBER,
        });
        const result = await GroupService.updateGroupMember({
            groupID,
            members: newMembers,
        });
        return res.status(200).json({
            status: API_STATUS.OK,
            data: [{ groupID }],
            message: MESSAGE.POST_SUCCESS("Tham gia group"),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

export const getMyListGroup = async (req, res, next) => {
    try {
        const user = req.user;
        const list = await GroupService.getMyListGroup({
            accountID: user.accountID,
        });
        if (list.length) {
            return res.status(200).json({
                status: API_STATUS.OK,
                message: MESSAGE.QUERY_SUCCESS("Nhóm"),
                data: list,
            });
        } else {
            return res.status(404).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.QUERY_NOT_FOUND("Nhóm"),
                data: [],
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

export const sharePresentationToGroup = async (req, res, next) => {
    try {
        const groupID = req.body ? req.body.groupID || 0 : 0;
        const presentationID = req.body ? req.body.presentationID || 0 : 0;
        const user = req.user;

        if (!groupID || !presentationID) {
            const message = [];
            if (!groupID) {
                message.push(MESSAGE.MISSING_INPUT("Mã nhóm"));
            }
            if (!presentationID) {
                message.push(MESSAGE.MISSING_INPUT("Mã bản trình bày"));
            }
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: message.join(", "),
            });
        }

        const presentation = await PresentationService.getPresentationByID({
            presentationID,
        });
        if (!presentation) {
            return res.status(404).json({
                message: MESSAGE.QUERY_NOT_FOUND("Bản trình bày"),
                status: API_STATUS.NOT_FOUND,
            });
        }

        let group = await GroupService.sharePresentationToGroup({
            groupID: parseInt(groupID),
            presentationID: parseInt(presentationID),
            accountID: user.accountID,
        });
        if (!group) {
            return res.status(404).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.QUERY_NOT_FOUND("Nhóm"),
            });
        }
        group = await getGroupCreator(group);
        group = await getGroupMembers(group);
        group = await getGroupCurrentPresentation(group);

        emitMessage(SOCKET_TYPE.START_PRESENTATION, {
            groupID,
            presentation: group.presentation,
        });
        return res.status(200).json({
            status: API_STATUS.OK,
            message: MESSAGE.POST_SUCCESS("Chia sẻ bản trình bày"),
            data: [group],
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

export const removePresentationFromGroup = async (req, res, next) => {
    try {
        const groupID = req.body ? req.body.groupID || 0 : 0;

        if (!groupID) {
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: MESSAGE.MISSING_INPUT("Mã nhóm"),
            });
        }

        let group = await GroupService.removePresentationFromGroup({
            groupID: parseInt(groupID),
        });
        if (!group) {
            return res.status(404).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.QUERY_NOT_FOUND("Nhóm"),
            });
        }
        emitMessage(SOCKET_TYPE.START_PRESENTATION, {
            groupID,
            presentation: null,
        });
        return res.status(200).json({
            status: API_STATUS.OK,
            message: MESSAGE.POST_SUCCESS("Gỡ bản trình bày"),
            data: [group],
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

export const deleteGroup = async (req, res, next) => {
    try {
        const { groupID } = req.body;
        if (!groupID) {
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: MESSAGE.MISSING_INPUT("Nhóm"),
            });
        }

        const me = req.user;

        const group = await GroupService.getOwnerGroup({
            groupID,
            accountID: me.accountID,
        });

        if (!group) {
            return res.status(403).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.PERMISSION_NOT_FOUND,
            });
        }

        const deletedGroup = await GroupService.deleteGroup({ groupID });

        emitMessage(SOCKET_TYPE.DELETE_GROUP, { groupID });

        return res.status(200).json({
            status: API_STATUS.OK,
            message: MESSAGE.POST_SUCCESS("Xóa group"),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

export const shareMultiPresentationToGroup = async (req, res, next) => {
    try {
        const sharedGroup = req.body ? req.body.sharedGroup || [] : [];
        const unSharedGroup = req.body ? req.body.unSharedGroup || [] : [];
        const presentationID = req.body ? req.body.presentationID || 0 : 0;
        const user = req.user;

        if (!presentationID) {
            const message = [];
            if (!presentationID) {
                message.push(MESSAGE.MISSING_INPUT("Mã bản trình bày"));
            }
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: message.join(", "),
            });
        }

        const presentation = await PresentationService.getPresentationByID({
            presentationID,
        });
        if (!presentation) {
            return res.status(404).json({
                message: MESSAGE.QUERY_NOT_FOUND("Bản trình bày"),
                status: API_STATUS.NOT_FOUND,
            });
        }

        const nShare = sharedGroup.length;
        for (let index = 0; index < nShare; index++) {
            let group = await GroupService.sharePresentationToGroup({
                groupID: parseInt(sharedGroup[index]),
                presentationID: parseInt(presentationID),
                accountID: user.accountID,
            });
            if (!group) {
                return res.status(404).json({
                    status: API_STATUS.NOT_FOUND,
                    message: MESSAGE.QUERY_NOT_FOUND("Nhóm"),
                });
            }
            group = await getGroupCreator(group);
            group = await getGroupMembers(group);
            group = await getGroupCurrentPresentation(group);
            emitMessage(SOCKET_TYPE.START_PRESENTATION, {
                groupID: group.groupID,
                presentation: group.presentation,
            });
        }

        const nUnshare = unSharedGroup.length;
        for (let index = 0; index < nUnshare; index++) {
            let group = await GroupService.unSharePresentationToGroup({
                groupID: parseInt(unSharedGroup[index]),
                accountID: user.accountID,
            });
            if (!group) {
                return res.status(404).json({
                    status: API_STATUS.NOT_FOUND,
                    message: MESSAGE.QUERY_NOT_FOUND("Nhóm"),
                });
            }
            emitMessage(SOCKET_TYPE.START_PRESENTATION, {
                groupID: group.groupID,
                presentation: null,
            });
        }

        return res.status(200).json({
            status: API_STATUS.OK,
            message: MESSAGE.POST_SUCCESS("Chia sẻ bản trình bày"),
            data: [],
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};
