function ProgressBar({ current = 0, total = 0 }) {
  const percent =
    total === 0 ? 0 : Math.min(100, Math.round((current / total) * 100));

  const statusText =
    total === 0
      ? "ยังไม่มีข้อมูล"
      : current === total
      ? "ตรวจสอบเสร็จสิ้น"
      : "กำลังตรวจสอบ...";

  return (
    <div className="progress-box">
      <div className="progress-top">
        <span>
          {statusText} ({current.toLocaleString()} / {total.toLocaleString()})
        </span>

        <strong>{percent}%</strong>
      </div>

      <div className="progress-track">
        <div
          className="progress-fill"
          style={{
            width: `${percent}%`,
          }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;