const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "กรุณาระบุชื่อผู้ใช้งาน"],
      trim: true,
      maxlength: [100, "ชื่อต้องไม่เกิน 100 ตัวอักษร"],
    },

    email: {
      type: String,
      required: [true, "กรุณาระบุอีเมล"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\S+@\S+\.\S+$/,
        "รูปแบบอีเมลไม่ถูกต้อง",
      ],
    },

    password: {
      type: String,
      required: [true, "กรุณาระบุรหัสผ่าน"],
      minlength: [6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"],
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  {
    timestamps: true,
  }
);

// เข้ารหัส Password ก่อนบันทึกลง MongoDB
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// ตรวจสอบ Password ตอน Login
userSchema.methods.comparePassword = async function (
  enteredPassword
) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;