import * as GroupService from "./groupService";
import * as AccountService from "../account/accountService";
import * as PresentationService from "../presentation/presentationService";
import * as SlideService from "../presentation/slide/slideService";

import { mapUser } from "../../utilities/user";

export const getGroupMembers = async (group) => {
    const arr = group.members.map((item) =>
        AccountService.findAccount({ accountID: item.accountID })
    );
    const userList = await Promise.all(arr);
    const n = group.members.length;
    const m = userList.length;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
            if (group.members[i].accountID === userList[j].accountID) {
                group.members[i] = {
                    ...group.members[i],
                    ...mapUser(userList[j]),
                };
            }
        }
    }
    return group;
};

export const getGroupCreator = async (group) => {
    const creator = await AccountService.findAccount({
        accountID: group.createdByAccountID,
    });
    if (creator) {
        group.createdBy = mapUser(creator);
    }
    return group;
};

export const getGroupCurrentPresentation = async (group) => {
    group.presentation = null;
    if (group.sharedPresentationID) {
        const presentation = await PresentationService.getPresentationByID({
            presentationID: group.sharedPresentationID,
        });
        if (presentation && presentation.presentationID) {
            const slides = await SlideService.getSlideOfPresentation({
                presentationID: presentation.presentationID,
            });
            presentation.slides = slides || [];
        }
        group.presentation = presentation;
        return group;
    }
    return group;
};

export const isInGroup = (user = {}, group) => {
    const n = (group.members || []).length;
    for (let i = 0; i < n; i++) {
        if (user.accountID === group.members[i].accountID) {
            return true;
        }
    }
    return false;
};
