import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  registerUser,
  saveAuthData,
} from "../services/authService";

const initialFormData = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!formData.name.trim()) {
      setErrorMessage("กรุณากรอกชื่อ");
      return;
    }

    if (!formData.email.trim()) {
      setErrorMessage("กรุณากรอกอีเมล");
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    try {
      setIsLoading(true);

      const result = await registerUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      saveAuthData(result.token, result.user);

      navigate("/dashboard");
    } catch (error) {
      console.error("Register error:", error);

      setErrorMessage(
        error.response?.data?.message ||
          "ไม่สามารถสมัครสมาชิกได้"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-7 col-lg-5">
            <div className="card border-0 shadow">
              <div className="card-body p-4 p-md-5">
                <div className="text-center mb-4">
                  <h1 className="h3 mb-2">สมัครสมาชิก</h1>

                  <p className="text-muted mb-0">
                    DBD Company Checker
                  </p>
                </div>

                {errorMessage && (
                  <div
                    className="alert alert-danger"
                    role="alert"
                  >
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label
                      htmlFor="name"
                      className="form-label"
                    >
                      ชื่อผู้ใช้งาน
                    </label>

                    <input
                      id="name"
                      name="name"
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="กรอกชื่อผู้ใช้งาน"
                    />
                  </div>

                  <div className="mb-3">
                    <label
                      htmlFor="email"
                      className="form-label"
                    >
                      อีเมล
                    </label>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="name@example.com"
                    />
                  </div>

                  <div className="mb-3">
                    <label
                      htmlFor="password"
                      className="form-label"
                    >
                      รหัสผ่าน
                    </label>

                    <input
                      id="password"
                      name="password"
                      type="password"
                      className="form-control"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="อย่างน้อย 6 ตัวอักษร"
                    />
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="confirmPassword"
                      className="form-label"
                    >
                      ยืนยันรหัสผ่าน
                    </label>

                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      className="form-control"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="กรอกรหัสผ่านอีกครั้ง"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={isLoading}
                  >
                    {isLoading
                      ? "กำลังสมัครสมาชิก..."
                      : "สมัครสมาชิก"}
                  </button>
                </form>

                <p className="text-center mt-4 mb-0">
                  มีบัญชีแล้ว?{" "}
                  <Link to="/login">
                    เข้าสู่ระบบ
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;