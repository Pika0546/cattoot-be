import { API_STATUS } from "../../lib/common";
import * as PresentationService from "./presentationService";
import * as MESSAGE from "../../resource/message";
import * as CollabService from "./collab/collabService";
import * as GroupService from "../group/groupService";
import { getPaginationInfo } from "../../utilities/pagination";
import { isInteger } from "../../utilities/number";
import * as SlideService from "./slide/slideService";
import {
    getPresentationAuthor,
    getPresentingGroups,
    isCoownerInGroups,
} from "./presentationUtil";
import { mapUser } from "../../utilities/user";
import { emitMessage, SOCKET_TYPE } from "../../config/socket";
import { SLIDE_TYPE } from "./slide/slideModel";
import { getSlideContent } from "./slide/slideUtil";

export const getMyPresentation = async (req, res, next) => {
    try {
        const { accountID } = req.user;
        const query = req.query || {};
        const title = query.title || null;
        const { offset, limit, getTotal } = getPaginationInfo(req);
        const result = await PresentationService.getMyPresentation({
            title,
            offset,
            limit,
            accountID,
        });
        const total = getTotal
            ? await PresentationService.countMyPresentation({
                  title,
                  accountID,
              })
            : 0;
        if (!result || result.length === 0) {
            return res.status(404).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.QUERY_NOT_FOUND("Bản trình bày"),
            });
        }
        const n = result.length;
        for (let i = 0; i < n; i++) {
            result[i].createdByUser = mapUser(req.user);
        }
        return res.status(200).json({
            status: API_STATUS.OK,
            data: result,
            ...(getTotal && { total }),
            message: MESSAGE.QUERY_SUCCESS("Bản trình bày"),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

export const getPresentationDetail = async (req, res, next) => {
    try {
        const user = req.user;
        const { presentationID } = req.params;
        if (!(presentationID && isInteger(presentationID))) {
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: MESSAGE.MISSING_INPUT("presentationID"),
            });
        }

        const presentation = await PresentationService.getPresentationByID({
            presentationID,
        });

        if (!presentation) {
            return res.status(404).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.QUERY_NOT_FOUND("Bản trình bày"),
            });
        }
        if (user.accountID !== presentation.createdByAccountID) {
            const collaborator = await CollabService.findCollaborator({
                presentationID,
                accountID: user.accountID,
            });
            if (!collaborator) {
                return res.status(403).json({
                    status: API_STATUS.PERMISSION_DENIED,
                    message: MESSAGE.PERMISSION_NOT_FOUND,
                });
            }
        }

        const slides = await SlideService.getSlideOfPresentation({
            presentationID: presentation.presentationID,
        });
        const groups =
            (await GroupService.getSharedPresentationGroup({
                presentationID: presentation.presentationID,
                accountID: req.user.accountID,
            })) || [];
        presentation.slides = slides || [];
        presentation.createdByUser = await getPresentationAuthor(presentation);
        presentation.groups = groups;
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

export const createPresentation = async (req, res, next) => {
    try {
        const creator = req.user;
        const presentation = await PresentationService.create({
            createdByAccountID: parseInt(creator.accountID),
        });
        const firstSlide = await SlideService.create({
            presentationID: presentation.presentationID,
        });
        const newPresentation = await PresentationService.changeCurrentSlideID({
            presentationID: presentation.presentationID,
            slideID: firstSlide.slideID,
        });
        const firstSlideContent = await SlideService.createMultipleChoiceSlide({
            slideID: firstSlide.slideID,
        });
        firstSlide.content = firstSlideContent;
        newPresentation.slides = [firstSlide];
        return res.status(200).json({
            status: API_STATUS.OK,
            data: [newPresentation],
            message: MESSAGE.POST_SUCCESS("Tạo presentation"),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

/* body: {name: "", slides: [{slideID: 0, type: "", slideOrder: 0, content: , } */
export const updatePresentation = async (req, res, next) => {
    try {
        const newName = req.body ? req.body.name || "" : "";
        let newSlides = req.body ? req.body.slides || "" : "";
        const currentSlideID = req.body ? req.body.currentSlideID : null;
        const presentationID = req.params
            ? req.params.presentationID || null
            : null;
        const user = req.user;
        if (!(presentationID && isInteger(presentationID))) {
            return res.status(400).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.QUERY_NOT_FOUND("Presentation"),
            });
        }

        const oldPresentation = await PresentationService.getPresentationByID({
            presentationID,
        });
        if (oldPresentation.createdByAccountID !== user.accountID) {
            const collaborator = await CollabService.findCollaborator({
                presentationID,
                accountID: user.accountID,
            });
            if (!collaborator) {
                return res.status(403).json({
                    status: API_STATUS.PERMISSION_DENIED,
                    message: MESSAGE.PERMISSION_NOT_FOUND,
                });
            }
        }

        if (!newName || !newSlides) {
            const message = [];
            if (!newName) {
                message.push(MESSAGE.MISSING_INPUT("Tên presentation"));
            }
            if (!newSlides) {
                message.push(MESSAGE.MISSING_INPUT("Slide"));
            }
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: message.join(", "),
            });
        }

        let presentation = await PresentationService.updatePresentationInfo({
            presentationID: parseInt(presentationID),
            name: newName,
            currentSlideID: currentSlideID,
        });
        if (!presentation) {
            return res.status(404).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.QUERY_NOT_FOUND("Presentation"),
            });
        }
        const oldSlides = await SlideService.getSlideOfPresentation({
            presentationID: presentation.presentationID,
        });
        const oldSlidesLen = oldSlides.length;
        const newSlidesLen = newSlides.length;
        for (let j = 0; j < oldSlidesLen; j++) {
            let isDeleted = true;
            for (let i = 0; i < newSlidesLen; i++) {
                if (oldSlides[j].slideID === newSlides[i].slideID) {
                    isDeleted = false;

                    //update slide
                    //update slide content
                    let slideContent = null;
                    if (newSlides[i].type === oldSlides[j].type) {
                        //just update
                        if (newSlides[i].type === SLIDE_TYPE.MULTIPLE_CHOICE) {
                            slideContent =
                                await SlideService.updateMultiChoiceSlide({
                                    slideID: newSlides[i].slideID,
                                    question: newSlides[i].content.question,
                                    option: newSlides[i].content.option,
                                });
                            if (!slideContent) {
                                return res.status(404).json({
                                    status: API_STATUS.NOT_FOUND,
                                    message:
                                        MESSAGE.QUERY_NOT_FOUND(
                                            "Nội dung slide"
                                        ),
                                });
                            }
                        }
                        if (newSlides[i].type === SLIDE_TYPE.HEADING) {
                            console.log(newSlides[i].content);
                            slideContent =
                                await SlideService.updateHeadingSlide({
                                    slideID: newSlides[i].slideID,
                                    heading: newSlides[i].content.heading,
                                    subHeading: newSlides[i].content.subHeading,
                                });
                            console.log(slideContent);
                            if (!slideContent) {
                                return res.status(404).json({
                                    status: API_STATUS.NOT_FOUND,
                                    message:
                                        MESSAGE.QUERY_NOT_FOUND(
                                            "Nội dung slide"
                                        ),
                                });
                            }
                        }
                        if (newSlides[i].type === SLIDE_TYPE.PARAGRAPH) {
                            slideContent =
                                await SlideService.updateParagraphSlide({
                                    slideID: newSlides[i].slideID,
                                    heading: newSlides[i].content.heading,
                                    paragraph: newSlides[i].content.paragraph,
                                });
                            if (!slideContent) {
                                return res.status(404).json({
                                    status: API_STATUS.NOT_FOUND,
                                    message:
                                        MESSAGE.QUERY_NOT_FOUND(
                                            "Nội dung slide"
                                        ),
                                });
                            }
                        }
                    } else {
                        //delete old slide type, create new slide type
                        const deletedOldSlideContent =
                            await SlideService.deleteSlideContentByID({
                                slideID: oldSlides[j].slideID,
                                type: oldSlides[j].type,
                            });
                        if (newSlides[i].type === SLIDE_TYPE.MULTIPLE_CHOICE) {
                            slideContent =
                                await SlideService.createAndUpdateMultipleChoiceSlide(
                                    {
                                        slideID: newSlides[i].slideID,
                                        question: newSlides[i].content.question,
                                        option: newSlides[i].content.option,
                                    }
                                );
                        }
                        if (newSlides[i].type === SLIDE_TYPE.HEADING) {
                            slideContent =
                                await SlideService.createAndUpdateHeadingSlide({
                                    slideID: newSlides[i].slideID,
                                    heading: newSlides[i].content.heading,
                                    subHeading: newSlides[i].content.subHeading,
                                });
                        }
                        if (newSlides[i].type === SLIDE_TYPE.PARAGRAPH) {
                            slideContent =
                                await SlideService.createAndUpdateParagraphSlide(
                                    {
                                        slideID: newSlides[i].slideID,
                                        heading: newSlides[i].content.heading,
                                        paragraph:
                                            newSlides[i].content.paragraph,
                                    }
                                );
                        }
                    }
                    //update slide info
                    let newSlide = await SlideService.updateSlideInfo({
                        presentationID: presentation.presentationID,
                        slideID: newSlides[i].slideID,
                        type: newSlides[i].type,
                        slideOrder: i,
                    });
                    if (!newSlide) {
                        return res.status(404).json({
                            status: API_STATUS.NOT_FOUND,
                            message: MESSAGE.QUERY_NOT_FOUND("Slide"),
                        });
                    }
                    newSlide.content = slideContent;
                    newSlides[i] = newSlide;
                }
            }
            if (isDeleted) {
                const deletedSlideContent =
                    await SlideService.deleteSlideContentByID({
                        slideID: oldSlides[j].slideID,
                        type: oldSlides[j].type,
                    });
                const deletedSlide = await SlideService.deleteSlideByID({
                    slideID: oldSlides[j].slideID,
                });
            }
        }
        const groups =
            (await GroupService.getSharedPresentationGroup({
                presentationID: presentation.presentationID,
                accountID: req.user.accountID,
            })) || [];
        presentation.groups = groups;
        presentation.slides = await getSlideContent(newSlides);
        console.log(user);
        emitMessage(SOCKET_TYPE.CHANGE_PRESENTATION, {
            presentation,
            userToken: user.token,
        });
        return res.status(200).json({
            status: API_STATUS.OK,
            message: MESSAGE.POST_SUCCESS("Cập nhật thông tin"),
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

export const deletePresentation = async (req, res, next) => {
    try {
        const { presentationID } = req.body;
        if (!presentationID) {
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: MESSAGE.MISSING_INPUT("PresentationID"),
            });
        }

        const slideList = await SlideService.getSlideOfPresentation({
            presentationID,
        });

        const n = slideList.length;
        for (let i = 0; i < n; i++) {
            const deletedSlideContent =
                await SlideService.deleteSlideContentByID({
                    slideID: slideList[i].slideID,
                    type: slideList[i].type,
                });
        }

        const deletedSlides = await SlideService.deleteSlide({
            presentationID,
        });

        const presentation = await PresentationService.deletePresentation({
            presentationID,
        });

        return res.status(200).json({
            status: API_STATUS.OK,
            message: MESSAGE.POST_SUCCESS("Xóa bản trình bày thành công"),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: API_STATUS.INTERNAL_ERROR,
            message: error.message,
        });
    }
};

export const changeCurrentSlideID = async (req, res, next) => {
    try {
        const { presentationID, slideID } = req.body;
        if (!presentationID || !slideID) {
            const arr = [];
            !slideID && arr.push("Slide");
            !presentationID && arr.push("Bản trình bày");
            return res.status(400).json({
                status: API_STATUS.INVALID_INPUT,
                message: MESSAGE.INVALID_INPUT(arr.join(", ")),
            });
        }

        const user = req.user;

        const presentation = await PresentationService.getPresentationByID({
            presentationID,
        });

        if (!presentation) {
            return res.status(404).json({
                status: API_STATUS.NOT_FOUND,
                message: MESSAGE.QUERY_NOT_FOUND("Bản trình bày"),
            });
        }

        const groups = await getPresentingGroups(presentation);
        if (!(user.accountID === presentation.createdByAccountID)) {
            if (groups && groups.length) {
                const isSuiteRole = await isCoownerInGroups(user, groups);
                if (!isSuiteRole) {
                    return res.status(403).json({
                        status: API_STATUS.PERMISSION_DENIED,
                        message: MESSAGE.PERMISSION_NOT_FOUND,
                    });
                }
            } else {
                return res.status(403).json({
                    status: API_STATUS.PERMISSION_DENIED,
                    message: MESSAGE.PERMISSION_NOT_FOUND,
                });
            }
        }
        const slide = await SlideService.findSlideByID({
            slideID,
            presentationID,
        });

        if (!slide) {
            return res.status(404).json({
                message: MESSAGE.QUERY_NOT_FOUND("Slide"),
                status: API_STATUS.NOT_FOUND,
            });
        }

        const result = await PresentationService.changeCurrentSlideID({
            presentationID,
            slideID: slide.slideID,
        });

        if (!result) {
            return res.status(404).json({
                message: MESSAGE.QUERY_NOT_FOUND("Bảng trình bày"),
                status: API_STATUS.NOT_FOUND,
            });
        }
        const slideWithContent = (await getSlideContent([slide]))[0];
        emitMessage(SOCKET_TYPE.NEXT_SLIDE, {
            slide: slideWithContent,
            userToken: user.token,
        });
        return res.status(200).json({
            status: API_STATUS.OK,
            message: MESSAGE.POST_SUCCESS("Chuyển slide"),
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
