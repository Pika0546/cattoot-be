import mongoose from "mongoose";
import Counter from "../../../lib/counterModel";

export const SLIDE_TYPE = {
    MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
    PARAGRAPH: "PARAGRAPH",
    HEADING: "HEADING",
};

const DEFAULT_QUESTION = "Trắc nghiệm nhiều lựa chọn";
const DEFAULT_OPTIONS = [
    {
        key: "Lựa chọn 1",
        value: 0,
        submitBy: [],
    },
    {
        key: "Lựa chọn 2",
        value: 0,
        submitBy: [],
    },
    {
        key: "Lựa chọn 3",
        value: 0,
        submitBy: [],
    },
];
const DEFAULT_HEADING = "Bản trình bày có tiêu đề";
const DEFAULT_HEADING_PARAGRAPH = "Bản trình bày có đoạn văn";

const SlideSchema = new mongoose.Schema(
    {
        slideID: {
            type: Number,
            default: 0,
        },
        type: {
            type: String,
            enum: Object.keys(SLIDE_TYPE),
            default: SLIDE_TYPE.MULTIPLE_CHOICE,
        },
        presentationID: {
            type: Number,
            required: true,
        },
        slideOrder: {
            type: Number,
            default: 0,
            required: true,
        },
    },
    { timestamps: true }
);

const MultipleChoiceSlideSchema = new mongoose.Schema(
    {
        slideID: {
            type: Number,
            required: true,
        },
        question: {
            type: String,
            required: true,
            default: DEFAULT_QUESTION,
        },
        option: {
            type: [
                {
                    key: {
                        type: String,
                    },
                    value: {
                        type: Number,
                        default: 0,
                    },
                    submitBy: {
                        type: [
                            {
                                accountID: {
                                    type: Number,
                                }, //Null if chưa đăng nhập
                                submitedAt: {
                                    type: Date,
                                },
                            },
                        ],
                        default: [],
                    },
                },
            ],
            default: DEFAULT_OPTIONS,
        },
    },
    { timestamps: true }
);

const HeadingSlideSchema = new mongoose.Schema(
    {
        slideID: {
            type: Number,
            required: true,
        },
        heading: {
            type: String,
            required: true,
            default: DEFAULT_HEADING,
        },
        subHeading: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

const ParagraphSlideSchema = new mongoose.Schema(
    {
        slideID: {
            type: Number,
            required: true,
        },
        heading: {
            type: String,
            required: true,
            default: DEFAULT_HEADING_PARAGRAPH,
        },
        paragraph: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

SlideSchema.pre(
    "save",
    async function (next) {
        const slide = this;
        if (!slide.slideID) {
            const counter = await Counter.increase("SLIDE");
            slide.slideID = counter.value;
        }

        next();
    },
    { timestamps: true }
);

const Slide = mongoose.model("Slide", SlideSchema);

export const MultipleChoiceSlide = mongoose.model(
    "MultipleChoiceSlide",
    MultipleChoiceSlideSchema
);

export const HeadingSlide = mongoose.model("HeadingSlide", HeadingSlideSchema);

export const ParagraphSlide = mongoose.model(
    "ParagraphSlide",
    ParagraphSlideSchema
);

export default Slide;
