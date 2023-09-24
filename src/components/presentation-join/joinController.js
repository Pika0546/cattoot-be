import { API_STATUS } from "../../lib/common";
import * as PresentationService from "../presentation/presentationService";
import {
    getPresentationAuthor,
    getPresentingGroups,
    isJoinablePresentation,
} from "../presentation/presentationUtil";
import * as SlideService from "../presentation/slide/slideService";
import * as MESSAGE from "../../resource/message";
import { emitMessage, SOCKET_TYPE } from "../../config/socket";
import jwt from "jsonwebtoken";
import { getSlideContent } from "../presentation/slide/slideUtil";

export const joinPresentation = async (req, res, next) => {
    try {
        const inviteCode = req.params.inviteCode;
        const presentationID = jwt.decode(inviteCode);
        const presentation = await PresentationService.getPresentationByID({
            presentationID,
        });
        if (!presentation) {
            return res.status(400).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.QUERY_NOT_FOUND("Bản trình bày"),
            });
        }
        const isJoin = await isJoinablePresentation(req.user, presentation);
        if (!isJoin) {
            return res.status(403).json({
                status: API_STATUS.PERMISSION_DENIED,
                message: MESSAGE.PERMISSION_NOT_FOUND,
            });
        }
        const slides = await SlideService.getSlideOfPresentation({
            presentationID,
        });
        presentation.slides = (await getSlideContent(slides)) || [];
        presentation.createdByUser = await getPresentationAuthor(presentation);
        return res.status(200).json({
            status: API_STATUS.OK,
            message: MESSAGE.QUERY_SUCCESS("Bản trình bày"),
            data: [presentation],
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

export const submitAnswer = async (req, res, next) => {
    try {
        const { slideID, option } = req.body;
        if (!slideID || !option) {
            const arr = [];
            !slide && arr.push("Slide");
            !option && arr.push("Lựa chọn");
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: MESSAGE.INVALID_INPUT(arr.join(", ")),
            });
        }
        let s = await SlideService.findSlideByID({ slideID });

        if (!s) {
            return res.status(404).json({
                message: MESSAGE.QUERY_NOT_FOUND("Slide"),
                status: API_STATUS.NOT_FOUND,
            });
        }

        const options = s.content.option;
        for (let i = 0; i < options.length; i++) {
            for (let j = 0; j < options[i].submitBy.length; j++) {
                if (
                    req.user &&
                    options[i].submitBy[j].accountID === req.user.accountID
                ) {
                    return res.status(400).json({
                        status: API_STATUS.INVALID_INPUT,
                        message: "Bạn đã trả lời cho slide này rồi",
                    });
                }
            }
        }

        const slide = await SlideService.updateSlideResult({
            slideID,
            option,
            ...(req.user && { accountID: req.user.accountID }),
        });
        if (!slide) {
            return res.status(404).json({
                message: MESSAGE.QUERY_NOT_FOUND("Slide"),
                status: API_STATUS.NOT_FOUND,
            });
        }
        s = await SlideService.findSlideByID({ slideID });
        const slides = await SlideService.getSlideOfPresentation({
            presentationID: s.presentationID,
        });
        if (s.slideOrder >= slides.length - 1) {
            slide.isLastSlide = true;
        }
        const resultContent = slides.find(
            (item) => item.slideID === s.slideID
        ).content;
        emitMessage(SOCKET_TYPE.SUBMIT_ANSWER, {
            slide: resultContent,
        });
        return res.status(200).json({
            message: MESSAGE.POST_SUCCESS("Submit"),
            data: [slide],
            status: API_STATUS.OK,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};
