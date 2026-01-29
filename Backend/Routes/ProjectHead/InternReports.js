const express = require("express");
const router = express.Router();
const { queryWithRetry } = require("../../dataBase/connection");

router.get("/all-reports", async (req, res) => {
  try {
    const { limit = 1000, employee_id, start_date, end_date } = req.query;

    let query = `
      SELECT 
        COALESCE(idr.id, '-') AS id,
        att.employee_id,
        COALESCE(att.employee_name, '-') AS employee_name,
        att.login_date AS report_date,
        COALESCE(idr.project_name, '-') AS intern_project_name,
        att.total_hours AS hours,
        COALESCE(idr.work_done, '-') AS intern_work_done,
        COALESCE(idr.section, '-') AS section,
        COALESCE(idr.created_at, '-') AS created_at,
        COALESCE(idr.updated_at, '-') AS updated_at,
        att.morning_in,
        att.morning_out,
        att.afternoon_in,
        att.afternoon_out,
        dr.id AS day_report_id,
        dr.taskId AS day_report_task_id,
        dr.projectId AS day_report_project_id,
        dr.activityId AS day_report_activity_id,
        dr.createdAt AS day_report_created_at,
        p.id AS project_id,
        p.project_name AS task_project_name,
        p.company_name AS task_company_name,
        p.tasks AS project_tasks
      FROM attendance att
      LEFT JOIN intern_dailyreport idr
        ON idr.employee_id = att.employee_id
        AND idr.report_date = att.login_date
      LEFT JOIN dayReport dr
        ON dr.employeeID = att.employee_id
        AND DATE(dr.createdAt) = att.login_date
      LEFT JOIN projects p
        ON p.id = dr.projectId
        AND p.active = 1
      WHERE 1=1
    `;

    const params = [];

    // Filter on att.employee_id (LEFT table)
    if (employee_id && employee_id !== "all") {
      query += ` AND att.employee_id = ?`;
      params.push(employee_id);
    }

    // Filter on att.login_date (LEFT table)
    if (start_date) {
      query += ` AND att.login_date >= ?`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND att.login_date <= ?`;
      params.push(end_date);
    }

    query += ` ORDER BY att.login_date DESC, idr.created_at DESC LIMIT ?`;
    params.push(parseInt(limit));

    console.log(`Query here: ${query}`);

    const reports = await queryWithRetry(query, params);

    // ✅ Process reports to extract task workDone from JSON
    const processedReports = reports.map((report) => {
      let taskInfo = null;
      let taskWorkDone = "-";
      let taskName = "-";
      let taskStatus = "-";
      let taskProgress = 0;
      let todayWorkHistory = [];

      // Check if we have dayReport and project tasks data
      if (report.day_report_task_id && report.project_tasks) {
        try {
          const tasks = JSON.parse(report.project_tasks);
          
          // Find the matching task by taskId
          const matchingTask = tasks.find(
            (task) => task.taskId === report.day_report_task_id
          );

          if (matchingTask) {
            taskInfo = {
              taskId: matchingTask.taskId,
              taskName: matchingTask.taskName,
              companyName: matchingTask.companyName,
              status: matchingTask.status,
              progress: matchingTask.progress,
              description: matchingTask.description,
              startDate: matchingTask.startDate,
              endDate: matchingTask.endDate,
              isHold: matchingTask.isHold,
            };

            taskName = matchingTask.taskName || "-";
            taskStatus = matchingTask.status || "-";
            taskProgress = matchingTask.progress || 0;

            // Get the report date for comparison
            const reportDate = new Date(report.report_date);
            const reportDateStr = reportDate.toISOString().split("T")[0]; // YYYY-MM-DD

            // ✅ Filter history entries for the same date
            if (matchingTask.history && Array.isArray(matchingTask.history)) {
              todayWorkHistory = matchingTask.history.filter((historyEntry) => {
                if (!historyEntry.timestamp) return false;
                const historyDate = new Date(historyEntry.timestamp);
                const historyDateStr = historyDate.toISOString().split("T")[0];
                return historyDateStr === reportDateStr;
              });

              // ✅ Get the latest workDone from today's history
              if (todayWorkHistory.length > 0) {
                // Sort by timestamp descending to get the latest
                todayWorkHistory.sort(
                  (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
                );
                taskWorkDone = todayWorkHistory[0].workDone || "-";
              } else {
                // If no history for today, check if task was created today
                if (matchingTask.createdAt) {
                  const createdDate = new Date(matchingTask.createdAt);
                  const createdDateStr = createdDate.toISOString().split("T")[0];
                  if (createdDateStr === reportDateStr) {
                    taskWorkDone = matchingTask.workDone || "-";
                  }
                }
              }
            } else {
              // No history, use main workDone if dates match
              if (matchingTask.createdAt) {
                const createdDate = new Date(matchingTask.createdAt);
                const createdDateStr = createdDate.toISOString().split("T")[0];
                if (createdDateStr === reportDateStr) {
                  taskWorkDone = matchingTask.workDone || "-";
                }
              }
            }
          }
        } catch (parseError) {
          console.error("Error parsing project tasks JSON:", parseError);
        }
      }

      // ✅ Combine intern work_done and task work_done
      const combinedWorkDone = [];
      if (report.intern_work_done && report.intern_work_done !== "-") {
        combinedWorkDone.push(report.intern_work_done);
      }
      if (taskWorkDone && taskWorkDone !== "-") {
        combinedWorkDone.push(taskWorkDone);
      }

      return {
        id: report.id,
        employee_id: report.employee_id,
        employee_name: report.employee_name,
        report_date: report.report_date,
        hours: report.hours,
        morning_in: report.morning_in,
        morning_out: report.morning_out,
        afternoon_in: report.afternoon_in,
        afternoon_out: report.afternoon_out,
        section: report.section,
        created_at: report.created_at,
        updated_at: report.updated_at,
        
        // ✅ Intern Daily Report Data
        intern_project_name: report.intern_project_name,
        intern_work_done: report.intern_work_done,
        
        // ✅ Task Data from dayReport
        has_day_report: !!report.day_report_task_id,
        day_report_id: report.day_report_id || null,
        task_project_id: report.day_report_project_id || null,
        task_project_name: report.task_project_name || "-",
        task_company_name: report.task_company_name || "-",
        task_id: report.day_report_task_id || null,
        task_name: taskName,
        task_status: taskStatus,
        task_progress: taskProgress,
        task_work_done: taskWorkDone,
        task_info: taskInfo,
        today_work_history: todayWorkHistory,
        
        // ✅ Combined fields for easy display
        project_name: report.task_project_name || report.intern_project_name || "-",
        work_done: combinedWorkDone.length > 0 ? combinedWorkDone.join(" | ") : "-",
        
        // ✅ All work done entries for detailed view
        all_work_entries: {
          intern: report.intern_work_done !== "-" ? report.intern_work_done : null,
          task: taskWorkDone !== "-" ? taskWorkDone : null,
          task_history: todayWorkHistory.map(h => ({
            time: h.timestamp,
            workDone: h.workDone,
            progress: h.progress,
            status: h.status
          }))
        }
      };
    });

    res.json({
      success: true,
      count: processedReports.length,
      reports: processedReports,
    });
  } catch (error) {
    console.error("Get all intern reports error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching intern reports",
      error: error.message,
    });
  }
});

// ✅ GET - Intern reports by specific employee (with attendance)

router.get("/reports/:employee_id", async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { limit = 100 } = req.query;

    const query = `
      SELECT 
        idr.id,
        idr.employee_id,
        idr.employee_name,
        idr.report_date,
        idr.project_name,
        idr.hours,
        idr.work_done,
        idr.section,
        idr.created_at,
        idr.updated_at,
        att.morning_in as time_in,
        COALESCE(att.afternoon_out, att.morning_out) as time_out
      FROM intern_dailyreport idr
      LEFT JOIN attendance att 
        ON idr.employee_id = att.employee_id 
        AND idr.report_date = att.login_date
      WHERE idr.employee_id = ?
      ORDER BY idr.report_date DESC, idr.created_at DESC
      LIMIT ?
    `;

    const reports = await queryWithRetry(query, [employee_id, parseInt(limit)]);

    res.json({
      success: true,
      count: reports.length,
      reports: reports,
    });
  } catch (error) {
    console.error("Get intern reports by employee error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching intern reports",
      error: error.message,
    });
  }
});

// ✅ GET - Intern reports by date range (with attendance) - CORRECTED
router.get("/reports-by-date", async (req, res) => {
  try {
    const { start_date, end_date, employee_id } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "start_date and end_date are required",
      });
    }

    let query = `
      SELECT 
        COALESCE(idr.id, '-') AS id,
        att.employee_id,
        COALESCE(att.employee_name, '-') AS employee_name,
        att.login_date AS report_date,
        COALESCE(idr.project_name, '-') AS project_name,
        att.total_hours AS hours,
        COALESCE(idr.work_done, '-') AS work_done,
        COALESCE(idr.section, '-') AS section,
        COALESCE(idr.created_at, '-') AS created_at,
        COALESCE(idr.updated_at, '-') AS updated_at,
        att.morning_in,
        att.morning_out,
        att.afternoon_in,
        att.afternoon_out
      FROM attendance att
      LEFT JOIN intern_dailyreport idr
        ON idr.employee_id = att.employee_id 
        AND idr.report_date = att.login_date
      WHERE att.login_date BETWEEN ? AND ?
    `;

    const params = [start_date, end_date];

    if (employee_id && employee_id !== "all") {
      query += ` AND att.employee_id = ?`;
      params.push(employee_id);
    }

    query += ` ORDER BY att.login_date DESC, idr.created_at DESC`;

    const reports = await queryWithRetry(query, params);

    res.json({
      success: true,
      count: reports.length,
      reports: reports,
    });
  } catch (error) {
    console.error("Get intern reports by date error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching intern reports by date",
      error: error.message,
    });
  }
});

// ✅ GET - Statistics/Summary
router.get("/statistics", async (req, res) => {
  try {
    const { employee_id, month, year } = req.query;

    let query = `
      SELECT 
        COUNT(*) as total_reports,
        SUM(hours) as total_hours,
        COUNT(DISTINCT employee_id) as total_employees,
        COUNT(DISTINCT project_name) as total_projects
      FROM intern_dailyreport
      WHERE 1=1
    `;

    const params = [];

    if (employee_id && employee_id !== "all") {
      query += ` AND employee_id = ?`;
      params.push(employee_id);
    }

    if (month && year) {
      query += ` AND MONTH(report_date) = ? AND YEAR(report_date) = ?`;
      params.push(parseInt(month), parseInt(year));
    }

    const stats = await queryWithRetry(query, params);

    res.json({
      success: true,
      statistics: stats[0],
    });
  } catch (error) {
    console.error("Get statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching statistics",
      error: error.message,
    });
  }
});

module.exports = router;