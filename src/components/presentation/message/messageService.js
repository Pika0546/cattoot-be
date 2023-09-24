import Message from "./messageModel";

export const createMessage = async ({
    presentationID,
    message,
    createdByAccountID,
}) => {
    const msg = new Message({
        presentationID,
        message,
        createdByAccountID: createdByAccountID || null,
    });
    return (await msg.save()).toObject();
};

/**
 * Service này trả về <limit> tin nhắn trong
 * presentatation có ID là <presentationID>
 * và có thời gian gửi sau tin nhắn có ID là <lastMessageID>
 */
export const getMessageList = ({ presentationID, lastMessageID, limit }) => {
    return Message.find({
        presentationID,
        ...(lastMessageID && {
            messageID: {
                $lt: lastMessageID,
            },
        }),
    })
        .sort({
            messageID: "desc",
        })
        .limit(limit)
        .lean();
};
