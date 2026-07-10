const express = require("express");

const {
  getCompanies,
  getSearchHistory,
  getCompanyById,
  createCompany,
  importCompanies,
  bulkSearchCompanies,
  updateCompany,
  deleteCompany,
} = require("../controllers/companyController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

/*
|--------------------------------------------------------------------------
| Search History
|--------------------------------------------------------------------------
*/
router.get("/history", getSearchHistory);

/*
|--------------------------------------------------------------------------
| Import Excel
|--------------------------------------------------------------------------
*/
router.post("/import", importCompanies);

/*
|--------------------------------------------------------------------------
| Bulk Search
|--------------------------------------------------------------------------
*/
router.post("/bulk-search", bulkSearchCompanies);

/*
|--------------------------------------------------------------------------
| CRUD
|--------------------------------------------------------------------------
*/

router
  .route("/")
  .get(getCompanies)
  .post(createCompany);

router
  .route("/:id")
  .get(getCompanyById)
  .put(updateCompany)
  .delete(deleteCompany);

module.exports = router;