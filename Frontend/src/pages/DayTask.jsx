import React, { useState, useEffect } from "react";
import { X, Clock, Calendar, Play, StopCircle } from "lucide-react";
import { useNotification } from "../components/NotificationContext";

const DayTask = ({ isOpen, onClose, onTaskStarted }) => {
  const { notify } = useNotification();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTaskIds, setActiveTaskIds] = useState([]); // Changed to array
  const [startingTasks, setStartingTasks] = useState({}); // Track starting state per task

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  // Get employee ID from session storage
  const getEmployeeId = () => {
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    return userData.userName || null;
  };

  // Get employee name from session storage
  const getEmployeeName = () => {
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    return userData.employeeName || "User";
  };

  // Format date for display (DD-MM-YYYY)
  const formatDisplayDate = (dateString) => {
    if (!dateString) return "-";
    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`;
  };

  // Format time for display
  const formatDisplayTime = (timeString) => {
    if (!timeString) return "-";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Check if task is for today
  const isToday = (dateString) => {
    if (!dateString) return false;
    const today = new Date();
    const taskDate = new Date(dateString);
    return (
      taskDate.getDate() === today.getDate() &&
      taskDate.getMonth() === today.getMonth() &&
      taskDate.getFullYear() === today.getFullYear()
    );
  };

  // Fetch active tasks on mount
  const fetchActiveTasks = async () => {
    const employeeId = getEmployeeId();
    if (!employeeId) return;

    try {
      const response = await fetch(
        `${API_URL}/employee-tasks/active-tasks/${employeeId}` // Changed endpoint
      );
      const data = await response.json();

      if (data.success && data.data) {
        const activeIds = data.data.map(task => task.taskId);
        setActiveTaskIds(activeIds);
        // Notify parent component if needed
        if (onTaskStarted && data.data.length > 0) {
          onTaskStarted(activeIds);
        }
      }
    } catch (error) {
      console.error("Error fetching active tasks:", error);
    }
  };

  // Fetch all "In Progress" tasks
  const fetchInProgressTasks = async () => {
    setLoading(true);
    const employeeId = getEmployeeId();

    if (!employeeId) {
      notify({
        title: "Error",
        message: "Employee ID not found. Please login again.",
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/employee-tasks/my-tasks/${employeeId}`
      );
      const data = await response.json();

      if (data.success) {
        // Filter for ALL "In Progress" tasks (no date restriction)
        const inProgressTasks = data.data.filter(
          (task) => task.status === "In Progress"
        );
        setTasks(inProgressTasks);
      } else {
        notify({
          title: "Error",
          message: data.error || "Failed to fetch tasks",
        });
      }
    } catch (error) {
      console.error("Error fetching in progress tasks:", error);
      notify({
        title: "Error",
        message: "Failed to fetch tasks",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchActiveTasks(); // Changed function name
      fetchInProgressTasks();
    }
  }, [isOpen]);

  // Handle task start
  const handleStartTask = async (task) => {
    setStartingTasks(prev => ({ ...prev, [task.taskId]: true }));

    try {
      // Create activity record in dayReport
      const activityId = `activity_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const response = await fetch(`${API_URL}/employee-tasks/start-task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeID: getEmployeeId(),
          projectId: task.project_id,
          taskId: task.taskId,
          activityId: activityId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Add task to active tasks array
        setActiveTaskIds(prev => [...prev, task.taskId]);
        // Notify parent component
        if (onTaskStarted) {
          onTaskStarted([...activeTaskIds, task.taskId]);
        }
        notify({
          title: "Success",
          message: `You have started working on: ${task.taskName}`,
        });
      } else {
        notify({
          title: "Error",
          message: data.error || "Failed to start task",
        });
      }
    } catch (error) {
      console.error("Error starting task:", error);
      notify({
        title: "Error",
        message: "Failed to start task",
      });
    } finally {
      setStartingTasks(prev => ({ ...prev, [task.taskId]: false }));
    }
  };

  // Handle task removal
  const handleRemoveTask = async (task) => {
    setStartingTasks(prev => ({ ...prev, [task.taskId]: true }));

    try {
      const response = await fetch(
        `${API_URL}/employee-tasks/remove-active-task`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employeeID: getEmployeeId(),
            taskId: task.taskId,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Remove task from active tasks array
        setActiveTaskIds(prev => prev.filter(id => id !== task.taskId));
        // Notify parent component
        if (onTaskStarted) {
          onTaskStarted(activeTaskIds.filter(id => id !== task.taskId));
        }
        notify({
          title: "Success",
          message: `Stopped working on: ${task.taskName}`,
        });
      } else {
        notify({
          title: "Error",
          message: data.error || "Failed to remove task",
        });
      }
    } catch (error) {
      console.error("Error removing task:", error);
      notify({
        title: "Error",
        message: "Failed to remove task",
      });
    } finally {
      setStartingTasks(prev => ({ ...prev, [task.taskId]: false }));
    }
  };

  // Get active tasks count
  const getActiveTasksCount = () => {
    return activeTaskIds.length;
  };

  // Get active task names for display
  const getActiveTaskNames = () => {
    return tasks
      .filter(task => activeTaskIds.includes(task.taskId))
      .map(task => task.taskName);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-[90vw] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-[1vw] border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-[1.2vw] font-semibold text-gray-800">
              In Progress Tasks
            </h2>
            <p className="text-[0.85vw] text-gray-500 mt-[0.2vw]">
              {getEmployeeName()} • {tasks.length} task{tasks.length !== 1 ? 's' : ''} available • {getActiveTasksCount()} active
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-[0.3vw] hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size="1.2vw" className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-[1vw] overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-[40vh]">
              <div className="animate-spin rounded-full h-[3vw] w-[3vw] border-b-2 border-blue-600"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[40vh] text-gray-500">
              <Calendar size="3vw" className="mb-[1vw] text-gray-300" />
              <p className="text-[1.1vw] font-medium mb-[0.5vw]">
                No tasks in progress
              </p>
              <p className="text-[0.9vw] text-gray-400">
                All your tasks are completed or not started yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1vw]">
              {tasks.map((task) => (
                <div
                  key={task.taskId}
                  className={`bg-white rounded-lg border-2 transition-all cursor-pointer ${
                    activeTaskIds.includes(task.taskId)
                      ? "border-green-500 shadow-lg scale-105"
                      : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                  }`}
                >
                  <div className="p-[1vw]">
                    {/* Company & Project */}
                    <div className="mb-[0.8vw]">
                      <h3 className="text-[0.95vw] font-semibold text-gray-800 mb-[0.3vw] truncate">
                        {task.companyName}
                      </h3>
                      <p className="text-[0.8vw] text-gray-600 truncate">
                        {task.project_name}
                      </p>
                    </div>

                    {/* Task Name */}
                    <div className="mb-[0.8vw]">
                      <div className="flex items-center gap-[0.3vw] mb-[0.3vw]">
                        <div className="w-[0.3vw] h-[0.3vw] bg-blue-500 rounded-full"></div>
                        <span className="text-[0.75vw] font-medium text-gray-500 uppercase">
                          Task
                        </span>
                      </div>
                      <p className="text-[0.9vw] font-medium text-gray-900">
                        {task.taskName}
                      </p>
                    </div>

                    {/* Time Info */}
                    <div className="grid grid-cols-2 gap-[0.5vw] mb-[0.8vw]">
                      <div className="bg-gray-50 rounded-lg p-[0.5vw]">
                        <div className="flex items-center gap-[0.3vw] mb-[0.2vw]">
                          <Calendar size="0.8vw" className="text-gray-500" />
                          <span className="text-[0.7vw] text-gray-500">
                            Start
                          </span>
                        </div>
                        <p className="text-[0.75vw] font-medium text-gray-900">
                          {formatDisplayDate(task.startDate)}
                        </p>
                        <p className="text-[0.7vw] text-gray-600">
                          {formatDisplayTime(task.startTime)}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-[0.5vw]">
                        <div className="flex items-center gap-[0.3vw] mb-[0.2vw]">
                          <Calendar size="0.8vw" className="text-gray-500" />
                          <span className="text-[0.7vw] text-gray-500">
                            End
                          </span>
                        </div>
                        <p className="text-[0.75vw] font-medium text-gray-900">
                          {formatDisplayDate(task.endDate)}
                        </p>
                        <p className="text-[0.7vw] text-gray-600">
                          {formatDisplayTime(task.endTime)}
                        </p>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mb-[0.8vw]">
                      <div className="flex items-center justify-between mb-[0.3vw]">
                        <span className="text-[0.75vw] text-gray-600">
                          Progress
                        </span>
                        <span className="text-[0.75vw] font-medium text-gray-900">
                          {task.progress || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-[0.4vw]">
                        <div
                          className="bg-blue-600 h-[0.4vw] rounded-full transition-all"
                          style={{ width: `${task.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="mb-[0.8vw]">
                      <span className="inline-block px-[0.5vw] py-[0.2vw] rounded-full text-[0.7vw] font-medium bg-blue-100 text-blue-700">
                        {task.status}
                      </span>
                    </div>

                    {/* Description */}
                    {task.description && (
                      <div className="mb-[0.8vw]">
                        <p className="text-[0.75vw] text-gray-600 line-clamp-2">
                          {task.description}
                        </p>
                      </div>
                    )}

                    {/* Action Button */}
                    {activeTaskIds.includes(task.taskId) ? (
                      <button
                        onClick={() => handleRemoveTask(task)}
                        disabled={startingTasks[task.taskId]}
                        className="w-full py-[0.5vw] rounded-lg text-[0.85vw] font-medium transition-all flex items-center justify-center gap-[0.3vw] bg-red-600 text-white hover:bg-red-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <StopCircle size="1vw" />
                        <span>Remove Task</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartTask(task)}
                        disabled={startingTasks[task.taskId]}
                        className="w-full py-[0.5vw] rounded-lg text-[0.85vw] font-medium transition-all flex items-center justify-center gap-[0.3vw] bg-blue-600 text-white hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Play size="1vw" />
                        <span>Start Now</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Show when there are active tasks */}
        {getActiveTasksCount() > 0 && (
          <div className="flex items-center justify-between px-[1vw] py-[0.8vw] border-t border-gray-200 bg-green-50 flex-shrink-0">
            <div className="flex items-center gap-[0.5vw]">
              <div className="w-[0.5vw] h-[0.5vw] bg-green-500 rounded-full animate-pulse"></div>
              <div className="flex flex-col">
                <span className="text-[0.85vw] text-gray-700">
                  Currently working on {getActiveTasksCount()} task{getActiveTasksCount() !== 1 ? 's' : ''}
                </span>
                <span className="text-[0.75vw] text-gray-600">
                  {getActiveTaskNames().slice(0, 3).join(", ")}
                  {getActiveTaskNames().length > 3 && " and more..."}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-[1vw] py-[0.4vw] text-[0.85vw] text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DayTask;