import Question from "./questionModel";

export const createQuestion = ({
    question,
    presentationID,
    createdByAccountID,
}) => {
    const result = new Question({
        presentationID,
        question,
        ...(createdByAccountID && { createdByAccountID }),
    });
    return result.save();
};

/**
 * Lấy danh sách câu hỏi của presentation
 * isAnswered: true - câu hỏi đã trả lời
 * isAnswered: false - chưa trả lời
 * isAnswered: undefined hoặc null - lấy tất cả
 */
export const getQuestionList = ({ presentationID, isAnswered }) => {
    return Question.find({
        presentationID,
        ...(isAnswered === false && { isAnswered: false }),
        ...(isAnswered === true && { isAnswered: true }),
    })
        .sort({
            totalVoted: "desc",
            createdAt: "desc",
        })
        .lean();
};

export const getQuestionByID = ({ questionID, presentationID }) => {
    return Question.findOne({
        questionID,
        presentationID,
    }).lean();
};

export const upvoteQuestion = async ({
    questionID,
    presentationID,
    voted,
    totalVoted,
}) => {
    return Question.findOneAndUpdate(
        {
            questionID,
            presentationID,
        },
        {
            voted,
            totalVoted,
        },
        {
            new: true,
        }
    ).lean();
};

export const markAnsweredQuestion = async ({ questionID, presentationID }) => {
    return Question.findOneAndUpdate(
        {
            questionID,
            presentationID,
        },
        {
            isAnswered: true,
        },
        {
            new: true,
        }
    ).lean();
};
