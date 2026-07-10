const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, "กรุณาระบุชื่อบริษัท"],
      trim: true,
    },

    juristicId: {
      type: String,
      required: [true, "กรุณาระบุเลขนิติบุคคล"],
      trim: true,
      minlength: [13, "เลขนิติบุคคลต้องมี 13 หลัก"],
      maxlength: [13, "เลขนิติบุคคลต้องมี 13 หลัก"],
    },

    status: {
      type: String,
      enum: [
        "รอตรวจสอบ",
        "ยังดำเนินกิจการ",
        "เลิกกิจการ",
        "ไม่พบข้อมูล",
      ],
      default: "รอตรวจสอบ",
    },

    updateDate: {
      type: Date,
      default: Date.now,
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

companySchema.index(
  {
    juristicId: 1,
    createdBy: 1,
  },
  {
    unique: true,
  }
);

const Company = mongoose.model(
  "Company",
  companySchema
);

module.exports = Company;