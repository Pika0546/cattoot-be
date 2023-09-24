import * as CollabService from "./collabService";
import { API_STATUS } from "../../../lib/common";
import * as MESSAGE from "../../../resource/message";
import { mapUser } from "../../../utilities/user";
import { getPresentationByID } from "../presentationService";
import { findAccountByAccountId } from "../../account/accountService";
import { sendEmail } from "../../../utilities/sendEmail";

export const getCollabList = async (req, res, next) => {
    try {
        const { presentationID } = req.query;
        if (!presentationID) {
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: MESSAGE.MISSING_INPUT("Bản trình bày"),
            });
        }

        const user = req.user;
        const presentatation = await getPresentationByID({
            presentationID,
            accountID: user.accountID,
        });
        if (!presentatation) {
            return res.status(404).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.QUERY_NOT_FOUND("Bản trình bày"),
            });
        }

        const result = await CollabService.getCollabList({ presentationID });
        const n = result.length;
        for (let i = 0; i < n; i++) {
            const accountRes = await findAccountByAccountId(
                result[i].accountID
            );
            if (accountRes) {
                result[i] = {
                    ...result[i],
                    accountInfo: mapUser(accountRes),
                };
            }
        }
        return res.status(200).json({
            status: API_STATUS.OK,
            data: result,
            message: MESSAGE.QUERY_SUCCESS("Cộng tác viên"),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

export const addCollab = async (req, res, next) => {
    try {
        const { presentationID, accountID } = req.body;
        if (!presentationID) {
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: MESSAGE.MISSING_INPUT("Bản trình bày"),
            });
        }
        if (!accountID) {
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: MESSAGE.MISSING_INPUT("Tài khoản"),
            });
        }

        const user = req.user;
        const presentatation = await getPresentationByID({
            presentationID,
            accountID: user.accountID,
        });

        if (!presentatation) {
            return res.status(404).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.QUERY_NOT_FOUND("Bản trình bày"),
            });
        }
        const account = await findAccountByAccountId(accountID);
        if (!account) {
            return res.status(404).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.QUERY_NOT_FOUND("Tài khoản"),
            });
        }

        const collaborator = await CollabService.findCollaborator({
            presentationID,
            accountID,
        });
        if (collaborator) {
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message:
                    "Người dùng này đã được thêm vào bản trình bày này rồi!",
            });
        }

        const result = await CollabService.createCollab({
            presentationID,
            accountID,
        });
        await sendEmail(
            account.email,
            `${user.fullname} đã mời bạn vào Bản trình chiếu ${presentatation.name}`,
            `${user.fullname} đã mời bạn vào Bản trình chiếu ${presentatation.name} với vai trò cộng tác. Truy cập liên kết dưới đây để xem Bản trình chiếu`,
            ` ${process.env.BASE_URL}presentation/${presentationID}`
        );
        return res.status(200).json({
            status: API_STATUS.OK,
            data: [
                {
                    ...result,
                    accountInfo: mapUser(account),
                },
            ],
            message: MESSAGE.POST_SUCCESS("Thêm người cộng tác"),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

export const removeCollab = async (req, res, next) => {
    try {
        const { presentationID, accountID } = req.body;
        if (!presentationID) {
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: MESSAGE.MISSING_INPUT("Bản trình bày"),
            });
        }
        if (!accountID) {
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: MESSAGE.MISSING_INPUT("Tài khoản"),
            });
        }

        const user = req.user;
        const presentatation = await getPresentationByID({
            presentationID,
            accountID: user.accountID,
        });

        if (!presentatation) {
            return res.status(404).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.QUERY_NOT_FOUND("Bản trình bày"),
            });
        }

        const account = await findAccountByAccountId(accountID);
        if (!account) {
            return res.status(404).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.QUERY_NOT_FOUND("Tài khoản"),
            });
        }
        const result = await CollabService.removeCollab({
            presentationID,
            accountID,
        });
        return res.status(200).json({
            status: API_STATUS.OK,
            message: MESSAGE.POST_SUCCESS("Xóa cộng tác viên"),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};
