const express = require("express");
const router = express.Router();
const { queryWithRetry } = require("../../dataBase/connection");

// Get ALL tasks from all projects (for Manager/ViewTask component)
router.get("/all-tasks", async (req, res) => {
  try {
    const query = `
      SELECT 
        id as project_id,
        company_name,
        project_name,
        tasks,
        created_by
      FROM projects 
      WHERE active = 1 
      AND tasks IS NOT NULL
      ORDER BY created_at DESC
    `;

    const projects = await queryWithRetry(query);

    // Flatten all tasks
    const allTasks = [];
    projects.forEach((project) => {
      if (project.tasks) {
        const tasks = JSON.parse(project.tasks);

        tasks.forEach((task) => {
          allTasks.push({
            ...task,
            project_id: project.project_id,
            project_name: project.project_name,
            companyName: project.company_name,
            assignedBy: project.created_by, // ✅ Add assigned by from project
          });
        });
      }
    });

    // Sort by createdAt (newest first)
    allTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      data: allTasks,
    });
  } catch (error) {
    console.error("Error fetching all tasks:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch all tasks",
    });
  }
});

// Get tasks for logged-in employee (for Employee's My Tasks)
router.get("/my-tasks/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;

    const query = `
      SELECT 
        id as project_id,
        company_name,
        project_name,
        tasks,
        created_by
      FROM projects 
      WHERE active = 1 
      AND tasks IS NOT NULL
      ORDER BY created_at DESC
    `;

    const projects = await queryWithRetry(query);

    // Flatten all tasks and filter by employee ID
    const myTasks = [];
    projects.forEach((project) => {
      if (project.tasks) {
        const tasks = JSON.parse(project.tasks);
        // Filter tasks assigned to this employee
        const employeeTasks = tasks.filter(
          (task) => task.assignedTo?.employeeId === employeeId
        );

        employeeTasks.forEach((task) => {
          myTasks.push({
            ...task,
            project_id: project.project_id,
            project_name: project.project_name,
            companyName: project.company_name,
            assignedBy: project.created_by,
          });
        });
      }
    });

    // Sort by createdAt (newest first)
    myTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      data: myTasks,
    });
  } catch (error) {
    console.error("Error fetching my tasks:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch tasks",
    });
  }
});

// Update task (ALL fields - for editing from ViewTask)
router.put("/tasks/:projectId/:taskId", async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const {
      taskName,
      startDate,
      endDate,
      startTime,
      endTime,
      assignedTo,
      description,
      progress,
      status,
      workDone,
    } = req.body;

    console.log("📝 Updating task:", projectId, taskId, "body:", req.body);

    // Get current project data
    const projectQuery = `
      SELECT tasks, company_name, project_name 
      FROM projects 
      WHERE id = ? AND active = 1
    `;
    const projectResult = await queryWithRetry(projectQuery, [projectId]);

    if (projectResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    const project = projectResult[0];
    const tasks = project.tasks ? JSON.parse(project.tasks) : [];

    // Find and update the specific task
    const taskIndex = tasks.findIndex((task) => task.taskId === taskId);

    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    // Store old task data for comparison
    const oldTask = { ...tasks[taskIndex] };

    // Create history entry if progress or status changed
    const currentTask = tasks[taskIndex];
    const progressChanged =
      progress !== undefined && progress !== currentTask.progress;
    const statusChanged = status !== undefined && status !== currentTask.status;

    if (progressChanged || statusChanged) {
      if (!currentTask.history) {
        currentTask.history = [];
      }

      currentTask.history.push({
        timestamp: new Date().toISOString(),
        progress: progress !== undefined ? progress : currentTask.progress,
        status: status !== undefined ? status : currentTask.status,
        workDone: workDone || "",
        updatedBy:
          assignedTo?.employeeName ||
          currentTask.assignedTo?.employeeName ||
          "Unknown",
      });
    }

    // Update ALL task fields
    tasks[taskIndex] = {
      ...tasks[taskIndex],
      taskName: taskName !== undefined ? taskName : tasks[taskIndex].taskName,
      startDate:
        startDate !== undefined ? startDate : tasks[taskIndex].startDate,
      endDate: endDate !== undefined ? endDate : tasks[taskIndex].endDate,
      startTime:
        startTime !== undefined ? startTime : tasks[taskIndex].startTime,
      endTime: endTime !== undefined ? endTime : tasks[taskIndex].endTime,
      assignedTo:
        assignedTo !== undefined ? assignedTo : tasks[taskIndex].assignedTo,
      description:
        description !== undefined ? description : tasks[taskIndex].description,
      progress: progress !== undefined ? progress : tasks[taskIndex].progress,
      status: status !== undefined ? status : tasks[taskIndex].status,
      workDone: workDone !== undefined ? workDone : tasks[taskIndex].workDone,
      updatedAt: new Date().toISOString(),
      history: tasks[taskIndex].history,
    };

    console.log("✅ Task updated with history:", tasks[taskIndex]);

    // Update database FIRST
    const updateQuery = `
      UPDATE projects 
      SET tasks = ? 
      WHERE id = ? AND active = 1
    `;
    await queryWithRetry(updateQuery, [JSON.stringify(tasks), projectId]);
    console.log("💾 Task saved to database successfully");

    // ✅ NOTIFICATION PROCESS
    console.log("🔍 Starting notification process...");
    console.log("🔍 global.io exists?", !!global.io);
    console.log("🔍 global.connectedUsers exists?", !!global.connectedUsers);

    if (global.connectedUsers) {
      console.log(
        "🔍 Connected users:",
        Array.from(global.connectedUsers.entries())
      );
    }

    let notificationsSent = 0;
    let totalNotificationsToSend = 0;
    const notifiedEmployees = new Set(); // Track to avoid duplicate notifications

    try {
      const io = global.io;
      const connectedUsers = global.connectedUsers;

      // ✅ STEP 1: Get all Project Heads
      const projectHeadsQuery = `
        SELECT employee_id, employee_name, designation
        FROM employees_details 
        WHERE designation = 'Project Head' 
        AND working_status = 'Active'
      `;
      const projectHeads = await queryWithRetry(projectHeadsQuery);
      console.log(`📢 Found ${projectHeads.length} Project Head(s)`);

      // ✅ STEP 2: Get Team Heads for the assigned employee's designation
      let teamHeads = [];

      // Get the designation of the assigned employee
      const assignedEmployeeId =
        assignedTo?.employeeId || oldTask.assignedTo?.employeeId;

      if (assignedEmployeeId) {
        const assignedEmployeeQuery = `
          SELECT designation 
          FROM employees_details 
          WHERE employee_id = ? 
          AND working_status = 'Active'
        `;
        const assignedEmployeeResult = await queryWithRetry(
          assignedEmployeeQuery,
          [assignedEmployeeId]
        );

        if (assignedEmployeeResult.length > 0) {
          const assignedDesignation = assignedEmployeeResult[0].designation;
          console.log(
            `🎯 Assigned employee designation: ${assignedDesignation}`
          );

          // Get all Team Heads with the same designation
          const teamHeadsQuery = `
            SELECT employee_id, employee_name, designation
            FROM employees_details 
            WHERE designation = ? 
            AND team_head = 1 
            AND working_status = 'Active'
          `;
          teamHeads = await queryWithRetry(teamHeadsQuery, [
            assignedDesignation,
          ]);
          console.log(
            `👥 Found ${teamHeads.length} Team Head(s) for designation: ${assignedDesignation}`
          );
        }
      }

      // ✅ STEP 3: Combine both groups (avoid duplicates)
      const allRecipientsToNotify = [...projectHeads, ...teamHeads];
      totalNotificationsToSend = allRecipientsToNotify.length;

      console.log(`\n📊 Notification Recipients:`);
      console.log(`   Project Heads: ${projectHeads.length}`);
      console.log(`   Team Heads: ${teamHeads.length}`);
      console.log(`   Total Recipients: ${totalNotificationsToSend}`);

      if (allRecipientsToNotify.length === 0) {
        console.warn("⚠️ No recipients found for notifications");
      } else {
        // Send notification to each recipient
        for (const recipient of allRecipientsToNotify) {
          // Skip if already notified (in case someone is both Project Head and Team Head)
          if (notifiedEmployees.has(recipient.employee_id)) {
            console.log(
              `⏭️ Skipping duplicate notification for ${recipient.employee_name} (${recipient.employee_id})`
            );
            continue;
          }

          notifiedEmployees.add(recipient.employee_id);

          console.log(
            `\n🔔 Processing notification for: ${recipient.employee_name} (${recipient.employee_id}) - ${recipient.designation}`
          );

          const notificationData = {
            id: `task_updated_${taskId}_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            title: "Task Updated",
            type: "task_update",
            requestType: "task_edit",
            status: "info",
            data: {
              taskId: taskId,
              taskName: tasks[taskIndex].taskName,
              projectName: project.project_name,
              companyName: project.company_name,
              updatedBy:
                assignedTo?.employeeName ||
                oldTask.assignedTo?.employeeName ||
                "Unknown",
              updatedById:
                assignedTo?.employeeId ||
                oldTask.assignedTo?.employeeId ||
                "UNKNOWN",
              oldStatus: oldTask.status,
              newStatus: tasks[taskIndex].status,
              oldProgress: oldTask.progress,
              newProgress: tasks[taskIndex].progress,
              changes: {
                taskName:
                  taskName !== undefined && taskName !== oldTask.taskName,
                dates:
                  (startDate !== undefined &&
                    startDate !== oldTask.startDate) ||
                  (endDate !== undefined && endDate !== oldTask.endDate),
                status: statusChanged,
                progress: progressChanged,
              },
              type: "task",
            },
            timestamp: new Date().toISOString(),
            read: false,
          };

          console.log(
            `📦 Notification data:`,
            JSON.stringify(notificationData, null, 2)
          );

          // Save notification to database FIRST (always save)
          try {
            await queryWithRetry(
              `INSERT INTO user_notifications (employee_id, notification_id, notification_data, is_read, created_at)
               VALUES (?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE notification_data = VALUES(notification_data)`,
              [
                recipient.employee_id,
                notificationData.id,
                JSON.stringify(notificationData),
                0,
                notificationData.timestamp,
              ]
            );
            console.log(
              `✅ Notification saved to DB for: ${recipient.employee_name} (${recipient.employee_id})`
            );
          } catch (err) {
            console.error(
              `❌ Failed to save notification to DB for ${recipient.employee_id}:`,
              err
            );
          }

          // Try to send real-time notification if socket is available
          if (io && connectedUsers) {
            console.log(
              `🔍 Checking socket connection for ${recipient.employee_id}...`
            );
            const socketId = connectedUsers.get(recipient.employee_id);

            console.log(`🔍 Socket ID for ${recipient.employee_id}:`, socketId);

            if (socketId) {
              try {
                console.log(
                  `🚀 Attempting to emit 'task-updated-notification' to socket: ${socketId}`
                );

                io.to(socketId).emit(
                  "task-updated-notification",
                  notificationData
                );

                console.log(
                  `✅ Real-time notification sent to: ${recipient.employee_name} (${recipient.employee_id}) - ${recipient.designation} via socket: ${socketId}`
                );
                notificationsSent++;
              } catch (error) {
                console.error(
                  `❌ Failed to send real-time notification to ${recipient.employee_id}:`,
                  error
                );
              }
            } else {
              console.log(
                `⚠️ ${recipient.employee_name} (${recipient.employee_id}) is offline (not connected)`
              );
            }
          } else {
            console.warn("⚠️ Socket.IO or connectedUsers not available");
            console.warn("⚠️ io:", !!io, "connectedUsers:", !!connectedUsers);
          }
        }
      }
    } catch (notificationError) {
      console.error("❌ Error in notification process:", notificationError);
      console.error("❌ Stack trace:", notificationError.stack);
    }

    console.log(`\n📊 Notification Summary:`);
    console.log(`   Total Recipients: ${totalNotificationsToSend}`);
    console.log(`   Unique Recipients: ${notifiedEmployees.size}`);
    console.log(`   Notifications Sent (real-time): ${notificationsSent}`);
    console.log(`   Notifications Saved to DB: ${notifiedEmployees.size}`);

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: tasks[taskIndex],
      notificationsSent: notificationsSent,
      totalRecipients: notifiedEmployees.size,
    });
  } catch (error) {
    console.error("❌ Error updating task:", error);
    console.error("❌ Stack trace:", error.stack);
    res.status(500).json({
      success: false,
      error: "Failed to update task: " + error.message,
    });
  }
});

// Delete task
router.delete("/tasks/:projectId/:taskId", async (req, res) => {
  try {
    const { projectId, taskId } = req.params;

    console.log("🗑️ Deleting task:", { projectId, taskId });

    // Get current project data
    const projectQuery = `
      SELECT tasks 
      FROM projects 
      WHERE id = ? AND active = 1
    `;
    const projectResult = await queryWithRetry(projectQuery, [projectId]);

    if (projectResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    const project = projectResult[0];
    const tasks = project.tasks ? JSON.parse(project.tasks) : [];

    // Find task index
    const taskIndex = tasks.findIndex((task) => task.taskId === taskId);

    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    // Remove task from array
    tasks.splice(taskIndex, 1);

    console.log("✅ Task deleted, remaining tasks:", tasks.length);

    // Update database
    const updateQuery = `
      UPDATE projects 
      SET tasks = ?
      WHERE id = ? AND active = 1
    `;

    await queryWithRetry(updateQuery, [JSON.stringify(tasks), projectId]);

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting task:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete task: " + error.message,
    });
  }
});

// Update task hold status
router.put("/tasks/:projectId/:taskId/hold", async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const { isHold } = req.body;

    // Get current project data
    const projectQuery = `SELECT tasks FROM projects WHERE id = ? AND active = 1`;
    const projectResult = await queryWithRetry(projectQuery, [projectId]);

    if (projectResult.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Project not found" });
    }

    const project = projectResult[0];
    const tasks = project.tasks ? JSON.parse(project.tasks) : [];

    // Find and update the specific task
    const taskIndex = tasks.findIndex((task) => task.taskId === taskId);

    if (taskIndex === -1) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }

    // Update hold status
    tasks[taskIndex] = {
      ...tasks[taskIndex],
      isHold: isHold,
      updatedAt: new Date().toISOString(),
    };

    // Update database
    const updateQuery = `UPDATE projects SET tasks = ? WHERE id = ? AND active = 1`;
    await queryWithRetry(updateQuery, [JSON.stringify(tasks), projectId]);

    res.status(200).json({
      success: true,
      message: "Task hold status updated successfully",
      data: tasks[taskIndex],
    });
  } catch (error) {
    console.error("Error updating task hold status:", error);
    res.status(500).json({
      success: false,
      error: `Failed to update task hold status: ${error.message}`,
    });
  }
});

// Get all active tasks for employee
router.get("/active-tasks/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Get all active tasks from dayReport
    const dayReportQuery = `
      SELECT DISTINCT taskId, projectId 
      FROM dayReport 
      WHERE employeeID = ? 
      AND DATE(createdAt) = DATE(UTC_TIMESTAMP())
      ORDER BY createdAt DESC
    `;
    
    const dayReportResult = await queryWithRetry(dayReportQuery, [employeeId]);

    if (dayReportResult.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Group tasks by project
    const tasksByProject = {};
    const activeTasks = [];

    for (const report of dayReportResult) {
      const { taskId, projectId } = report;

      // Check if task is still "In Progress" in the projects table
      const projectQuery = `
        SELECT tasks 
        FROM projects 
        WHERE id = ? AND active = 1
      `;
      
      const projectResult = await queryWithRetry(projectQuery, [projectId]);

      if (projectResult.length === 0) {
        // Project not found, remove from dayReport
        await queryWithRetry(
          `DELETE FROM dayReport WHERE employeeID = ? AND taskId = ? AND DATE(createdAt) = CURDATE()`, 
          [employeeId, taskId]
        );
        continue;
      }

      const tasks = projectResult[0].tasks ? JSON.parse(projectResult[0].tasks) : [];
      const task = tasks.find(t => t.taskId === taskId);

      // Check if task exists and is still "In Progress"
      if (!task || task.status !== "In Progress") {
        // Task is completed or doesn't exist, remove from dayReport
        await queryWithRetry(
          `DELETE FROM dayReport WHERE employeeID = ? AND taskId = ? AND DATE(createdAt) = CURDATE()`, 
          [employeeId, taskId]
        );
        continue;
      }

      // Task is still in progress, add to active tasks
      activeTasks.push({
        taskId: taskId,
        projectId: projectId,
        status: task.status,
        progress: task.progress,
        taskName: task.taskName,
      });
    }

    res.status(200).json({
      success: true,
      data: activeTasks,
    });
  } catch (error) {
    console.error("Error fetching active tasks:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch active tasks",
    });
  }
});

// Get all today's started tasks (for ViewTask component)
router.get("/today-started-tasks", async (req, res) => {
  try {
    // Get all started tasks from dayReport for today
    const dayReportQuery = `
      SELECT DISTINCT taskId, projectId, employeeID, createdAt
      FROM dayReport 
      WHERE DATE(createdAt) = DATE(UTC_TIMESTAMP())
      ORDER BY createdAt DESC
    `;
    
    const dayReportResult = await queryWithRetry(dayReportQuery);

    if (dayReportResult.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Group tasks by project
    const tasksByProject = {};
    const startedTasks = [];

    for (const report of dayReportResult) {
      const { taskId, projectId, employeeID, createdAt } = report;

      if (!tasksByProject[projectId]) {
        // Fetch project details
        const projectQuery = `
          SELECT company_name, project_name, tasks 
          FROM projects 
          WHERE id = ? AND active = 1
        `;
        const projectResult = await queryWithRetry(projectQuery, [projectId]);

        if (projectResult.length === 0) continue;

        const project = projectResult[0];
        tasksByProject[projectId] = {
          companyName: project.company_name,
          project_name: project.project_name,
          tasks: project.tasks ? JSON.parse(project.tasks) : [],
        };
      }

      // Find the specific task
      const task = tasksByProject[projectId].tasks.find(t => t.taskId === taskId);
      if (task) {
        startedTasks.push({
          ...task,
          companyName: tasksByProject[projectId].companyName,
          project_name: tasksByProject[projectId].project_name,
          project_id: projectId,
          employeeID: employeeID,
          startedAt: createdAt,
        });
      }
    }

    res.status(200).json({
      success: true,
      data: startedTasks,
    });
  } catch (error) {
    console.error("Error fetching today's started tasks:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch today's started tasks",
    });
  }
});

// Start task (modified to allow multiple tasks)
router.post("/start-task", async (req, res) => {
  try {
    const { employeeID, projectId, taskId, activityId } = req.body;

    console.log("🚀 Starting task:", { employeeID, projectId, taskId, activityId });

    // Validate required fields
    if (!employeeID || !projectId || !taskId || !activityId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Check if task exists in project
    const projectQuery = `SELECT tasks FROM projects WHERE id = ? AND active = 1`;
    const projectResult = await queryWithRetry(projectQuery, [projectId]);

    if (projectResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    const project = projectResult[0];
    const tasks = project.tasks ? JSON.parse(project.tasks) : [];
    const taskExists = tasks.find((task) => task.taskId === taskId);

    if (!taskExists) {
      return res.status(404).json({
        success: false,
        error: "Task not found in project",
      });
    }

    // Check if task is already active for today
    const today = new Date().toISOString().split("T")[0];
    const checkExistingQuery = `
      SELECT * FROM dayReport 
      WHERE employeeID = ? 
      AND taskId = ?
      AND DATE(createdAt) = ?
      LIMIT 1
    `;
    const existingTask = await queryWithRetry(checkExistingQuery, [employeeID, taskId, today]);

    if (existingTask.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Task is already active",
      });
    }

    // Insert new record into dayReport
    const insertQuery = `
      INSERT INTO dayReport (employeeID, projectId, taskId, activityId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `;
    
    await queryWithRetry(insertQuery, [employeeID, projectId, taskId, activityId]);

    console.log("✅ Task started successfully");

    // Get count of active tasks
    const activeCountQuery = `
      SELECT COUNT(DISTINCT taskId) as activeCount 
      FROM dayReport 
      WHERE employeeID = ? 
      AND DATE(createdAt) = ?
    `;
    
    const countResult = await queryWithRetry(activeCountQuery, [employeeID, today]);

    res.status(200).json({
      success: true,
      message: "Task started successfully",
      data: {
        employeeID,
        projectId,
        taskId,
        activityId,
        activeTaskCount: countResult[0]?.activeCount || 1,
      },
    });
  } catch (error) {
    console.error("❌ Error starting task:", error);
    res.status(500).json({
      success: false,
      error: "Failed to start task: " + error.message,
    });
  }
});

// Remove specific active task
router.post("/remove-active-task", async (req, res) => {
  try {
    const { employeeID, taskId } = req.body;

    console.log("🛑 Removing active task:", { employeeID, taskId });

    // Validate required fields
    if (!employeeID || !taskId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Get today's date
    const today = new Date().toISOString().split("T")[0];

    // Delete the specific task entry from dayReport
    const deleteQuery = `
      DELETE FROM dayReport 
      WHERE employeeID = ? 
      AND taskId = ? 
      AND DATE(createdAt) = ?
    `;
    
    const result = await queryWithRetry(deleteQuery, [employeeID, taskId, today]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: "Task not found or already removed",
      });
    }

    console.log("✅ Active task removed successfully");

    // Get remaining active tasks count
    const remainingCountQuery = `
      SELECT COUNT(DISTINCT taskId) as activeCount 
      FROM dayReport 
      WHERE employeeID = ? 
      AND DATE(createdAt) = ?
    `;
    
    const countResult = await queryWithRetry(remainingCountQuery, [employeeID, today]);

    res.status(200).json({
      success: true,
      message: "Active task removed successfully",
      data: {
        employeeID,
        taskId,
        rowsAffected: result.affectedRows,
        remainingActiveTasks: countResult[0]?.activeCount || 0,
      },
    });
  } catch (error) {
    console.error("❌ Error removing active task:", error);
    res.status(500).json({
      success: false,
      error: "Failed to remove active task: " + error.message,
    });
  }
});

module.exports = router;
