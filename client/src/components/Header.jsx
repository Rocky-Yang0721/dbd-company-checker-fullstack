function Header({
  onImportExcel,
  onExportExcel,
  onExportCSV,
}) {
  return (
    <header className="header">
      <div>
        <h1>DBD Company Checker</h1>
        <p>Batch DBD Status Checker</p>
      </div>

      <div className="header-actions">
        <label className="primary-button">
          📥 Import Excel
          <input
            type="file"
            accept=".xlsx,.xls"
            hidden
            onChange={onImportExcel}
          />
        </label>

        <button
          className="secondary-button"
          onClick={onExportExcel}
        >
          📊 Export Excel
        </button>

        <button
          className="secondary-button"
          onClick={onExportCSV}
        >
          📄 Export CSV
        </button>
      </div>
    </header>
  );
}

export default Header;