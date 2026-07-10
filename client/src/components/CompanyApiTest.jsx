import { useEffect, useState } from "react";
import {
  createCompany,
  deleteCompany,
  getCompanies,
} from "../services/companyService";

function CompanyApiTest() {
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadCompanies = async () => {
    try {
      setIsLoading(true);
      setMessage("");

      const result = await getCompanies();

      setCompanies(result.data || []);
    } catch (error) {
      console.error("Load companies error:", error);

      setMessage(
        error.response?.data?.message ||
          "ไม่สามารถโหลดข้อมูลบริษัทได้"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleAddTestCompany = async () => {
    try {
      setMessage("");

      const randomNumber = Date.now()
        .toString()
        .slice(-10)
        .padStart(10, "0");

      const juristicId = `010${randomNumber}`;

      await createCompany({
        companyName: "บริษัท ทดสอบจากหน้าเว็บ จำกัด",
        juristicId,
        status: "รอตรวจสอบ",
        note: "เพิ่มจาก React",
      });

      setMessage("เพิ่มบริษัทสำเร็จ");

      await loadCompanies();
    } catch (error) {
      console.error("Create company error:", error);

      setMessage(
        error.response?.data?.message ||
          "ไม่สามารถเพิ่มบริษัทได้"
      );
    }
  };

  const handleDeleteCompany = async (id) => {
    const confirmed = window.confirm(
      "ต้องการลบบริษัทนี้หรือไม่?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteCompany(id);

      setMessage("ลบบริษัทสำเร็จ");

      await loadCompanies();
    } catch (error) {
      console.error("Delete company error:", error);

      setMessage(
        error.response?.data?.message ||
          "ไม่สามารถลบบริษัทได้"
      );
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 className="mb-1">ทดสอบ Company API</h2>
          <p className="text-muted mb-0">
            ข้อมูลจาก MongoDB ผ่าน Express API
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleAddTestCompany}
        >
          เพิ่มบริษัททดสอบ
        </button>
      </div>

      {message && (
        <div className="alert alert-info">
          {message}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-5">
          กำลังโหลดข้อมูล...
        </div>
      ) : (
        <div className="card shadow-sm">
          <div className="card-body">
            <p>
              จำนวนบริษัททั้งหมด:{" "}
              <strong>{companies.length}</strong>
            </p>

            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
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
                      <td
                        colSpan="5"
                        className="text-center text-muted"
                      >
                        ยังไม่มีข้อมูลบริษัท
                      </td>
                    </tr>
                  ) : (
                    companies.map((company) => (
                      <tr key={company._id}>
                        <td>{company.companyName}</td>
                        <td>{company.juristicId}</td>
                        <td>{company.status}</td>
                        <td>{company.note || "-"}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() =>
                              handleDeleteCompany(company._id)
                            }
                          >
                            ลบ
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyApiTest;