import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const getTodayText = () => {
  return new Date().toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getStatusStyle = (status) => {
  if (status === "ยังดำเนินกิจการ") {
    return {
      fill: "D1FAE5",
      font: "047857",
    };
  }

  if (status === "เลิกกิจการ") {
    return {
      fill: "FEE2E2",
      font: "B91C1C",
    };
  }

  if (status === "ตรวจสอบไม่พบ") {
    return {
      fill: "E5E7EB",
      font: "374151",
    };
  }

  return {
    fill: "FEF3C7",
    font: "92400E",
  };
};

export const exportCompaniesToExcel = async (companies) => {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "DBD Company Checker";
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet("Summary");
  const detailSheet = workbook.addWorksheet("Company Detail");

  const total = companies.length;
  const active = companies.filter((c) => c.status === "ยังดำเนินกิจการ").length;
  const closed = companies.filter((c) => c.status === "เลิกกิจการ").length;
  const notFound = companies.filter((c) => c.status === "ตรวจสอบไม่พบ").length;
  const pending = companies.filter((c) => c.status === "รอตรวจสอบ").length;

  // =====================
  // Sheet 1: Summary
  // =====================
  summarySheet.mergeCells("A1:F1");
  summarySheet.getCell("A1").value = "DBD COMPANY STATUS REPORT";
  summarySheet.getCell("A1").font = {
    size: 20,
    bold: true,
    color: { argb: "FFFFFF" },
  };
  summarySheet.getCell("A1").alignment = {
    horizontal: "center",
    vertical: "middle",
  };
  summarySheet.getCell("A1").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "1D4ED8" },
  };

  summarySheet.mergeCells("A2:F2");
  summarySheet.getCell("A2").value = `วันที่ออกรายงาน: ${getTodayText()}`;
  summarySheet.getCell("A2").alignment = { horizontal: "center" };
  summarySheet.getCell("A2").font = {
    size: 12,
    color: { argb: "374151" },
  };

  const summaryData = [
    ["ทั้งหมด", total, "1D4ED8"],
    ["รอตรวจสอบ", pending, "F59E0B"],
    ["ดำเนินกิจการ", active, "10B981"],
    ["เลิกกิจการ", closed, "EF4444"],
    ["ไม่พบข้อมูล", notFound, "6B7280"],
  ];

  let startRow = 4;

  summaryData.forEach(([label, value, color], index) => {
    const row = startRow + index * 2;

    summarySheet.mergeCells(`A${row}:B${row + 1}`);
    summarySheet.mergeCells(`C${row}:F${row + 1}`);

    summarySheet.getCell(`A${row}`).value = label;
    summarySheet.getCell(`C${row}`).value = value;

    summarySheet.getCell(`A${row}`).font = {
      bold: true,
      size: 13,
      color: { argb: "FFFFFF" },
    };

    summarySheet.getCell(`C${row}`).font = {
      bold: true,
      size: 22,
      color: { argb: color },
    };

    summarySheet.getCell(`A${row}`).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: color },
    };

    summarySheet.getCell(`A${row}`).alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    summarySheet.getCell(`C${row}`).alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    for (let col = 1; col <= 6; col += 1) {
      summarySheet.getCell(row, col).border = {
        top: { style: "thin", color: { argb: "D1D5DB" } },
        left: { style: "thin", color: { argb: "D1D5DB" } },
        bottom: { style: "thin", color: { argb: "D1D5DB" } },
        right: { style: "thin", color: { argb: "D1D5DB" } },
      };
    }
  });

  summarySheet.columns = [
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
  ];

  summarySheet.views = [{ showGridLines: false }];

  // =====================
  // Sheet 2: Detail
  // =====================
  detailSheet.columns = [
    { header: "ลำดับ", key: "no", width: 10 },
    { header: "ชื่อบริษัท", key: "name", width: 45 },
    { header: "เลขนิติบุคคล", key: "juristicId", width: 22 },
    { header: "สถานะ", key: "status", width: 22 },
    { header: "ข้อมูล Update วันที่", key: "updatedAt", width: 22 },
  ];

  detailSheet.getRow(1).height = 28;

  detailSheet.getRow(1).eachCell((cell) => {
    cell.font = {
      bold: true,
      color: { argb: "FFFFFF" },
    };

    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "1D4ED8" },
    };

    cell.border = {
      top: { style: "thin", color: { argb: "CBD5E1" } },
      left: { style: "thin", color: { argb: "CBD5E1" } },
      bottom: { style: "thin", color: { argb: "CBD5E1" } },
      right: { style: "thin", color: { argb: "CBD5E1" } },
    };
  });

  companies.forEach((company, index) => {
    const row = detailSheet.addRow({
      no: index + 1,
      name: company.name || "-",
      juristicId: company.juristicId || "-",
      status: company.status || "-",
      updatedAt: company.updatedAt || "-",
    });

    row.height = 24;

    row.eachCell((cell) => {
      cell.alignment = {
        vertical: "middle",
      };

      cell.border = {
        top: { style: "thin", color: { argb: "E5E7EB" } },
        left: { style: "thin", color: { argb: "E5E7EB" } },
        bottom: { style: "thin", color: { argb: "E5E7EB" } },
        right: { style: "thin", color: { argb: "E5E7EB" } },
      };
    });

    if (index % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "F8FAFC" },
        };
      });
    }

    const statusCell = row.getCell("status");
    const statusStyle = getStatusStyle(company.status);

    statusCell.font = {
      bold: true,
      color: { argb: statusStyle.font },
    };

    statusCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: statusStyle.fill },
    };

    statusCell.alignment = {
      horizontal: "center",
      vertical: "middle",
    };
  });

  detailSheet.autoFilter = {
    from: "A1",
    to: "E1",
  };

  detailSheet.views = [
    {
      state: "frozen",
      ySplit: 1,
      showGridLines: false,
    },
  ];

  const buffer = await workbook.xlsx.writeBuffer();

  const fileName = `DBD_Company_Status_Report_${new Date()
    .toISOString()
    .slice(0, 10)}.xlsx`;

  saveAs(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    fileName
  );
};

export const exportCompaniesToCSV = (companies) => {
  const headers = [
    "ลำดับ",
    "ชื่อบริษัท",
    "เลขนิติบุคคล",
    "สถานะ",
    "ข้อมูล Update วันที่",
  ];

  const rows = companies.map((company, index) => [
    index + 1,
    company.name || "-",
    company.juristicId || "-",
    company.status || "-",
    company.updatedAt || "-",
  ]);

  const csvContent = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  saveAs(blob, `DBD_Company_Status_Report_${new Date().toISOString().slice(0, 10)}.csv`);
};