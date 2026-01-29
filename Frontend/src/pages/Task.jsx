import React, { useState, useEffect } from "react";
import { Edit, X, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useNotification } from "../components/NotificationContext";
import DayTask from "./DayTask";

const RECORDS_PER_PAGE = 8;

const Task = () => {
  const { notify } = useNotification();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Update Task Modal
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [updateFormData, setUpdateFormData] = useState({
    progress: 0,
    status: "In Progress",
    workDone: "",
  });

  // View Task Modal
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewTask, setViewTask] = useState(null);

  // Day Task Modal
  const [isDayTaskOpen, setIsDayTaskOpen] = useState(false);

  // Active Task Tracking - Changed to array for multiple active tasks
  const [activeTaskIds, setActiveTaskIds] = useState([]);

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

  // Fetch active tasks on mount
  const fetchActiveTasks = async () => {
    const employeeId = getEmployeeId();
    if (!employeeId) return;

    try {
      const response = await fetch(
        `${API_URL}/employee-tasks/active-tasks/${employeeId}` // Use plural endpoint
      );
      const data = await response.json();

      if (data.success && data.data) {
        // Extract task IDs from the array of active tasks
        const activeIds = data.data.map(task => task.taskId);
        setActiveTaskIds(activeIds);
        console.log("Active task IDs fetched:", activeIds);
      } else {
        setActiveTaskIds([]);
      }
    } catch (error) {
      console.error("Error fetching active tasks:", error);
      setActiveTaskIds([]);
    }
  };

  useEffect(() => {
    fetchMyTasks();
    fetchActiveTasks();
  }, [isDayTaskOpen]);

  const fetchMyTasks = async () => {
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
        setTasks(data.data);
      } else {
        notify({
          title: "Error",
          message: data.error || "Failed to fetch tasks",
        });
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      notify({
        title: "Error",
        message: "Failed to fetch tasks",
      });
    } finally {
      setLoading(false);
    }
  };

  // View Task Handler
  const handleViewClick = (task) => {
    setViewTask(task);
    setIsViewModalOpen(true);
  };

  const handleViewModalClose = () => {
    setIsViewModalOpen(false);
    setViewTask(null);
  };

  const handleUpdateClick = (task) => {
    setSelectedTask(task);
    setUpdateFormData({
      progress: task.progress || 0,
      status: task.status || "In Progress",
      workDone: task.workDone || "",
    });
    setIsUpdateModalOpen(true);
  };

  const handleUpdateInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "status" && value === "Complete") {
      setUpdateFormData((prev) => ({
        ...prev,
        status: value,
        progress: 100,
      }));
    } else {
      setUpdateFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleProgressChange = (e) => {
    const value = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
    setUpdateFormData((prev) => ({
      ...prev,
      progress: value,
      // Automatically set status to "Complete" when progress reaches 100
      status: value === 100 ? "Complete" : prev.status === "Complete" ? "In Progress" : prev.status,
    }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(
        `${API_URL}/employee-tasks/tasks/${selectedTask.project_id}/${selectedTask.taskId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateFormData),
        }
      );

      const data = await response.json();

      if (data.success) {
        notify({
          title: "Success",
          message: "Task updated successfully!",
        });
        setIsUpdateModalOpen(false);
        setSelectedTask(null);
        fetchMyTasks();

        // If task is completed, remove it from active tasks
        if (updateFormData.status === "Complete") {
          setActiveTaskIds(prev => prev.filter(id => id !== selectedTask.taskId));
        }
        
        // Refresh active tasks list
        fetchActiveTasks();
      } else {
        notify({
          title: "Error",
          message: data.error || "Failed to update task",
        });
      }
    } catch (error) {
      console.error("Error updating task:", error);
      notify({
        title: "Error",
        message: "Failed to update task",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setIsUpdateModalOpen(false);
    setSelectedTask(null);
  };

  // Handle task started/stopped from DayTask component
  const handleTaskStarted = (taskIds) => {
    setActiveTaskIds(taskIds || []);
    console.log("Active tasks updated from DayTask:", taskIds);
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

  // Format timestamp for history table
  const formatHistoryTimestamp = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    return `${day}-${month}-${year} ${hour12}:${minutes} ${ampm}`;
  };

  // Check if task is overdue
  const isTaskOverdue = (endDate, endTime) => {
    if (!endDate) return false;

    try {
      const now = new Date();
      const taskEndDateTime = new Date(`${endDate}T${endTime || "23:59"}`);
      return now > taskEndDateTime;
    } catch (error) {
      return false;
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "Complete":
        return "bg-green-100 text-green-700";
      case "In Progress":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Filtering and pagination
  const filteredTasks = tasks.filter(
    (task) =>
      task.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.taskName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.project_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTasks.length / RECORDS_PER_PAGE);
  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
  const endIndex = startIndex + RECORDS_PER_PAGE;
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

  const handlePrevious = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <div className="text-black min-h-[92%] max-h-[100%] w-[100%] max-w-[100%] overflow-hidden">
      <div className="w-[100%] h-[91vh] flex flex-col gap-[1vh]">
        {/* Table Section */}
        <div className="bg-white rounded-xl shadow-sm h-[100%] flex flex-col">
          {/* Header with Employee Name */}
          <div className="flex items-center justify-between p-[0.8vw] h-[10%] flex-shrink-0">
            <div className="flex items-center gap-[0.5vw]">
              <span className="font-medium text-[0.95vw] text-gray-800">
                My Tasks
              </span>
              <span className="text-[0.85vw] text-gray-500">
                ({filteredTasks.length})
              </span>
              <span className="text-[0.8vw] text-gray-400 ml-[0.5vw]">
                • Assigned to: {getEmployeeName()}
              </span>
              {activeTaskIds.length > 0 && (
                <span className="text-[0.8vw] text-green-600 ml-[0.5vw]">
                  • Active: {activeTaskIds.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-[0.5vw]">
              <button
                onClick={() => setIsDayTaskOpen(true)}
                className="px-[1vw] py-[0.4vw] text-[0.85vw] text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Today Task
              </button>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-[1vw] pr-[1vw] py-[0.24vw] rounded-full text-[0.9vw] bg-gray-200 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 min-h-0">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-[2vw] w-[2vw] border-b-2 border-blue-600"></div>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p className="text-[1.1vw] font-medium mb-[0.5vw]">
                  No tasks assigned to you
                </p>
                <p className="text-[1vw] text-gray-400">
                  Tasks assigned to you will appear here
                </p>
              </div>
            ) : (
              <div className="mr-[0.8vw] mb-[0.8vw] ml-[0.8vw] border border-gray-300 rounded-xl overflow-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-[#E2EBFF] sticky top-0">
                    <tr>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                        S.NO
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                        Company Name
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                        Project Name
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                        Task Name
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                        Start Date
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                        End Date
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                        Start Time
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                        End Time
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                        Status
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                        Progress
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                        Description
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTasks.map((task, index) => (
                      <tr
                        key={task.taskId}
                        className={`hover:bg-gray-50 transition-colors ${
                          activeTaskIds.includes(task.taskId)
                            ? "border-2 border-green-500 bg-green-50"
                            : task.isHold
                            ? "bg-amber-100"
                            : isTaskOverdue(task.endDate, task.endTime) &&
                              task.status !== "Complete"
                            ? "bg-red-100"
                            : ""
                        }`}
                      >
                        <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-center text-gray-900 border border-gray-300">
                          {startIndex + index + 1}
                        </td>
                        <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-900 border border-gray-300">
                          {task.companyName}
                        </td>
                        <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-900 border border-gray-300">
                          {task.project_name}
                        </td>
                        <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-900 border border-gray-300">
                          {task.taskName}
                        </td>
                        <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-center text-gray-900 border border-gray-300">
                          {formatDisplayDate(task.startDate)}
                        </td>
                        <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-center text-gray-900 border border-gray-300">
                          {formatDisplayDate(task.endDate)}
                        </td>
                        <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-center text-gray-900 border border-gray-300">
                          {formatDisplayTime(task.startTime)}
                        </td>
                        <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-center text-gray-900 border border-gray-300">
                          {formatDisplayTime(task.endTime)}
                        </td>
                        <td className="px-[0.7vw] py-[0.56vw] text-center border border-gray-300">
                          <span
                            className={`px-[0.5vw] py-[0.2vw] rounded-full text-[0.75vw] font-medium ${getStatusColor(
                              task.status || "In Progress"
                            )}`}
                          >
                            {task.status || "In Progress"}
                          </span>
                        </td>
                        <td className="px-[0.7vw] py-[0.56vw] text-center border border-gray-300">
                          <div className="flex items-center gap-[0.3vw] justify-center">
                            <div className="w-[4vw] bg-gray-200 rounded-full h-[0.5vw]">
                              <div
                                className="bg-blue-600 h-[0.5vw] rounded-full transition-all"
                                style={{ width: `${task.progress || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-[0.75vw] font-medium text-gray-700">
                              {task.progress || 0}%
                            </span>
                          </div>
                        </td>
                        <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-900 border border-gray-300 max-w-[10vw]">
                          <div className="truncate" title={task.description}>
                            {task.description || "-"}
                          </div>
                        </td>
                        <td className="px-[0.7vw] py-[0.52vw] border border-gray-300">
                          <div className="flex justify-center items-center gap-[0.3vw]">
                            {/* View Button */}
                            <button
                              onClick={() => handleViewClick(task)}
                              className="p-[0.6vw] text-blue-600 hover:bg-blue-50 rounded-full transition-colors cursor-pointer"
                              title="View Task"
                            >
                              <Eye size={"1.02vw"} />
                            </button>
                            {/* Update Button - Only show for active tasks */}
                            {activeTaskIds.includes(task.taskId) && (
                              <button
                                onClick={() => handleUpdateClick(task)}
                                className="p-[0.6vw] text-green-600 hover:bg-green-50 rounded-full transition-colors cursor-pointer"
                                title="Update Task"
                              >
                                <Edit size={"1.02vw"} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {!loading && filteredTasks.length > 0 && (
            <div className="flex items-center justify-between px-[0.8vw] py-[0.5vw] h-[10%]">
              <div className="text-[0.85vw] text-gray-600">
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, filteredTasks.length)} of{" "}
                {filteredTasks.length} entries
              </div>
              <div className="flex items-center gap-[0.5vw]">
                <button
                  onClick={handlePrevious}
                  disabled={currentPage === 1}
                  className="px-[0.8vw] py-[0.4vw] flex items-center gap-[0.3vw] bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-[0.85vw] transition cursor-pointer"
                >
                  <ChevronLeft size={"1vw"} />
                  Previous
                </button>
                <span className="text-[0.85vw] text-gray-600 px-[0.5vw]">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                  className="px-[0.8vw] py-[0.4vw] flex items-center gap-[0.3vw] bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-[0.85vw] transition cursor-pointer"
                >
                  Next
                  <ChevronRight size={"1vw"} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Task Modal */}
      {isViewModalOpen && viewTask && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[55vw] max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-[1vw] border-b border-gray-200 flex-shrink-0">
              <div>
                <h2 className="text-[1.1vw] font-semibold text-gray-800">
                  Task Details
                </h2>
                <p className="text-[0.8vw] text-gray-500 mt-[0.2vw]">
                  {viewTask.taskName}
                </p>
              </div>
              <button
                onClick={handleViewModalClose}
                className="p-[0.3vw] hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size="1.2vw" className="text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-[1vw] overflow-y-auto flex-1">
              {/* Basic Information Table */}
              <div className="mb-[1.5vw]">
                <h3 className="text-[0.95vw] font-semibold text-gray-800 mb-[0.5vw]">
                  Basic Information
                </h3>
                <table className="w-full border-collapse border border-gray-300">
                  <tbody>
                    <tr className="bg-gray-50">
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] font-medium text-gray-700 border border-gray-300 w-[30%]">
                        Company Name
                      </td>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] text-gray-900 border border-gray-300">
                        {viewTask.companyName || "-"}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] font-medium text-gray-700 border border-gray-300">
                        Project Name
                      </td>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] text-gray-900 border border-gray-300">
                        {viewTask.project_name || "-"}
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] font-medium text-gray-700 border border-gray-300">
                        Task Name
                      </td>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] text-gray-900 border border-gray-300">
                        {viewTask.taskName}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] font-medium text-gray-700 border border-gray-300">
                        Description
                      </td>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] text-gray-900 border border-gray-300 whitespace-pre-wrap">
                        {viewTask.description || "No description"}
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] font-medium text-gray-700 border border-gray-300">
                        Hold Status
                      </td>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] border border-gray-300">
                        <span
                          className={`inline-block px-[0.5vw] py-[0.2vw] rounded-full text-[0.75vw] font-medium ${
                            viewTask.isHold
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {viewTask.isHold ? "On Hold" : "Active"}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] font-medium text-gray-700 border border-gray-300">
                        Active Status
                      </td>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] border border-gray-300">
                        <span
                          className={`inline-block px-[0.5vw] py-[0.2vw] rounded-full text-[0.75vw] font-medium ${
                            activeTaskIds.includes(viewTask.taskId)
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {activeTaskIds.includes(viewTask.taskId)
                            ? "Currently Active"
                            : "Not Active"}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Schedule Table */}
              <div className="mb-[1.5vw]">
                <h3 className="text-[0.95vw] font-semibold text-gray-800 mb-[0.5vw]">
                  Schedule
                </h3>
                <table className="w-full border-collapse border border-gray-300">
                  <tbody>
                    <tr className="bg-gray-50">
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] font-medium text-gray-700 border border-gray-300 w-[30%]">
                        Start Date
                      </td>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] text-gray-900 border border-gray-300">
                        {formatDisplayDate(viewTask.startDate)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] font-medium text-gray-700 border border-gray-300">
                        End Date
                      </td>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] text-gray-900 border border-gray-300">
                        {formatDisplayDate(viewTask.endDate)}
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] font-medium text-gray-700 border border-gray-300">
                        Start Time
                      </td>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] text-gray-900 border border-gray-300">
                        {formatDisplayTime(viewTask.startTime)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] font-medium text-gray-700 border border-gray-300">
                        End Time
                      </td>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] text-gray-900 border border-gray-300">
                        {formatDisplayTime(viewTask.endTime)}
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] font-medium text-gray-700 border border-gray-300">
                        Assigned To
                      </td>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] text-gray-900 border border-gray-300">
                        {viewTask.assignedTo?.employeeName || getEmployeeName()}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] font-medium text-gray-700 border border-gray-300">
                        Assigned By
                      </td>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] text-gray-900 border border-gray-300">
                        {viewTask.createdBy?.employeeName || "-"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* History Table */}
              {viewTask.history && viewTask.history.length > 0 && (
                <div>
                  <h3 className="text-[0.95vw] font-semibold text-gray-800 mb-[0.5vw]">
                    Update History
                  </h3>
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <table className="w-full border-collapse">
                      <thead className="bg-[#E2EBFF]">
                        <tr>
                          <th className="px-[0.7vw] py-[0.5vw] text-[0.85vw] font-medium text-gray-800 border-b border-gray-300 text-left">
                            Date & Time
                          </th>
                          <th className="px-[0.7vw] py-[0.5vw] text-[0.85vw] font-medium text-gray-800 border-b border-gray-300 text-center">
                            Status
                          </th>
                          <th className="px-[0.7vw] py-[0.5vw] text-[0.85vw] font-medium text-gray-800 border-b border-gray-300 text-center">
                            Progress
                          </th>
                          <th className="px-[0.7vw] py-[0.5vw] text-[0.85vw] font-medium text-gray-800 border-b border-gray-300 text-left">
                            Work Done
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewTask.history.map((entry, index) => (
                          <tr
                            key={index}
                            className={
                              index % 2 === 0 ? "bg-gray-50" : "bg-white"
                            }
                          >
                            <td className="px-[0.7vw] py-[0.5vw] text-[0.8vw] text-gray-900 border-b border-gray-300">
                              {formatHistoryTimestamp(entry.timestamp)}
                            </td>
                            <td className="px-[0.7vw] py-[0.5vw] text-center border-b border-gray-300">
                              <span
                                className={`inline-block px-[0.4vw] py-[0.15vw] rounded-full text-[0.7vw] font-medium ${getStatusColor(
                                  entry.status
                                )}`}
                              >
                                {entry.status}
                              </span>
                            </td>
                            <td className="px-[0.7vw] py-[0.5vw] text-[0.8vw] text-center text-gray-900 border-b border-gray-300">
                              <span className="font-medium">
                                {entry.progress}%
                              </span>
                            </td>
                            <td className="px-[0.7vw] py-[0.5vw] text-[0.8vw] text-gray-900 border-b border-gray-300">
                              {entry.workDone || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-[0.5vw] px-[1vw] py-[1vw] border-t border-gray-200 flex-shrink-0">
              <button
                onClick={handleViewModalClose}
                className="px-[1vw] py-[0.4vw] text-[0.85vw] text-white bg-black rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Task Modal */}
      {isUpdateModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[45vw] max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-[1vw] border-b border-gray-200 flex-shrink-0">
              <div>
                <h2 className="text-[1.1vw] font-semibold text-gray-800">
                  Update Task
                </h2>
                <p className="text-[0.8vw] text-gray-500 mt-[0.2vw]">
                  {selectedTask.taskName}
                </p>
              </div>
              <button
                onClick={handleModalClose}
                className="p-[0.3vw] hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={"1.2vw"} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={handleUpdateSubmit}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="p-[1vw] overflow-y-auto flex-1">
                <div className="space-y-[1vw]">
                  {/* Task Name (Read Only) */}
                  <div>
                    <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.3vw]">
                      Task Name
                    </label>
                    <input
                      type="text"
                      value={selectedTask.taskName}
                      disabled
                      className="w-full px-[0.6vw] py-[0.4vw] text-[0.85vw] border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    />
                  </div>

                  {/* Description (Read Only) */}
                  <div>
                    <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.3vw]">
                      Description
                    </label>
                    <textarea
                      value={selectedTask.description || "No description"}
                      disabled
                      rows="3"
                      className="w-full px-[0.6vw] py-[0.4vw] text-[0.85vw] border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed resize-none"
                    />
                  </div>

                  <div className="">
                    {/* Status */}
                    <div>
                      <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.3vw]">
                        Status <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="status"
                        value={updateFormData.status}
                        onChange={handleUpdateInputChange}
                        required
                        className="w-full px-[0.6vw] py-[0.4vw] text-[0.85vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="In Progress">In Progress</option>
                        <option value="Complete">Complete</option>
                      </select>
                    </div>

                    {/* Progress */}
                    <div>
                      <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.3vw]">
                        Progress (0-100) <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-[0.5vw]">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={updateFormData.progress}
                          onChange={handleProgressChange}
                          disabled={updateFormData.status === "Complete"}
                          className="flex-1 h-[0.4vw] bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={updateFormData.progress}
                          onChange={handleProgressChange}
                          disabled={updateFormData.status === "Complete"}
                          className="w-[4vw] px-[0.4vw] py-[0.3vw] text-[0.85vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-center"
                        />
                        <span className="text-[0.85vw] font-medium text-gray-700">
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Work Done */}
                  <div>
                    <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.3vw]">
                      Work Done
                    </label>
                    <textarea
                      name="workDone"
                      value={updateFormData.workDone}
                      onChange={handleUpdateInputChange}
                      rows="4"
                      className="w-full px-[0.6vw] py-[0.4vw] text-[0.85vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-none"
                      placeholder="Describe the work completed..."
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-[0.5vw] px-[1vw] py-[1vw] border-t border-gray-200 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleModalClose}
                  disabled={submitting}
                  className="px-[1vw] py-[0.4vw] text-[0.85vw] text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-[1vw] py-[0.4vw] text-[0.85vw] text-white bg-black rounded-lg hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-[0.3vw] min-w-[5vw] justify-center"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-[1vw] w-[1vw] border-b-2 border-white"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    "Update Task"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DayTask Modal */}
      <DayTask 
        isOpen={isDayTaskOpen} 
        onClose={() => setIsDayTaskOpen(false)} 
        onTaskStarted={handleTaskStarted}
      />
    </div>
  );
};

export default Task;