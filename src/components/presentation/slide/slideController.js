import { API_STATUS } from "../../../lib/common";
import {
    create,
    createMultipleChoiceSlide,
    getSlideOfPresentation,
} from "./slideService";
import * as MESSAGE from "../../../resource/message";
import * as PresentationService from "../presentationService";
export const createNewSlide = async (req, res, next) => {
    try {
        const { presentationID } = req.body;
        if (!presentationID) {
            const arr = [];
            !presentationID && arr.push("Bản trình bày");
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: MESSAGE.INVALID_INPUT(arr.join(", ")),
            });
        }

        const presentation = await PresentationService.getPresentationByID({
            presentationID,
        });
        if (!presentation) {
            return res.status(400).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.QUERY_NOT_FOUND("Bản trình bày"),
            });
        }

        const slides = await getSlideOfPresentation({ presentationID });
        const slideOrder = slides ? slides.length : 0;

        const slide = await create({
            presentationID,
            slideOrder,
        });
        if (slide) {
            const slideContent = await createMultipleChoiceSlide({
                slideID: slide.slideID,
            });
            slide.content = slideContent;
        }
        return res.status(200).json({
            status: API_STATUS.OK,
            data: [slide],
            message: MESSAGE.POST_SUCCESS("Tạo slide"),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};
