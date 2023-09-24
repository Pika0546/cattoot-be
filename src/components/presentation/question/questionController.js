import * as MESSAGE from "../../../resource/message";
import { API_STATUS } from "../../../lib/common";
import * as QuestionService from "./questionService";
import { getPresentationByID } from "../presentationService";
import { emitMessage, SOCKET_TYPE } from "../../../config/socket";
import { getSharedPresentationGroup } from "../../group/groupService";
import { queryParamToBool } from "../../../utilities/api";

export const sendQuestion = async (req, res, next) => {
    try {
        const { question, presentationID } = req.body;
        if (!question) {
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: MESSAGE.MISSING_INPUT("Câu hỏi"),
            });
        }
        if (!presentationID) {
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: MESSAGE.MISSING_INPUT("Bản trình bày"),
            });
        }

        if (question.length > 200) {
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: "Câu hỏi không được vược quá 200 kí tự",
            });
        }

        const presentation = await getPresentationByID({ presentationID });
        if (!presentation) {
            return res.status(404).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.QUERY_NOT_FOUND("Bản trình bày"),
            });
        }

        const user = req.user;

        const result = await QuestionService.createQuestion({
            presentationID,
            question,
            ...(user && { createdByAccountID: user.accountID }),
        });
        emitMessage(SOCKET_TYPE.SUBMIT_QUESTION, {
            question: result,
        });
        return res.status(200).json({
            status: API_STATUS.OK,
            data: [result],
            message: MESSAGE.POST_SUCCESS("Gửi câu hỏi"),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

export const getQuestionList = async (req, res, next) => {
    try {
        const { presentationID } = req.query;
        const isAnswered = queryParamToBool(req.query.isAnswered);
        if (!presentationID) {
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: MESSAGE.MISSING_INPUT("Bản trình bày"),
            });
        }

        const presentation = await getPresentationByID({ presentationID });
        if (!presentation) {
            return res.status(404).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.QUERY_NOT_FOUND("Bản trình bày"),
            });
        }
        const result = await QuestionService.getQuestionList({
            presentationID,
            isAnswered,
        });
        return res.status(200).json({
            status: API_STATUS.OK,
            data: result,
            message: MESSAGE.QUERY_SUCCESS("Câu hỏi"),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

export const upvoteQuestion = async (req, res, next) => {
    try {
        const { questionID, presentationID } = req.body;
        if (!questionID) {
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: MESSAGE.MISSING_INPUT("Câu hỏi"),
            });
        }
        if (!presentationID) {
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: MESSAGE.MISSING_INPUT("Bản trình bày"),
            });
        }

        const question = await QuestionService.getQuestionByID({
            questionID,
            presentationID,
        });
        if (!question) {
            return res.status(404).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.QUERY_NOT_FOUND("Câu hỏi"),
            });
        }

        let totalVoted = question.totalVoted;
        let voted = question.voted;
        const user = req.user;

        voted.push({ accountID: user ? user.accountID : null });
        totalVoted++;

        const result = await QuestionService.upvoteQuestion({
            questionID,
            presentationID,
            voted,
            totalVoted,
        });

        emitMessage(SOCKET_TYPE.UPVOTE_QUESTION, {
            accountID: user ? user.accountID : null,
            question: result,
        });

        return res.status(200).json({
            status: API_STATUS.OK,
            data: [result],
            message: MESSAGE.POST_SUCCESS("Upvote câu hỏi"),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

export const markAnsweredQuestion = async (req, res, next) => {
    try {
        const { questionID, presentationID } = req.body;
        if (!questionID) {
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: MESSAGE.MISSING_INPUT("Câu hỏi"),
            });
        }
        if (!presentationID) {
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: MESSAGE.MISSING_INPUT("Bản trình bày"),
            });
        }

        const user = req.user;
        //check role
        const presentation = await getPresentationByID({
            presentationID,
            accountID: user.accountID,
        });
        const groups = await getSharedPresentationGroup({
            presentationID,
            accountID: user.accountID,
        });
        if (!presentation && (!groups || !groups.length)) {
            return res.status(403).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.PERMISSION_NOT_FOUND,
            });
        }

        const result = await QuestionService.markAnsweredQuestion({
            questionID,
            presentationID,
        });
        if (!result) {
            return res.status(404).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.QUERY_NOT_FOUND("Câu hỏi"),
            });
        }

        emitMessage(SOCKET_TYPE.MARKED_AS_ANWSERED_QUESTION, {
            question: result,
        });

        return res.status(200).json({
            status: API_STATUS.OK,
            data: [result],
            message: MESSAGE.POST_SUCCESS("Mark answered câu hỏi"),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};
