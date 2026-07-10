const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const companyRoutes = require("./routes/companyRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

connectDB();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
    ],
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "DBD Company Checker Backend is running",
  });
});

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Backend และ MongoDB พร้อมใช้งาน",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server is running on http://localhost:${PORT}`
  );
});