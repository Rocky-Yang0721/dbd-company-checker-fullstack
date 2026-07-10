const getStatusClassName = (status) => {
  if (status === "ดำเนินกิจการ" || status === "ยังดำเนินกิจการ") {
    return "status-badge status-active";
  }

  if (status === "เลิกกิจการ") {
    return "status-badge status-closed";
  }

  if (status === "ไม่พบข้อมูล" || status === "ตรวจสอบไม่พบ") {
    return "status-badge status-not-found";
  }

  if (status === "กำลังตรวจสอบ") {
    return "status-badge status-checking";
  }

  if (status === "รอตรวจสอบ") {
    return "status-badge status-pending";
  }

  return "status-badge status-default";
};

function CompanyTable({ companies }) {
  return (
    <div className="table-card">
      <table className="company-table">
        <thead>
          <tr>
            <th>ลำดับ</th>
            <th>ชื่อบริษัท</th>
            <th>เลขนิติบุคคล</th>
            <th>สถานะ</th>
            <th>Update Date</th>
          </tr>
        </thead>

        <tbody>
          {companies.length === 0 ? (
            <tr>
              <td colSpan="5" className="empty-cell">
                ไม่พบข้อมูล
              </td>
            </tr>
          ) : (
            companies.map((company, index) => (
              <tr key={company.id || `${company.juristicId}-${index}`}>
                <td>{company.id || index + 1}</td>
                <td>{company.name || "-"}</td>
                <td>{company.juristicId || "-"}</td>
                <td>
                  <span className={getStatusClassName(company.status)}>
                    {company.status || "รอตรวจสอบ"}
                  </span>
                </td>
                <td>{company.updatedAt || "-"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default CompanyTable;