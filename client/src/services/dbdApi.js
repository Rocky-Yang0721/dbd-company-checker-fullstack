const DBD_API_MODE = import.meta.env.VITE_DBD_API_MODE || "mock";

const DBD_BASE_URL =
  "https://api.egov.go.th/ws/dbd/juristic/v4/profile/information";

const CONSUMER_KEY = import.meta.env.VITE_EGOV_CONSUMER_KEY || "";
const TOKEN = import.meta.env.VITE_EGOV_TOKEN || "";

const mockDatabase = [
  {
    juristicId: "0105566000001",
    name: "บริษัท เอบีซี จำกัด",
    status: "ดำเนินกิจการ",
    updatedAt: "01/07/2569",
  },
  {
    juristicId: "0105566000002",
    name: "บริษัท พลังงานไทย จำกัด",
    status: "ดำเนินกิจการ",
    updatedAt: "01/07/2569",
  },
  {
    juristicId: "0105566000003",
    name: "บริษัท ตัวอย่าง เทรดดิ้ง จำกัด",
    status: "เลิกกิจการ",
    updatedAt: "15/06/2569",
  },
  {
    juristicId: "0105566000004",
    name: "บริษัท ซันไรส์ โซล่าร์ จำกัด",
    status: "ดำเนินกิจการ",
    updatedAt: "20/06/2569",
  },
];

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const normalizeText = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const normalizeJuristicId = (value) => {
  return normalizeText(value).replace(/\D/g, "");
};

const mapDbdStatus = (status) => {
  const text = normalizeText(status);

  if (!text) return "ไม่พบข้อมูล";

  if (
    text.includes("ยังดำเนินกิจการ") ||
    text.includes("ดำเนินกิจการ") ||
    text.includes("คงอยู่")
  ) {
    return "ดำเนินกิจการ";
  }

  if (
    text.includes("เลิก") ||
    text.includes("เสร็จการชำระบัญชี") ||
    text.includes("ล้มละลาย")
  ) {
    return "เลิกกิจการ";
  }

  return text;
};

const checkCompanyStatusMock = async (company) => {
  await sleep(300 + Math.random() * 500);

  const juristicId = normalizeJuristicId(company.juristicId);
  const name = normalizeText(company.name);

  const matchedCompany = mockDatabase.find((item) => {
    if (juristicId) return item.juristicId === juristicId;
    return item.name === name;
  });

  if (!matchedCompany) {
    return {
      ...company,
      juristicId,
      status: "ไม่พบข้อมูล",
      updatedAt: "-",
      error: "",
    };
  }

  return {
    ...company,
    name: matchedCompany.name,
    juristicId: matchedCompany.juristicId,
    status: matchedCompany.status,
    updatedAt: matchedCompany.updatedAt,
    error: "",
  };
};

const extractCompanyFromDbd = (data, fallbackCompany) => {
  const item =
    data?.ResultList?.[0] ||
    data?.resultList?.[0] ||
    data?.data?.[0] ||
    data?.result?.[0] ||
    data;

  const juristicId =
    item?.JuristicID ||
    item?.juristicID ||
    item?.JuristicId ||
    item?.juristicId ||
    fallbackCompany.juristicId ||
    "";

  const name =
    item?.JuristicName_TH ||
    item?.JuristicNameTH ||
    item?.juristicNameTH ||
    item?.JuristicName ||
    item?.juristicName ||
    fallbackCompany.name ||
    "";

  const status =
    item?.JuristicStatus ||
    item?.juristicStatus ||
    item?.Status ||
    item?.status ||
    "";

  const updatedAt =
    item?.UpdateDate ||
    item?.updateDate ||
    item?.LastUpdateDate ||
    item?.lastUpdateDate ||
    "-";

  if (!status && !name && !juristicId) {
    return {
      ...fallbackCompany,
      status: "ไม่พบข้อมูล",
      updatedAt: "-",
      error: "ไม่พบข้อมูลจาก DBD",
    };
  }

  return {
    ...fallbackCompany,
    name,
    juristicId,
    status: mapDbdStatus(status),
    updatedAt,
    error: "",
  };
};

const checkCompanyStatusReal = async (company) => {
  const juristicId = normalizeJuristicId(company.juristicId);

  if (!juristicId || juristicId.length !== 13) {
    return {
      ...company,
      juristicId,
      status: "ไม่พบข้อมูล",
      updatedAt: "-",
      error: "เลขนิติบุคคลต้องมี 13 หลัก",
    };
  }

  if (!CONSUMER_KEY || !TOKEN) {
    return {
      ...company,
      juristicId,
      status: "รอตรวจสอบ",
      updatedAt: "-",
      error: "ยังไม่ได้ตั้งค่า Consumer Key หรือ Token ในไฟล์ .env",
    };
  }

  try {
    const response = await fetch(
      `${DBD_BASE_URL}?JuristicID=${encodeURIComponent(juristicId)}`,
      {
        method: "GET",
        headers: {
          "Consumer-Key": CONSUMER_KEY,
          Token: TOKEN,
          Accept: "application/json",
        },
      }
    );

    const text = await response.text();

    if (!response.ok) {
      throw new Error(`DBD API Error ${response.status}: ${text}`);
    }

    const data = text ? JSON.parse(text) : null;

    return extractCompanyFromDbd(data, {
      ...company,
      juristicId,
    });
  } catch (error) {
    return {
      ...company,
      juristicId,
      status: "ไม่พบข้อมูล",
      updatedAt: "-",
      error: error.message || "เรียก DBD API ไม่สำเร็จ",
    };
  }
};

export const checkCompanyStatus = async (company) => {
  if (DBD_API_MODE === "real") {
    return checkCompanyStatusReal(company);
  }

  return checkCompanyStatusMock(company);
};