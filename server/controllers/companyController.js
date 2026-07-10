const Company = require("../models/Company");
const SearchHistory = require("../models/SearchHistory");

const ALLOWED_STATUSES = [
  "รอตรวจสอบ",
  "ยังดำเนินกิจการ",
  "เลิกกิจการ",
  "ไม่พบข้อมูล",
];

const STATUS_MAP = {
  // ภาษาอังกฤษ
  active: "ยังดำเนินกิจการ",
  pending: "รอตรวจสอบ",
  closed: "เลิกกิจการ",
  "not found": "ไม่พบข้อมูล",
  notfound: "ไม่พบข้อมูล",

  // ภาษาไทย
  "ยังดำเนินกิจการ": "ยังดำเนินกิจการ",
  "รอตรวจสอบ": "รอตรวจสอบ",
  "เลิกกิจการ": "เลิกกิจการ",
  "ไม่พบข้อมูล": "ไม่พบข้อมูล",
};

const normalizeCompanyItem = (item = {}, index = 0) => {
  const companyName = String(
    item.companyName ||
      item["ชื่อบริษัท"] ||
      item["บริษัท"] ||
      item["Company Name"] ||
      ""
  ).trim();

  const juristicId = String(
    item.juristicId ||
      item["เลขนิติบุคคล"] ||
      item["เลขทะเบียนนิติบุคคล"] ||
      item["Juristic ID"] ||
      ""
  )
    .trim()
    .replace(/\D/g, "");

  const rawStatus = String(
    item.status ||
      item["สถานะ"] ||
      "รอตรวจสอบ"
  )
    .trim()
    .toLowerCase();

  const mappedStatus =
    STATUS_MAP[rawStatus] || "รอตรวจสอบ";

  const status = ALLOWED_STATUSES.includes(mappedStatus)
    ? mappedStatus
    : "รอตรวจสอบ";

  const note = String(
    item.note ||
      item["หมายเหตุ"] ||
      ""
  ).trim();

  return {
    rowNumber: index + 1,
    companyName,
    juristicId,
    status,
    note,
  };
};

const createHistory = async ({
  userId,
  actionType,
  fileName = "",
  totalItems = 0,
  foundItems = 0,
  notFoundItems = 0,
  importedItems = 0,
  updatedItems = 0,
  skippedItems = 0,
  status = "COMPLETED",
  message = "",
}) => {
  try {
    await SearchHistory.create({
      actionType,
      fileName,
      totalItems,
      foundItems,
      notFoundItems,
      importedItems,
      updatedItems,
      skippedItems,
      status,
      message,
      createdBy: userId,
    });
  } catch (error) {
    console.error("Create search history error:", error);
  }
};

// GET /api/companies
const getCompanies = async (req, res) => {
  try {
    const { search, status } = req.query;

    const filter = {
      createdBy: req.user.id,
    };

    if (search?.trim()) {
      filter.$or = [
        {
          companyName: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          juristicId: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    if (status && status !== "ทั้งหมด") {
      filter.status = status;
    }

    const companies = await Company.find(filter).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: companies.length,
      data: companies,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "ไม่สามารถอ่านข้อมูลบริษัทได้",
      error: error.message,
    });
  }
};

// GET /api/companies/history
const getSearchHistory = async (req, res) => {
  try {
    const requestedLimit = Number(req.query.limit) || 10;
    const limit = Math.min(
      Math.max(requestedLimit, 1),
      50
    );

    const history = await SearchHistory.find({
      createdBy: req.user.id,
    })
      .sort({
        createdAt: -1,
      })
      .limit(limit);

    return res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "ไม่สามารถอ่านประวัติการทำงานได้",
      error: error.message,
    });
  }
};

// GET /api/companies/:id
const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลบริษัท",
      });
    }

    return res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "ไม่สามารถอ่านข้อมูลบริษัทได้",
      error: error.message,
    });
  }
};

// POST /api/companies
const createCompany = async (req, res) => {
  try {
    const normalizedCompany =
      normalizeCompanyItem(req.body);

    if (!normalizedCompany.companyName) {
      return res.status(400).json({
        success: false,
        message: "กรุณาระบุชื่อบริษัท",
      });
    }

    if (
      !/^\d{13}$/.test(normalizedCompany.juristicId)
    ) {
      return res.status(400).json({
        success: false,
        message: "เลขนิติบุคคลต้องเป็นตัวเลข 13 หลัก",
      });
    }

    const existingCompany = await Company.findOne({
      juristicId: normalizedCompany.juristicId,
      createdBy: req.user.id,
    });

    if (existingCompany) {
      return res.status(409).json({
        success: false,
        message: "เลขนิติบุคคลนี้มีอยู่ในระบบแล้ว",
      });
    }

    const company = await Company.create({
      companyName: normalizedCompany.companyName,
      juristicId: normalizedCompany.juristicId,
      status: normalizedCompany.status,
      updateDate: req.body.updateDate || new Date(),
      note: normalizedCompany.note,
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "เพิ่มบริษัทสำเร็จ",
      data: company,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "ไม่สามารถเพิ่มบริษัทได้",
      error: error.message,
    });
  }
};

// POST /api/companies/import
const importCompanies = async (req, res) => {
  const {
    companies,
    fileName = "",
  } = req.body;

  if (
    !Array.isArray(companies) ||
    companies.length === 0
  ) {
    return res.status(400).json({
      success: false,
      message: "ไม่พบข้อมูลบริษัทสำหรับนำเข้า",
    });
  }

  if (companies.length > 5000) {
    return res.status(400).json({
      success: false,
      message: "นำเข้าได้สูงสุดครั้งละ 5,000 รายการ",
    });
  }

  try {
    const normalizedCompanies = companies.map(
      (item, index) =>
        normalizeCompanyItem(item, index)
    );

    const validCompanies = [];
    const errors = [];

    normalizedCompanies.forEach((item, index) => {
      if (!item.companyName) {
        errors.push({
          row: index + 2,
          companyName: "",
          message: "ไม่พบชื่อบริษัท",
        });

        return;
      }

      if (!/^\d{13}$/.test(item.juristicId)) {
        errors.push({
          row: index + 2,
          companyName: item.companyName,
          message: "เลขนิติบุคคลต้องเป็นตัวเลข 13 หลัก",
        });

        return;
      }

      validCompanies.push(item);
    });

    const juristicIds = validCompanies.map(
      (item) => item.juristicId
    );

    const existingCompanies = await Company.find({
      createdBy: req.user.id,
      juristicId: {
        $in: juristicIds,
      },
    });

    const existingCompanyMap = new Map();

    existingCompanies.forEach((company) => {
      existingCompanyMap.set(
        company.juristicId,
        company
      );
    });

    const bulkOperations = [];
    let importedCount = 0;
    let updatedCount = 0;

    validCompanies.forEach((item) => {
      const existingCompany =
        existingCompanyMap.get(item.juristicId);

      if (existingCompany) {
        updatedCount += 1;
      } else {
        importedCount += 1;
      }

      bulkOperations.push({
        updateOne: {
          filter: {
            juristicId: item.juristicId,
            createdBy: req.user.id,
          },
          update: {
            $set: {
              companyName: item.companyName,
              status: item.status,
              note:
                item.note ||
                "นำเข้าจากไฟล์ Excel",
              updateDate: new Date(),
            },
            $setOnInsert: {
              juristicId: item.juristicId,
              createdBy: req.user.id,
            },
          },
          upsert: true,
        },
      });
    });

    if (bulkOperations.length > 0) {
      await Company.bulkWrite(bulkOperations, {
        ordered: false,
      });
    }

    const skippedCount = errors.length;

    await createHistory({
      userId: req.user.id,
      actionType: "IMPORT",
      fileName,
      totalItems: companies.length,
      importedItems: importedCount,
      updatedItems: updatedCount,
      skippedItems: skippedCount,
      status: "COMPLETED",
      message: `เพิ่มใหม่ ${importedCount} รายการ อัปเดต ${updatedCount} รายการ ข้าม ${skippedCount} รายการ`,
    });

    return res.status(200).json({
      success: true,
      message: "นำเข้าข้อมูลบริษัทเรียบร้อยแล้ว",
      data: {
        total: companies.length,
        imported: importedCount,
        updated: updatedCount,
        skipped: skippedCount,
        errors,
      },
    });
  } catch (error) {
    await createHistory({
      userId: req.user.id,
      actionType: "IMPORT",
      fileName,
      totalItems: companies.length,
      status: "FAILED",
      message: error.message,
    });

    return res.status(500).json({
      success: false,
      message: "ไม่สามารถนำเข้าข้อมูลบริษัทได้",
      error: error.message,
    });
  }
};

// POST /api/companies/bulk-search
const bulkSearchCompanies = async (req, res) => {
  const {
    companies,
    fileName = "",
    searchType = "BULK_SEARCH",
  } = req.body;

  if (
    !Array.isArray(companies) ||
    companies.length === 0
  ) {
    return res.status(400).json({
      success: false,
      message: "ไม่พบข้อมูลบริษัทสำหรับตรวจสอบ",
    });
  }

  if (companies.length > 5000) {
    return res.status(400).json({
      success: false,
      message: "ตรวจสอบได้สูงสุดครั้งละ 5,000 รายการ",
    });
  }

  try {
    const normalizedCompanies = companies.map(
      (item, index) =>
        normalizeCompanyItem(item, index)
    );

    const validJuristicIds = [
      ...new Set(
        normalizedCompanies
          .map((item) => item.juristicId)
          .filter((juristicId) =>
            /^\d{13}$/.test(juristicId)
          )
      ),
    ];

    const existingCompanies = await Company.find({
      createdBy: req.user.id,
      juristicId: {
        $in: validJuristicIds,
      },
    });

    const companyMap = new Map();

    existingCompanies.forEach((company) => {
      companyMap.set(
        company.juristicId,
        company
      );
    });

    let foundItems = 0;
    let notFoundItems = 0;

    const results = normalizedCompanies.map(
      (item) => {
        if (
          !/^\d{13}$/.test(item.juristicId)
        ) {
          notFoundItems += 1;

          return {
            rowNumber: item.rowNumber,
            companyName:
              item.companyName || "-",
            juristicId:
              item.juristicId || "-",
            status: "ไม่พบข้อมูล",
            updateDate: null,
            note: "เลขนิติบุคคลไม่ถูกต้อง",
            source: "Validation",
            found: false,
          };
        }

        const matchedCompany =
          companyMap.get(item.juristicId);

        if (!matchedCompany) {
          notFoundItems += 1;

          return {
            rowNumber: item.rowNumber,
            companyName:
              item.companyName || "-",
            juristicId: item.juristicId,
            status: "ไม่พบข้อมูล",
            updateDate: null,
            note: "ไม่พบข้อมูลในฐานข้อมูล Demo",
            source: "Demo Database",
            found: false,
          };
        }

        foundItems += 1;

        return {
          rowNumber: item.rowNumber,
          companyName:
            matchedCompany.companyName,
          juristicId:
            matchedCompany.juristicId,
          status: matchedCompany.status,
          updateDate:
            matchedCompany.updateDate,
          note: matchedCompany.note || "",
          source: "Demo Database",
          found: true,
        };
      }
    );

    const historyActionType =
      searchType === "PASTE_SEARCH"
        ? "PASTE_SEARCH"
        : "BULK_SEARCH";

    await createHistory({
      userId: req.user.id,
      actionType: historyActionType,
      fileName,
      totalItems: results.length,
      foundItems,
      notFoundItems,
      status: "COMPLETED",
      message: `พบข้อมูล ${foundItems} รายการ ไม่พบข้อมูล ${notFoundItems} รายการ`,
    });

    return res.status(200).json({
      success: true,
      count: results.length,
      foundCount: foundItems,
      notFoundCount: notFoundItems,
      data: results,
    });
  } catch (error) {
    await createHistory({
      userId: req.user.id,
      actionType:
        searchType === "PASTE_SEARCH"
          ? "PASTE_SEARCH"
          : "BULK_SEARCH",
      fileName,
      totalItems: companies.length,
      status: "FAILED",
      message: error.message,
    });

    return res.status(500).json({
      success: false,
      message:
        "ไม่สามารถตรวจสอบข้อมูลแบบหลายบริษัทได้",
      error: error.message,
    });
  }
};

// PUT /api/companies/:id
const updateCompany = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
    };

    if (updateData.juristicId) {
      updateData.juristicId = String(
        updateData.juristicId
      )
        .trim()
        .replace(/\D/g, "");

      if (
        !/^\d{13}$/.test(updateData.juristicId)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "เลขนิติบุคคลต้องเป็นตัวเลข 13 หลัก",
        });
      }
    }

    if (updateData.status) {
      const rawStatus = String(
        updateData.status
      )
        .trim()
        .toLowerCase();

      updateData.status =
        STATUS_MAP[rawStatus] ||
        "รอตรวจสอบ";
    }

    updateData.updateDate = new Date();

    const company =
      await Company.findOneAndUpdate(
        {
          _id: req.params.id,
          createdBy: req.user.id,
        },
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลบริษัท",
      });
    }

    return res.status(200).json({
      success: true,
      message: "แก้ไขข้อมูลบริษัทสำเร็จ",
      data: company,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "เลขนิติบุคคลนี้มีอยู่ในระบบแล้ว",
      });
    }

    return res.status(400).json({
      success: false,
      message: "ไม่สามารถแก้ไขข้อมูลบริษัทได้",
      error: error.message,
    });
  }
};

// DELETE /api/companies/:id
const deleteCompany = async (req, res) => {
  try {
    const company =
      await Company.findOneAndDelete({
        _id: req.params.id,
        createdBy: req.user.id,
      });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลบริษัท",
      });
    }

    return res.status(200).json({
      success: true,
      message: "ลบข้อมูลบริษัทสำเร็จ",
      data: company,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "ไม่สามารถลบข้อมูลบริษัทได้",
      error: error.message,
    });
  }
};

module.exports = {
  getCompanies,
  getSearchHistory,
  getCompanyById,
  createCompany,
  importCompanies,
  bulkSearchCompanies,
  updateCompany,
  deleteCompany,
};