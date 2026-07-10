import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import Header from "../components/Header";
import SummaryCard from "../components/SummaryCard";
import FilterBar from "../components/FilterBar";
import ProgressBar from "../components/ProgressBar"; 
import CompanyTable from "../components/CompanyTable";
import Pagination from "../components/Pagination";

import { sampleCompanies } from "../data/sampleData";
import { readCompaniesFromExcel } from "../services/excelService.js";
import { checkCompanyStatus } from "../services/dbdApi.js";
import { runBatchQueue } from "../services/batchService.js";
import { getHistory, saveHistory, clearHistory } from "../services/historyService.js";
import {
  exportCompaniesToExcel,
  exportCompaniesToCSV,
} from "../services/exportService";

const ITEMS_PER_PAGE = 10;

function Dashboard() {
  const [companies, setCompanies] = useState(sampleCompanies);
  const [inputMode, setInputMode] = useState("juristicId");
  const [companyText, setCompanyText] = useState(
    sampleCompanies.map((company) => company.juristicId || company.name).join("\n")
  );

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [checkedCount, setCheckedCount] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [history, setHistory] = useState(getHistory());
  const [showHistory, setShowHistory] = useState(false);

  const stopRef = useRef(false);

  const convertTextToCompanies = () => {
    const lines = companyText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const newCompanies = lines.map((line, index) => {
      const matchedCompany =
        inputMode === "juristicId"
          ? sampleCompanies.find((company) => company.juristicId === line)
          : sampleCompanies.find((company) => company.name === line);

      return {
        id: index + 1,
        name: matchedCompany?.name || (inputMode === "companyName" ? line : ""),
        juristicId:
          matchedCompany?.juristicId || (inputMode === "juristicId" ? line : ""),
        status: "รอตรวจสอบ",
        updatedAt: "-",
        error: "",
      };
    });

    setCompanies(newCompanies);
    setCheckedCount(0);
    setCurrentPage(1);

    return newCompanies;
  };

  const handleImportExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const importedCompanies = await readCompaniesFromExcel(file);

      setCompanies(importedCompanies);
      setCompanyText(
        importedCompanies
          .map((company) =>
            inputMode === "juristicId" ? company.juristicId : company.name
          )
          .join("\n")
      );
      setCheckedCount(0);
      setCurrentPage(1);
      toast.success(`Import Excel สำเร็จ ${importedCompanies.length} รายการ`);
    } catch (error) {
      toast.error("อ่านไฟล์ Excel ไม่สำเร็จ");
      console.error(error);
    } finally {
      event.target.value = "";
    }
  };

  const handleBatchCheck = async () => {
    if (companyText.trim() === "" || isChecking) {
      toast.error("กรุณาใส่ข้อมูลบริษัทก่อนตรวจสอบ");
      return;
    }

    stopRef.current = false;

    const startTime = Date.now();
    const companiesToCheck = convertTextToCompanies();

    setIsChecking(true);
    setCheckedCount(0);
    toast.success("เริ่มตรวจสอบสถานะบริษัท");

    const results = await runBatchQueue({
      items: companiesToCheck,
      worker: checkCompanyStatus,
      concurrency: 5,
      retries: 3,
      delayMs: 1000,
      timeoutMs: 15000,
      shouldStop: () => stopRef.current,
      onProgress: ({ completed, latestResult, index }) => {
        setCheckedCount(completed);

        setCompanies((prevCompanies) =>
          prevCompanies.map((company, companyIndex) =>
            companyIndex === index ? latestResult : company
          )
        );
      },
    });

    const durationSeconds = Math.round((Date.now() - startTime) / 1000);

    const historyRecord = saveHistory({
      total: results.length,
      active: results.filter(
        (c) => c.status === "ดำเนินกิจการ" || c.status === "ยังดำเนินกิจการ"
      ).length,
      closed: results.filter((c) => c.status === "เลิกกิจการ").length,
      notFound: results.filter(
        (c) => c.status === "ไม่พบข้อมูล" || c.status === "ตรวจสอบไม่พบ"
      ).length,
      durationSeconds,
      isStopped: stopRef.current,
    });

    setHistory(historyRecord);
    setIsChecking(false);

    if (stopRef.current) {
      toast("หยุดการตรวจสอบแล้ว", { icon: "⛔" });
    } else {
      toast.success(`ตรวจสอบเสร็จสิ้น ${results.length} บริษัท`);
    }
  };

  const handleStopChecking = () => {
    stopRef.current = true;
    setIsChecking(false);
    toast("กำลังหยุดการตรวจสอบ", { icon: "⛔" });
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
    toast.success("ล้างประวัติเรียบร้อย");
  };

  const handleExportExcel = () => {
    if (companies.length === 0) {
      toast.error("ไม่มีข้อมูลสำหรับ Export");
      return;
    }

    exportCompaniesToExcel(companies);
    toast.success("Export Excel สำเร็จ");
  };

  const handleExportCSV = () => {
    if (companies.length === 0) {
      toast.error("ไม่มีข้อมูลสำหรับ Export");
      return;
    }

    exportCompaniesToCSV(companies);
    toast.success("Export CSV สำเร็จ");
  };

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      const keyword = searchText.toLowerCase().trim();

      const matchSearch =
        String(company.name || "").toLowerCase().includes(keyword) ||
        String(company.juristicId || "").includes(keyword);

      const matchStatus =
        statusFilter === "all" || company.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [companies, searchText, statusFilter]);

  const totalPages = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE) || 1;

  const currentCompanies = filteredCompanies.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const total = companies.length;
  const pending = companies.filter((c) => c.status === "รอตรวจสอบ").length;
  const active = companies.filter(
    (c) => c.status === "ดำเนินกิจการ" || c.status === "ยังดำเนินกิจการ"
  ).length;
  const closed = companies.filter((c) => c.status === "เลิกกิจการ").length;
  const notFound = companies.filter(
    (c) => c.status === "ไม่พบข้อมูล" || c.status === "ตรวจสอบไม่พบ"
  ).length;

  const latestHistory = history[0];

  return (
    <div className="app-shell">
      <Header
        onImportExcel={handleImportExcel}
        onExportExcel={handleExportExcel}
        onExportCSV={handleExportCSV}
      />

      <div className="main-layout">
        <aside className="left-panel">
          <section className="side-card">
            <div className="side-card-title">
              <h3>1. รายชื่อบริษัทหลัก</h3>
            </div>

            <label className="radio-row">
              <input
                type="radio"
                name="inputMode"
                checked={inputMode === "juristicId"}
                onChange={() => {
                  setInputMode("juristicId");
                  setCompanyText(
                    companies
                      .map((company) => company.juristicId || company.name)
                      .join("\n")
                  );
                }}
              />
              ตรวจจากเลขนิติบุคคล
            </label>

            <label className="radio-row">
              <input
                type="radio"
                name="inputMode"
                checked={inputMode === "companyName"}
                onChange={() => {
                  setInputMode("companyName");
                  setCompanyText(
                    companies
                      .map((company) => company.name || company.juristicId)
                      .join("\n")
                  );
                }}
              />
              ตรวจจากชื่อบริษัท
            </label>

            <textarea
              className="company-textarea"
              value={companyText}
              onChange={(event) => setCompanyText(event.target.value)}
              placeholder={
                inputMode === "juristicId"
                  ? "วางเลขนิติบุคคล 1 บรรทัด = 1 บริษัท"
                  : "วางชื่อบริษัท 1 บรรทัด = 1 บริษัท"
              }
            />

            <div className="side-card-footer">
              <span>
                {
                  companyText
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean).length
                }{" "}
                / 2,000 บริษัท
              </span>

              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  setCompanyText("");
                  setCompanies([]);
                  setCheckedCount(0);
                  setCurrentPage(1);
                  toast.success("ล้างข้อมูลเรียบร้อย");
                }}
                disabled={isChecking}
              >
                ล้างข้อมูล
              </button>
            </div>

            <button
              type="button"
              className="check-button"
              onClick={handleBatchCheck}
              disabled={isChecking || companyText.trim() === ""}
            >
              {isChecking
                ? `กำลังตรวจสอบ ${checkedCount.toLocaleString()} / ${companies.length.toLocaleString()}`
                : "🔍 ตรวจสอบสถานะทั้งหมด"}
            </button>

            {isChecking && (
              <button
                type="button"
                className="ghost-button"
                onClick={handleStopChecking}
                style={{ marginTop: "10px", width: "100%" }}
              >
                ⛔ หยุดตรวจสอบ
              </button>
            )}
          </section>

          <section className="side-card">
            <div className="side-card-title">
              <h3>2. ประวัติการตรวจสอบ</h3>
            </div>

            <div className="history-item">
              <div>
                <p>รอบล่าสุด</p>
                <span>
                  {latestHistory
                    ? `${latestHistory.total.toLocaleString()} บริษัท`
                    : `${checkedCount.toLocaleString()} บริษัท`}
                </span>
              </div>
              <b>{isChecking ? "กำลังตรวจ" : "พร้อมใช้งาน"}</b>
            </div>

            {latestHistory && (
              <div className="history-item">
                <div>
                  <p>{latestHistory.checkedAt}</p>
                  <span>
                    ใช้เวลา {latestHistory.durationSeconds.toLocaleString()} วินาที
                  </span>
                </div>
                <b>{latestHistory.isStopped ? "หยุดกลางทาง" : "สำเร็จ"}</b>
              </div>
            )}

            <button
              type="button"
              className="history-button"
              onClick={() => setShowHistory((prev) => !prev)}
            >
              {showHistory ? "ซ่อนประวัติ" : "ดูประวัติทั้งหมด"}
            </button>

            {showHistory && (
              <div style={{ marginTop: "12px" }}>
                {history.length === 0 ? (
                  <p style={{ color: "#64748b", fontSize: "13px" }}>
                    ยังไม่มีประวัติการตรวจสอบ
                  </p>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="history-item">
                      <div>
                        <p>{item.checkedAt}</p>
                        <span>
                          {item.total} บริษัท | พบ {item.active} | เลิก{" "}
                          {item.closed} | ไม่พบ {item.notFound}
                        </span>
                      </div>
                      <b>{item.durationSeconds}s</b>
                    </div>
                  ))
                )}

                {history.length > 0 && (
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={handleClearHistory}
                    style={{ marginTop: "10px", width: "100%" }}
                  >
                    ล้างประวัติ
                  </button>
                )}
              </div>
            )}
          </section>
        </aside>

        <main className="result-panel">
          <div className="section-title">
            <h2>📋 ผลการตรวจสอบ</h2>
          </div>

          <div className="summary-grid">
            <SummaryCard label="ทั้งหมด" value={total} />
            <SummaryCard label="รอตรวจสอบ" value={pending} />
            <SummaryCard label="ดำเนินกิจการ" value={active} />
            <SummaryCard label="เลิกกิจการ" value={closed} />
            <SummaryCard label="ไม่พบข้อมูล" value={notFound} />
          </div>

          <ProgressBar current={checkedCount} total={companies.length} />

          <FilterBar
            searchText={searchText}
            setSearchText={setSearchText}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />

          <CompanyTable companies={currentCompanies} />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />

          {!isChecking && checkedCount > 0 && (
            <div className="success-box">
              ✅ ตรวจสอบเสร็จสิ้น {checkedCount.toLocaleString()} บริษัท
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;