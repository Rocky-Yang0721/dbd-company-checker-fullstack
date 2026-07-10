function FilterBar({ searchText, setSearchText, statusFilter, setStatusFilter }) {
  return (
    <div className="filter-bar">
      <input
        className="search-input"
        type="text"
        placeholder="ค้นหาชื่อบริษัท หรือเลขนิติบุคคล"
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
      />

      <select
        className="status-select"
        value={statusFilter}
        onChange={(event) => setStatusFilter(event.target.value)}
      >
        <option value="all">สถานะทั้งหมด</option>
        <option value="ยังดำเนินกิจการ">ยังดำเนินกิจการ</option>
        <option value="เลิกกิจการ">เลิกกิจการ</option>
        <option value="ตรวจสอบไม่พบ">ตรวจสอบไม่พบ</option>
      </select>
    </div>
  );
}

export default FilterBar;