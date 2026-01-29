const express = require("express");
const router = express.Router();
const db = require("../../dataBase/connection");

// POST - Submit a request/comment for a task
router.post("/", (req, res) => {
  console.log("POST /api/marketing/task-requests called");
  const { marketing_task_id, employee_id, employee_name, comment } = req.body;

  if (!marketing_task_id || !employee_id || !comment) {
    return res.status(400).json({
      status: false,
      message: "marketing_task_id, employee_id, and comment are required",
    });
  }

  const query = `
    INSERT INTO marketing_task_requests
      (marketing_task_id, employee_id, employee_name, comment, status, created_at)
    VALUES (?, ?, ?, ?, 'PENDING', NOW())
  `;

  const params = [marketing_task_id, employee_id, employee_name, comment];

  db.pool.query(query, params, (err, result) => {
    if (err) {
      console.error("Insert request error:", err);
      return res.status(500).json({
        status: false,
        message: "DB error",
        error: err.message,
      });
    }

    res.status(201).json({
      status: true,
      message: "Request submitted successfully",
      requestId: result.insertId,
    });
  });
});

// GET - Fetch requests for a specific task
router.get("/:taskId", (req, res) => {
  const { taskId } = req.params;

  const query = `
    SELECT 
      request_id,
      marketing_task_id,
      employee_id,
      employee_name,
      comment,
      manager_remarks,
      status,
      created_at
    FROM marketing_task_requests
    WHERE marketing_task_id = ?
    ORDER BY created_at DESC
  `;

  db.pool.query(query, [taskId], (err, results) => {
    if (err) {
      console.error("Fetch requests error:", err);
      return res.status(500).json({
        status: false,
        message: "DB error",
        error: err.message,
      });
    }

    res.json({
      status: true,
      requests: results || [],
    });
  });
});

// PUT - Approve or Reject request with remarks
router.put("/:request_id/respond", (req, res) => {
  const { request_id } = req.params;
  const { action, remarks } = req.body;

  if (!action || !remarks) {
    return res.status(400).json({
      status: false,
      message: "action and remarks are required",
    });
  }

  const status = action === 'APPROVE' ? 'RESOLVED' : 'REJECTED';

  const query = `
    UPDATE marketing_task_requests 
    SET status = ?, manager_remarks = ?, updated_at = NOW()
    WHERE request_id = ?
  `;

  db.pool.query(query, [status, remarks, request_id], (err, result) => {
    if (err) {
      console.error("Update request error:", err);
      return res.status(500).json({
        status: false,
        message: "DB error",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: false,
        message: "Request not found",
      });
    }

    res.json({
      status: true,
      message: "Request status updated successfully",
    });
  });
});

// PUT - Update request status (mark as viewed/resolved) - LEGACY
router.put("/:requestId", (req, res) => {
  const { requestId } = req.params;
  const { status } = req.body;

  const query = `
    UPDATE marketing_task_requests 
    SET status = ?, updated_at = NOW()
    WHERE request_id = ?
  `;

  db.pool.query(query, [status, requestId], (err, result) => {
    if (err) {
      console.error("Update request error:", err);
      return res.status(500).json({
        status: false,
        message: "DB error",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: false,
        message: "Request not found",
      });
    }

    res.json({
      status: true,
      message: "Request status updated",
    });
  });
});

module.exports = router;
