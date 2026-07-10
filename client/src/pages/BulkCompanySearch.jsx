import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

import {
  bulkSearchCompanies,
  importCompanies,
} from "../services/companyService";

import {
  getCurrentUser,
  logoutUser,
} from "../services/authService";

const MAX_ITEMS = 5000;

const emptyImportResult = {
  total: 0,
  imported: 0,
  updated: 0,
  skipped: 0,
  errors: [],
};

function BulkCompanySearch() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState("excel");
  const [companies, setCompanies] = useState([]);
  const [results, setResults] = useState([]);
  const [fileName, setFileName] = useState("");
  const [pasteText, setPasteText] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [importResult, setImportResult] = useState(null);

  const summary = useMemo(() => {
    return {
      total: results.length,
      active: results.filter(
        (item) => item.status === "ยังดำเนินกิจการ"
      ).length,
      pending: results.filter(
        (item) => item.status === "รอตรวจสอบ"
      ).length,
      closed: results.filter(
        (item) => item.status === "เลิกกิจการ"
      ).length,
      notFound: results.filter(
        (item) => item.status === "ไม่พบข้อมูล"
      ).length,
    };
  }, [results]);

  const clearMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const resetResults = () => {
    setResults([]);
    setImportResult(null);
  };

  const readExcelFile = (file) => {
    if (!file) return;

    const validExtensions = [".xlsx", ".xls"];
    const dotIndex = file.name.lastIndexOf(".");
    const extension =
      dotIndex >= 0
        ? file.name.slice(dotIndex).toLowerCase()
        : "";

    if (!validExtensions.includes(extension)) {
      setErrorMessage(
        "กรุณาเลือกไฟล์ Excel นามสกุล .xlsx หรือ .xls เท่านั้น"
      );
      setCompanies([]);
      setFileName("");
      resetResults();
      return;
    }

    clearMessages();
    resetResults();
    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          defval: "",
          raw: false,
        });

        if (jsonData.length === 0) {
          setErrorMessage("ไฟล์ Excel ไม่มีข้อมูล");
          setCompanies([]);
          return;
        }

        if (jsonData.length > MAX_ITEMS) {
          setErrorMessage(
            `ไฟล์มีข้อมูลเกิน ${MAX_ITEMS.toLocaleString()} รายการ กรุณาแบ่งไฟล์ก่อนใช้งาน`
          );
          setCompanies([]);
          return;
        }

        setCompanies(jsonData);
        setSuccessMessage(
          `อ่านไฟล์สำเร็จ พบข้อมูล ${jsonData.length.toLocaleString()} รายการ`
        );
      } catch (error) {
        console.error("Read Excel error:", error);
        setErrorMessage(
          "ไม่สามารถอ่านไฟล์ Excel ได้ กรุณาตรวจสอบรูปแบบไฟล์"
        );
        setCompanies([]);
        resetResults();
      }
    };

    reader.onerror = () => {
      setErrorMessage("เกิดข้อผิดพลาดระหว่างอ่านไฟล์");
      setCompanies([]);
      resetResults();
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFileUpload = (event) => {
    readExcelFile(event.target.files?.[0]);
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    readExcelFile(event.dataTransfer.files?.[0]);
  };

  const handleBrowseFile = () => {
    fileInputRef.current?.click();
  };

  const handleClearFile = () => {
    setCompanies([]);
    setFileName("");
    clearMessages();
    resetResults();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const normalizePasteLine = (line) => {
    const trimmedLine = line.trim();

    if (!trimmedLine) return null;

    const parts = trimmedLine
      .split(/[,\t|;]/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length === 1) {
      return {
        companyName: "",
        juristicId: parts[0],
      };
    }

    const first = parts[0];
    const second = parts[1];
    const firstDigits = first.replace(/\D/g, "");
    const secondDigits = second.replace(/\D/g, "");

    if (firstDigits.length === 13) {
      return {
        companyName: second || "",
        juristicId: first,
      };
    }

    return {
      companyName: first,
      juristicId: secondDigits.length > 0 ? second : "",
    };
  };

  const parsePasteCompanies = () => {
    const parsedCompanies = pasteText
      .split(/\r?\n/)
      .map(normalizePasteLine)
      .filter(Boolean);

    return parsedCompanies;
  };

  const handleImport = async () => {
    if (companies.length === 0) {
      setErrorMessage("กรุณาเลือกไฟล์ Excel ก่อนนำเข้าข้อมูล");
      return;
    }

    try {
      setIsImporting(true);
      clearMessages();
      setImportResult(null);

      const result = await importCompanies(companies, fileName);
      const importedData = result.data || emptyImportResult;

      setImportResult(importedData);
      setSuccessMessage(
        `นำเข้าข้อมูลสำเร็จ: เพิ่มใหม่ ${importedData.imported || 0} รายการ, อัปเดต ${importedData.updated || 0} รายการ, ข้าม ${importedData.skipped || 0} รายการ`
      );
    } catch (error) {
      console.error("Import companies error:", error);
      setErrorMessage(
        error.response?.data?.message ||
          "ไม่สามารถนำเข้าข้อมูลบริษัทได้"
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleExcelSearch = async () => {
    if (companies.length === 0) {
      setErrorMessage("กรุณาเลือกไฟล์ Excel ก่อนตรวจสอบสถานะ");
      return;
    }

    try {
      setIsChecking(true);
      clearMessages();

      const result = await bulkSearchCompanies(companies, {
        fileName,
        searchType: "BULK_SEARCH",
      });

      setResults(result.data || []);
      setSuccessMessage(
        `ตรวจสอบเสร็จแล้ว ${result.data?.length || 0} รายการ`
      );
    } catch (error) {
      console.error("Bulk search error:", error);
      setErrorMessage(
        error.response?.data?.message ||
          "ไม่สามารถตรวจสอบข้อมูลหลายบริษัทได้"
      );
    } finally {
      setIsChecking(false);
    }
  };

  const handlePasteSearch = async () => {
    const parsedCompanies = parsePasteCompanies();

    if (parsedCompanies.length === 0) {
      setErrorMessage(
        "กรุณาวางชื่อบริษัทหรือเลขนิติบุคคลอย่างน้อย 1 รายการ"
      );
      return;
    }

    if (parsedCompanies.length > MAX_ITEMS) {
      setErrorMessage(
        `ตรวจสอบได้สูงสุดครั้งละ ${MAX_ITEMS.toLocaleString()} รายการ`
      );
      return;
    }

    try {
      setIsChecking(true);
      clearMessages();
      setImportResult(null);

      const result = await bulkSearchCompanies(parsedCompanies, {
        searchType: "PASTE_SEARCH",
      });

      setResults(result.data || []);
      setSuccessMessage(
        `ตรวจสอบข้อมูลที่วางเสร็จแล้ว ${result.data?.length || 0} รายการ`
      );
    } catch (error) {
      console.error("Paste search error:", error);
      setErrorMessage(
        error.response?.data?.message ||
          "ไม่สามารถตรวจสอบข้อมูลที่วางได้"
      );
    } finally {
      setIsChecking(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        ชื่อบริษัท: "บริษัท ตัวอย่าง จำกัด",
        เลขนิติบุคคล: "0101111111111",
        สถานะ: "ยังดำเนินกิจการ",
        หมายเหตุ: "ข้อมูลสำหรับ Demo",
      },
      {
        ชื่อบริษัท: "บริษัท ABC จำกัด",
        เลขนิติบุคคล: "0102222222222",
        สถานะ: "รอตรวจสอบ",
        หมายเหตุ: "ข้อมูลสำหรับ Demo",
      },
      {
        ชื่อบริษัท: "บริษัท XYZ จำกัด",
        เลขนิติบุคคล: "0103333333333",
        สถานะ: "เลิกกิจการ",
        หมายเหตุ: "ข้อมูลสำหรับ Demo",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    worksheet["!cols"] = [
      { wch: 38 },
      { wch: 20 },
      { wch: 20 },
      { wch: 30 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "company-search-template.xlsx");
  };

  const handleExportExcel = () => {
    if (results.length === 0) {
      setErrorMessage("ยังไม่มีผลการตรวจสอบสำหรับ Export");
      return;
    }

    const exportData = results.map((item, index) => ({
      ลำดับ: index + 1,
      ชื่อบริษัท: item.companyName,
      เลขนิติบุคคล: item.juristicId,
      สถานะ: item.status,
      วันที่อัปเดต: item.updateDate
        ? new Date(item.updateDate).toLocaleDateString("th-TH")
        : "-",
      หมายเหตุ: item.note || "-",
      แหล่งข้อมูล: item.source || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    worksheet["!cols"] = [
      { wch: 10 },
      { wch: 40 },
      { wch: 20 },
      { wch: 22 },
      { wch: 18 },
      { wch: 35 },
      { wch: 20 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Bulk Search Results"
    );
    XLSX.writeFile(
      workbook,
      `bulk-company-search-results-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
    );
  };

  const handleLogout = () => {
    const confirmed = window.confirm(
      "ต้องการออกจากระบบหรือไม่?"
    );

    if (!confirmed) return;

    logoutUser();
    navigate("/login", { replace: true });
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

  const isBusy = isImporting || isChecking;

  return (
    <div className="container-fluid bg-light min-vh-100 py-4">
      <div className="container">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h1 className="h3 mb-1">Bulk Company Search</h1>
            <p className="text-muted mb-0">
              ตรวจสอบสถานะบริษัทหลายรายการจาก Excel หรือวางข้อมูลโดยตรง
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

            <Link
              to="/dashboard"
              className="btn btn-outline-primary"
            >
              Dashboard
            </Link>

            <Link
              to="/companies"
              className="btn btn-outline-success"
            >
              Company Management
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

        {errorMessage && (
          <div className="alert alert-danger" role="alert">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success" role="alert">
            {successMessage}
          </div>
        )}

        <div className="card shadow-sm mb-4">
          <div className="card-header bg-white">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div>
                <h2 className="h5 mb-1">Company Verification Center</h2>
                <p className="text-muted mb-0">
                  เลือกวิธีตรวจสอบข้อมูลบริษัทที่ต้องการ
                </p>
              </div>

              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={handleDownloadTemplate}
                disabled={isBusy}
              >
                Download Template Excel
              </button>
            </div>
          </div>

          <div className="card-body">
            <ul className="nav nav-pills gap-2 mb-4">
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${
                    activeTab === "excel" ? "active" : ""
                  }`}
                  onClick={() => {
                    setActiveTab("excel");
                    clearMessages();
                    setResults([]);
                  }}
                  disabled={isBusy}
                >
                  Upload Excel
                </button>
              </li>

              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${
                    activeTab === "paste" ? "active" : ""
                  }`}
                  onClick={() => {
                    setActiveTab("paste");
                    clearMessages();
                    setResults([]);
                    setImportResult(null);
                  }}
                  disabled={isBusy}
                >
                  วางหลายบริษัท
                </button>
              </li>
            </ul>

            {activeTab === "excel" && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="d-none"
                  onChange={handleFileUpload}
                />

                <div
                  role="button"
                  tabIndex="0"
                  className={`border border-2 rounded-3 p-5 text-center ${
                    isDragging
                      ? "border-primary bg-primary-subtle"
                      : "border-secondary-subtle bg-light"
                  }`}
                  style={{
                    borderStyle: "dashed",
                    cursor: "pointer",
                    transition: "0.2s",
                  }}
                  onClick={handleBrowseFile}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" ||
                      event.key === " "
                    ) {
                      handleBrowseFile();
                    }
                  }}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="display-5 mb-3">📄</div>
                  <h3 className="h5">ลากไฟล์ Excel มาวางที่นี่</h3>
                  <p className="text-muted mb-3">
                    หรือคลิกเพื่อเลือกไฟล์จากเครื่อง รองรับ .xlsx และ .xls
                  </p>
                  <span className="btn btn-primary">
                    เลือกไฟล์ Excel
                  </span>
                </div>

                {fileName && (
                  <div className="border rounded bg-white p-3 mt-3">
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                      <div>
                        <div className="fw-semibold">ไฟล์ที่เลือก</div>
                        <div className="text-muted">{fileName}</div>
                      </div>

                      <div className="d-flex flex-wrap align-items-center gap-3">
                        <div className="text-center">
                          <div className="small text-muted">
                            จำนวนข้อมูล
                          </div>
                          <div className="fs-4 fw-bold text-primary">
                            {companies.length.toLocaleString()}
                          </div>
                          <div className="small text-muted">รายการ</div>
                        </div>

                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={handleClearFile}
                          disabled={isBusy}
                        >
                          ล้างไฟล์
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="d-flex flex-wrap justify-content-end gap-2 mt-4">
                  <button
                    type="button"
                    className="btn btn-primary px-4"
                    onClick={handleImport}
                    disabled={companies.length === 0 || isBusy}
                  >
                    {isImporting
                      ? "กำลังนำเข้าข้อมูล..."
                      : `นำเข้า Demo Database ${companies.length.toLocaleString()} รายการ`}
                  </button>

                  <button
                    type="button"
                    className="btn btn-success px-4"
                    onClick={handleExcelSearch}
                    disabled={companies.length === 0 || isBusy}
                  >
                    {isChecking
                      ? "กำลังตรวจสอบ..."
                      : `ตรวจสอบสถานะ ${companies.length.toLocaleString()} รายการ`}
                  </button>
                </div>
              </>
            )}

            {activeTab === "paste" && (
              <>
                <label
                  htmlFor="pasteCompanies"
                  className="form-label fw-semibold"
                >
                  วางชื่อบริษัทและเลขนิติบุคคลหลายรายการ
                </label>

                <textarea
                  id="pasteCompanies"
                  className="form-control"
                  rows="11"
                  value={pasteText}
                  onChange={(event) => {
                    setPasteText(event.target.value);
                    clearMessages();
                  }}
                  placeholder={`รูปแบบที่รองรับ:\nบริษัท ABC จำกัด,0101111111111\nบริษัท XYZ จำกัด,0102222222222\n\nหรือกรอกเฉพาะเลขนิติบุคคลทีละบรรทัด:\n0101111111111\n0102222222222`}
                  disabled={isBusy}
                />

                <div className="form-text">
                  รองรับตัวคั่นแบบ comma, tab, semicolon หรือ | สูงสุด {MAX_ITEMS.toLocaleString()} รายการ
                </div>

                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setPasteText("");
                      setResults([]);
                      clearMessages();
                    }}
                    disabled={!pasteText || isBusy}
                  >
                    ล้างข้อความ
                  </button>

                  <button
                    type="button"
                    className="btn btn-success px-4"
                    onClick={handlePasteSearch}
                    disabled={!pasteText.trim() || isBusy}
                  >
                    {isChecking
                      ? "กำลังตรวจสอบ..."
                      : "ตรวจสอบหลายบริษัท"}
                  </button>
                </div>
              </>
            )}

            {isBusy && (
              <div className="mt-4">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">
                    {isImporting
                      ? `กำลังนำเข้าข้อมูล ${companies.length.toLocaleString()} รายการ`
                      : "กำลังตรวจสอบข้อมูลบริษัท"}
                  </span>
                  <span className="text-muted">กรุณารอสักครู่</span>
                </div>

                <div className="progress" style={{ height: "22px" }}>
                  <div
                    className="progress-bar progress-bar-striped progress-bar-animated"
                    style={{ width: "100%" }}
                  >
                    กำลังประมวลผล
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {importResult && (
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-white">
              <h2 className="h5 mb-0">สรุปผลการนำเข้าข้อมูล</h2>
            </div>

            <div className="card-body">
              <div className="row g-3">
                <div className="col-6 col-md-3">
                  <div className="border rounded p-3 text-center h-100">
                    <div className="text-muted small">ข้อมูลทั้งหมด</div>
                    <div className="fs-3 fw-bold text-primary">
                      {(importResult.total || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="col-6 col-md-3">
                  <div className="border rounded p-3 text-center h-100">
                    <div className="text-muted small">เพิ่มใหม่</div>
                    <div className="fs-3 fw-bold text-success">
                      {(importResult.imported || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="col-6 col-md-3">
                  <div className="border rounded p-3 text-center h-100">
                    <div className="text-muted small">อัปเดตข้อมูล</div>
                    <div className="fs-3 fw-bold text-warning">
                      {(importResult.updated || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="col-6 col-md-3">
                  <div className="border rounded p-3 text-center h-100">
                    <div className="text-muted small">ข้ามรายการ</div>
                    <div className="fs-3 fw-bold text-danger">
                      {(importResult.skipped || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {importResult.errors?.length > 0 && (
                <div className="mt-4">
                  <h3 className="h6">
                    รายการที่ไม่สามารถนำเข้าได้
                  </h3>

                  <div className="table-responsive">
                    <table className="table table-sm table-bordered">
                      <thead className="table-light">
                        <tr>
                          <th>แถว</th>
                          <th>ชื่อบริษัท</th>
                          <th>สาเหตุ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResult.errors.map((item, index) => (
                          <tr key={`${item.row}-${index}`}>
                            <td>{item.row}</td>
                            <td>{item.companyName || "-"}</td>
                            <td>{item.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {results.length > 0 && (
          <>
            <div className="row g-3 mb-4">
              <div className="col-12 col-sm-6 col-lg">
                <div className="card h-100 border-primary shadow-sm">
                  <div className="card-body">
                    <p className="text-muted mb-1">ทั้งหมด</p>
                    <h3 className="fw-bold text-primary mb-0">
                      {summary.total.toLocaleString()}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg">
                <div className="card h-100 border-success shadow-sm">
                  <div className="card-body">
                    <p className="text-muted mb-1">ยังดำเนินกิจการ</p>
                    <h3 className="fw-bold text-success mb-0">
                      {summary.active.toLocaleString()}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg">
                <div className="card h-100 border-warning shadow-sm">
                  <div className="card-body">
                    <p className="text-muted mb-1">รอตรวจสอบ</p>
                    <h3 className="fw-bold text-warning mb-0">
                      {summary.pending.toLocaleString()}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg">
                <div className="card h-100 border-danger shadow-sm">
                  <div className="card-body">
                    <p className="text-muted mb-1">เลิกกิจการ</p>
                    <h3 className="fw-bold text-danger mb-0">
                      {summary.closed.toLocaleString()}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg">
                <div className="card h-100 border-secondary shadow-sm">
                  <div className="card-body">
                    <p className="text-muted mb-1">ไม่พบข้อมูล</p>
                    <h3 className="fw-bold text-secondary mb-0">
                      {summary.notFound.toLocaleString()}
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            <div className="card shadow-sm">
              <div className="card-header bg-white">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                  <div>
                    <h2 className="h5 mb-1">ผลการตรวจสอบ</h2>
                    <span className="text-muted">
                      แสดงผลทั้งหมด {results.length.toLocaleString()} รายการ
                    </span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={handleExportExcel}
                  >
                    Export Excel
                  </button>
                </div>
              </div>

              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="ps-3">ลำดับ</th>
                        <th>ชื่อบริษัท</th>
                        <th>เลขนิติบุคคล</th>
                        <th>สถานะ</th>
                        <th>วันที่อัปเดต</th>
                        <th>หมายเหตุ</th>
                        <th>แหล่งข้อมูล</th>
                      </tr>
                    </thead>

                    <tbody>
                      {results.map((item, index) => (
                        <tr key={`${item.juristicId}-${index}`}>
                          <td className="ps-3">{index + 1}</td>
                          <td>{item.companyName}</td>
                          <td>
                            <code>{item.juristicId}</code>
                          </td>
                          <td>
                            <span
                              className={`badge ${getStatusBadgeClass(
                                item.status
                              )}`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td>
                            {item.updateDate
                              ? new Date(
                                  item.updateDate
                                ).toLocaleDateString("th-TH")
                              : "-"}
                          </td>
                          <td>{item.note || "-"}</td>
                          <td>{item.source || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {companies.length === 0 &&
          results.length === 0 &&
          activeTab === "excel" && (
            <div className="alert alert-info">
              สำหรับ Demo ให้ดาวน์โหลด Template กรอกข้อมูล แล้วนำเข้า Demo Database หนึ่งครั้ง จากนั้นจึงตรวจสอบสถานะได้
            </div>
          )}
      </div>
    </div>
  );
}

export default BulkCompanySearch;
