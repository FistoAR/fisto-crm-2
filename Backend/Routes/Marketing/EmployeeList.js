// Routes/Marketing/EmployeeList.js
const express = require("express");
const router = express.Router();
const db = require("../../dataBase/connection");

// Digital Marketing and Digital Marketing & HR designations
router.get("/", (req, res) => {
  console.log("GET /api/marketing/employees-list called");

  const query = `
    SELECT employee_id, employee_name, designation
    FROM employees_details
    WHERE working_status = 'Active'
      AND (designation = 'Digital Marketing' OR designation = 'Digital Marketing & HR')
    ORDER BY employee_name ASC
  `;

  db.pool.query(query, (err, results) => {
    if (err) {
      console.error("Employees list error:", err);
      return res.status(500).json({
        status: false,
        message: "DB error",
        error: err.message,
      });
    }

    res.json({
      status: true,
      employees: results, 
    });
  });
});

module.exports = router;
