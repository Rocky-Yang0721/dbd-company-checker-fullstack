# DBD Company Checker

DBD Company Checker is a full-stack web application designed to help users manage and verify company information efficiently.

The application supports company management, dashboard summaries, authentication, bulk Excel uploads, multiple-company checking, and Excel export.

## Live Demo

Frontend:

https://dbd-company-checker-fullstack.vercel.app

Backend API:

https://dbd-company-checker-api.onrender.com

## Project Overview

Normally, checking company registration information manually requires searching for one company at a time. This process can be time-consuming when users need to check hundreds or thousands of companies.

DBD Company Checker was developed to simplify this workflow by allowing users to:

* Manage company information
* Search and filter company records
* Upload multiple companies from Excel
* Check multiple company records at once
* View dashboard summaries
* Export results to Excel

The current version retrieves company data from MongoDB. Integration with the official DBD API is planned for a future version.

## Main Features

### Authentication

* User registration
* User login
* User logout
* JWT authentication
* Protected routes

### Dashboard

* Total company count
* Active company count
* Pending company count
* Closed company count
* Not found company count
* Recent company table
* Refresh dashboard data

### Company Management

* Create company records
* View company records
* Update company records
* Delete company records
* Search by company name or juristic ID
* Filter by company status
* Basic pagination

### Bulk Company Search

* Upload Excel files
* Read company data from Excel
* Check multiple companies
* Display result summaries
* Export results to Excel
* Download Excel template
* Responsive interface

## Technology Stack

### Frontend

* React
* Vite
* Bootstrap 5
* Axios
* React Router
* XLSX

### Backend

* Node.js
* Express.js
* MongoDB Atlas
* Mongoose
* JSON Web Token
* bcrypt
* CORS
* dotenv

### Deployment

* Frontend: Vercel
* Backend: Render
* Database: MongoDB Atlas
* Source Control: GitHub

## Project Structure

```text
dbd-company-checker-fullstack
├── client
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   ├── services
│   │   ├── utils
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vercel.json
├── config
├── controllers
├── middleware
├── models
├── routes
├── server.js
├── package.json
└── README.md
```

## API Endpoints

### Authentication

| Method | Endpoint             | Description                       |
| ------ | -------------------- | --------------------------------- |
| POST   | `/api/auth/register` | Register a new user               |
| POST   | `/api/auth/login`    | Login and receive an access token |

### Companies

| Method | Endpoint             | Description         |
| ------ | -------------------- | ------------------- |
| GET    | `/api/companies`     | Get all companies   |
| GET    | `/api/companies/:id` | Get a company by ID |
| POST   | `/api/companies`     | Create a company    |
| PUT    | `/api/companies/:id` | Update a company    |
| DELETE | `/api/companies/:id` | Delete a company    |

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Rocky-Yang0721/dbd-company-checker-fullstack.git
```

### 2. Open the project folder

```bash
cd dbd-company-checker-fullstack
```

### 3. Install backend dependencies

```bash
npm install
```

### 4. Install frontend dependencies

```bash
cd client
npm install
```

## Environment Variables

Create a `.env` file in the backend project folder.

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Create a `.env` file inside the `client` folder.

```env
VITE_API_URL=http://localhost:5000/api
```

For production deployment:

```env
VITE_API_URL=https://dbd-company-checker-api.onrender.com/api
```

## Run the Project Locally

### Start the backend

From the main project folder:

```bash
npm run dev
```

The backend will run at:

```text
http://localhost:5000
```

### Start the frontend

Open another terminal and run:

```bash
cd client
npm run dev
```

The frontend will run at:

```text
http://localhost:5173
```

## Database Schema

The company collection contains the following fields:

```text
companyName
juristicId
status
updateDate
note
createdBy
```

## Future Improvements

* Connect to the official DBD API
* Add pie charts and bar charts
* Add company status trends
* Add import and export history
* Add search history
* Add progress indicators for bulk searches
* Support CSV and PDF exports
* Support juristic ID paste input
* Add Swagger API documentation
* Add automated testing
* Add Docker deployment
* Add GitHub Actions CI/CD

## Future DBD API Workflow

```text
Upload Excel
      ↓
Read company information
      ↓
Call DBD API
      ↓
Receive company status
      ↓
Display results
      ↓
Export Excel
```

## Author

Developed as a full-stack portfolio project using React, Node.js, Express, and MongoDB.

GitHub:

https://github.com/Rocky-Yang0721
