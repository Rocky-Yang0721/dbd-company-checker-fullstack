# DBD Company Checker Full-Stack

ระบบจัดการและตรวจสอบสถานะนิติบุคคล พัฒนาด้วย React, Node.js, Express และ MongoDB

โปรเจกต์นี้พัฒนาต่อยอดจาก Front-end Project เดิม โดยเพิ่มระบบ Backend, Database, Authentication และ CRUD ให้เป็น Full-Stack Application

---

## Features

- สมัครสมาชิก
- เข้าสู่ระบบ
- ออกจากระบบ
- JWT Authentication
- Protected Route
- เพิ่มข้อมูลบริษัท
- แสดงรายชื่อบริษัท
- แก้ไขข้อมูลบริษัท
- ลบข้อมูลบริษัท
- ค้นหาจากชื่อบริษัท
- ค้นหาจากเลขนิติบุคคล
- Filter ตามสถานะ
- Dashboard สรุปจำนวนบริษัท
- ผู้ใช้แต่ละคนเห็นเฉพาะข้อมูลของตัวเอง
- เชื่อมต่อ MongoDB Atlas
- REST API ด้วย Express.js

---

## Technology Stack

### Front-end

- React.js
- Vite
- React Router DOM
- Bootstrap
- Axios
- React Hot Toast
- ExcelJS
- File Saver
- XLSX
- Lucide React

### Back-end

- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Token
- bcryptjs
- CORS
- dotenv
- Nodemon

---

## Project Structure

```text
dbd-company-checker-fullstack
│
├── client
│   ├── public
│   ├── src
│   │   ├── assets
│   │   ├── components
│   │   ├── data
│   │   ├── pages
│   │   ├── services
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server
│   ├── config
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   └── server.js
│
└── README.md