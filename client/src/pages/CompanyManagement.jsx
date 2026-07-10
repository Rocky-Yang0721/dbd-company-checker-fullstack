import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  createCompany,
  deleteCompany,
  getCompanies,
  updateCompany,
} from "../services/companyService";

import { getCurrentUser, logoutUser } from "../services/authService";

const initialFormData = {
  companyName: "",
  juristicId: "",
  status: "รอตรวจสอบ",
  note: "",
};

function CompanyManagement() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [companies, setCompanies] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);

    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  const loadCompanies = async (
    customSearch = search,
    customStatus = statusFilter,
  ) => {
    try {
      setIsLoading(true);

      const result = await getCompanies({
        search: customSearch,
        status: customStatus,
      });

      setCompanies(result.data || []);
    } catch (error) {
      console.error("Load companies error:", error);

      showMessage(
        error.response?.data?.message || "ไม่สามารถโหลดข้อมูลบริษัทได้",
        "danger",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies("", "ทั้งหมด");
  }, []);

  const handleLogout = () => {
    const confirmed = window.confirm("ต้องการออกจากระบบหรือไม่?");

    if (!confirmed) {
      return;
    }

    logoutUser();
    navigate("/login", { replace: true });
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.companyName.trim()) {
      showMessage("กรุณากรอกชื่อบริษัท", "danger");
      return false;
    }

    if (!/^\d{13}$/.test(formData.juristicId)) {
      showMessage("เลขนิติบุคคลต้องเป็นตัวเลข 13 หลัก", "danger");

      return false;
    }

    return true;
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);

      if (editingId) {
        await updateCompany(editingId, formData);
        showMessage("แก้ไขข้อมูลบริษัทสำเร็จ");
      } else {
        await createCompany(formData);
        showMessage("เพิ่มบริษัทสำเร็จ");
      }

      resetForm();
      await loadCompanies();
    } catch (error) {
      console.error("Save company error:", error);

      showMessage(
        error.response?.data?.message || "ไม่สามารถบันทึกข้อมูลบริษัทได้",
        "danger",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (company) => {
    setEditingId(company._id);

    setFormData({
      companyName: company.companyName || "",
      juristicId: company.juristicId || "",
      status: company.status || "รอตรวจสอบ",
      note: company.note || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (company) => {
    const confirmed = window.confirm(
      `ต้องการลบ "${company.companyName}" หรือไม่?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteCompany(company._id);

      showMessage("ลบบริษัทสำเร็จ");

      if (editingId === company._id) {
        resetForm();
      }

      await loadCompanies();
    } catch (error) {
      console.error("Delete company error:", error);

      showMessage(
        error.response?.data?.message || "ไม่สามารถลบบริษัทได้",
        "danger",
      );
    }
  };

  const handleSearch = async (event) => {
    event.preventDefault();

    await loadCompanies(search, statusFilter);
  };

  const handleClearFilter = async () => {
    setSearch("");
    setStatusFilter("ทั้งหมด");

    await loadCompanies("", "ทั้งหมด");
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "ยังดำเนินกิจการ":
        return "text-bg-success";

      case "เลิกกิจการ":
        return "text-bg-danger";

      case "ไม่พบข้อมูล":
        return "text-bg-secondary";

      default:
        return "text-bg-warning";
    }
  };

  return (
    <div className="container-fluid bg-light min-vh-100 py-4">
      <div className="container">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h1 className="h3 mb-1">DBD Company Management</h1>

            <p className="text-muted mb-0">
              ระบบจัดการและตรวจสอบสถานะนิติบุคคล
            </p>
          </div>

          <div className="d-flex flex-wrap align-items-center justify-content-end gap-3">
            <div className="text-end">
              <div className="fw-semibold">
                {currentUser?.name || "ผู้ใช้งาน"}
              </div>

              <small className="text-muted">{currentUser?.email || ""}</small>
            </div>

            <div className="d-flex flex-wrap align-items-center gap-2">
              <Link to="/dashboard" className="btn btn-outline-primary">
                Dashboard
              </Link>

              <Link to="/bulk-search" className="btn btn-outline-success">
                Bulk Search
              </Link>

              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={handleLogout}
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div className={`alert alert-${messageType}`} role="alert">
            {message}
          </div>
        )}

        <div className="card shadow-sm mb-4">
          <div className="card-header bg-white">
            <h2 className="h5 mb-0">
              {editingId ? "แก้ไขข้อมูลบริษัท" : "เพิ่มบริษัทใหม่"}
            </h2>
          </div>

          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="companyName" className="form-label">
                    ชื่อบริษัท
                  </label>

                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    className="form-control"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="เช่น บริษัท ตัวอย่าง จำกัด"
                  />
                </div>

                <div className="col-md-6">
                  <label htmlFor="juristicId" className="form-label">
                    เลขนิติบุคคล
                  </label>

                  <input
                    id="juristicId"
                    name="juristicId"
                    type="text"
                    inputMode="numeric"
                    maxLength="13"
                    className="form-control"
                    value={formData.juristicId}
                    onChange={handleInputChange}
                    placeholder="กรอกตัวเลข 13 หลัก"
                  />
                </div>

                <div className="col-md-4">
                  <label htmlFor="status" className="form-label">
                    สถานะ
                  </label>

                  <select
                    id="status"
                    name="status"
                    className="form-select"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="รอตรวจสอบ">รอตรวจสอบ</option>

                    <option value="ยังดำเนินกิจการ">ยังดำเนินกิจการ</option>

                    <option value="เลิกกิจการ">เลิกกิจการ</option>

                    <option value="ไม่พบข้อมูล">ไม่พบข้อมูล</option>
                  </select>
                </div>

                <div className="col-md-8">
                  <label htmlFor="note" className="form-label">
                    หมายเหตุ
                  </label>

                  <input
                    id="note"
                    name="note"
                    type="text"
                    className="form-control"
                    value={formData.note}
                    onChange={handleInputChange}
                    placeholder="ระบุหมายเหตุเพิ่มเติม"
                  />
                </div>

                <div className="col-12 d-flex flex-wrap gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSaving}
                  >
                    {isSaving
                      ? "กำลังบันทึก..."
                      : editingId
                        ? "บันทึกการแก้ไข"
                        : "เพิ่มบริษัท"}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={resetForm}
                      disabled={isSaving}
                    >
                      ยกเลิกการแก้ไข
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="card shadow-sm">
          <div className="card-header bg-white">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <h2 className="h5 mb-1">รายชื่อบริษัท</h2>

                <span className="text-muted">
                  จำนวนทั้งหมด {companies.length} รายการ
                </span>
              </div>
            </div>
          </div>

          <div className="card-body">
            <form className="row g-2 mb-4" onSubmit={handleSearch}>
              <div className="col-md-6">
                <input
                  type="text"
                  className="form-control"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="ค้นหาชื่อบริษัทหรือเลขนิติบุคคล"
                />
              </div>

              <div className="col-md-3">
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="ทั้งหมด">สถานะทั้งหมด</option>

                  <option value="รอตรวจสอบ">รอตรวจสอบ</option>

                  <option value="ยังดำเนินกิจการ">ยังดำเนินกิจการ</option>

                  <option value="เลิกกิจการ">เลิกกิจการ</option>

                  <option value="ไม่พบข้อมูล">ไม่พบข้อมูล</option>
                </select>
              </div>

              <div className="col-md-3 d-flex gap-2">
                <button type="submit" className="btn btn-primary flex-grow-1">
                  ค้นหา
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleClearFilter}
                >
                  ล้าง
                </button>
              </div>
            </form>

            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>

                <p className="text-muted mt-3 mb-0">กำลังโหลดข้อมูล...</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>ลำดับ</th>
                      <th>ชื่อบริษัท</th>
                      <th>เลขนิติบุคคล</th>
                      <th>สถานะ</th>
                      <th>หมายเหตุ</th>
                      <th>จัดการ</th>
                    </tr>
                  </thead>

                  <tbody>
                    {companies.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center text-muted py-5">
                          ไม่พบข้อมูลบริษัท
                        </td>
                      </tr>
                    ) : (
                      companies.map((company, index) => (
                        <tr key={company._id}>
                          <td>{index + 1}</td>

                          <td>{company.companyName}</td>

                          <td>
                            <code>{company.juristicId}</code>
                          </td>

                          <td>
                            <span
                              className={`badge ${getStatusBadgeClass(
                                company.status,
                              )}`}
                            >
                              {company.status}
                            </span>
                          </td>

                          <td>{company.note || "-"}</td>

                          <td>
                            <div className="d-flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleEdit(company)}
                              >
                                แก้ไข
                              </button>

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(company)}
                              >
                                ลบ
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanyManagement;
