const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const companyRoutes = require("./routes/companyRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

connectDB();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://dbd-company-checker-fullstack.vercel.app",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(
        new Error("Not allowed by CORS")
      );
    },
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message:
      "DBD Company Checker Backend is running",
  });
});

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message:
      "Backend และ MongoDB พร้อมใช้งาน",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);

app.use((error, req, res, next) => {
  if (error.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message:
        "โดเมนนี้ไม่ได้รับอนุญาตให้เรียกใช้งาน API",
    });
  }

  return next(error);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server is running on port ${PORT}`
  );
});