import * as XLSX from "xlsx";

const normalizeText = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const getValueByPossibleHeaders = (row, headers) => {
  for (const header of headers) {
    if (row[header] !== undefined && row[header] !== null) {
      return normalizeText(row[header]);
    }
  }

  return "";
};

export const readCompaniesFromExcel = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("ไม่พบไฟล์ Excel"));
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet);

        const companies = rows
          .map((row, index) => {
            const name = getValueByPossibleHeaders(row, [
              "ชื่อบริษัท",
              "บริษัท",
              "ชื่อนิติบุคคล",
              "Company Name",
              "companyName",
              "name",
            ]);

            const juristicId = getValueByPossibleHeaders(row, [
              "เลขนิติบุคคล",
              "เลขทะเบียนนิติบุคคล",
              "เลขทะเบียน",
              "Juristic ID",
              "JuristicID",
              "juristicId",
              "taxId",
            ]);

            return {
              id: index + 1,
              name,
              juristicId,
              status: "รอตรวจสอบ",
              updatedAt: "-",
            };
          })
          .filter((company) => company.name || company.juristicId);

        resolve(companies);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("อ่านไฟล์ Excel ไม่สำเร็จ"));
    };

    reader.readAsArrayBuffer(file);
  });
};