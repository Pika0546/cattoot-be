import { mapUser } from "../../utilities/user";
import { findAccountByAccountId } from "../account/accountService";
import { GROUP_MEMBER_ROLE } from "../group/groupModel";
import * as GroupService from "../group/groupService";
import { getGroupMembers, isInGroup } from "../group/groupUtil";
export const getPresentationAuthor = async (presentation) => {
    const account = await findAccountByAccountId(
        presentation.createdByAccountID
    );
    return mapUser(account);
};

export const getPresentingGroups = (presentation) => {
    return GroupService.findGroup({
        sharedPresentationID: presentation.presentationID,
    });
};

export const isCoownerInGroups = async (user, groups) => {
    const n = groups.length;
    for (let i = 0; i < n; i++) {
        const item = await getGroupMembers({ ...groups[i] });
        const m = item.members.length;
        for (let j = 0; j < m; j++) {
            if (item.members[j].accountID === user.accountID) {
                if (
                    item.members[j].role === GROUP_MEMBER_ROLE.COOWNER ||
                    item.members[j].role === GROUP_MEMBER_ROLE.OWNER
                ) {
                    return true;
                }
                return false;
            }
        }
    }
    return false;
};

export const isJoinablePresentation = async (user, presentation) => {
    const groups = await getPresentingGroups(presentation);
    if (groups && groups.length) {
        if (!user) {
            return false;
        }
        const n = groups.length;
        for (let i = 0; i < n; i++) {
            const group = await getGroupMembers(groups[i]);
            if (isInGroup(user, group)) {
                return true;
            }
        }
        return false;
    }
    return true;
};
