import { mapUser } from "../../../utilities/user";
import { findAccountByAccountId } from "../../account/accountService";
import Slide, {
    HeadingSlide,
    MultipleChoiceSlide,
    ParagraphSlide,
    SLIDE_TYPE,
} from "./slideModel";
import { getSlideContent } from "./slideUtil";

export const getSlideOfPresentation = async ({ presentationID }) => {
    const slides = await Slide.find({
        presentationID,
    })
        .sort({ slideOrder: 1 })
        .lean();
    return await getSlideContent(slides);
};

export const create = async ({ presentationID, slideOrder }) => {
    const slide = new Slide({
        presentationID,
        ...(slideOrder && { slideOrder }),
    });
    return (await slide.save()).toObject();
};

export const createMultipleChoiceSlide = async ({ slideID }) => {
    const multipleChoiceSlide = new MultipleChoiceSlide({
        slideID,
    });
    return (await multipleChoiceSlide.save()).toObject();
};

export const deleteSlide = ({ presentationID }) => {
    return Slide.deleteMany({
        presentationID,
    });
};

export const updateSlideInfo = async ({
    slideID,
    type,
    slideOrder,
    presentationID,
}) => {
    return Slide.findOneAndUpdate(
        {
            slideID,
            presentationID,
        },
        {
            type,
            slideOrder,
        },
        {
            new: true,
        }
    ).lean();
};

export const updateMultiChoiceSlide = async ({ slideID, question, option }) => {
    return MultipleChoiceSlide.findOneAndUpdate(
        {
            slideID,
        },
        {
            question,
            option,
        },
        {
            new: true,
        }
    ).lean();
};

export const updateHeadingSlide = async ({ slideID, heading, subHeading }) => {
    return HeadingSlide.findOneAndUpdate(
        {
            slideID,
        },
        {
            heading,
            subHeading,
        },
        {
            new: true,
        }
    ).lean();
};

export const updateParagraphSlide = async ({ slideID, heading, paragraph }) => {
    return ParagraphSlide.findOneAndUpdate(
        {
            slideID,
        },
        {
            heading,
            paragraph,
        },
        {
            new: true,
        }
    ).lean();
};

export const updateSlideResult = async ({ slideID, option, accountID }) => {
    return MultipleChoiceSlide.findOneAndUpdate(
        {
            slideID,
            "option.key": option,
        },
        {
            $inc: {
                "option.$.value": 1,
            },
            $push: {
                "option.$.submitBy": {
                    accountID: accountID || null,
                    submitedAt: new Date(),
                },
            },
        },
        {
            new: true,
        }
    ).lean();
};

export const createAndUpdateMultipleChoiceSlide = async ({
    slideID,
    question,
    option,
}) => {
    const multipleChoiceSlide = new MultipleChoiceSlide({
        slideID,
        question,
        option,
    });
    return (await multipleChoiceSlide.save()).toObject();
};

export const createAndUpdateHeadingSlide = async ({
    slideID,
    heading,
    subHeading,
}) => {
    const headingSlide = new HeadingSlide({
        slideID,
        heading,
        subHeading,
    });
    return (await headingSlide.save()).toObject();
};

export const createAndUpdateParagraphSlide = async ({
    slideID,
    heading,
    paragraph,
}) => {
    const paragraphSlide = new ParagraphSlide({
        slideID,
        heading,
        paragraph,
    });
    return (await paragraphSlide.save()).toObject();
};

export const findSlideByID = async ({ slideID, presentationID }) => {
    const slide = await Slide.findOne({
        slideID: slideID,
        ...(presentationID && { presentationID }),
    }).lean();
    if (slide) {
        let content = null;
        if (slide.type === SLIDE_TYPE.MULTIPLE_CHOICE) {
            content = await MultipleChoiceSlide.findOne({ slideID }).lean();
        }
        if (slide.type === SLIDE_TYPE.HEADING) {
            content = await HeadingSlide.findOne({ slideID }).lean();
        }
        if (slide.type === SLIDE_TYPE.PARAGRAPH) {
            content = await ParagraphSlide.findOne({ slideID }).lean();
        }
        slide.content = content;
        return slide;
    }
    return null;

    // return Slide.aggregate([
    //     {
    //         $lookup: {
    //             from: "multiplechoiceslides",
    //             localField: "slideID",
    //             foreignField: "slideID",
    //             as: "content",
    //         },
    //     },
    //     {
    //         $match: {
    //             slideID: slideID,
    //             ...(presentationID && { presentationID }),
    //         },
    //     },
    //     {
    //         $sort: {
    //             slideOrder: 1,
    //         },
    //     },
    // ]);
};

export const deleteSlideByID = async ({ slideID }) => {
    return Slide.deleteOne({ slideID });
};

export const deleteSlideContentByID = async ({
    slideID,
    type = SLIDE_TYPE.MULTIPLE_CHOICE,
}) => {
    if (type === SLIDE_TYPE.MULTIPLE_CHOICE) {
        return MultipleChoiceSlide.deleteOne({ slideID });
    }
    if (type === SLIDE_TYPE.HEADING) {
        return HeadingSlide.deleteOne({ slideID });
    }
    if (type === SLIDE_TYPE.PARAGRAPH) {
        return ParagraphSlide.deleteOne({ slideID });
    }
};
