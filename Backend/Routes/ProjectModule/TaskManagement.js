const express = require("express");
const router = express.Router();
const {
  Tasks,
  Project_Details,
} = require("../../Models/DB_Collections");

function isTimeOverlapping(startA, endA, startB, endB) {
  return new Date(startA) < new Date(endB) && new Date(endA) > new Date(startB);
}

const checkInternalActivityConflicts = (activities) => {
  const conflicts = [];

  for (let i = 0; i < activities.length; i++) {
    const activity1 = activities[i];

    if (!activity1.employee || !activity1.startDate || !activity1.endDate) {
      continue;
    }

    const start1Time = activity1.startTime || "09:30";
    const end1Time = activity1.endTime || "18:30";
    const start1 = `${activity1.startDate}T${start1Time}`;
    const end1 = `${activity1.endDate}T${end1Time}`;

    for (let j = i + 1; j < activities.length; j++) {
      const activity2 = activities[j];

      if (!activity2.employee || !activity2.startDate || !activity2.endDate) {
        continue;
      }

      if (activity1.employee === activity2.employee) {
        const start2Time = activity2.startTime || "09:30";
        const end2Time = activity2.endTime || "18:30";
        const start2 = `${activity2.startDate}T${start2Time}`;
        const end2 = `${activity2.endDate}T${end2Time}`;

        if (isTimeOverlapping(start1, end1, start2, end2)) {
          conflicts.push({
            activity1Index: i,
            activity2Index: j,
            activity1Name: activity1.activityName || `Activity ${i + 1}`,
            activity2Name: activity2.activityName || `Activity ${j + 1}`,
            employeeId: activity1.employee,
          });
        }
      }
    }
  }

  return conflicts;
};

const calculateTaskPercentage = (activities) => {
  if (!activities || activities.length === 0) {
    return 0;
  }

  const totalPercentage = activities.reduce((sum, activity) => {
    return sum + (activity.percentage || 0);
  }, 0);

  return Math.round(totalPercentage / activities.length);
};

const updateProjectPercentage = async (projectId) => {
  try {
    const allTasks = await Tasks.find({ projectId }).lean();

    if (!allTasks || allTasks.length === 0) {
      await Project_Details.findByIdAndUpdate(projectId, { percentage: 0 });
      return;
    }

    const totalPercentage = allTasks.reduce((sum, task) => {
      return sum + (task.percentage || 0);
    }, 0);

    const projectPercentage = Math.round(totalPercentage / allTasks.length);

    await Project_Details.findByIdAndUpdate(projectId, {
      percentage: projectPercentage,
    });

    return projectPercentage;
  } catch (error) {
    console.error("Error updating project percentage:", error);
    throw error;
  }
};

router.post("/check-availability", async (req, res) => {
  try {
    const {
      employeeId,
      startDate,
      startTime,
      endDate,
      endTime,
      isActivityReport,
      excludeId,
      projectId,
      projectType,
    } = req.body;

    if (!employeeId || !startDate || !endDate) {
      return res.status(400).json({
        available: true,
        conflicts: [],
        message: "Missing required parameters",
      });
    }

    const requestStart = startTime
      ? `${startDate}T${startTime}`
      : `${startDate}T09:30`;
    const requestEnd = endTime ? `${endDate}T${endTime}` : `${endDate}T18:30`;

    if (new Date(requestEnd) <= new Date(requestStart)) {
      return res.json({
        available: false,
        conflicts: [],
        message: "End time must be after start time",
      });
    }

    const query = {
      $or: [{ employee: employeeId }, { "activities.employee": employeeId }],
    };

    let assignedTasks = await Tasks.find(query)
      .select(
        "employee activities projectId taskName startDate endDate startTime endTime percentage"
      )
      .lean();

    if (projectType && projectId) {
      const currentProject = await Project_Details.findById(projectId)
        .select("projectType")
        .lean();

      if (currentProject && currentProject.projectType) {
        const projectsWithSameType = await Project_Details.find({
          projectType: currentProject.projectType,
        })
          .select("_id")
          .lean();

        const projectIds = projectsWithSameType.map((p) => p._id);

        assignedTasks = assignedTasks.filter((task) => {
          const taskProjectId = task.projectId.toString();
          return projectIds.some((id) => id.toString() === taskProjectId);
        });
      }
    }

    const conflicts = [];

    for (const task of assignedTasks) {
      let projectName = null;
      if (task.projectId) {
        const project = await Project_Details.findById(task.projectId)
          .select("projectName companyName description")
          .lean();

        if (project) {
          projectName = project.projectName || "Unknown Project";
        }
      }

      if (
        task.employee &&
        task.employee === employeeId &&
        task.startDate &&
        task.endDate
      ) {
        if (!isActivityReport && excludeId && task._id.toString() === excludeId)
          continue;

        const taskPercentage = task.percentage || 0;
        if (taskPercentage >= 100) continue;

        const taskStart = task.startTime
          ? `${task.startDate}T${task.startTime}`
: `${task.startDate}T09:30`;
      const taskEnd = task.endTime
        ? `${task.endDate}T${task.endTime}`
        : `${task.endDate}T18:30`;

        if (isTimeOverlapping(requestStart, requestEnd, taskStart, taskEnd)) {
          conflicts.push({
            taskId: task._id,
            taskName: task.taskName || "Unnamed Task",
            projectName: projectName || "Unknown Project",
            startDate: task.startDate,
            startTime: task.startTime || null,
            endDate: task.endDate,
            endTime: task.endTime || null,
            percentage: taskPercentage,
            type: "task",
          });
        }
      }

      if (task.activities && task.activities.length > 0) {
        for (const activity of task.activities) {
          if (
            activity.employee === employeeId &&
            activity.startDate &&
            activity.endDate
          ) {
            if (
              isActivityReport &&
              excludeId &&
              activity._id.toString() === excludeId
            )
              continue;

            const activityPercentage = activity.percentage || 0;
            if (activityPercentage >= 100) continue;

            const activityStart = activity.startTime
              ? `${activity.startDate}T${activity.startTime}`
              : `${activity.startDate}T09:30`;
            const activityEnd = activity.endTime
              ? `${activity.endDate}T${activity.endTime}`
              : `${activity.endDate}T18:30`;

            if (
              isTimeOverlapping(
                requestStart,
                requestEnd,
                activityStart,
                activityEnd
              )
            ) {
              conflicts.push({
                taskId: task._id,
                taskName: task.taskName || "Unnamed Task",
                activityName: activity.activityName,
                projectName: projectName || "Unknown Project",
                startDate: activity.startDate,
                startTime: activity.startTime || null,
                endDate: activity.endDate,
                endTime: activity.endTime || null,
                percentage: activityPercentage,
                type: "activity",
              });
            }
          }
        }
      }
    }

    res.json({
      available: conflicts.length === 0,
      conflicts,
      message:
        conflicts.length > 0
          ? `Employee has ${conflicts.length} conflicting assignment(s)`
          : "Employee is available",
    });
  } catch (error) {
    console.error("Error checking availability:", error);
    res.status(500).json({
      error: "Failed to check availability",
      available: true,
      conflicts: [],
    });
  }
});


router.post("/create", async (req, res) => {
  try {
    const { projectId, tasks } = req.body;

    if (!projectId || !tasks || !Array.isArray(tasks)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data",
      });
    }

    const validationErrors = [];

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];

      if (!task.taskName || task.taskName.trim() === "") {
        validationErrors.push(`Task ${i + 1}: Task name is required`);
      }

      if (!task.startDate || !task.endDate) {
        validationErrors.push(
          `Task ${i + 1}: Start and end dates are required`
        );
      }

      if (task.startDate && task.endDate) {
        let taskStart, taskEnd;

        if (task.startTime && task.endTime) {
          taskStart = new Date(`${task.startDate}T${task.startTime}`);
          taskEnd = new Date(`${task.endDate}T${task.endTime}`);
        } else {
          const defaultStartTime = "09:30";
          const defaultEndTime = "18:30";

          taskStart = new Date(
            `${task.startDate}T${task.startTime || defaultStartTime}`
          ).toISOString();
          taskEnd = new Date(
            `${task.endDate}T${task.endTime || defaultEndTime}`
          ).toISOString();
        }

        if (taskEnd <= taskStart) {
          validationErrors.push(
            `Task ${i + 1}: End time must be after start time`
          );
        }

        if (task.activities && task.activities.length > 0) {
          const validActivities = task.activities.filter(
            (act) =>
              act.activityName && act.activityName.trim() !== "" && act.employee
          );

          if (validActivities.length === 0) {
            validationErrors.push(
              `Task ${i + 1}: Activities must have name and employee assigned`
            );
          }

          for (let j = 0; j < task.activities.length; j++) {
            const activity = task.activities[j];

            if (!activity.activityName || activity.activityName.trim() === "") {
              validationErrors.push(
                `Task ${i + 1}, Activity ${j + 1}: Activity name is required`
              );
            }

            if (!activity.employee) {
              validationErrors.push(
                `Task ${i + 1}, Activity ${j + 1}: Employee must be assigned`
              );
            }

            if (
              activity.startDate &&
              activity.startTime &&
              activity.endDate &&
              activity.endTime
            ) {
              const actStart = new Date(
                `${activity.startDate}T${activity.startTime}`
              );
              const actEnd = new Date(
                `${activity.endDate}T${activity.endTime}`
              );

              if (actEnd <= actStart) {
                validationErrors.push(
                  `Task ${i + 1}, Activity ${
                    j + 1
                  }: End time must be after start time`
                );
              }

              if (task.startTime && task.endTime) {
                if (actStart < taskStart || actEnd > taskEnd) {
                  validationErrors.push(
                    `Task ${i + 1}, Activity ${
                      j + 1
                    }: Activity time must be within task time range`
                  );
                }
              }
            }
          }

          const internalConflicts = checkInternalActivityConflicts(
            task.activities
          );
          if (internalConflicts.length > 0) {
            internalConflicts.forEach((conflict) => {
              validationErrors.push(
                `Task ${i + 1}: ${conflict.activity1Name} and ${
                  conflict.activity2Name
                } have overlapping times for the same employee`
              );
            });
          }
        }
      }

      const hasTaskEmployees = task.employees && task.employees.length > 0;
      const hasActivityEmployees =
        task.activities &&
        task.activities.length > 0 &&
        task.activities.some((act) => act.employee);

      if (hasTaskEmployees && hasActivityEmployees) {
        validationErrors.push(
          `Task ${
            i + 1
          }: Cannot have both task-level and activity-level employee assignments`
        );
      }

      if (!hasTaskEmployees && !hasActivityEmployees) {
        validationErrors.push(
          `Task ${
            i + 1
          }: Must assign employees either at task level or through activities`
        );
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors,
      });
    }

    const createdTasks = [];

    for (const taskData of tasks) {
      const activities = taskData.activities
        ? taskData.activities.map((activity) => ({
            ...activity,
            percentage: activity.percentage || 0,
          }))
        : [];

      const taskPercentage =
        activities.length > 0 ? calculateTaskPercentage(activities) : 0;

      const task = new Tasks({
        projectId,
        employeeID: taskData.employeeID,
        taskName: taskData.taskName,
        description: taskData.description,
        startDate: taskData.startDate,
        startTime: taskData.startTime || "09:30",
        endDate: taskData.endDate,
        endTime: taskData.endTime || "18:30",
        employee: taskData.employees || "",
        department: taskData.department || "",
        teams: taskData.teams || [],
        activities: activities,
        percentage: taskPercentage,
        points: taskData.points,
        status: "Not Started",
      });

      const savedTask = await task.save();
      createdTasks.push(savedTask);
    }

    await updateProjectPercentage(projectId);

    res.status(201).json({
      success: true,
      message: `${createdTasks.length} task(s) created successfully`,
      tasks: createdTasks,
    });
  } catch (error) {
    console.error("Error creating tasks:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create tasks",
      error: error.message,
    });
  }
});

// router.get("/dashboard", async (req, res) => {
//   try {
//     const tasks = await Tasks.find().lean();
//     const unscheduledTask = await UnscheduledTask.find().lean();
//     const dayTask = await DayReport.find().lean();

//     const employees = await Employee_details.find({ 
//       role: { $ne: "Super Admin" } 
//     }).lean();

//     const enrichedTasks = await Promise.all(
//       tasks.map(async (task) => {
//         if (task.projectId) {
//           const project = await Project_Details.findById(task.projectId)
//             .select("clientId")
//             .lean();
//           if (project && project.clientId) {
//             const initiate = await Initiate.findOne({
//               clientId: project.clientId,
//             })
//               .select("projectName -_id")
//               .lean();
//             if (initiate) task.projectName = initiate.projectName;
//           }
//         }
//         return task;
//       })
//     );

//     const enrichedDayTask = await Promise.all(
//       dayTask.map(async (day) => {
//         let taskDetails = null;
//         let activityDetails = null;
//         let projectName = "";
//         let startDate = "";
//         let endDate = "";
//         let startTime = "";
//         let endTime = "";

//         if (day.taskId) {
//           const task = await Tasks.findById(day.taskId).lean();
//           if (task) {
//             taskDetails = {
//               taskName: task.taskName,
//               description: task.description,
//               startDate: task.startDate,
//               endDate: task.endDate,
//               startTime: task.startTime,
//               endTime: task.endTime,
//             };

//             startDate = task.startDate;
//             endDate = task.endDate;
//             startTime = task.startTime;
//             endTime = task.endTime;

//             if (day.activityId && task.activities) {
//               const activity = task.activities.find(
//                 (act) => act._id.toString() === day.activityId.toString()
//               );
//               if (activity) {
//                 activityDetails = {
//                   activityName: activity.activityName,
//                   description: activity.description,
//                   startDate: activity.startDate,
//                   endDate: activity.endDate,
//                   startTime: activity.startTime,
//                   endTime: activity.endTime,
//                 };

//                 startDate = activity.startDate;
//                 endDate = activity.endDate;
//                 startTime = activity.startTime;
//                 endTime = activity.endTime;
//               }
//             }

//             if (task.projectId) {
//               const project = await Project_Details.findById(task.projectId)
//                 .select("clientId")
//                 .lean();
//               if (project && project.clientId) {
//                 const initiate = await Initiate.findOne({
//                   clientId: project.clientId,
//                 })
//                   .select("projectName -_id")
//                   .lean();
//                 if (initiate) {
//                   projectName = initiate.projectName;
//                 }
//               }
//             }
//           }
//         }

//         return {
//           ...day,
//           taskDetails,
//           activityDetails,
//           projectName,
//           startDate,
//           endDate,
//           startTime,
//           endTime,
//         };
//       })
//     );

//     res.json({
//       success: true,
//       tasks: enrichedTasks,
//       unscheduledTask: unscheduledTask,
//       dayTask: enrichedDayTask,
//       employees: employees,
//     });
//   } catch (error) {
//     console.error("Error fetching all tasks:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch tasks",
//       error: error.message,
//     });
//   }
// });


router.get("/", async (req, res) => {
  try {
    const tasks = await Tasks.find().lean();

    const enrichedTasks = await Promise.all(
      tasks.map(async (task) => {
        if (task.projectId) {
          const project = await Project_Details.findById(task.projectId)
            .select("projectName companyName description")
            .lean();
          if (project) {
            task.projectName = project.projectName || "Unknown Project";
            task.companyName = project.companyName || "Unknown Company";
            task.description = project.description || "";
          }
        }
        return task;
      })
    );

    res.json({
      success: true,
      tasks: enrichedTasks,
    });
  } catch (error) {
    console.error("Error fetching all tasks:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
      error: error.message,
    });
  }
});

router.get("/project/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;

    const tasks = await Tasks.find({ projectId });

    res.json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
      error: error.message,
    });
  }
});

router.put("/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const updateData = req.body;

    const existingTask = await Tasks.findById(taskId);
    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (
      updateData.employees &&
      updateData.employees.length > 0 &&
      updateData.activities &&
      updateData.activities.length > 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Task cannot have both task-level employees and activities",
      });
    }

    if (updateData.activities && updateData.activities.length > 0) {
      const conflicts = checkInternalActivityConflicts(updateData.activities);
      if (conflicts.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Activity conflicts detected",
          conflicts: conflicts,
        });
      }

      updateData.percentage = calculateTaskPercentage(updateData.activities);
    }

    const updatedTask = await Tasks.findByIdAndUpdate(taskId, updateData, {
      new: true,
      runValidators: true,
    });

    await updateProjectPercentage(existingTask.projectId);

    res.json({
      success: true,
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update task",
      error: error.message,
    });
  }
});

router.delete("/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;

    const deletedTask = await Tasks.findByIdAndDelete(taskId);

    if (!deletedTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    await updateProjectPercentage(deletedTask.projectId);

    res.json({
      success: true,
      message: "Task deleted successfully",
      task: deletedTask,
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete task",
      error: error.message,
    });
  }
});

module.exports = router;
