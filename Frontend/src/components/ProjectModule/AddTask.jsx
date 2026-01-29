import React, { useState, useEffect, useRef } from "react";
import { Check, X, Loader2, Trash2 } from "lucide-react";
import { useNotification } from "../NotificationContext";
import { useConfirm } from "../ConfirmContext";
import closeIcon from "../../assets/ProjectPages/overview/close.webp"
import downArrow from "../../assets/ProjectPages/overview/down arrow.svg"

export default function AddTask({
  onBack,
  currentEmployees = [],
  projectId,
  startDate,
  endDate,
  projectType,
  correctionDate,
}) {
  const { notify } = useNotification();
  const confirm = useConfirm();

  const [deletedTaskIds, setDeletedTaskIds] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const initialTasksRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showActivityBox, setShowActivityBox] = useState({});
  const [expandedTask, setExpandedTask] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  const [activityValidationStatus, setActivityValidationStatus] = useState({});
  const [validatingActivity, setValidatingActivity] = useState({});
  const [hasExistingTasks, setHasExistingTasks] = useState(false);

  const [taskPointInput, setTaskPointInput] = useState({});
  const [showActivityPointsInput, setShowActivityPointsInput] = useState({});
  const [activityPointInput, setActivityPointInput] = useState({});
  const [deadlineCrossed, setDeadlineCrossed] = useState(false);

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getEmployeeById = (id) => {
    return (
      currentEmployees.find(
        (e) => e._id === id || e.id === id || e.employeeId === id,
      ) || null
    );
  };

  const getUniqueDepartments = () => {
    const departments = new Set();
    currentEmployees.forEach((emp) => {
      if (emp.department) {
        departments.add(emp.department);
      }
    });
    return Array.from(departments).sort();
  };

  const getEmployeesByDepartment = (department) => {
    if (!department) return [];
    return currentEmployees.filter((emp) => emp.department === department);
  };

  const getTeamFromEmployee = (employeeId) => {
    const employee = getEmployeeById(employeeId);
    return employee?.department || "";
  };

  const isDeadlineCrossed = () => {
    if (!endDate) return false;
    const projectEndDate = new Date(endDate);
    projectEndDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today > projectEndDate;
  };

  const isTaskAfterCorrection = (taskCreatedAt, correctionDates) => {
    if (!correctionDates || correctionDates.length === 0) return false;
    if (!taskCreatedAt) return false;

    const latestCorrectionDate = correctionDates[correctionDates.length - 1];
    const correctionCreatedAt = new Date(latestCorrectionDate.createdAt);
    const taskCreated = new Date(taskCreatedAt);

    return taskCreated > correctionCreatedAt;
  };

  const getEffectiveDates = (
    taskCreatedAt,
    projectStartDate,
    projectEndDate,
    correctionDates,
  ) => {
    const isAfterCorrection = isTaskAfterCorrection(
      taskCreatedAt,
      correctionDates,
    );

    if (isAfterCorrection && correctionDates && correctionDates.length > 0) {
      const latestCorrection = correctionDates[correctionDates.length - 1];
      let endDateValue = latestCorrection.date;
      try {
        const cdDateObj = new Date(latestCorrection.date);
        const datePart = cdDateObj.toISOString().split("T")[0];
        endDateValue = datePart;
      } catch (e) {
        if (endDateValue && typeof endDateValue === "string") {
          endDateValue = endDateValue.split("T")[0];
        }
      }

      return {
        startDate: getTodayDate(),
        endDate: endDateValue,
        useCorrection: true,
      };
    }

    return {
      startDate: projectStartDate,
      endDate: projectEndDate,
      useCorrection: false,
    };
  };

  const getMinDate = (
    pStartDate,
    projectEndDate,
    correctionDates,
    taskCreatedAt = null,
  ) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const effectiveDates = getEffectiveDates(
      taskCreatedAt,
      pStartDate,
      projectEndDate,
      correctionDates,
    );

    const sDate = new Date(effectiveDates.startDate);
    const eDate = new Date(effectiveDates.endDate);

    const formatDateLocal = (date) => {
      const offset = date.getTimezoneOffset();
      const local = new Date(date.getTime() - offset * 60000);
      return local.toISOString().split("T")[0];
    };

    if (effectiveDates.useCorrection) {
      return formatDateLocal(today);
    }

    if (!isNaN(sDate) && !isNaN(eDate) && sDate < today && today < eDate) {
      return formatDateLocal(today);
    }

    return !isNaN(sDate) ? formatDateLocal(sDate) : "";
  };

  const [tasks, setTasks] = useState([
    {
      id: 1,
      activities: [],
      employeeID: "",
      createdAt: new Date().toISOString(),
      startDate: getMinDate(startDate, endDate, correctionDate, null),
      endDate: (() => {
        const effectiveDates = getEffectiveDates(
          null,
          startDate,
          endDate,
          correctionDate,
        );
        const endDateValue = effectiveDates.endDate;
        if (endDateValue && endDateValue.includes("T")) {
          return endDateValue.split("T")[0];
        }
        return endDateValue;
      })(),
      startTime: "",
      endTime: "",
      duration: "",
      taskName: "",
      description: "",
      employees: "",
      department: "",
      canAddNext: false,
      percentage: 0,
      isLocked: false,
      isExisting: false,
      points: [],
    },
  ]);

  const canEditEndDate = (
    taskEndDate,
    projectEndDate,
    correctionDates,
    taskCreatedAt = null,
  ) => {
    if (!taskEndDate || !projectEndDate) return true;

    const normalizeLocalDate = (d) => {
      const date = new Date(d);
      const offset = date.getTimezoneOffset();
      return new Date(date.getTime() - offset * 60000);
    };

    const today = normalizeLocalDate(new Date());
    today.setHours(0, 0, 0, 0);

    const effectiveDates = getEffectiveDates(
      taskCreatedAt,
      projectEndDate,
      projectEndDate,
      correctionDates,
    );
    const effectiveProjectEnd = normalizeLocalDate(effectiveDates.endDate);
    const taskEnd = normalizeLocalDate(taskEndDate);

    return effectiveProjectEnd >= today && effectiveProjectEnd >= taskEnd;
  };

  const calculateDuration = (sDate, sTime, eDate, eTime) => {
    if (!sDate || !eDate) return "";

    const start = new Date(`${sDate}T${sTime || "09:30"}`);
    const end = new Date(`${eDate}T${eTime || "18:30"}`);

    if (end <= start) return "Invalid duration";

    const diffMs = end - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (days > 0) {
      return `${days}d ${remainingHours}h ${minutes}m`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  };

  const isFieldLocked = (taskIndex, activityIndex = null) => {
    const task = tasks[taskIndex];
    if (!task) return false;

    if (activityIndex !== null) {
      const activity = task.activities[activityIndex];
      return (activity?.percentage || 0) > 0;
    }
    return (task?.percentage || 0) > 0;
  };

  const calculateCanAddNext = (task) => {
    const hasTaskName = task.taskName && task.taskName.trim() !== "";
    const hasStartDate = task.startDate !== "";
    const hasEndDate = task.endDate !== "";
    const hasEmployee =
      (task.employees && task.employees.trim() !== "") ||
      (task.activities.length > 0 &&
        task.activities.every((act) => act.employee !== ""));

    return hasTaskName && hasStartDate && hasEndDate && hasEmployee;
  };

  const handleAddTaskPoint = (taskIndex) => {
    const pointText = taskPointInput[taskIndex]?.trim();
    if (!pointText) {
      notify({ title: "Warning", message: "Please enter a point" });
      return;
    }

    setTasks((prevTasks) => {
      const newTasks = [...prevTasks];
      newTasks[taskIndex] = {
        ...newTasks[taskIndex],
        points: [
          ...(newTasks[taskIndex].points || []),
          { text: pointText, completed: false },
        ],
      };
      return newTasks;
    });

    setTaskPointInput((prev) => ({ ...prev, [taskIndex]: "" }));
  };

  const handleRemoveTaskPoint = (taskIndex, pointIndex) => {
    setTasks((prevTasks) => {
      const newTasks = [...prevTasks];
      const newPoints = [...(newTasks[taskIndex].points || [])];
      newPoints.splice(pointIndex, 1);
      newTasks[taskIndex] = {
        ...newTasks[taskIndex],
        points: newPoints,
      };
      return newTasks;
    });
  };

  const handleAddActivityPoint = (taskIndex, activityIndex) => {
    const pointText =
      activityPointInput[`${taskIndex}_${activityIndex}`]?.trim();
    if (!pointText) {
      notify({ title: "Warning", message: "Please enter a point" });
      return;
    }

    setTasks((prevTasks) => {
      const newTasks = [...prevTasks];
      const newActivities = [...newTasks[taskIndex].activities];
      newActivities[activityIndex] = {
        ...newActivities[activityIndex],
        points: [
          ...(newActivities[activityIndex].points || []),
          { text: pointText, completed: false },
        ],
      };
      newTasks[taskIndex] = {
        ...newTasks[taskIndex],
        activities: newActivities,
      };
      return newTasks;
    });

    setActivityPointInput((prev) => ({
      ...prev,
      [`${taskIndex}_${activityIndex}`]: "",
    }));
  };

  const handleRemoveActivityPoint = (taskIndex, activityIndex, pointIndex) => {
    setTasks((prevTasks) => {
      const newTasks = [...prevTasks];
      const newActivities = [...newTasks[taskIndex].activities];
      const newPoints = [...(newActivities[activityIndex].points || [])];
      newPoints.splice(pointIndex, 1);
      newActivities[activityIndex] = {
        ...newActivities[activityIndex],
        points: newPoints,
      };
      newTasks[taskIndex] = {
        ...newTasks[taskIndex],
        activities: newActivities,
      };
      return newTasks;
    });
  };

  const checkEmployeeAvailability = async (
    employeeId,
    empStartDate,
    empStartTime,
    empEndDate,
    empEndTime,
    isActivityReport,
    excludeId,
  ) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/tasks/check-availability`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId,
            startDate: empStartDate,
            startTime: empStartTime,
            endDate: empEndDate,
            endTime: empEndTime,
            projectId,
            projectType,
            isActivityReport,
            excludeId,
          }),
        },
      );

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error checking availability:", error);
      return { available: true, conflicts: [] };
    }
  };

  const checkEmployeeConflictAcrossTasks = (
    employeeId,
    checkStartDate,
    checkStartTime,
    checkEndDate,
    checkEndTime,
    excludeTaskIndex,
    excludeActivityIndex = null,
  ) => {
    if (!employeeId || !checkStartDate || !checkEndDate) {
      return { hasConflict: false, conflicts: [] };
    }

    const currentStartTime = checkStartTime || "09:30";
    const currentEndTime = checkEndTime || "18:30";

    const currentStart = new Date(`${checkStartDate}T${currentStartTime}`);
    const currentEnd = new Date(`${checkEndDate}T${currentEndTime}`);
    const conflicts = [];

    tasks.forEach((task, taskIdx) => {
      if (taskIdx !== excludeTaskIndex && task.employees === employeeId) {
        if (task.startDate && task.endDate) {
          const taskStartTime = task.startTime || "09:30";
          const taskEndTime = task.endTime || "18:30";
          const taskStart = new Date(`${task.startDate}T${taskStartTime}`);
          const taskEnd = new Date(`${task.endDate}T${taskEndTime}`);

          if (currentStart < taskEnd && currentEnd > taskStart) {
            conflicts.push(
              `Task ${taskIdx + 1}: ${task.taskName || "Untitled"}`,
            );
          }
        }
      }

      task.activities.forEach((activity, actIdx) => {
        if (taskIdx === excludeTaskIndex && actIdx === excludeActivityIndex)
          return;

        if (
          activity.employee === employeeId &&
          activity.startDate &&
          activity.endDate
        ) {
          const actStartTime = activity.startTime || "09:30";
          const actEndTime = activity.endTime || "18:30";
          const actStart = new Date(`${activity.startDate}T${actStartTime}`);
          const actEnd = new Date(`${activity.endDate}T${actEndTime}`);

          if (currentStart < actEnd && currentEnd > actStart) {
            conflicts.push(`Task ${taskIdx + 1} - Activity ${actIdx + 1}`);
          }
        }
      });
    });

    return { hasConflict: conflicts.length > 0, conflicts };
  };

  const validateActivityTimeWithinTask = (taskIndex, activityIndex) => {
    const task = tasks[taskIndex];
    const activity = task.activities[activityIndex];

    if (!activity.startDate || !activity.endDate) {
      return { valid: true, message: "" };
    }

    if (!task.startDate || !task.endDate) {
      return { valid: true, message: "" };
    }

    const taskStartTime = task.startTime || "09:30";
    const taskEndTime = task.endTime || "18:30";
    const activityStartTime = activity.startTime || "09:30";
    const activityEndTime = activity.endTime || "18:30";

    const taskStart = new Date(`${task.startDate}T${taskStartTime}`);
    const taskEnd = new Date(`${task.endDate}T${taskEndTime}`);
    const activityStart = new Date(
      `${activity.startDate}T${activityStartTime}`,
    );
    const activityEnd = new Date(`${activity.endDate}T${activityEndTime}`);

    if (activityStart < taskStart || activityEnd > taskEnd) {
      return {
        valid: false,
        message: "Activity date/time must be within task date/time range",
      };
    }

    return { valid: true, message: "" };
  };

  const canEnableActivityButton = (taskIndex) => {
    const task = tasks[taskIndex];
    return task?.taskName && task.taskName.trim() !== "";
  };

  const handleTaskDateChange = (taskIndex, field, value) => {
    setTasks((prevTasks) => {
      const newTasks = [...prevTasks];
      const currentTask = { ...newTasks[taskIndex] };

      if (["startDate", "endDate", "startTime", "endTime"].includes(field)) {
        const tempTask = { ...currentTask, [field]: value };

        if (tempTask.activities.length > 0) {
          const taskStartTime = tempTask.startTime || "09:30";
          const taskEndTime = tempTask.endTime || "18:30";
          const taskStart = new Date(`${tempTask.startDate}T${taskStartTime}`);
          const taskEnd = new Date(`${tempTask.endDate}T${taskEndTime}`);

          const invalidActivities = tempTask.activities.filter((activity) => {
            if (!activity.startDate || !activity.endDate) return false;

            const actStartTime = activity.startTime || "09:30";
            const actEndTime = activity.endTime || "18:30";
            const actStart = new Date(`${activity.startDate}T${actStartTime}`);
            const actEnd = new Date(`${activity.endDate}T${actEndTime}`);

            return actStart < taskStart || actEnd > taskEnd;
          });

          if (invalidActivities.length > 0) {
            notify({
              title: "Warning",
              message: `Cannot change task duration. ${invalidActivities.length} activity(ies) fall outside the new time range. Please adjust activities first.`,
            });
            return prevTasks;
          }
        }
      }

      currentTask[field] = value;

      if (["startDate", "startTime", "endDate", "endTime"].includes(field)) {
        currentTask.duration = calculateDuration(
          currentTask.startDate,
          currentTask.startTime,
          currentTask.endDate,
          currentTask.endTime,
        );

        if (
          currentTask.activities.length === 0 &&
          currentTask.employees &&
          currentTask.percentage < 1
        ) {
          currentTask.employees = "";
        }
      }

      currentTask.canAddNext = calculateCanAddNext(currentTask);

      newTasks[taskIndex] = currentTask;
      return newTasks;
    });
  };

  const handleTaskEmployeeChange = async (taskIndex, employeeId) => {
    const task = tasks[taskIndex];

    if (!task.taskName || task.taskName.trim() === "") {
      notify({
        title: "Warning",
        message: "Please enter task name before assigning employee",
      });
      return;
    }

    if (!task.startDate || !task.endDate) {
      notify({
        title: "Warning",
        message: "Please select start and end dates before assigning employee",
      });
      return;
    }

    const availability = await checkEmployeeAvailability(
      employeeId,
      task.startDate,
      task.startTime || "09:30",
      task.endDate,
      task.endTime || "18:30",
      false,
      task.id ?? null,
    );

    if (!availability.available && availability.conflicts?.length > 0) {
      notify({
        title: "Warning",
        message: `Employee is already assigned to: ${availability.conflicts.map(
          (c) =>
            c.activityName
              ? `Project: ${c.projectName} | Task: ${c.taskName} | Activity: ${c.activityName}`
              : `Project: ${c.projectName} | Task: ${c.taskName}`,
        )}`,
      });
      return;
    } else if (!availability.available) {
      notify({
        title: "Warning",
        message: availability.message,
      });
      return;
    }

    const localConflict = checkEmployeeConflictAcrossTasks(
      employeeId,
      task.startDate,
      task.startTime || "09:30",
      task.endDate,
      task.endTime || "18:30",
      taskIndex,
    );

    if (localConflict.hasConflict) {
      notify({
        title: "Warning",
        message: `Employee has time conflict with: ${localConflict.conflicts.join(
          ", ",
        )}`,
      });
      return;
    }

    const team = getTeamFromEmployee(employeeId);

    setTasks((prevTasks) => {
      const newTasks = [...prevTasks];
      const currentTask = { ...newTasks[taskIndex] };

      currentTask.employees = employeeId;

      currentTask.canAddNext = calculateCanAddNext(currentTask);

      newTasks[taskIndex] = currentTask;
      return newTasks;
    });
  };

  const handleActivityChange = (taskIndex, activityIndex, field, value) => {
    setTasks((prevTasks) => {
      const newTasks = [...prevTasks];
      const currentTask = { ...newTasks[taskIndex] };
      const newActivities = [...currentTask.activities];
      const currentActivity = {
        ...newActivities[activityIndex],
        [field]: value,
      };

      if (field === "department") {
        currentActivity.employee = "";
      }

      if (["startDate", "startTime", "endDate", "endTime"].includes(field)) {
        currentActivity.duration = calculateDuration(
          currentActivity.startDate,
          currentActivity.startTime,
          currentActivity.endDate,
          currentActivity.endTime,
        );
      }

      newActivities[activityIndex] = currentActivity;
      currentTask.activities = newActivities;
      currentTask.canAddNext = calculateCanAddNext(currentTask);

      newTasks[taskIndex] = currentTask;
      return newTasks;
    });

    if (["startDate", "startTime", "endDate", "endTime"].includes(field)) {
      setTimeout(() => {
        const timeValidation = validateActivityTimeWithinTask(
          taskIndex,
          activityIndex,
        );
        if (!timeValidation.valid) {
          setValidationErrors((prev) => ({
            ...prev,
            [`activity_${taskIndex}_${activityIndex}_time`]:
              timeValidation.message,
          }));
        } else {
          setValidationErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[`activity_${taskIndex}_${activityIndex}_time`];
            return newErrors;
          });
        }
      }, 0);

      setActivityValidationStatus((prev) => ({
        ...prev,
        [`${taskIndex}_${activityIndex}`]: false,
      }));
    }

    if (field === "employee") {
      setTimeout(() => {
        const task = tasks[taskIndex];
        const activity = task?.activities?.[activityIndex];
        if (!activity) return;

        const conflicts = [];

        if (activity.startDate && activity.endDate) {
          task.activities.forEach((act, idx) => {
            if (idx === activityIndex) return;

            if (act.employee === value && act.startDate && act.endDate) {
              const currentStartTime = activity.startTime || "09:30";
              const currentEndTime = activity.endTime || "18:30";
              const actStartTime = act.startTime || "09:30";
              const actEndTime = act.endTime || "18:30";

              const currentStart = new Date(
                `${activity.startDate}T${currentStartTime}`,
              );
              const currentEnd = new Date(
                `${activity.endDate}T${currentEndTime}`,
              );
              const actStart = new Date(`${act.startDate}T${actStartTime}`);
              const actEnd = new Date(`${act.endDate}T${actEndTime}`);

              if (currentStart < actEnd && currentEnd > actStart) {
                conflicts.push(`Activity ${idx + 1}`);
              }
            }
          });
        }

        if (conflicts.length > 0) {
          setValidationErrors((prev) => ({
            ...prev,
            [`activity_${taskIndex}_${activityIndex}_employee`]: `Conflicts with ${conflicts.join(
              ", ",
            )}`,
          }));
        } else {
          setValidationErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[`activity_${taskIndex}_${activityIndex}_employee`];
            return newErrors;
          });
        }
      }, 0);

      setActivityValidationStatus((prev) => ({
        ...prev,
        [`${taskIndex}_${activityIndex}`]: false,
      }));
    }

    if (field === "department") {
      setActivityValidationStatus((prev) => ({
        ...prev,
        [`${taskIndex}_${activityIndex}`]: false,
      }));
    }
  };

  const validateActivity = async (taskIndex, activityIndex) => {
    const activity = tasks[taskIndex]?.activities?.[activityIndex];
    if (!activity) return;

    if (!activity.activityName || activity.activityName.trim() === "") {
      notify({ title: "Warning", message: "Activity name is required" });
      return;
    }

    if (!activity.department) {
      notify({ title: "Warning", message: "Department must be selected" });
      return;
    }

    if (!activity.employee) {
      notify({ title: "Warning", message: "Employee must be assigned" });
      return;
    }

    if (!activity.startDate || !activity.endDate) {
      notify({
        title: "Warning",
        message: "Please complete start date and end date",
      });
      return;
    }

    const timeValidation = validateActivityTimeWithinTask(
      taskIndex,
      activityIndex,
    );
    if (!timeValidation.valid) {
      notify({ title: "Warning", message: timeValidation.message });
      return;
    }

    const task = tasks[taskIndex];
    const conflicts = [];
    task.activities.forEach((act, idx) => {
      if (idx === activityIndex) return;

      if (act.employee === activity.employee && act.startDate && act.endDate) {
        const currentStartTime = activity.startTime || "09:30";
        const currentEndTime = activity.endTime || "18:30";
        const actStartTime = act.startTime || "09:30";
        const actEndTime = act.endTime || "18:30";

        const currentStart = new Date(
          `${activity.startDate}T${currentStartTime}`,
        );
        const currentEnd = new Date(`${activity.endDate}T${currentEndTime}`);
        const actStart = new Date(`${act.startDate}T${actStartTime}`);
        const actEnd = new Date(`${act.endDate}T${actEndTime}`);

        if (currentStart < actEnd && currentEnd > actStart) {
          conflicts.push(`Activity ${idx + 1}`);
        }
      }
    });

    if (conflicts.length > 0) {
      notify({
        title: "Warning",
        message: `Employee conflicts with ${conflicts.join(", ")}`,
      });
      return;
    }

    setValidatingActivity((prev) => ({
      ...prev,
      [`${taskIndex}_${activityIndex}`]: true,
    }));

    try {
      const availability = await checkEmployeeAvailability(
        activity.employee,
        activity.startDate,
        activity.startTime || "09:30",
        activity.endDate,
        activity.endTime || "18:30",
        true,
        activity._id ?? null,
      );

      if (!availability.available && availability.conflicts?.length > 0) {
        notify({
          title: "Warning",
          message: `Employee is already assigned to: ${availability.conflicts.map(
            (c) =>
              c.activityName
                ? `Project: ${c.projectName} | Task: ${c.taskName} | Activity: ${c.activityName}`
                : `Project: ${c.projectName} | Task: ${c.taskName}`,
          )}`,
        });

        setValidatingActivity((prev) => ({
          ...prev,
          [`${taskIndex}_${activityIndex}`]: false,
        }));
        return;
      } else if (!availability.available) {
        notify({
          title: "Warning",
          message: availability.message,
        });
        setValidatingActivity((prev) => ({
          ...prev,
          [`${taskIndex}_${activityIndex}`]: false,
        }));
        return;
      }

      const localConflict = checkEmployeeConflictAcrossTasks(
        activity.employee,
        activity.startDate,
        activity.startTime,
        activity.endDate,
        activity.endTime,
        taskIndex,
        activityIndex,
      );

      if (localConflict.hasConflict) {
        notify({
          title: "Warning",
          message: `Employee has time conflict with: ${localConflict.conflicts.join(
            ", ",
          )}`,
        });
        setValidatingActivity((prev) => ({
          ...prev,
          [`${taskIndex}_${activityIndex}`]: false,
        }));
        return;
      }

      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`activity_${taskIndex}_${activityIndex}_employee`];
        delete newErrors[`activity_${taskIndex}_${activityIndex}_time`];
        return newErrors;
      });

      setTimeout(() => {
        setActivityValidationStatus((prev) => ({
          ...prev,
          [`${taskIndex}_${activityIndex}`]: true,
        }));
        setValidatingActivity((prev) => ({
          ...prev,
          [`${taskIndex}_${activityIndex}`]: false,
        }));
      }, 500);
    } catch (error) {
      console.error(error);
      setValidatingActivity((prev) => ({
        ...prev,
        [`${taskIndex}_${activityIndex}`]: false,
      }));
      notify({ title: "Error", message: "Validation failed" });
    }
  };

  const toggleActivity = (taskIndex) => {
    const currentState = showActivityBox[taskIndex];

    if (!currentState) {
      if (!canEnableActivityButton(taskIndex)) {
        notify({
          title: "Warning",
          message: "Please fill task name before adding activities",
        });
        return;
      }

      setTasks((prevTasks) => {
        const newTasks = [...prevTasks];
        const currentTask = { ...newTasks[taskIndex] };

        currentTask.employees = "";

        if (currentTask.activities.length === 0) {
          currentTask.activities = [
            {
              activityName: "",
              department: "", 
              employee: "",
              startDate: currentTask.startDate || "",
              startTime: currentTask.startTime || "",
              endDate: currentTask.endDate || "",
              endTime: currentTask.endTime || "",
              duration: calculateDuration(
                currentTask.startDate,
                currentTask.startTime,
                currentTask.endDate,
                currentTask.endTime,
              ),
              description: "",
              points: [],
            },
          ];
        }

        currentTask.canAddNext = calculateCanAddNext(currentTask);
        newTasks[taskIndex] = currentTask;
        return newTasks;
      });

      setShowActivityBox((prev) => ({ ...prev, [taskIndex]: true }));
    } else {
      setTasks((prevTasks) => {
        const newTasks = [...prevTasks];
        const currentTask = {
          ...newTasks[taskIndex],
          activities: [],
          employees: "",
        };
        currentTask.canAddNext = calculateCanAddNext(currentTask);
        newTasks[taskIndex] = currentTask;
        return newTasks;
      });

      setShowActivityBox((prev) => ({ ...prev, [taskIndex]: false }));

      setActivityValidationStatus((prev) => {
        const newStatus = { ...prev };
        Object.keys(newStatus).forEach((key) => {
          if (key.startsWith(`${taskIndex}_`)) {
            delete newStatus[key];
          }
        });
        return newStatus;
      });

      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        Object.keys(newErrors).forEach((key) => {
          if (key.startsWith(`activity_${taskIndex}_`)) {
            delete newErrors[key];
          }
        });
        return newErrors;
      });
    }
  };

  const canAddActivity = (taskIndex) => {
    const task = tasks[taskIndex];
    if (!task || task.activities.length === 0) return false;

    const lastActivityIndex = task.activities.length - 1;
    return (
      activityValidationStatus[`${taskIndex}_${lastActivityIndex}`] === true
    );
  };

  const addActivity = (taskIndex) => {
    if (!canAddActivity(taskIndex)) {
      notify({
        title: "Warning",
        message: "Please validate the previous activity first",
      });
      return;
    }

    setTasks((prevTasks) => {
      const newTasks = [...prevTasks];
      const currentTask = { ...newTasks[taskIndex] };

      currentTask.activities = [
        ...currentTask.activities,
        {
          activityName: "",
          department: "", 
          employee: "",
          startDate: currentTask.startDate || "",
          startTime: currentTask.startTime || "",
          endDate: currentTask.endDate || "",
          endTime: currentTask.endTime || "",
          duration: "",
          description: "",
          points: [],
        },
      ];

      newTasks[taskIndex] = currentTask;
      return newTasks;
    });
  };

  const removeActivity = async (taskIndex, activityIndex) => {
    if (tasks[taskIndex].activities.length === 1) {
      notify({
        title: "Warning",
        message: "At least one activity is required",
      });
      return;
    }

    const ok = await confirm({
      type: "error",
      title: "Are you sure you want to delete this activity?",
      message: "This action cannot be undone. Are you sure?",
      confirmText: "Yes, Delete",
      cancelText: "Cancel",
    });

    if (!ok) return;

    setTasks((prevTasks) => {
      const newTasks = [...prevTasks];
      const currentTask = { ...newTasks[taskIndex] };
      const newActivities = currentTask.activities.filter(
        (_, idx) => idx !== activityIndex,
      );
      currentTask.activities = newActivities;
      currentTask.canAddNext = calculateCanAddNext(currentTask);
      newTasks[taskIndex] = currentTask;
      return newTasks;
    });

    // Re-index validation statuses
    setActivityValidationStatus((prev) => {
      const newStatus = { ...prev };
      delete newStatus[`${taskIndex}_${activityIndex}`];

      const remainingActivities = tasks[taskIndex].activities.length - 1;
      for (let i = activityIndex; i < remainingActivities; i++) {
        const oldKey = `${taskIndex}_${i + 1}`;
        const newKey = `${taskIndex}_${i}`;
        if (newStatus[oldKey] !== undefined) {
          newStatus[newKey] = newStatus[oldKey];
          delete newStatus[oldKey];
        }
      }
      return newStatus;
    });

    setValidatingActivity((prev) => {
      const newValidating = { ...prev };
      delete newValidating[`${taskIndex}_${activityIndex}`];
      return newValidating;
    });

    setActivityPointInput((prev) => {
      const newInput = { ...prev };
      delete newInput[`${taskIndex}_${activityIndex}`];
      return newInput;
    });

    setShowActivityPointsInput((prev) => {
      const newShow = { ...prev };
      delete newShow[`${taskIndex}_${activityIndex}`];
      return newShow;
    });

    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith(`activity_${taskIndex}_${activityIndex}`)) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
  };

  const removeTask = async (taskIndex) => {
    if (tasks.length < 1) {
      notify({
        title: "Warning",
        message: "There is no task to remove",
      });
      return;
    }

    const ok = await confirm({
      type: "error",
      title: "Are you sure you want to delete this task?",
      message: "This action cannot be undone. Are you sure?",
      confirmText: "Yes, Delete",
      cancelText: "Cancel",
    });

    if (!ok) return;

    const taskToRemove = tasks[taskIndex];

    if (taskToRemove.isExisting && taskToRemove.id) {
      setDeletedTaskIds((prev) => [...prev, taskToRemove.id]);
    }

    setTasks((prevTasks) => prevTasks.filter((_, idx) => idx !== taskIndex));

    if (expandedTask === taskIndex) {
      setExpandedTask(0);
    } else if (expandedTask > taskIndex) {
      setExpandedTask((prev) => prev - 1);
    }

    setShowActivityBox((prev) => {
      const newShowActivityBox = {};
      Object.keys(prev).forEach((key) => {
        const index = parseInt(key);
        if (index < taskIndex) {
          newShowActivityBox[index] = prev[key];
        } else if (index > taskIndex) {
          newShowActivityBox[index - 1] = prev[key];
        }
      });
      return newShowActivityBox;
    });
  };

  const handleAddTask = () => {
    const lastTaskIndex = tasks.length - 1;
    if (tasks.length > 0 && !tasks[lastTaskIndex].canAddNext) {
      notify({
        title: "Warning",
        message:
          "Please complete all required fields in the current task before adding a new one",
      });
      return;
    }

    const userData =
      sessionStorage.getItem("user") || localStorage.getItem("user");
    const employeeId = userData ? JSON.parse(userData).userName : "";

    const newTaskCreatedAt = new Date().toISOString();
    const effectiveDates = getEffectiveDates(
      newTaskCreatedAt,
      startDate,
      endDate,
      correctionDate,
    );

    const newTask = {
      id: Date.now(),
      activities: [],
      employeeID: employeeId,
      createdAt: newTaskCreatedAt,
      startDate: getMinDate(
        startDate,
        endDate,
        correctionDate,
        newTaskCreatedAt,
      ),
      endDate: effectiveDates.endDate,
      startTime: "",
      endTime: "",
      duration: "",
      taskName: "",
      description: "",
      employees: "",
      department: "",
      canAddNext: false,
      percentage: 0,
      isLocked: false,
      isExisting: false,
      points: [],
    };

    setTasks((prevTasks) => [...prevTasks, newTask]);
    setExpandedTask(tasks.length);
  };

  const toggleExpandTask = (index) => {
    setExpandedTask((prev) => (prev === index ? null : index));
  };

  useEffect(() => {
    const userData =
      sessionStorage.getItem("user") || localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        const employeeId = parsedUser.id;
        setTasks((prevTasks) =>
          prevTasks.map((task) => ({
            ...task,
            employeeID: employeeId,
          })),
        );
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }

    const fetchExistingTasks = async () => {
      if (!projectId) return;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/tasks/project/${projectId}`,
        );
        const data = await response.json();

        const hasDeadlineCrossed = isDeadlineCrossed();
        setDeadlineCrossed(hasDeadlineCrossed);

        if (response.ok && data.success && data.tasks.length > 0) {
          const formattedTasks = data.tasks.map((task, index) => {
            const hasActivityProgress = task.activities?.some(
              (act) => (act.percentage || 0) > 0,
            );
            const isTaskLocked =
              (task.percentage || 0) > 0 || hasActivityProgress;

            let employeeString = "";
            if (Array.isArray(task.employee) && task.employee.length > 0) {
              employeeString = task.employee[0];
            } else if (typeof task.employee === "string") {
              employeeString = task.employee;
            }

            const formattedActivities = (task.activities || []).map((act) => ({
              ...act,
              department: act.department || "", 
            }));

            return {
              id: task._id || index + 1,
              activities: formattedActivities,
              employeeID: task.employeeID || "",
              createdAt: task.createdAt || task.createdDate || "",
              startDate: task.startDate || "",
              endDate: task.endDate || "",
              startTime: task.startTime || "",
              endTime: task.endTime || "",
              duration: calculateDuration(
                task.startDate,
                task.startTime,
                task.endDate,
                task.endTime,
              ),
              taskName: task.taskName || "",
              description: task.description || "",
              employees: employeeString,
              department: task.department || "",
              canAddNext: true,
              percentage: task.percentage || 0,
              isLocked: isTaskLocked,
              isExisting: true,
              points: task.points || [],
            };
          });

          setTasks(formattedTasks);
          setHasExistingTasks(formattedTasks.length > 0);
          setDeadlineCrossed(false);
          setExpandedTask(formattedTasks.length > 1 ? null : 0);

          const validationStatus = {};
          formattedTasks.forEach((task, taskIdx) => {
            if (task.activities && task.activities.length > 0) {
              task.activities.forEach((_, actIdx) => {
                validationStatus[`${taskIdx}_${actIdx}`] = true;
              });
            }
          });
          setActivityValidationStatus(validationStatus);

          const activityBoxes = {};
          formattedTasks.forEach((task, taskIdx) => {
            if (task.activities && task.activities.length > 0) {
              activityBoxes[taskIdx] = true;
            }
          });
          setShowActivityBox(activityBoxes);

          setTimeout(() => {
            initialTasksRef.current = JSON.stringify(formattedTasks);
          }, 100);
        } else {
          if (hasDeadlineCrossed) {
            setTasks([]);
          }
          setTimeout(() => {
            initialTasksRef.current = JSON.stringify(tasks);
          }, 100);
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setTimeout(() => {
          initialTasksRef.current = JSON.stringify(tasks);
        }, 100);
      }
    };

    fetchExistingTasks();
  }, [projectId]);

  useEffect(() => {
    if (initialTasksRef.current === null) {
      initialTasksRef.current = JSON.stringify(tasks);
      return;
    }

    const currentState = JSON.stringify(tasks);
    const hasChanges =
      currentState !== initialTasksRef.current || deletedTaskIds.length > 0;
    setHasUnsavedChanges(hasChanges);
  }, [tasks, deletedTaskIds]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleSubmit = async () => {
    if (Object.keys(validationErrors).length > 0) {
      notify({
        title: "Warning",
        message: "Please fix all validation errors before submitting",
      });
      return;
    }

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      if (!task.taskName) {
        notify({
          title: "Warning",
          message: `Please enter a name for Task ${i + 1}`,
        });
        return;
      }
      if (!task.startDate || !task.endDate) {
        notify({
          title: "Warning",
          message: `Please complete date for Task ${i + 1}`,
        });
        return;
      }
      if (task.activities.length === 0 && !task.employees) {
        notify({
          title: "Warning",
          message: `Please assign an employee for Task ${i + 1}`,
        });
        return;
      }

      if (task.activities.length > 0) {
        const hasUnvalidated = task.activities.some((_, idx) => {
          return !activityValidationStatus[`${i}_${idx}`];
        });
        if (hasUnvalidated) {
          notify({
            title: "Warning",
            message: `Task ${i + 1}: All activities must be validated`,
          });
          return;
        }
      }
    }

    try {
      setIsSubmitting(true);

      if (deletedTaskIds.length > 0) {
        for (const taskId of deletedTaskIds) {
          try {
            await fetch(
              `${import.meta.env.VITE_API_BASE_URL}/tasks/${taskId}`,
              {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
              },
            );
          } catch (error) {
            console.error("Error deleting task:", error);
          }
        }
      }

      const tasksToCreate = tasks
        .filter((task) => !task.isExisting)
        .map((task) => ({
          ...task,
          employees: task.employees,
          department: task.department,
        }));

      const updatedTasks = tasks.filter((task) => task.isExisting);

      if (tasksToCreate.length > 0) {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/tasks/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, tasks: tasksToCreate }),
        });
      }

      for (const task of updatedTasks) {
        const employeeToSend = task.activities.length > 0 ? "" : task.employees;

        await fetch(`${import.meta.env.VITE_API_BASE_URL}/tasks/${task.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskName: task.taskName,
            description: task.description,
            startDate: task.startDate,
            startTime: task.startTime,
            endDate: task.endDate,
            endTime: task.endTime,
            employee: employeeToSend,
            department: task.department,
            activities: task.activities,
            points: task.points,
          }),
        });
      }

      notify({
        title: "Success",
        message: "Tasks saved successfully!",
      });

      setHasUnsavedChanges(false);
      initialTasksRef.current = null;
      setDeletedTaskIds([]);
      onBack();
    } catch (error) {
      console.error("Error submitting tasks:", error);
      notify({
        title: "Error",
        message: "Failed to connect to server",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative bg-white rounded-xl flex flex-col h-full min-h-full overflow-hidden p-[0.6vw]">
      <div className="flex justify-between pb-[0.3vw]">
        <h2 className="text-gray-700 text-[0.9vw] font-medium">
          {hasExistingTasks ? "Manage Tasks" : "Create Tasks"}
        </h2>

        <div className="flex items-center gap-[1vw]">
          <span
            className="mr-[0.5vw] mt-[0.1vw]"
            onClick={async () => {
              if (hasUnsavedChanges) {
                const ok = await confirm({
                  type: "warning",
                  title: "Unsaved Changes",
                  message:
                    "You have unsaved changes. Do you want to exit without saving?",
                  confirmText: "Yes, Exit",
                  cancelText: "Stay",
                });

                if (ok) {
                  onBack();
                }
              } else {
                onBack();
              }
            }}
          >
            <img
              src={closeIcon}
              alt=""
              className="w-[1.5vw] h-[1.5vw] cursor-pointer transition-transform duration-200 hover:scale-110"
            />
          </span>
        </div>
      </div>

      {correctionDate && correctionDate.length > 0 && (
        <div className="px-[0.8vw] py-[0.3vw] mx-[1vw] my-[0.7vw] mb-0 bg-orange-50 border-2 border-orange-300 rounded-lg">
          <h3 className="text-[0.85vw] font-normal text-orange-800 mb-[0.05vw]">
            Correction Periods
          </h3>
          <div className="space-y-[0.4vw]">
            {correctionDate.map((correction, idx) => (
              <div
                key={idx}
                className="text-[0.75vw] text-orange-700 bg-orange-50 px-[0.6vw] py-[0.1vw] rounded flex gap-[1vw] items-center"
              >
                <span className="font-medium">
                  Corrections -{correctionDate.length - idx}
                </span>
                <div>
                  Start: {new Date(correction.createdAt).toLocaleDateString()}
                </div>
                <div>End: {new Date(correction.date).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-h-[90%] h-auto w-[100%] overflow-y-auto pr-[0.3vw] pt-[0.3vw]">
        {deadlineCrossed && tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-[1.5vw] py-[2vw]">
            <div className="text-center">
              <div className="text-[1.2vw] font-semibold text-red-600 mb-[0.5vw]">
                ⚠️ Deadline Crossed
              </div>
              <div className="text-[0.85vw] text-gray-700 mb-[1vw] max-w-[44vw]">
                You have already crossed the deadline for this project. To add
                new tasks, you need to extend the deadline in the{" "}
                <span className="font-semibold text-blue-600">
                  Activity → Outcomes sections
                </span>{" "}
                of this project.
              </div>
              <button
                onClick={onBack}
                className="bg-blue-600 hover:bg-blue-700 text-white px-[1vw] cursor-pointer py-[0.4vw] rounded-lg text-[0.8vw] font-medium transition-colors"
              >
                Go Back to Project
              </button>
            </div>
          </div>
        ) : (
          tasks.map((task, taskIndex) => (
            <div
              key={task.id || taskIndex}
              className="flex flex-col rounded-b-lg bg-white"
            >
              <div className="relative flex items-start">
                <div className="flex flex-col items-center mt-[1.25vw] px-[0.7vw]">
                  <div className="w-[1.9vw] h-[1.8vw] text-[0.85vw] flex items-center justify-center rounded-full border bg-white inset-0 z-[1] border-blue-400 text-blue-400 font-bold">
                    {String(taskIndex + 1).padStart(2, "0")}
                  </div>
                  <div className="absolute overflow-hidden border-l border-dashed text-blue-400 border-blue-500 flex-1 h-[100%]"></div>
                </div>

                <div
                  className={`flex-1 rounded-xl overflow-hidden bg-white mt-[1vw] ${
                    isTaskAfterCorrection(task.createdAt, correctionDate)
                      ? "border-2 border-orange-300"
                      : "border border-gray-400"
                  }`}
                >
                  <div
                    className={`${
                      isTaskAfterCorrection(task.createdAt, correctionDate)
                        ? "bg-orange-100"
                        : "bg-[#F2F2F2]"
                    } h-10 flex items-center justify-between px-[0.8vw] cursor-pointer`}
                    onClick={() => toggleExpandTask(taskIndex)}
                  >
                    <div className="flex items-center gap-[0.5vw]">
                      <span className="font-medium text-gray-700 text-[0.8vw]">
                        Task {taskIndex + 1}
                      </span>
                    </div>

                    {expandedTask !== taskIndex && (
                      <div className="flex justify-between w-[80%]">
                        <div className="min-w-[20%]">
                          <p className="w-fit text-[0.75vw]">
                            {task.taskName || "Untitled Task"}
                          </p>
                        </div>

                        <div className="min-w-[20%]">
                          {task.activities.length > 0 && (
                            <p className="w-fit bg-white px-[0.4vw] py-[0.2vw] text-[0.75vw] rounded-full">
                              {`Group Task's: ${task.activities.length}`}
                            </p>
                          )}
                        </div>

                        <div className="min-w-[20%]">
                          {task.startDate && (
                            <p className="w-fit bg-blue-100 px-[0.4vw] py-[0.2vw] text-[0.75vw] rounded-full">
                              {`Start: ${task.startDate}`}
                            </p>
                          )}
                        </div>

                        <div className="min-w-[20%]">
                          {task.endDate && (
                            <p className="w-fit bg-blue-100 px-[0.4vw] py-[0.2vw] text-[0.75vw] rounded-full">
                              {`End: ${task.endDate}`}
                            </p>
                          )}
                        </div>

                        <div className="min-w-[20%]"></div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {!isFieldLocked(taskIndex) ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTask(taskIndex);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-100 rounded-full p-[0.4vw]"
                        >
                          <Trash2 className="w-[1vw] h-[1vw] cursor-pointer" />
                        </button>
                      ) : (
                        <span className="min-w-[1.9vw] min-h-[1.9vw]"></span>
                      )}
                      <span className="text-gray-700 transition-all duration-500 ease-in-out hover:bg-gray-300 rounded-full p-[0.2vw]">
                        <img
                          src={downArrow}
                          alt="Toggle"
                          className={`w-[1.4vw] h-[1.4vw] inline-block transform transition-transform duration-500 ease-in-out ${
                            expandedTask === taskIndex
                              ? "rotate-180"
                              : "rotate-0"
                          }`}
                        />
                      </span>
                    </div>
                  </div>

                  <div
                    className={`transition-all duration-800 ease-in-out overflow-hidden ${
                      expandedTask === taskIndex
                        ? "max-h-[2000px] opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="grid grid-cols-6 gap-[1vw] pt-[0.8vw] px-[1.2vw]">
                      <div className="col-span-2">
                        <label className="block text-[0.8vw] text-gray-700 mb-[0.3vw]">
                          Task name
                        </label>
                        <input
                          type="text"
                          value={task.taskName}
                          disabled={
                            !canEditEndDate(
                              task.endDate,
                              endDate,
                              correctionDate,
                              task.createdAt,
                            )
                          }
                          onChange={(e) =>
                            handleTaskDateChange(
                              taskIndex,
                              "taskName",
                              e.target.value,
                            )
                          }
                          placeholder="Type here"
                          className="w-full border text-black border-gray-300 rounded-full px-[0.8vw] py-[0.3vw] text-[0.75vw] focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-[0.8vw] text-gray-700 mb-[0.3vw]">
                          Start date
                        </label>
                        <input
                          type="date"
                          value={
                            task.startDate ||
                            getMinDate(
                              startDate,
                              endDate,
                              correctionDate,
                              task.createdAt,
                            )
                          }
                          disabled={isFieldLocked(taskIndex)}
                          min={getMinDate(
                            startDate,
                            endDate,
                            correctionDate,
                            task.createdAt,
                          )}
                          max={(() => {
                            const effectiveDates = getEffectiveDates(
                              task.createdAt,
                              startDate,
                              endDate,
                              correctionDate,
                            );
                            return new Date(effectiveDates.endDate)
                              .toISOString()
                              .split("T")[0];
                          })()}
                          onChange={(e) =>
                            handleTaskDateChange(
                              taskIndex,
                              "startDate",
                              e.target.value,
                            )
                          }
                          className="w-full border border-gray-300 rounded-full px-[0.8vw] py-[0.3vw] text-[0.75vw] text-gray-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-[0.8vw] text-gray-700 mb-[0.3vw]">
                          Start time
                        </label>
                        <div className="relative w-full">
                          <input
                            type="time"
                            value={task.startTime}
                            disabled={isFieldLocked(taskIndex)}
                            onChange={(e) =>
                              handleTaskDateChange(
                                taskIndex,
                                "startTime",
                                e.target.value,
                              )
                            }
                            className={`w-full border border-gray-300 rounded-full px-[0.8vw] py-[0.3vw] text-[0.75vw] text-gray-600 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                              task.startTime ? "pr-[2vw]" : ""
                            }`}
                          />
                          {task.startTime && !isFieldLocked(taskIndex) && (
                            <button
                              type="button"
                              onClick={() =>
                                handleTaskDateChange(taskIndex, "startTime", "")
                              }
                              className="absolute right-[0.6vw] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[0.8vw] text-gray-700 mb-[0.3vw]">
                          End date
                        </label>
                        <input
                          type="date"
                          value={
                            task.endDate ||
                            (() => {
                              const effectiveDates = getEffectiveDates(
                                task.createdAt,
                                startDate,
                                endDate,
                                correctionDate,
                              );
                              return effectiveDates.endDate;
                            })()
                          }
                          disabled={
                            !canEditEndDate(
                              task.endDate,
                              endDate,
                              correctionDate,
                              task.createdAt,
                            )
                          }
                          min={getMinDate(
                            startDate,
                            endDate,
                            correctionDate,
                            task.createdAt,
                          )}
                          max={(() => {
                            const effectiveDates = getEffectiveDates(
                              task.createdAt,
                              startDate,
                              endDate,
                              correctionDate,
                            );
                            return new Date(effectiveDates.endDate)
                              .toISOString()
                              .split("T")[0];
                          })()}
                          onChange={(e) =>
                            handleTaskDateChange(
                              taskIndex,
                              "endDate",
                              e.target.value,
                            )
                          }
                          className="w-full border border-gray-300 rounded-full px-[0.8vw] py-[0.3vw] text-[0.75vw] text-gray-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-[0.8vw] text-gray-700 mb-[0.3vw]">
                          End time
                        </label>
                        <div className="relative w-full">
                          <input
                            type="time"
                            value={task.endTime || ""}
                            disabled={
                              !canEditEndDate(
                                task.endDate,
                                endDate,
                                correctionDate,
                                task.createdAt,
                              )
                            }
                            onChange={(e) =>
                              handleTaskDateChange(
                                taskIndex,
                                "endTime",
                                e.target.value,
                              )
                            }
                            className={`w-full border border-gray-300 rounded-full px-[0.8vw] py-[0.3vw] text-[0.75vw] text-gray-600 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                              task.endTime ? "pr-[2vw]" : ""
                            }`}
                          />
                          {task.endTime &&
                            canEditEndDate(
                              task.endDate,
                              endDate,
                              correctionDate,
                              task.createdAt,
                            ) && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleTaskDateChange(taskIndex, "endTime", "")
                                }
                                className="absolute right-[0.6vw] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                              >
                                ✕
                              </button>
                            )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-[1vw] pt-[0.8vw] px-[1.2vw]">
                      <div className="col-span-2">
                        <label className="block text-[0.8vw] text-gray-700 mb-[0.3vw]">
                          Description
                        </label>
                        <textarea
                          value={task.description}
                          disabled={
                            !canEditEndDate(
                              task.endDate,
                              endDate,
                              correctionDate,
                              task.createdAt,
                            )
                          }
                          onChange={(e) =>
                            handleTaskDateChange(
                              taskIndex,
                              "description",
                              e.target.value,
                            )
                          }
                          placeholder="Enter description here"
                          className="w-full border text-black border-gray-300 rounded-lg px-[0.8vw] py-[0.3vw] text-[0.75vw] focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      {!showActivityBox[taskIndex] && (
                        <div className=" col-span-3 flex items-start gap-[1vw] mt-[1vw] pr-[1vw]">
                          <div className="flex-1">
                            <label className="block text-[0.8vw] text-gray-700 mb-[0.3vw]">
                              Select Department
                            </label>
                            <select
                              value={task.department || ""}
                              disabled={isFieldLocked(taskIndex)}
                              onChange={(e) =>
                                handleTaskDateChange(
                                  taskIndex,
                                  "department",
                                  e.target.value,
                                )
                              }
                              className="rounded-full border border-gray-300 text-gray-700 px-[0.8vw] py-[0.3vw] text-[0.75vw] cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed w-full"
                            >
                              <option value="" disabled>
                                Select Department
                              </option>
                              {getUniqueDepartments().map((dept) => (
                                <option key={dept} value={dept}>
                                  {dept}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex-1">
                            <label className="block text-[0.8vw] text-gray-700 mb-[0.3vw]">
                              Assign Employee
                            </label>
                            <select
                              value={task.employees || ""}
                              disabled={
                                isFieldLocked(taskIndex) || !task.department
                              }
                              onChange={(e) =>
                                handleTaskEmployeeChange(
                                  taskIndex,
                                  e.target.value,
                                )
                              }
                              className="rounded-full border border-gray-300 text-gray-700 px-[0.8vw] py-[0.3vw] text-[0.75vw] cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed w-full"
                            >
                              <option value="" disabled>
                                {task.department
                                  ? "Select Employee"
                                  : "Select Department First"}
                              </option>
                              {task.department &&
                                getEmployeesByDepartment(task.department).map(
                                  (emp) => (
                                    <option key={emp.id} value={emp.id}>
                                      {emp.name}
                                    </option>
                                  ),
                                )}
                            </select>
                          </div>

                          <div className="relative flex-1">
                            <label className="block text-[0.8vw] text-gray-700 mb-[0.3vw]">
                              Task points
                            </label>
                            <div className="absolute b-0 border border-gray-300 rounded-lg p-[0.5vw] bg-white">
                              <div className="flex gap-[0.5vw]">
                                <input
                                  type="text"
                                  value={taskPointInput[taskIndex] || ""}
                                  onChange={(e) =>
                                    setTaskPointInput((prev) => ({
                                      ...prev,
                                      [taskIndex]: e.target.value,
                                    }))
                                  }
                                  placeholder="Add a point..."
                                  className="flex-1 border border-gray-300 rounded-full px-[0.8vw] py-[0.3vw] text-[0.75vw] focus:outline-none"
                                  onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                      handleAddTaskPoint(taskIndex);
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => handleAddTaskPoint(taskIndex)}
                                  className="bg-blue-600 text-white px-[0.8vw] py-[0.3vw] rounded-full text-[0.7vw] hover:bg-blue-700 cursor-pointer"
                                >
                                  Add
                                </button>
                              </div>

                              {task.points && task.points.length > 0 && (
                                <div className="space-y-[0.3vw] max-h-[8vw] overflow-y-auto ">
                                  {task.points.map((point, pointIndex) => (
                                    <div
                                      key={pointIndex}
                                      className={`flex ${
                                        task.points.length - 1 !== pointIndex
                                          ? "border-b border-gray-300"
                                          : ""
                                      } ${
                                        pointIndex === 0 ? "mt-[0.6vw]" : ""
                                      } items-center py-[0.3vw] gap-[0.5vw] group`}
                                    >
                                      <span
                                        className={`flex-1 text-[0.75vw] ${
                                          point.completed
                                            ? "line-through text-gray-400"
                                            : "text-gray-700"
                                        }`}
                                      >
                                        {point.text}
                                      </span>
                                      <button
                                        onClick={() =>
                                          handleRemoveTaskPoint(
                                            taskIndex,
                                            pointIndex,
                                          )
                                        }
                                        className="group-hover:opacity-100 text-red-500 hover:text-red-700 text-[0.9vw] cursor-pointer pr-[1vw]"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-[1.2vw] grid grid-cols-1 items-start gap-4">
                      <div className="flex flex-col gap-[0.4vw]">
                        <p className="text-gray-400 text-[0.75vw]">
                          Want to break this task into smaller steps?
                        </p>
                        <button
                          onClick={() => toggleActivity(taskIndex)}
                          disabled={
                            (!showActivityBox[taskIndex] &&
                              !canEnableActivityButton(taskIndex)) ||
                            isFieldLocked(taskIndex)
                          }
                          className={`${
                            showActivityBox[taskIndex]
                              ? "bg-red-600 hover:bg-red-700 cursor-pointer"
                              : canEnableActivityButton(taskIndex) &&
                                  !isFieldLocked(taskIndex)
                                ? "bg-gray-800 hover:bg-gray-500 cursor-pointer"
                                : "bg-gray-400 cursor-not-allowed"
                          } text-white px-[0.8vw] py-[0.4vw] text-[0.7vw] rounded-full w-fit`}
                        >
                          {showActivityBox[taskIndex]
                            ? "Remove Group Task's"
                            : "Add Group Task ( Optional )"}
                        </button>
                      </div>

                      <div className="p-[1.2vw] pt-0 pl-0 flex flex-col col-span-3">
                        {showActivityBox[taskIndex] && (
                          <div>
                            <p className="text-gray-700 my-[0.6vw]">
                              Group Task's:
                            </p>
                            <div className="rounded-t-lg overflow-hidden border border-gray-300">
                              <table className="w-full text-[0.75vw]">
                                <thead>
                                  <tr className="bg-[#E2EBFF] text-gray-600">
                                    <th className="border border-gray-300 py-[0.3vw] px-[0.2vw]">
                                      No
                                    </th>
                                    <th className="border border-gray-300 py-[0.4vw] px-[0.3vw]">
                                      Task Name
                                    </th>
                                    <th className="border border-gray-300 py-[0.4vw] px-[0.3vw]">
                                      Department
                                    </th>
                                    <th className="border border-gray-300 py-[0.4vw] px-[0.3vw]">
                                      Employee
                                    </th>
                                    <th className="border border-gray-300 py-[0.4vw] px-[0.3vw]">
                                      Start date/time
                                    </th>
                                    <th className="border border-gray-300 py-[0.4vw] px-[0.3vw]">
                                      End date/time
                                    </th>
                                    <th className="border border-gray-300 py-[0.4vw] px-[0.3vw]">
                                      Description
                                    </th>
                                    <th className="border border-gray-300 py-[0.4vw] px-[0.3vw]">
                                      Points
                                    </th>
                                    <th className="border border-gray-300 py-[0.4vw] px-[0.3vw]">
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {task.activities.map((activity, i) => {
                                    const isActivityLocked = isFieldLocked(
                                      taskIndex,
                                      i,
                                    );
                                    return (
                                      <tr
                                        key={i}
                                        className="bg-white items-center text-gray-600"
                                      >
                                        <td className="border border-gray-300 text-center p-[0.4vw]">
                                          {String(i + 1).padStart(2, "0")}
                                        </td>
                                        <td className="border border-gray-300 p-[0.4vw]">
                                          <input
                                            type="text"
                                            value={activity.activityName}
                                            onChange={(e) =>
                                              handleActivityChange(
                                                taskIndex,
                                                i,
                                                "activityName",
                                                e.target.value,
                                              )
                                            }
                                            placeholder="Activity name"
                                            className="w-full px-[0.3vw] py-[0.3vw] border-none rounded focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            disabled={
                                              !canEditEndDate(
                                                activity.endDate,
                                                endDate,
                                                correctionDate,
                                                task.createdAt,
                                              )
                                            }
                                          />
                                        </td>
                                        <td className="border border-gray-300 p-[0.4vw]">
                                          <select
                                            value={activity.department || ""}
                                            onChange={(e) =>
                                              handleActivityChange(
                                                taskIndex,
                                                i,
                                                "department",
                                                e.target.value,
                                              )
                                            }
                                            className="w-full px-[0.3vw] py-[0.3vw] border-none rounded focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            disabled={isActivityLocked}
                                          >
                                            <option value="" disabled>
                                              Select Dept
                                            </option>
                                            {getUniqueDepartments().map(
                                              (dept) => (
                                                <option key={dept} value={dept}>
                                                  {dept}
                                                </option>
                                              ),
                                            )}
                                          </select>
                                        </td>
                                        <td className="border border-gray-300 p-[0.4vw]">
                                          <select
                                            value={activity.employee}
                                            onChange={(e) =>
                                              handleActivityChange(
                                                taskIndex,
                                                i,
                                                "employee",
                                                e.target.value,
                                              )
                                            }
                                            className="w-full px-[0.3vw] py-[0.3vw] border-none rounded focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            disabled={
                                              isActivityLocked ||
                                              !activity.department
                                            }
                                          >
                                            <option value="" disabled>
                                              {activity.department
                                                ? "Select employee"
                                                : "Select Dept first"}
                                            </option>
                                            {activity.department &&
                                              getEmployeesByDepartment(
                                                activity.department,
                                              ).map((emp) => (
                                                <option
                                                  key={emp.id}
                                                  value={emp.id}
                                                >
                                                  {emp.name}
                                                </option>
                                              ))}
                                          </select>
                                        </td>
                                        <td className="border border-gray-300 p-[0.4vw]">
                                          <div className="flex gap-1">
                                            <input
                                              type="date"
                                              value={activity.startDate}
                                              min={
                                                task.startDate || getTodayDate()
                                              }
                                              max={task.endDate || ""}
                                              onChange={(e) =>
                                                handleActivityChange(
                                                  taskIndex,
                                                  i,
                                                  "startDate",
                                                  e.target.value,
                                                )
                                              }
                                              className="w-1/2 px-[0.3vw] py-[0.3vw] border-none rounded focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                                              disabled={isActivityLocked}
                                            />
                                            <div className="relative w-1/2">
                                              <input
                                                type="time"
                                                value={activity.startTime}
                                                onChange={(e) =>
                                                  handleActivityChange(
                                                    taskIndex,
                                                    i,
                                                    "startTime",
                                                    e.target.value,
                                                  )
                                                }
                                                className={`w-full px-[0.3vw] py-[0.3vw] border-none rounded focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
                                                  activity.startTime
                                                    ? "pr-[1.5vw]"
                                                    : ""
                                                }`}
                                                disabled={isActivityLocked}
                                              />
                                              {activity.startTime &&
                                                !isActivityLocked && (
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      handleActivityChange(
                                                        taskIndex,
                                                        i,
                                                        "startTime",
                                                        "",
                                                      )
                                                    }
                                                    className="absolute right-[0.3vw] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-[0.7vw]"
                                                  >
                                                    ✕
                                                  </button>
                                                )}
                                            </div>
                                          </div>
                                        </td>
                                        <td className="border border-gray-300 p-[0.4vw]">
                                          <div className="flex gap-1">
                                            <input
                                              type="date"
                                              value={activity.endDate}
                                              onChange={(e) =>
                                                handleActivityChange(
                                                  taskIndex,
                                                  i,
                                                  "endDate",
                                                  e.target.value,
                                                )
                                              }
                                              min={
                                                task.startDate || getTodayDate()
                                              }
                                              max={task.endDate || ""}
                                              className="w-1/2 px-[0.3vw] py-[0.3vw] border-none rounded focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                                              disabled={
                                                !canEditEndDate(
                                                  activity.endDate,
                                                  endDate,
                                                  correctionDate,
                                                  task.createdAt,
                                                )
                                              }
                                            />
                                            <div className="relative w-1/2">
                                              <input
                                                type="time"
                                                value={activity.endTime}
                                                onChange={(e) =>
                                                  handleActivityChange(
                                                    taskIndex,
                                                    i,
                                                    "endTime",
                                                    e.target.value,
                                                  )
                                                }
                                                className={`w-full px-[0.3vw] py-[0.3vw] border-none rounded focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
                                                  activity.endTime
                                                    ? "pr-[1.5vw]"
                                                    : ""
                                                }`}
                                                disabled={
                                                  !canEditEndDate(
                                                    activity.endDate,
                                                    task.endDate,
                                                  )
                                                }
                                              />
                                              {activity.endTime &&
                                                canEditEndDate(
                                                  activity.endDate,
                                                  task.endDate,
                                                ) && (
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      handleActivityChange(
                                                        taskIndex,
                                                        i,
                                                        "endTime",
                                                        "",
                                                      )
                                                    }
                                                    className="absolute right-[0.3vw] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-[0.7vw]"
                                                  >
                                                    ✕
                                                  </button>
                                                )}
                                            </div>
                                          </div>
                                        </td>

                                        <td className="border border-gray-300 p-[0.4vw]">
                                          <input
                                            type="text"
                                            value={activity.description}
                                            onChange={(e) =>
                                              handleActivityChange(
                                                taskIndex,
                                                i,
                                                "description",
                                                e.target.value,
                                              )
                                            }
                                            placeholder="Description"
                                            className="w-full px-[0.3vw] py-[0.3vw] border-none rounded focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            disabled={
                                              !canEditEndDate(
                                                activity.endDate,
                                                endDate,
                                                correctionDate,
                                                task.createdAt,
                                              )
                                            }
                                          />
                                        </td>

                                        <td className="border border-gray-300 p-[0.4vw]">
                                          <div className="flex items-center gap-[0.3vw]">
                                            <button
                                              onClick={() =>
                                                setShowActivityPointsInput(
                                                  (prev) => ({
                                                    ...prev,
                                                    [`${taskIndex}_${i}`]:
                                                      !prev[
                                                        `${taskIndex}_${i}`
                                                      ],
                                                  }),
                                                )
                                              }
                                              className="bg-blue-600 text-white px-[0.5vw] py-[0.2vw] rounded-full text-[0.65vw] hover:bg-blue-700 cursor-pointer whitespace-nowrap"
                                            >
                                              {activity.points?.length > 0
                                                ? `${activity.points.length} Points`
                                                : "Add Points"}
                                            </button>
                                          </div>

                                          {showActivityPointsInput[
                                            `${taskIndex}_${i}`
                                          ] && (
                                            <div className="absolute z-10 mt-[0.3vw] right-[02vw] bg-white border border-gray-300 rounded-lg shadow-lg p-[0.5vw] w-[15vw]">
                                              <div className="flex gap-[0.3vw] mb-[0.5vw]">
                                                <input
                                                  type="text"
                                                  value={
                                                    activityPointInput[
                                                      `${taskIndex}_${i}`
                                                    ] || ""
                                                  }
                                                  onChange={(e) =>
                                                    setActivityPointInput(
                                                      (prev) => ({
                                                        ...prev,
                                                        [`${taskIndex}_${i}`]:
                                                          e.target.value,
                                                      }),
                                                    )
                                                  }
                                                  placeholder="Add point..."
                                                  className="flex-1 border border-gray-300 rounded-full px-[0.5vw] py-[0.2vw] text-[0.7vw] focus:outline-none"
                                                  onKeyPress={(e) => {
                                                    if (e.key === "Enter") {
                                                      handleAddActivityPoint(
                                                        taskIndex,
                                                        i,
                                                      );
                                                    }
                                                  }}
                                                />
                                                <button
                                                  onClick={() =>
                                                    handleAddActivityPoint(
                                                      taskIndex,
                                                      i,
                                                    )
                                                  }
                                                  className="bg-blue-600 text-white flex items-center px-[0.5vw] rounded-full text-[0.95vw] hover:bg-blue-700 cursor-pointer"
                                                >
                                                  +
                                                </button>
                                              </div>

                                              {activity.points &&
                                                activity.points.length > 0 && (
                                                  <div className="space-y-[0.3vw] max-h-[10vw] overflow-y-auto">
                                                    {activity.points.map(
                                                      (point, pointIdx) => (
                                                        <div
                                                          key={pointIdx}
                                                          className="flex items-center gap-[0.3vw] group"
                                                        >
                                                          <span
                                                            className={`flex-1 text-[0.7vw] ${
                                                              point.completed
                                                                ? "line-through text-gray-400"
                                                                : "text-gray-700"
                                                            }`}
                                                          >
                                                            {point.text}
                                                          </span>
                                                          <button
                                                            onClick={() =>
                                                              handleRemoveActivityPoint(
                                                                taskIndex,
                                                                i,
                                                                pointIdx,
                                                              )
                                                            }
                                                            className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 text-[0.65vw] cursor-pointer"
                                                          >
                                                            ✕
                                                          </button>
                                                        </div>
                                                      ),
                                                    )}
                                                  </div>
                                                )}

                                              <button
                                                onClick={() =>
                                                  setShowActivityPointsInput(
                                                    (prev) => ({
                                                      ...prev,
                                                      [`${taskIndex}_${i}`]: false,
                                                    }),
                                                  )
                                                }
                                                className="mt-[0.5vw] w-full text-center text-[0.7vw] text-gray-600 hover:text-gray-800 cursor-pointer"
                                              >
                                                Close
                                              </button>
                                            </div>
                                          )}
                                        </td>

                                        <td className="border border-gray-300 p-[0.4vw]">
                                          <div className="flex items-center justify-center gap-2">
                                            {canEditEndDate(
                                              activity.endDate,
                                              task.endDate,
                                            ) &&
                                            !activityValidationStatus[
                                              `${taskIndex}_${i}`
                                            ] ? (
                                              <>
                                                {validatingActivity[
                                                  `${taskIndex}_${i}`
                                                ] ? (
                                                  <Loader2 className="w-[1.1vw] h-[1.1vw] animate-spin text-blue-600" />
                                                ) : (
                                                  <button
                                                    onClick={() =>
                                                      validateActivity(
                                                        taskIndex,
                                                        i,
                                                      )
                                                    }
                                                    className="text-green-600 hover:text-green-700 cursor-pointer"
                                                    title="Validate activity"
                                                  >
                                                    <Check className="w-[1.1vw] h-[1.1vw]" />
                                                  </button>
                                                )}

                                                {!isActivityLocked && (
                                                  <button
                                                    onClick={() =>
                                                      removeActivity(
                                                        taskIndex,
                                                        i,
                                                      )
                                                    }
                                                    className="text-red-600 hover:text-red-700 cursor-pointer"
                                                    title="Remove activity"
                                                  >
                                                    <X className="w-[1.1vw] h-[1.1vw]" />
                                                  </button>
                                                )}
                                              </>
                                            ) : (
                                              <div className="flex items-center gap-2">
                                                {canEditEndDate(
                                                  activity.endDate,
                                                  task.endDate,
                                                ) ? (
                                                  <>
                                                    <span className="text-green-600 text-[0.7vw]">
                                                      Validated
                                                    </span>
                                                    {!isActivityLocked && (
                                                      <button
                                                        onClick={() =>
                                                          removeActivity(
                                                            taskIndex,
                                                            i,
                                                          )
                                                        }
                                                        className="text-red-600 hover:text-red-700 cursor-pointer"
                                                        title="Remove activity"
                                                      >
                                                        <X className="w-[1vw] h-[1vw]" />
                                                      </button>
                                                    )}
                                                  </>
                                                ) : (
                                                  <span className="text-green-600 text-[0.7vw]">
                                                    Validated
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                            <button
                              onClick={() => addActivity(taskIndex)}
                              disabled={!canAddActivity(taskIndex)}
                              className={`border rounded-full mt-[0.8vw] px-[0.6vw] py-[0.3vw] text-[0.7vw] ${
                                canAddActivity(taskIndex)
                                  ? "text-gray-600 bg-gray-200 hover:bg-gray-300 cursor-pointer"
                                  : "text-gray-400 bg-gray-100 cursor-not-allowed"
                              }`}
                            >
                              + Activity {task.activities.length + 1}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {!deadlineCrossed && (
        <div className="flex items-center pl-[0.7vw] gap-[0.6vw] mt-[0.8vw]">
          <div className="w-[1.9vw] h-[1.8vw] text-[0.85vw] bg-white inset-0 z-[1] flex items-center justify-center rounded-full border border-blue-400 text-blue-400 font-bold">
            {String(tasks.length + 1).padStart(2, "0")}
          </div>
          <button
            onClick={handleAddTask}
            disabled={
              deadlineCrossed ||
              (tasks.length > 0 && !tasks[tasks.length - 1].canAddNext) ||
              (() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (correctionDate && correctionDate.length > 0) {
                  const latestCorrection =
                    correctionDate[correctionDate.length - 1];
                  const correctionEnd = new Date(latestCorrection.date);
                  correctionEnd.setHours(23, 59, 59, 999);

                  if (today <= correctionEnd) {
                    return false;
                  }
                }

                const projectEnd = new Date(endDate);
                projectEnd.setHours(23, 59, 59, 999);
                return today > projectEnd;
              })()
            }
            className={`flex items-center text-white px-[0.5vw] py-[0.3vw] text-[0.75vw] rounded-full ${
              (tasks.length > 0 && !tasks[tasks.length - 1].canAddNext) ||
              (() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (correctionDate && correctionDate.length > 0) {
                  const latestCorrection =
                    correctionDate[correctionDate.length - 1];
                  const correctionEnd = new Date(latestCorrection.date);
                  correctionEnd.setHours(23, 59, 59, 999);
                  if (today <= correctionEnd) return false;
                }

                const projectEnd = new Date(endDate);
                projectEnd.setHours(23, 59, 59, 999);
                return today > projectEnd;
              })()
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gray-700 hover:bg-gray-500 cursor-pointer"
            }`}
          >
            + Add task {tasks.length + 1}
          </button>
        </div>
      )}

      <div className="flex justify-end gap-[0.7vw] absolute bottom-[0.6vw] right-[0.6vw]">
        <button
          className="bg-gray-300 px-[0.9vw] py-[0.3vw] text-[0.8vw] rounded-full text-gray-700 hover:bg-gray-200 cursor-pointer"
          onClick={async () => {
            if (hasUnsavedChanges) {
              const ok = await confirm({
                type: "warning",
                title: "Unsaved Changes",
                message:
                  "You have unsaved changes. Do you want to exit without saving?",
                confirmText: "Yes, Exit",
                cancelText: "Stay",
              });

              if (ok) {
                onBack();
              }
            } else {
              onBack();
            }
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`${
            isSubmitting
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-500 cursor-pointer"
          } text-white px-[1.3vw] py-[0.3vw] text-[0.8vw] rounded-full flex items-center gap-2`}
        >
          {isSubmitting && (
            <Loader2 className="w-[1.2vw] h-[1.2vw] animate-spin" />
          )}
          {isSubmitting ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}