export const mapUser = (user) => {
    return {
        fullname: user.fullname,
        email: user.email,
        accountID: user.accountID,
        gender: user.gender,
        verified: user.verified,
    };
};
