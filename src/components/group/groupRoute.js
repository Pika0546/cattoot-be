import express from "express";
import {
    createGroup,
    getGroupByID,
    getListGroup,
    updateGroup,
    updateRole,
    removeMember,
    sendEmailInviteGroup,
    joinGroup,
    getMyListGroup,
    sharePresentationToGroup,
    removePresentationFromGroup,
    deleteGroup,
    shareMultiPresentationToGroup,
} from "./groupController";
const groupRoute = express.Router();

/* body: {name: "", description:""} */
groupRoute.post("/", createGroup);

/* query: {offset: 5, limit: 10, getTotal: true, name: ""} */
groupRoute.get("/", getListGroup);

/* query: {} */
groupRoute.get("/my-groups", getMyListGroup);

/* query: {groupID: 0, presentationID: 0} */
groupRoute.post("/shared_presentation", shareMultiPresentationToGroup);

/* query: {groupID: 0} */
groupRoute.post("/removed_presentation", removePresentationFromGroup);

/* body: {accountID: 0, role:"", groupID: 0} */
groupRoute.post("/role-update", updateRole);

/* body: {accountID: 0, groupID:0} */
groupRoute.post("/remove-member", removeMember);

/* body: {email: "", groupName: "", inviteLink: ""} */
groupRoute.post("/email-invite", sendEmailInviteGroup);

groupRoute.post("/delete", deleteGroup);

/* query: {} */
groupRoute.get("/invite/:inviteCode", joinGroup);

/* query: {} */
groupRoute.get("/:groupID", getGroupByID);

/* body: {name: "", description:""} */
groupRoute.post("/:groupID", updateGroup);

export default groupRoute;
