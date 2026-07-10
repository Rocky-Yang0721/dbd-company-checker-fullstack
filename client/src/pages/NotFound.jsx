import { Link } from "react-router-dom";
import { isAuthenticated } from "../services/authService";

function NotFound() {
  const destination = isAuthenticated()
    ? "/dashboard"
    : "/login";

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center px-3">
      <div className="text-center">
        <div className="display-1 fw-bold text-primary">
          404
        </div>

        <h1 className="h3 mb-3">
          ไม่พบหน้าที่ต้องการ
        </h1>

        <p className="text-muted mb-4">
          URL ที่เปิดไม่ถูกต้อง หรือหน้านี้อาจถูกย้ายไปแล้ว
        </p>

        <Link
          to={destination}
          className="btn btn-primary"
        >
          {isAuthenticated()
            ? "กลับหน้า Dashboard"
            : "กลับหน้าเข้าสู่ระบบ"}
        </Link>
      </div>
    </div>
  );
}

export default NotFound;