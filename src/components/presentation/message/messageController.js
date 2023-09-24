import { API_STATUS } from "../../../lib/common";
import * as MessageService from "./messageService";
import * as MESSAGE from "../../../resource/message";
import { getPresentationByID } from "../presentationService";
import { emitMessage, SOCKET_TYPE } from "../../../config/socket";
import { findAccountByAccountId } from "../../account/accountService";
import { mapUser } from "../../../utilities/user";

export const sendMessage = async (req, res, next) => {
    try {
        const { message, presentationID } = req.body;
        if (!message) {
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: MESSAGE.MISSING_INPUT("Nội dung tin nhắn"),
            });
        }
        if (!presentationID) {
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: MESSAGE.MISSING_INPUT("Bản trình bày"),
            });
        }
        const createdByAccountID = req.user ? req.user.accountID : null;
        const presentatation = await getPresentationByID({ presentationID });
        if (!presentatation) {
            return res.status(404).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.QUERY_NOT_FOUND("Bản trình bày"),
            });
        }

        const msg = await MessageService.createMessage({
            createdByAccountID,
            message,
            presentationID,
        });
        if (msg.createdByAccountID) {
            const account = await findAccountByAccountId(
                msg.createdByAccountID
            );
            msg.createdBy = mapUser(account);
        }
        emitMessage(SOCKET_TYPE.SEND_MESSAGE, { message: msg });
        return res.status(200).json({
            status: API_STATUS.OK,
            message: MESSAGE.POST_SUCCESS("Gửi tin nhắn"),
            data: [msg],
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

export const getMessageList = async (req, res, next) => {
    try {
        const { presentationID, lastMessageID, limit = 10 } = req.query;
        if (!presentationID) {
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: MESSAGE.MISSING_INPUT("Bản trình bày"),
            });
        }
        const msgs = await MessageService.getMessageList({
            presentationID,
            lastMessageID,
            limit,
        });
        if (!msgs || msgs.length === 0) {
            return res.status(404).json({
                status: API_STATUS.NOT_FOUND,
                data: [],
                message: MESSAGE.QUERY_NOT_FOUND("Tin nhắn"),
            });
        }
        const a = msgs
            .map((item) => {
                if (item.createdByAccountID) {
                    return findAccountByAccountId(item.createdByAccountID);
                }
                return null;
            })
            .filter((item) => item);

        const accountRes = await Promise.all(a);

        for (let i = 0; i < msgs.length; i++) {
            if (msgs[i].createdByAccountID) {
                for (let j = 0; j < accountRes.length; j++) {
                    if (
                        msgs[i].createdByAccountID === accountRes[j].accountID
                    ) {
                        msgs[i].createdBy = mapUser(accountRes[j]);
                        break;
                    }
                }
            }
        }

        return res.status(200).json({
            status: API_STATUS.OK,
            data: msgs.reverse(),
            message: MESSAGE.QUERY_SUCCESS("tin nhắn"),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};
