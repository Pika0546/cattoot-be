import { mapUser } from "../../../utilities/user";
import { findAccountByAccountId } from "../../account/accountService";
import Slide, {
    HeadingSlide,
    MultipleChoiceSlide,
    ParagraphSlide,
    SLIDE_TYPE,
} from "./slideModel";

export const getSlideContent = async (slides = []) => {
    const result = [...slides];
    const n = result.length;
    const contentResults = [];
    for (let i = 0; i < n; i++) {
        let slide = null;
        if (result[i].type === SLIDE_TYPE.MULTIPLE_CHOICE) {
            slide = await MultipleChoiceSlide.findOne({
                slideID: result[i].slideID,
            }).lean();
        }

        if (result[i].type === SLIDE_TYPE.HEADING) {
            slide = await HeadingSlide.findOne({
                slideID: result[i].slideID,
            }).lean();
        }

        if (result[i].type === SLIDE_TYPE.PARAGRAPH) {
            slide = await ParagraphSlide.findOne({
                slideID: result[i].slideID,
            }).lean();
        }
        slide && contentResults.push(slide);
    }

    const m = contentResults.length;
    const ids = new Set();
    for (let i = 0; i < m; i++) {
        if (contentResults[i].option) {
            const optionlength = contentResults[i].option.length;
            for (let k = 0; k < optionlength; k++) {
                const submits = contentResults[i].option[k].submitBy;
                const l = submits.length;
                for (let j = 0; j < l; j++) {
                    if (submits[j].accountID) {
                        ids.add(submits[j].accountID);
                    }
                }
            }
        }
    }
    const accountArr = [...ids].map((item) => findAccountByAccountId(item));

    const accountRes = await Promise.all(accountArr);
    accountRes.forEach((account) => {
        for (let i = 0; i < m; i++) {
            if (contentResults[i].option) {
                const optionlength = contentResults[i].option.length;
                for (let k = 0; k < optionlength; k++) {
                    const submits = contentResults[i].option[k].submitBy || [];
                    const l = submits.length;
                    for (let j = 0; j < l; j++) {
                        if (
                            submits[j].accountID &&
                            submits[j].accountID === account.accountID
                        ) {
                            submits[j].accountInfo = mapUser(account);
                            submits[j].fullname = account.fullname;
                        }
                    }
                }
            }
        }
    });
    for (let i = 0; i < n; i++) {
        result[i].content = null;
        for (let j = 0; j < m; j++) {
            if (result[i].slideID === contentResults[j].slideID) {
                result[i].content = contentResults[j];
                break;
            }
        }
    }
    return result;
};
