const express = require("express");
const { queryWithRetry } = require("../../dataBase/connection");
const { Project_Details, Tasks, DayReport, TaskReports, TaskReportsReview } = require("../../Models/DB_Collections");

const router = express.Router();

router.post("/checkEmployeeProgress", async (req, res) => {
  try {
    const { projectId, employeeId } = req.body;

    if (!projectId || !employeeId) {
      return res.status(400).json({
        success: false,
        message: "Project ID and Employee ID are required",
      });
    }

   const project = await Project_Details.findById(projectId).lean();

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const tasksWithEmployee = await Tasks.find({
      projectId: projectId,
      $or: [{ employee: employeeId }, { "activities.employee": employeeId }],
    }).lean();

    if (tasksWithEmployee.length === 0) {
      return res.status(200).json({
        success: true,
        canRemove: true,
        message: "Employee can be removed",
        projectName: project.projectName,
      });
    }

    let hasStartedWork = false;
    let startedWorkDetails = null;

    for (const task of tasksWithEmployee) {
      if (task.employee && task.employee.includes(employeeId)) {
        if (task.percentage > 0) {
          hasStartedWork = true;
          startedWorkDetails = {
            projectName: project.projectName,
            taskName: task.taskName,
            message: `Employee has started work on project: ${project.projectName} | task: ${task.taskName}`,
          };
          break;
        }
      }

      if (task.activities && task.activities.length > 0) {
        for (const activity of task.activities) {
          if (activity.employee === employeeId) {
            const activityPercentage = activity.percentage || 0;

            if (activityPercentage > 0) {
              hasStartedWork = true;
              startedWorkDetails = {
                projectName: project.projectName,
                taskName: task.taskName,
                activityName: activity.activityName,
                message: `Employee has started work on Project: ${project.projectName} | task: ${task.taskName} | Group task: ${activity.activityName}`,
              };
              break;
            }
          }
        }

        if (hasStartedWork) break;
      }
    }

    if (hasStartedWork) {
      return res.status(200).json({
        success: true,
        canRemove: false,
        justAssigned: false,
        message: startedWorkDetails.message,
        projectName: startedWorkDetails.projectName,
        taskName: startedWorkDetails.taskName,
        activityName: startedWorkDetails.activityName,
      });
    }

    const taskNames = tasksWithEmployee.map((t) => t.taskName).join(", ");

    return res.status(200).json({
      success: true,
      canRemove: true,
      justAssigned: true,
      message: `Employee has assigned tasks on project: ${project.projectName} | tasks: ${taskNames}`,
      projectName: project.projectName,
      taskName: taskNames,
    });
  } catch (err) {
    console.error("Error checking employee progress:", err);
    res.status(500).json({
      success: false,
      message: "Failed to check employee progress",
      ...(process.env.NODE_ENV === "development" && { details: err.message }),
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const projectData = req.body;

    if (!projectData.accessGrantedTo) {
      projectData.accessGrantedTo = [];
    }

    projectData.percentage = 0;
    projectData.status = "In Progress";
    projectData.employees = [];

    const newProject = new Project_Details(projectData);
    await newProject.save();

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: newProject,
    });
  } catch (err) {
    console.error("Error saving project:", err);
    res.status(500).json({
      success: false,
      message: "Failed to save project",
      error: err.message,
    });
  }
});

router.put("/updateEmployees", async (req, res) => {
  try {
    const { projectId, employees } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: "Bad Request",
        message: "Project ID is required",
      });
    }

    if (!employees || !Array.isArray(employees)) {
      return res.status(400).json({
        success: false,
        error: "Bad Request",
        message: "Employees array is required",
      });
    }

    const employeeIds = employees.map((emp) => emp.id);

    const updatedProject = await Project_Details.findByIdAndUpdate(
      projectId,
      {
        employees: employeeIds,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true },
    )
      .select("-__v")
      .lean();

    if (!updatedProject) {
      return res.status(404).json({
        success: false,
        error: "Not Found",
        message: "Project not found",
      });
    }

    const placeholders = employeeIds.map(() => "?").join(",");

    const populatedEmployeesQuery = `
        SELECT 
          employee_id AS id,
          employee_name AS name,
          profile_url AS profile,
          designation AS department
        FROM employees_details
        WHERE employee_id IN (${placeholders})
      `;
    const populatedEmployees = await queryWithRetry(
      populatedEmployeesQuery,
      employeeIds,
    );

    updatedProject.employees = populatedEmployees.map((emp) => ({
      id: emp._id,
      name: emp.employeeName,
      profile: emp.profile,
    }));

    res.status(200).json({
      success: true,
      message: "Employees updated successfully",
      data: updatedProject,
    });
  } catch (err) {
    console.error("Error updating employees:", err);

    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Bad Request",
        message: "Invalid project ID format",
      });
    }

    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "Failed to update employees",
      ...(process.env.NODE_ENV === "development" && { details: err.message }),
    });
  }
});

router.put("/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const updateData = req.body;

    const project = await Project_Details.findByIdAndUpdate(
      projectId,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: project,
    });
  } catch (err) {
    console.error("Error updating project:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update project",
      error: err.message,
    });
  }
});

router.get("/autocomplete/company", async (req, res) => {
  try {
    const companies = await Project_Details.distinct("companyName");

    res.status(200).json({
      success: true,
      data: companies.filter(Boolean),
    });
  } catch (error) {
    console.error("Error fetching company names:", error);
    res.status(500).json({ error: "Failed to fetch company names" });
  }
});

router.get("/autocomplete/category", async (req, res) => {
  try {
    const { search } = req.query;

    let query = {};
    if (search) {
      query = { category: { $regex: search, $options: "i" } };
    }

    const categories = await Project_Details.find(query).distinct("category");

    res.status(200).json({
      success: true,
      data: categories.filter(Boolean),
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.get("/departments", async (req, res) => {
  try {
    const query = `
      SELECT id, designation as name
      FROM designations 
      ORDER BY designation ASC
    `;
    const departments = await queryWithRetry(query);

    res.status(200).json({
      success: true,
      data: departments,
    });
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({ error: "Failed to fetch departments" });
  }
});

router.get("/teamHeads", async (req, res) => {
  try {
    const query = `
      SELECT 
        employee_id as id,
        employee_name as name,
        designation as department,
        profile_url as profile
      FROM employees_details 
      WHERE team_head = 1
      AND working_status = 'Active'
      ORDER BY employee_name ASC
    `;
    const teamHeads = await queryWithRetry(query);

    res.status(200).json({
      success: true,
      data: teamHeads,
    });
  } catch (error) {
    console.error("Error fetching team heads:", error);
    res.status(500).json({ error: "Failed to fetch team heads" });
  }
});

router.get("/employee-tasks/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required",
      });
    }

    const concurrentProjects = await Project_Details.find({
      status: { $nin: ["Hold", "Canceled"] },
    })
      .select("_id")
      .lean();

    const projectIds = concurrentProjects.map((p) => p._id);

    const tasks = await Tasks.find({
      projectId: { $in: projectIds },
      $or: [{ employee: employeeId }, { "activities.employee": employeeId }],
    })
      .sort({ createdAt: -1 })
      .lean();

    if (tasks.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: "No tasks found for this employee",
      });
    }

    const processedTasks = await Promise.all(
      tasks.map(async (task) => {
        const project = await Project_Details.findById(task.projectId)
          .select("clientId colorCode priority projectName")
          .lean();

        let projectDetails = { ...project };

        const isTaskAssigned = task.employee?.includes(employeeId);
        const taskPercentage = task.percentage || 0;

        let assignedActivities = [];
        if (task.activities?.length > 0) {
          assignedActivities = await Promise.all(
            task.activities
              .filter((activity) => activity.employee === employeeId)
              .map(async (activity) => {
                return {
                  ...activity,
                  isComplete: activity.percentage >= 100,
                };
              })
          );

          assignedActivities = assignedActivities.filter(
            (activity) => !activity.isComplete
          );
        }

        const shouldIncludeTask =
          (isTaskAssigned && taskPercentage < 100) ||
          assignedActivities.length > 0;

        if (!shouldIncludeTask) {
          return null;
        }

        return {
          taskId: task._id,
          taskName: task.taskName,
          taskDescription: task.description,
          taskPercentage: taskPercentage,
          taskStatus: task.status,
          taskBudget: task.budget,
          startDate: task.startDate,
          endDate: task.endDate,
          isTask: isTaskAssigned && taskPercentage < 100,
          project: {
            projectId: projectDetails._id,
            projectName: projectDetails.projectName,
            colorCode: projectDetails.colorCode,
            priority: projectDetails.priority,
          },
          activities: assignedActivities,
          activityCount: assignedActivities.length,
        };
      })
    );

    const filteredTasks = processedTasks.filter((task) => task !== null);

    res.status(200).json({
      success: true,
      count: filteredTasks.length,
      data: filteredTasks,
    });
  } catch (err) {
    console.error("Error fetching employee tasks:", err);

    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Bad Request",
        message: "Invalid employee ID format",
      });
    }

    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "Failed to fetch employee tasks",
      ...(process.env.NODE_ENV === "development" && { details: err.message }),
    });
  }
});


router.get("/employee-day-reports/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required",
      });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const dayReports = await DayReport.find({
      employeeID: employeeId,
      createdAt: {
        $gte: startOfToday,
        $lte: endOfToday,
      },
    }).lean();

    const todayItems = dayReports.map((report) => ({
      taskId: report.taskId,
      activityId: report.activityId,
      projectId: report.projectId,
    }));

    res.status(200).json({
      success: true,
      data: todayItems,
    });
  } catch (err) {
    console.error("Error fetching day reports:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch day reports",
      error: err.message,
    });
  }
});

router.get("/:projectId", async (req, res) => {
  try {
    let project = await Project_Details.findById(req.params.projectId)
      .select("-__v")
      .lean();

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Not Found",
        message: "Project not found",
      });
    }

    const originalEmployeeIds = project.employees ? [...project.employees] : [];

    let creator = null;
    if (project.employeeID) {
      const query = `
        SELECT 
          employee_id as id,
          employee_name as name,
          profile_url as profile,
          designation as department
        FROM employees_details 
        WHERE employee_id = ?
      `;
      const employees = await queryWithRetry(query, [project.employeeID]);
      if (employees.length > 0) {
        creator = employees[0];
        project.creator = creator;
      }
    }

    if (project.department && project.department.length > 0) {
      const deptPlaceholders = project.department.map(() => "?").join(",");
      const deptQuery = `
        SELECT id, designation as name
        FROM designations 
        WHERE id IN (${deptPlaceholders})
      `;
      const departments = await queryWithRetry(deptQuery, project.department);
      project.departmentDetails = departments;
    }

    if (!project.department || !project.department.length) {
      project.allEmployees = [];
    } else {
      const deptPlaceholders = project.department.map(() => "?").join(",");

      const employeesByDeptQuery = `
        SELECT 
          e.employee_id AS id,
          e.employee_name AS name,
          e.profile_url AS profile,
          d.designation AS department
        FROM employees_details e
        JOIN designations d 
          ON e.designation = d.designation
        WHERE d.id IN (${deptPlaceholders})
        AND e.working_status = 'Active'
      `;

      const allEmployees = await queryWithRetry(employeesByDeptQuery, project.department);

      if (allEmployees?.length > 0) {
        project.allEmployees = allEmployees.map((e) => ({
          id: e.id,
          name: e.name,
          profile: e.profile,
          department: e.department,
        }));
      }
    }

    if (originalEmployeeIds.length > 0 && project.allEmployees) {
      const enrichedEmployees = originalEmployeeIds
        .map((empId) =>
          project.allEmployees.find(
            (e) => e.id.toString() === empId.toString(),
          ),
        )
        .filter(Boolean);
      project.employees = enrichedEmployees;
    }

    const allProjectEmployeeIds = [];

    if (project.accessGrantedTo && project.accessGrantedTo.length > 0) {
      project.accessGrantedTo.forEach((item) => {
        if (item.employeeId) {
          allProjectEmployeeIds.push(item.employeeId);
        }
      });
    }

    if (originalEmployeeIds.length > 0) {
      originalEmployeeIds.forEach((empId) => {
        allProjectEmployeeIds.push(empId.toString());
      });
    }

    const uniqueProjectEmployeeIds = [...new Set(allProjectEmployeeIds)];

    if (uniqueProjectEmployeeIds.length > 0) {
      const placeholders = uniqueProjectEmployeeIds.map(() => "?").join(",");
      const teamHeadQuery = `
        SELECT 
          employee_id as id,
          employee_name as name,
          profile_url as profile,
          designation as department
        FROM employees_details 
        WHERE employee_id IN (${placeholders})
        AND team_head = 1
        AND working_status = 'Active'
      `;
      const teamHeadResult = await queryWithRetry(teamHeadQuery, uniqueProjectEmployeeIds);

      if (teamHeadResult.length > 0) {
        project.teamHead = teamHeadResult;
      } else {
        project.teamHead = creator;
      }
    } else {
      project.teamHead = creator;
    }

    const allTeamHeadsQuery = `
      SELECT 
        employee_id as id,
        employee_name as name,
        profile_url as profile,
        designation as department
      FROM employees_details 
      WHERE team_head = 1
      AND working_status = 'Active'
    `;
    const teamHeads = await queryWithRetry(allTeamHeadsQuery);
    project.teamHeads = teamHeads;

    const tasks = await Tasks.find({ projectId: req.params.projectId })
      .sort({ createdAt: -1 })
      .lean();

    if (tasks.length > 0) {
          const tasksWithAssignedBy = await Promise.all(
            tasks.map(async (task) => {
              let assignedBy = null;
    
             if (task.employeeID) {
                const empQuery = `
                  SELECT 
                    employee_id as id,
                    employee_name as name,
                    profile_url as profile
                  FROM employees_details 
                  WHERE employee_id = ?
                `;
                const empResult = await queryWithRetry(empQuery, [task.employeeID]);
                if (empResult.length > 0) {
                  assignedBy = empResult[0];
                }
              }
    
              let latestTaskReport = await TaskReportsReview.findOne({
                taskId: task._id,
                activityId: null,
                status: "underReview",
              })
                .sort({ createdAt: -1 })
                .select("createdAt status percentage budget")
                .lean();
    
              if (!latestTaskReport) {
                latestTaskReport = await TaskReports.findOne({
                  taskId: task._id,
                  activityId: null,
                })
                  .sort({ createdAt: -1 })
                  .select("createdAt status budget")
                  .lean();
              }
    
              if (latestTaskReport?.status === "underReview") {
                task.status = "underReview";
                task.percentage = latestTaskReport.percentage ?? task.percentage;
                
              }
    
              let activitiesWithReports = task.activities;
              if (task.activities?.length > 0) {
                activitiesWithReports = await Promise.all(
                  task.activities.map(async (activity) => {
                    let latestActivityReport = await TaskReportsReview.findOne({
                      taskId: task._id,
                      activityId: activity._id,
                      status: "underReview",
                    })
                      .sort({ createdAt: -1 })
                      .select("createdAt status percentage budget")
                      .lean();
    
                    if (!latestActivityReport) {
                      latestActivityReport = await TaskReports.findOne({
                        taskId: task._id,
                        activityId: activity._id,
                      })
                        .sort({ createdAt: -1 })
                        .select("createdAt status budget")
                        .lean();
                    }
    
                    if (latestActivityReport?.status === "underReview") {
                      activity.status = "underReview";
                      activity.percentage =
                        latestActivityReport.percentage ?? activity.percentage;
                    }
    
                    return {
                      ...activity,
                      latestReportDate: latestActivityReport?.createdAt || null,
                    };
                  })
                );
              }
    
              return {
                ...task,
                activities: activitiesWithReports,
                assigned_by: assignedBy,
                latestReportDate: latestTaskReport?.createdAt || null,
              };
            })
          );
    
          project.tasks = tasksWithAssignedBy;
        } else {
          project.tasks = null;
        }
    

    if (project.correctionDate && project.correctionDate.length > 0) {
      const projectTasks = await Tasks.find({ projectId: req.params.projectId })
        .select("createdAt")
        .lean();

      project.correctionDate = project.correctionDate.map((cd) => {
        let cdTime;
        try {
          if (cd.time) {
            const cdDateObj = new Date(cd.date);
            const datePart = cdDateObj.toISOString().split("T")[0];
            cdTime = new Date(`${datePart}T${cd.time}`).getTime();
          } else {
            cdTime = new Date(cd.date).getTime();
          }
        } catch (e) {
          cdTime = new Date(cd.date).getTime();
        }

        const hasNewTask = projectTasks.some(
          (task) => new Date(task.createdAt).getTime() > cdTime
        );

        return {
          ...cd,
          isDelete: !hasNewTask,
        };
      });
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (err) {
    console.error("Error fetching project:", err);

    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Bad Request",
        message: "Invalid project ID format",
      });
    }

    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "Failed to fetch project",
    });
  }
});


router.get("/", async (req, res) => {
  try {
    const search = req.query.search || "";
    const empID = req.query.empID || null;
    const role = req.query.role || null;

    let searchQuery = {};

    if (
      empID &&
      empID !== "null" &&
      empID !== "" &&
      !["Admin", "SBU", "Project Head"].includes(role)
    ) {
      searchQuery.$or = [
        { employeeID: empID },
        { employees: empID },
        { "accessGrantedTo.employeeId": empID },
      ];
    }

    let projects = await Project_Details.find(searchQuery)
      .sort({ createdAt: -1 })
      .select("-__v")
      .lean();

    if (!projects || projects.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: "No projects found",
      });
    }

    const employeeIds = [
      ...new Set(projects.map((p) => p.employeeID).filter(Boolean)),
    ];

    let employeeMap = {};
    if (employeeIds.length > 0) {
      const placeholders = employeeIds.map(() => "?").join(",");
      const query = `
        SELECT 
          employee_id as id,
          employee_name as name,
          profile_url as profile,
          designation as department
        FROM employees_details 
        WHERE employee_id IN (${placeholders})
      `;
      const employees = await queryWithRetry(query, employeeIds);
      employees.forEach((emp) => {
        employeeMap[emp.id] = emp;
      });
    }

    projects = projects.map((proj) => {
      if (proj.employeeID && employeeMap[proj.employeeID]) {
        proj.teamHead = employeeMap[proj.employeeID];
      } else {
        proj.teamHead = { id: null, name: "Unassigned", profile: null };
      }
      return proj;
    });

    if (search) {
      projects = projects.filter(
        (proj) =>
          proj.projectName?.toLowerCase().includes(search.toLowerCase()) ||
          proj.companyName?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "Failed to fetch projects",
    });
  }
});

router.delete("/removeEmployeeTasks", async (req, res) => {
  try {
    const { projectId, employeeId } = req.body;

    if (!projectId || !employeeId) {
      return res.status(400).json({
        success: false,
        message: "Project ID and Employee ID are required",
      });
    }

    const tasks = await Tasks.find({
      projectId: projectId,
      $or: [{ employee: employeeId }, { "activities.employee": employeeId }],
    });

    let deletedTasks = 0;
    let updatedTasks = 0;

    for (const task of tasks) {
      if (!task.activities || task.activities.length === 0) {
        if (task.employee && task.employee.includes(employeeId)) {
          await Tasks.findByIdAndDelete(task._id);
          await TaskReports.deleteMany({ taskId: task._id });
          deletedTasks++;
        }
      } else {
        const updatedActivities = task.activities.filter(
          (activity) => activity.employee !== employeeId
        );

        if (updatedActivities.length === 0) {
          await Tasks.findByIdAndDelete(task._id);
          await TaskReports.deleteMany({ taskId: task._id });
          deletedTasks++;
        } else {
          await Tasks.findByIdAndUpdate(task._id, {
            activities: updatedActivities,
            updatedAt: new Date(),
          });

          const removedActivityIds = task.activities
            .filter((activity) => activity.employee === employeeId)
            .map((activity) => activity._id);

          await TaskReports.deleteMany({
            taskId: task._id,
            activityId: { $in: removedActivityIds },
          });

          updatedTasks++;
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully removed employee tasks`,
      data: {
        deletedTasks,
        updatedTasks,
      },
    });
  } catch (err) {
    console.error("Error removing employee tasks:", err);
    res.status(500).json({
      success: false,
      message: "Failed to remove employee tasks",
      ...(process.env.NODE_ENV === "development" && { details: err.message }),
    });
  }
});

module.exports = router;
