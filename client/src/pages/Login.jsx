import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, saveAuthData } from "../services/authService";

const initialFormData = {
  email: "",
  password: "",
};

function Login() {
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

    if (!formData.email.trim() || !formData.password) {
      setErrorMessage("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    try {
      setIsLoading(true);

      const result = await loginUser({
        email: formData.email.trim(),
        password: formData.password,
      });

      saveAuthData(result.token, result.user);

      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);

      setErrorMessage(
        error.response?.data?.message || "ไม่สามารถเข้าสู่ระบบได้",
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
                  <h1 className="h3 mb-2">เข้าสู่ระบบ</h1>

                  <p className="text-muted mb-0">DBD Company Checker</p>
                </div>

                {errorMessage && (
                  <div className="alert alert-danger" role="alert">
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
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

                  <div className="mb-4">
                    <label htmlFor="password" className="form-label">
                      รหัสผ่าน
                    </label>

                    <input
                      id="password"
                      name="password"
                      type="password"
                      className="form-control"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="กรอกรหัสผ่าน"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={isLoading}
                  >
                    {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                  </button>
                </form>

                <p className="text-center mt-4 mb-0">
                  ยังไม่มีบัญชี? <Link to="/register">สมัครสมาชิก</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
