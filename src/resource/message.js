export const UNAUTHORIZED = "Unauthorized";
export const NOT_FOUND_ACCOUNT = "Tài khoản không tồn tại";
export const INCORRECT_PASSWORD = "Mật khẩu không chính xác";
export const SEND_VERIFY_EMAIL = (email) =>
    `Một email xác minh đã được gửi đến ${email}. Vui lòng kiểm tra hộp thư đến (hoặc spam) và làm theo hướng dẫn.`;
export const QUERY_SUCCESS = (name) => `Truy vấn ${name || "data"} thành công`;
export const EXISTED_USER = "Tên đăng nhập đã tồn tại";
export const EXISTED_GROUP = "Tên nhóm đã được sử dụng";
export const EXISTED_EMAIL = "Email đã được sử dụng";
export const MISSING_INPUT = (input) => `${input} không được để trống`;
export const POST_SUCCESS = (action) => `${action} thành công`;
export const QUERY_NOT_FOUND = (name) => `Không tìm thấy ${name} nào`;
export const INVALID_INPUT = (name) => `${name} không hợp lệ`;
export const NOT_FOUND_GROUP = "Nhóm không tồn tại";
export const PERMISSION_NOT_FOUND =
    "Bạn không có quyền thực hiện hành động này";
export const SEND_EMAIL_SUCCESS = "Gửi email thành công";
export const AUTHENTICATE_FAILED = "AUTHENTICATE_FAILED";
