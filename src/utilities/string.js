export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const NUMBERIC = "1234567890";

export const generateCode = (id, len, template = NUMBERIC + ALPHABET) => {
    let num = id;
    let result = "";
    let ln = template.length;

    const capacity = Math.pow(ln, len);
    num = num % capacity;
    for (let i = 0; i < len; i++) {
        let cur = num % ln;
        if (i > 0) {
            cur = (cur + parseInt(result.charCodeAt(i - 1))) % ln;
        }
        result += template[cur];
        num = parseInt(num / ln);
    }
    return result;
};

export const getRegextForSearchLike = (keyword) => {
    return new RegExp(`.*${keyword}.*`);
};
