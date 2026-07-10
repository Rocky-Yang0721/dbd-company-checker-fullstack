import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  getCompanies,
  getSearchHistory,
} from "../services/companyService";

import {
  getCurrentUser,
  logoutUser,
} from "../services/authService";

function DashboardHome() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [companies, setCompanies] = useState([]);
  const [history, setHistory] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] = useState("");

  const loadCompanies = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const result = await getCompanies();

      setCompanies(result.data || []);
    } catch (error) {
      console.error("Dashboard load error:", error);

      setErrorMessage(
        error.response?.data?.message ||
          "ไม่สามารถโหลดข้อมูล Dashboard ได้"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      setIsHistoryLoading(true);

      const result = await getSearchHistory(8);

      setHistory(result.data || []);
    } catch (error) {
      console.error("History load error:", error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const loadDashboard = async () => {
    await Promise.all([
      loadCompanies(),
      loadHistory(),
    ]);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const summary = useMemo(() => {
    const total = companies.length;

    const active = companies.filter(
      (company) =>
        company.status === "ยังดำเนินกิจการ"
    ).length;

    const pending = companies.filter(
      (company) =>
        company.status === "รอตรวจสอบ"
    ).length;

    const closed = companies.filter(
      (company) =>
        company.status === "เลิกกิจการ"
    ).length;

    const notFound = companies.filter(
      (company) =>
        company.status === "ไม่พบข้อมูล"
    ).length;

    return {
      total,
      active,
      pending,
      closed,
      notFound,
    };
  }, [companies]);

  const percentages = useMemo(() => {
    if (summary.total === 0) {
      return {
        active: 0,
        pending: 0,
        closed: 0,
        notFound: 0,
      };
    }

    const getPercent = (value) =>
      Math.round((value / summary.total) * 100);

    return {
      active: getPercent(summary.active),
      pending: getPercent(summary.pending),
      closed: getPercent(summary.closed),
      notFound: getPercent(summary.notFound),
    };
  }, [summary]);

  const donutBackground = useMemo(() => {
    if (summary.total === 0) {
      return "conic-gradient(#e9ecef 0deg 360deg)";
    }

    const activeEnd = percentages.active;
    const pendingEnd =
      activeEnd + percentages.pending;
    const closedEnd =
      pendingEnd + percentages.closed;

    return `conic-gradient(
      #198754 0% ${activeEnd}%,
      #ffc107 ${activeEnd}% ${pendingEnd}%,
      #dc3545 ${pendingEnd}% ${closedEnd}%,
      #6c757d ${closedEnd}% 100%
    )`;
  }, [summary.total, percentages]);

  const summaryCards = [
    {
      title: "บริษัททั้งหมด",
      value: summary.total,
      borderClass: "border-primary",
      textClass: "text-primary",
    },
    {
      title: "ยังดำเนินกิจการ",
      value: summary.active,
      borderClass: "border-success",
      textClass: "text-success",
    },
    {
      title: "รอตรวจสอบ",
      value: summary.pending,
      borderClass: "border-warning",
      textClass: "text-warning",
    },
    {
      title: "เลิกกิจการ",
      value: summary.closed,
      borderClass: "border-danger",
      textClass: "text-danger",
    },
    {
      title: "ไม่พบข้อมูล",
      value: summary.notFound,
      borderClass: "border-secondary",
      textClass: "text-secondary",
    },
  ];

  const recentCompanies = companies.slice(0, 5);

  const handleLogout = () => {
    const confirmed = window.confirm(
      "ต้องการออกจากระบบหรือไม่?"
    );

    if (!confirmed) {
      return;
    }

    logoutUser();
    navigate("/login", {
      replace: true,
    });
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    return new Date(dateValue).toLocaleString(
      "th-TH",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  const getActionLabel = (actionType) => {
    switch (actionType) {
      case "IMPORT":
        return "นำเข้าข้อมูล";

      case "PASTE_SEARCH":
        return "ค้นหาจากข้อความ";

      case "BULK_SEARCH":
        return "ค้นหาจาก Excel";

      default:
        return actionType || "-";
    }
  };

  const getActionBadgeClass = (actionType) => {
    switch (actionType) {
      case "IMPORT":
        return "text-bg-primary";

      case "PASTE_SEARCH":
        return "text-bg-info";

      case "BULK_SEARCH":
        return "text-bg-success";

      default:
        return "text-bg-secondary";
    }
  };

  const getHistoryStatusBadgeClass = (status) => {
    if (status === "COMPLETED") {
      return "text-bg-success";
    }

    return "text-bg-danger";
  };

  const getHistoryStatusLabel = (status) => {
    if (status === "COMPLETED") {
      return "สำเร็จ";
    }

    return "ไม่สำเร็จ";
  };

  return (
    <div className="container-fluid bg-light min-vh-100 py-4">
      <div className="container">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h1 className="h3 mb-1">
              DBD Company Checker
            </h1>

            <p className="text-muted mb-0">
              Dashboard สรุปข้อมูลและประวัติการตรวจสอบนิติบุคคล
            </p>
          </div>

          <div className="d-flex flex-wrap align-items-center justify-content-end gap-3">
            <div className="text-end">
              <div className="fw-semibold">
                {currentUser?.name || "ผู้ใช้งาน"}
              </div>

              <small className="text-muted">
                {currentUser?.email || ""}
              </small>
            </div>

            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={handleLogout}
            >
              ออกจากระบบ
            </button>
          </div>
        </div>

        {errorMessage && (
          <div
            className="alert alert-danger"
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="card shadow-sm">
            <div className="card-body text-center py-5">
              <div
                className="spinner-border text-primary"
                role="status"
              >
                <span className="visually-hidden">
                  Loading...
                </span>
              </div>

              <p className="text-muted mt-3 mb-0">
                กำลังโหลดข้อมูล Dashboard...
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="row g-3 mb-4">
              {summaryCards.map((card) => (
                <div
                  className="col-12 col-sm-6 col-lg"
                  key={card.title}
                >
                  <div
                    className={`card h-100 shadow-sm border-top border-4 ${card.borderClass}`}
                  >
                    <div className="card-body">
                      <p className="text-muted mb-2">
                        {card.title}
                      </p>

                      <h2
                        className={`display-6 fw-bold mb-0 ${card.textClass}`}
                      >
                        {card.value}
                      </h2>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="d-flex flex-wrap gap-2 mb-4">
              <Link
                to="/companies"
                className="btn btn-primary"
              >
                จัดการข้อมูลบริษัท
              </Link>

              <Link
                to="/bulk-search"
                className="btn btn-success"
              >
                Bulk Company Search
              </Link>

              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={loadDashboard}
              >
                รีเฟรชข้อมูล
              </button>
            </div>

            <div className="row g-4 mb-4">
              <div className="col-12 col-lg-5">
                <div className="card shadow-sm h-100">
                  <div className="card-header bg-white">
                    <h2 className="h5 mb-1">
                      สัดส่วนสถานะบริษัท
                    </h2>

                    <p className="text-muted mb-0">
                      คำนวณจากข้อมูลทั้งหมดใน Demo Database
                    </p>
                  </div>

                  <div className="card-body">
                    <div className="d-flex flex-column align-items-center">
                      <div
                        className="position-relative rounded-circle mb-4"
                        style={{
                          width: "220px",
                          height: "220px",
                          background: donutBackground,
                        }}
                        aria-label="กราฟสัดส่วนสถานะบริษัท"
                      >
                        <div
                          className="position-absolute top-50 start-50 translate-middle rounded-circle bg-white d-flex flex-column align-items-center justify-content-center shadow-sm"
                          style={{
                            width: "125px",
                            height: "125px",
                          }}
                        >
                          <span className="text-muted small">
                            บริษัททั้งหมด
                          </span>

                          <strong className="fs-2 text-primary">
                            {summary.total}
                          </strong>

                          <span className="text-muted small">
                            รายการ
                          </span>
                        </div>
                      </div>

                      <div className="w-100">
                        <div className="d-flex justify-content-between align-items-center border-bottom py-2">
                          <div className="d-flex align-items-center gap-2">
                            <span
                              className="rounded-circle bg-success"
                              style={{
                                width: "12px",
                                height: "12px",
                              }}
                            />

                            <span>ยังดำเนินกิจการ</span>
                          </div>

                          <strong>
                            {summary.active}{" "}
                            <span className="text-muted fw-normal">
                              ({percentages.active}%)
                            </span>
                          </strong>
                        </div>

                        <div className="d-flex justify-content-between align-items-center border-bottom py-2">
                          <div className="d-flex align-items-center gap-2">
                            <span
                              className="rounded-circle bg-warning"
                              style={{
                                width: "12px",
                                height: "12px",
                              }}
                            />

                            <span>รอตรวจสอบ</span>
                          </div>

                          <strong>
                            {summary.pending}{" "}
                            <span className="text-muted fw-normal">
                              ({percentages.pending}%)
                            </span>
                          </strong>
                        </div>

                        <div className="d-flex justify-content-between align-items-center border-bottom py-2">
                          <div className="d-flex align-items-center gap-2">
                            <span
                              className="rounded-circle bg-danger"
                              style={{
                                width: "12px",
                                height: "12px",
                              }}
                            />

                            <span>เลิกกิจการ</span>
                          </div>

                          <strong>
                            {summary.closed}{" "}
                            <span className="text-muted fw-normal">
                              ({percentages.closed}%)
                            </span>
                          </strong>
                        </div>

                        <div className="d-flex justify-content-between align-items-center py-2">
                          <div className="d-flex align-items-center gap-2">
                            <span
                              className="rounded-circle bg-secondary"
                              style={{
                                width: "12px",
                                height: "12px",
                              }}
                            />

                            <span>ไม่พบข้อมูล</span>
                          </div>

                          <strong>
                            {summary.notFound}{" "}
                            <span className="text-muted fw-normal">
                              ({percentages.notFound}%)
                            </span>
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-lg-7">
                <div className="card shadow-sm h-100">
                  <div className="card-header bg-white">
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                      <div>
                        <h2 className="h5 mb-1">
                          ประวัติการทำงานล่าสุด
                        </h2>

                        <p className="text-muted mb-0">
                          แสดงล่าสุดไม่เกิน 8 รายการ
                        </p>
                      </div>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={loadHistory}
                      >
                        รีเฟรชประวัติ
                      </button>
                    </div>
                  </div>

                  <div className="card-body p-0">
                    {isHistoryLoading ? (
                      <div className="text-center py-5">
                        <div
                          className="spinner-border spinner-border-sm text-primary"
                          role="status"
                        >
                          <span className="visually-hidden">
                            Loading...
                          </span>
                        </div>

                        <p className="text-muted mt-2 mb-0">
                          กำลังโหลดประวัติ...
                        </p>
                      </div>
                    ) : history.length === 0 ? (
                      <div className="text-center text-muted py-5 px-3">
                        ยังไม่มีประวัติการนำเข้าหรือค้นหาข้อมูล
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th className="ps-3">
                                วันที่และเวลา
                              </th>

                              <th>ประเภท</th>
                              <th>จำนวน</th>
                              <th>ผลลัพธ์</th>
                              <th>สถานะ</th>
                            </tr>
                          </thead>

                          <tbody>
                            {history.map((item) => (
                              <tr key={item._id}>
                                <td className="ps-3 text-nowrap">
                                  {formatDateTime(
                                    item.createdAt
                                  )}
                                </td>

                                <td>
                                  <span
                                    className={`badge ${getActionBadgeClass(
                                      item.actionType
                                    )}`}
                                  >
                                    {getActionLabel(
                                      item.actionType
                                    )}
                                  </span>

                                  {item.fileName && (
                                    <div className="small text-muted mt-1">
                                      {item.fileName}
                                    </div>
                                  )}
                                </td>

                                <td>
                                  {item.totalItems || 0}
                                </td>

                                <td>
                                  <div className="small">
                                    {item.actionType ===
                                    "IMPORT" ? (
                                      <>
                                        เพิ่ม{" "}
                                        {item.importedItems || 0},
                                        อัปเดต{" "}
                                        {item.updatedItems || 0},
                                        ข้าม{" "}
                                        {item.skippedItems || 0}
                                      </>
                                    ) : (
                                      <>
                                        พบ{" "}
                                        {item.foundItems || 0},
                                        ไม่พบ{" "}
                                        {item.notFoundItems || 0}
                                      </>
                                    )}
                                  </div>
                                </td>

                                <td>
                                  <span
                                    className={`badge ${getHistoryStatusBadgeClass(
                                      item.status
                                    )}`}
                                  >
                                    {getHistoryStatusLabel(
                                      item.status
                                    )}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="card shadow-sm">
              <div className="card-header bg-white">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                  <div>
                    <h2 className="h5 mb-1">
                      ข้อมูลบริษัทล่าสุด
                    </h2>

                    <span className="text-muted">
                      แสดงล่าสุดไม่เกิน 5 รายการ
                    </span>
                  </div>

                  <Link
                    to="/companies"
                    className="btn btn-sm btn-outline-primary"
                  >
                    ดูทั้งหมด
                  </Link>
                </div>
              </div>

              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="ps-3">
                          ชื่อบริษัท
                        </th>

                        <th>เลขนิติบุคคล</th>
                        <th>สถานะ</th>
                        <th>วันที่อัปเดต</th>
                        <th>หมายเหตุ</th>
                      </tr>
                    </thead>

                    <tbody>
                      {recentCompanies.length === 0 ? (
                        <tr>
                          <td
                            colSpan="5"
                            className="text-center text-muted py-5"
                          >
                            ยังไม่มีข้อมูลบริษัท
                          </td>
                        </tr>
                      ) : (
                        recentCompanies.map((company) => (
                          <tr key={company._id}>
                            <td className="ps-3">
                              {company.companyName}
                            </td>

                            <td>
                              <code>
                                {company.juristicId}
                              </code>
                            </td>

                            <td>
                              {company.status}
                            </td>

                            <td>
                              {company.updateDate
                                ? new Date(
                                    company.updateDate
                                  ).toLocaleDateString(
                                    "th-TH"
                                  )
                                : "-"}
                            </td>

                            <td>
                              {company.note || "-"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DashboardHome;
