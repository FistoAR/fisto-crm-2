import React, { useState, useEffect, useRef } from "react";
import {
  Edit,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  AlertCircle,
  ClipboardCheck,
  Calendar,
  Search,
  Play,
} from "lucide-react";
import { useNotification } from "../../NotificationContext";
import AddTask from "./AddTask";

const RECORDS_PER_PAGE = 8;

const ViewTask = () => {
  const { notify } = useNotification();

  const getUserInfo = () => {
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    return {
      designation: userData.designation || "",
      userName: userData.userName || "",
      employeeName: userData.employeeName || "",
    };
  };

  const userInfo = getUserInfo();
  const isProjectHead = userInfo.designation === "Project Head";
  const isRestrictedRole = ["3D", "Software Developer", "UI/UX"].includes(
    userInfo.designation
  );

  const [tasks, setTasks] = useState([]);
  const [todayStartedTasks, setTodayStartedTasks] = useState([]); // ✅ NEW: Today's started tasks
  const [loading, setLoading] = useState(false);
  const [todayLoading, setTodayLoading] = useState(false); // ✅ NEW: Loading state for today tab
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);

  // ✅ Tab state - "all" or "today"
  const [activeTab, setActiveTab] = useState("all");

  // ✅ Filter states
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");

  // View Task Modal
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewTask, setViewTask] = useState(null);

  // AddTask Modal for Editing
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Delete Confirmation Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTask, setDeleteTask] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchAllTasks();
    fetchAllEmployees();
    fetchTodayStartedTasks(); // ✅ NEW: Fetch today's started tasks
  }, []);

  // ✅ Reset pagination when filters or tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedEmployee, selectedProject, selectedDate, activeTab]);

  // ✅ Refresh today's tasks when switching to today tab
  useEffect(() => {
    if (activeTab === "today") {
      fetchTodayStartedTasks();
    }
  }, [activeTab]);

  const fetchAllEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/projects/all-employees`);
      const data = await response.json();
      if (data.success) {
        setEmployees(data.data);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchAllTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/employee-tasks/all-tasks`);
      const data = await response.json();
      if (data.success) {
        setTasks(data.data);

        // ✅ Extract unique projects
        const uniqueProjects = [
          ...new Set(data.data.map((task) => task.project_name)),
        ].filter(Boolean);
        setProjects(uniqueProjects);
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

  // ✅ NEW: Fetch today's started tasks from dayReport
  const fetchTodayStartedTasks = async () => {
    setTodayLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/employee-tasks/today-started-tasks`
      );
      const data = await response.json();
      if (data.success) {
        setTodayStartedTasks(data.data);
      } else {
        console.error("Failed to fetch today's started tasks:", data.error);
      }
    } catch (error) {
      console.error("Error fetching today's started tasks:", error);
    } finally {
      setTodayLoading(false);
    }
  };

  const getEmployeeDesignation = (employeeId) => {
    const employee = employees.find((emp) => emp.id === employeeId);
    return employee?.designation || "";
  };

  const handleViewClick = (task) => {
    setViewTask(task);
    setIsViewModalOpen(true);
  };

  const handleEditClick = (task) => {
    setEditingTask(task);
    setIsAddTaskModalOpen(true);
  };

  const handleHoldToggle = async (task) => {
    try {
      const response = await fetch(
        `${API_URL}/employee-tasks/tasks/${task.project_id}/${task.taskId}/hold`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isHold: !task.isHold,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        notify({
          title: "Success",
          message: task.isHold
            ? "Task resumed successfully!"
            : "Task put on hold!",
        });
        fetchAllTasks();
        fetchTodayStartedTasks(); // ✅ Refresh today's tasks too
      } else {
        notify({
          title: "Error",
          message: data.error || "Failed to update task hold status",
        });
      }
    } catch (error) {
      console.error("Error updating hold status:", error);
      notify({
        title: "Error",
        message: "Failed to update task hold status",
      });
    }
  };

  const handleDeleteClick = (task) => {
    setDeleteTask(task);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTask) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `${API_URL}/employee-tasks/tasks/${deleteTask.project_id}/${deleteTask.taskId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.success) {
        notify({
          title: "Success",
          message: "Task deleted successfully!",
        });
        setIsDeleteModalOpen(false);
        setDeleteTask(null);
        fetchAllTasks();
        fetchTodayStartedTasks(); // ✅ Refresh today's tasks too
      } else {
        notify({
          title: "Error",
          message: data.error || "Failed to delete task",
        });
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      notify({
        title: "Error",
        message: "Failed to delete task",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleModalClose = () => {
    setIsViewModalOpen(false);
    setViewTask(null);
  };

  const handleAddTaskClose = () => {
    setIsAddTaskModalOpen(false);
    setEditingTask(null);
    fetchAllTasks();
    fetchTodayStartedTasks(); // ✅ Refresh today's tasks too
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return "-";
    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`;
  };

  const formatDisplayTime = (timeString) => {
    if (!timeString) return "-";

    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;

    return `${hour12}:${minutes} ${ampm}`;
  };

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

  // ✅ Format started time for today's tasks
  const formatStartedTime = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // ✅ Single date filter - checks if selected date is between task start and end date
  const filterByDate = (task) => {
    if (!selectedDate) return true;

    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    const taskStart = new Date(task.startDate);
    taskStart.setHours(0, 0, 0, 0);

    const taskEnd = new Date(task.endDate);
    taskEnd.setHours(23, 59, 59, 999);

    return selected >= taskStart && selected <= taskEnd;
  };

  // ✅ Check if task is overdue
  const isTaskOverdue = (task) => {
    if (!task.endDate || task.status === "Complete") return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const taskEndDate = new Date(task.endDate);
    taskEndDate.setHours(0, 0, 0, 0);

    return taskEndDate < today;
  };

  // ✅ Clear all filters
  const clearAllFilters = () => {
    setSelectedEmployee("all");
    setSelectedProject("all");
    setSelectedDate("");
  };

  // ✅ Get the tasks to display based on active tab
  const getDisplayTasks = () => {
    if (activeTab === "today") {
      // Filter today's started tasks
      return todayStartedTasks.filter((task) => {
        const matchesSearch =
          task.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.taskName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.assignedTo?.employeeName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          task.startedBy?.employeeName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase());

        const matchesEmployee =
          selectedEmployee === "all" ||
          task.assignedTo?.employeeId === selectedEmployee ||
          task.startedBy?.employeeId === selectedEmployee;

        const matchesProject =
          selectedProject === "all" || task.project_name === selectedProject;

        return matchesSearch && matchesEmployee && matchesProject;
      });
    } else {
      // Filter all tasks
      return tasks.filter((task) => {
        const matchesSearch =
          task.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.taskName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.assignedTo?.employeeName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase());

        const matchesEmployee =
          selectedEmployee === "all" ||
          task.assignedTo?.employeeId === selectedEmployee;

        const matchesProject =
          selectedProject === "all" || task.project_name === selectedProject;

        const matchesDate = filterByDate(task);

        // Role-based filter
        if (isProjectHead) {
          return (
            matchesSearch && matchesEmployee && matchesProject && matchesDate
          );
        } else if (isRestrictedRole) {
          const assignedEmployeeId = task.assignedTo?.employeeId;
          if (!assignedEmployeeId) return false;

          const assignedEmployeeDesignation =
            getEmployeeDesignation(assignedEmployeeId);

          const designationMatches =
            assignedEmployeeDesignation === userInfo.designation;
          return (
            matchesSearch &&
            matchesEmployee &&
            matchesProject &&
            matchesDate &&
            designationMatches
          );
        }

        return (
          matchesSearch && matchesEmployee && matchesProject && matchesDate
        );
      });
    }
  };

  const filteredTasks = getDisplayTasks();

  const totalPages = Math.ceil(filteredTasks.length / RECORDS_PER_PAGE);
  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
  const endIndex = startIndex + RECORDS_PER_PAGE;
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

  // ✅ Group paginated tasks by company
  const paginatedGroupedTasks = paginatedTasks.reduce((groups, task) => {
    const company = task.companyName || "Unknown Company";
    if (!groups[company]) {
      groups[company] = [];
    }
    groups[company].push(task);
    return groups;
  }, {});

  const handlePrevious = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

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

  // ✅ Check if filters are active
  const hasActiveFilters =
    selectedEmployee !== "all" ||
    selectedProject !== "all" ||
    selectedDate !== "";

  const activeFilterCount =
    (selectedEmployee !== "all" ? 1 : 0) +
    (selectedProject !== "all" ? 1 : 0) +
    (selectedDate !== "" ? 1 : 0);

  const isLoading = activeTab === "today" ? todayLoading : loading;

  return (
    <>
      <div className="bg-white rounded-b-xl rounded-tr-xl shadow-sm h-[100%] flex flex-col">
        {/* ✅ Tabs Header */}
        <div className="flex items-center border-b border-gray-200 px-[0.8vw] pt-[0.5vw]">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-[1.2vw] py-[0.5vw] text-[0.9vw] font-medium transition-colors relative ${
              activeTab === "all"
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            All Tasks
            <span className="ml-[0.3vw] text-[0.8vw] text-gray-400">
              ({tasks.length})
            </span>
            {activeTab === "all" && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600 rounded-t-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("today")}
            className={`px-[1.2vw] py-[0.5vw] text-[0.9vw] font-medium transition-colors relative flex items-center gap-[0.3vw] ${
              activeTab === "today"
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Play size="0.9vw" />
            Today's Active
            <span
              className={`ml-[0.3vw] px-[0.4vw] py-[0.1vw] text-[0.75vw] rounded-full ${
                activeTab === "today"
                  ? "bg-green-100 text-green-600"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {todayStartedTasks.length}
            </span>
            {activeTab === "today" && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600 rounded-t-full"></div>
            )}
          </button>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-[0.8vw] h-[10%] flex-shrink-0">
          <div className="flex items-center gap-[0.5vw]">
            <span className="font-medium text-[0.95vw] text-gray-800">
              {activeTab === "all" ? "All Tasks" : "Today's Started Tasks"}
            </span>
            <span className="text-[0.85vw] text-gray-500">
              ({filteredTasks.length})
            </span>
            {activeTab === "today" && (
              <span className="text-[0.8vw] text-green-600 bg-green-50 px-[0.5vw] py-[0.15vw] rounded-full flex items-center gap-[0.2vw]">
                <Play size="0.7vw" fill="currentColor" />
                Working Now
              </span>
            )}
          </div>
          <div className="px-[0.8vw] flex items-center gap-[0.7vw] flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search
                className="absolute left-[0.5vw] top-1/2 transform -translate-y-1/2 text-gray-400"
                size="1.1vw"
              />
              <input
                type="text"
                placeholder={
                  activeTab === "today"
                    ? "Search started tasks..."
                    : "Search tasks..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-[2.3vw] pr-[1vw] py-[0.4vw] rounded-lg text-[0.85vw] border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Employee Dropdown */}
            <div className="min-w-[180px]">
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-[0.6vw] py-[0.4vw] text-[0.85vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Project Dropdown */}
            <div className="min-w-[180px]">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-[0.6vw] py-[0.4vw] text-[0.85vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Projects</option>
                {projects.map((project, index) => (
                  <option key={index} value={project}>
                    {project}
                  </option>
                ))}
              </select>
            </div>

            {/* ✅ Single Date Picker - Only show for "All" tab */}
            {activeTab === "all" && (
              <div className="min-w-[180px] relative">
                <Calendar
                  className="absolute left-[0.5vw] top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                  size="1.1vw"
                />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-[2.3vw] pr-[0.6vw] py-[0.4vw] text-[0.85vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Select date"
                />
              </div>
            )}

            {/* Refresh Button for Today tab */}
            {activeTab === "today" && (
              <button
                onClick={fetchTodayStartedTasks}
                disabled={todayLoading}
                className="flex items-center gap-[0.3vw] px-[0.8vw] py-[0.4vw] text-[0.85vw] text-blue-600 hover:text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                {todayLoading ? (
                  <div className="animate-spin rounded-full h-[1vw] w-[1vw] border-b-2 border-blue-600"></div>
                ) : (
                  <svg
                    className="w-[1vw] h-[1vw]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                )}
                Refresh
              </button>
            )}

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-[0.3vw] px-[0.8vw] py-[0.4vw] text-[0.85vw] text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              >
                <X size="1vw" />
                Clear Filters
                <span className="bg-red-600 text-white text-[0.7vw] px-[0.4vw] py-[0.05vw] rounded-full">
                  {activeFilterCount}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Table Section */}
        <div className="flex-1 min-h-0 px-[0.8vw] pb-[0.8vw]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-[2vw] w-[2vw] border-b-2 border-blue-600"></div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="text-[1.1vw] font-medium mb-[0.5vw]">
                {activeTab === "today"
                  ? "No tasks started today"
                  : "No tasks found"}
              </p>
              <p className="text-[1vw] text-gray-400">
                {activeTab === "today"
                  ? "Tasks started via 'Start Now' will appear here"
                  : hasActiveFilters
                  ? "Try adjusting your filters"
                  : "Tasks will appear here once created"}
              </p>
            </div>
          ) : (
            <div className="border border-gray-300 rounded-xl overflow-auto h-full">
              <table className="w-full border-collapse border border-gray-300 min-w-[1800px]">
                <thead className="bg-[#E2EBFF] sticky top-0 z-10">
                  <tr>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 min-w-[50px]">
                      S.NO
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 min-w-[150px]">
                      Company Name
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 min-w-[150px]">
                      Project Name
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 min-w-[150px]">
                      Task Name
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 min-w-[200px]">
                      Description
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 min-w-[100px]">
                      Status
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 min-w-[120px]">
                      Progress
                    </th>
                    {/* ✅ Show "Started At" column for Today tab */}
                    {activeTab === "today" && (
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 min-w-[100px]">
                        Started At
                      </th>
                    )}
                    {/* ✅ Show "Started By" column for Today tab */}
                    {activeTab === "today" && (
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 min-w-[120px]">
                        Started By
                      </th>
                    )}
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 min-w-[100px]">
                      Start Date
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 min-w-[100px]">
                      End Date
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 min-w-[90px]">
                      Start Time
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 min-w-[90px]">
                      End Time
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 min-w-[120px]">
                      Assigned To
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 min-w-[120px]">
                      Assigned By
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 min-w-[150px] sticky right-0 bg-[#E2EBFF] z-10">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* ✅ Grouped by Company Name */}
                  {Object.keys(paginatedGroupedTasks)
                    .sort()
                    .map((companyName) => {
                      const companyTasks = paginatedGroupedTasks[companyName];
                      return (
                        <React.Fragment key={companyName}>
                          {/* Company Header Row */}
                          <tr className="bg-gray-200">
                            <td
                              colSpan={activeTab === "today" ? "16" : "14"}
                              className="px-[0.7vw] py-[0.4vw] text-[0.9vw] font-semibold text-gray-800 border border-gray-300"
                            >
                              {companyName} ({companyTasks.length}{" "}
                              {activeTab === "today" ? "active" : ""} tasks)
                            </td>
                          </tr>
                          {/* Company Tasks */}
                          {companyTasks.map((task) => {
                            const globalIndex = filteredTasks.findIndex(
                              (t) => t.taskId === task.taskId
                            );
                            const isOverdue = isTaskOverdue(task);
                            const isHold = task.isHold;
                            const isActiveToday =
                              task.isActiveToday || activeTab === "today";

                            return (
                              <tr
                                key={task.taskId}
                                className={`transition-colors ${
                                  isActiveToday
                                    ? "bg-green-50 hover:bg-green-100 border-l-4 border-l-green-500"
                                    : isOverdue
                                    ? "bg-red-200 hover:bg-red-100"
                                    : isHold
                                    ? "bg-amber-200 hover:bg-amber-100"
                                    : "hover:bg-gray-50"
                                }`}
                              >
                                <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-center text-gray-900 border border-gray-300">
                                  {globalIndex + 1}
                                </td>
                                <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-900 border border-gray-300">
                                  {task.companyName}
                                </td>
                                <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-900 border border-gray-300">
                                  {task.project_name}
                                </td>
                                <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-900 border border-gray-300">
                                  <div className="flex items-center gap-[0.3vw]">
                                    {task.taskName}
                                    {isActiveToday && (
                                      <span className="px-[0.3vw] py-[0.1vw] bg-green-500 text-white text-[0.65vw] rounded-full flex items-center gap-[0.1vw]">
                                        <Play size="0.5vw" fill="white" />
                                        Active
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-900 border border-gray-300">
                                  <div
                                    className="max-w-[200px] truncate"
                                    title={task.description}
                                  >
                                    {task.description || "-"}
                                  </div>
                                </td>
                                <td className="px-[0.7vw] py-[0.56vw] text-center border border-gray-300">
                                  <span
                                    className={`px-[0.5vw] py-[0.2vw] rounded-full text-[0.75vw] inline-block font-medium ${getStatusColor(
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
                                        style={{
                                          width: `${task.progress || 0}%`,
                                        }}
                                      ></div>
                                    </div>
                                    <span className="text-[0.75vw] font-medium text-gray-700 whitespace-nowrap">
                                      {task.progress || 0}%
                                    </span>
                                  </div>
                                </td>
                                {/* ✅ Started At column for Today tab */}
                                {activeTab === "today" && (
                                  <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-center text-gray-900 border border-gray-300">
                                    <span className="text-green-600 font-medium">
                                      {formatStartedTime(task.startedAt)}
                                    </span>
                                  </td>
                                )}
                                {/* ✅ Started By column for Today tab */}
                                {activeTab === "today" && (
                                  <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-900 border border-gray-300">
                                    {task.startedBy?.employeeName || "-"}
                                  </td>
                                )}
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
                                <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-900 border border-gray-300">
                                  {task.assignedTo?.employeeName || "-"}
                                </td>
                                <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-900 border border-gray-300">
                                  {task.createdBy?.employeeName ||
                                    task.assignedBy ||
                                    "-"}
                                </td>
                                <td className="px-[0.7vw] py-[0.52vw] border border-gray-300 sticky right-0 bg-white">
                                  <div className="flex justify-center items-center gap-[0.3vw]">
                                    <button
                                      onClick={() => handleViewClick(task)}
                                      className="p-[0.6vw] text-blue-600 hover:bg-blue-50 rounded-full transition-colors cursor-pointer"
                                      title="View Task"
                                    >
                                      <Eye size={"1.02vw"} />
                                    </button>
                                    <button
                                      onClick={() => handleEditClick(task)}
                                      className="p-[0.6vw] text-gray-600 hover:bg-gray-50 rounded-full transition-colors cursor-pointer"
                                      title="Edit Task"
                                    >
                                      <Edit size={"1.02vw"} />
                                    </button>
                                    <button
                                      onClick={() => handleHoldToggle(task)}
                                      className={`p-[0.6vw] ${
                                        task.isHold
                                          ? "text-green-600 hover:bg-green-50"
                                          : "text-yellow-600 hover:bg-yellow-50"
                                      } rounded-full transition-colors cursor-pointer`}
                                      title={
                                        task.isHold
                                          ? "Resume Task"
                                          : "Hold Task"
                                      }
                                    >
                                      {task.isHold ? (
                                        <ClipboardCheck size={"1.02vw"} />
                                      ) : (
                                        <AlertCircle size={"1.02vw"} />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => handleDeleteClick(task)}
                                      className="p-[0.6vw] text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                                      title="Delete Task"
                                    >
                                      <Trash2 size={"1.02vw"} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && filteredTasks.length > 0 && (
          <div className="flex items-center justify-between px-[0.8vw] py-[0.5vw] h-[10%] flex-shrink-0 border-t border-gray-200">
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
                Page {currentPage} of {totalPages || 1}
              </span>
              <button
                onClick={handleNext}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-[0.8vw] py-[0.4vw] flex items-center gap-[0.3vw] bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-[0.85vw] transition cursor-pointer"
              >
                Next
                <ChevronRight size={"1vw"} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Task Modal - Keep the same */}
      {isViewModalOpen && viewTask && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[55vw] max-h-[90vh] flex flex-col overflow-hidden">
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
                onClick={handleModalClose}
                className="p-[0.3vw] hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={"1.2vw"} className="text-gray-500" />
              </button>
            </div>

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
                        {viewTask.assignedTo?.employeeName || "-"}
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

            <div className="flex items-center justify-end gap-[0.5vw] px-[1vw] py-[1vw] border-t border-gray-200 flex-shrink-0">
              <button
                onClick={handleModalClose}
                className="px-[1vw] py-[0.4vw] text-[0.85vw] text-white bg-black rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AddTask Modal for Editing - Keep the same */}
      {isAddTaskModalOpen && (
        <AddTask
          isOpen={isAddTaskModalOpen}
          onClose={handleAddTaskClose}
          editingTask={editingTask}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deleteTask && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[30vw] overflow-hidden">
            <div className="flex items-center justify-between p-[1vw] border-b border-gray-200">
              <h2 className="text-[1.1vw] font-semibold text-gray-800">
                Delete Task
              </h2>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="p-[0.3vw] hover:bg-gray-100 rounded-full transition-colors"
                disabled={isDeleting}
              >
                <X size={"1.2vw"} className="text-gray-500" />
              </button>
            </div>

            <div className="p-[1vw]">
              <p className="text-[0.9vw] text-gray-700 mb-[0.5vw]">
                Are you sure you want to delete this task?
              </p>
              <p className="text-[0.85vw] font-medium text-gray-900">
                {deleteTask.taskName}
              </p>
              <p className="text-[0.75vw] text-red-600 mt-[0.5vw]">
                This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-[0.5vw] px-[1vw] py-[1vw] border-t border-gray-200">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-[1vw] py-[0.4vw] text-[0.85vw] text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-[1vw] py-[0.4vw] text-[0.85vw] text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-[0.3vw] min-w-[5vw] justify-center"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-[1vw] w-[1vw] border-b-2 border-white"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ViewTask;
