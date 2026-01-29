import React, { useState, useEffect, useCallback, useMemo, use } from "react";
import axios from "axios";
import {
  X,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  CalendarDays,
  CalendarRange,
  CalendarCheck,
  Loader2,
  RefreshCw,
  MessageSquare,
  Send,
  Filter,
  CalendarClock,
  ListTodo,
  AlertTriangle,
} from "lucide-react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/marketingTaskAssign`;

const api = {
  getMyTasks: (params) => axios.get(`${API_BASE_URL}/my-tasks`, { params }),
  getMyTaskCounts: (employeeId) => 
    axios.get(`${API_BASE_URL}/my-tasks/counts`, { params: { employee_id: employeeId } }),
  updateMyTask: (id, data) => axios.put(`${API_BASE_URL}/my-tasks/${id}`, data),
};

// Toast Component
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success" ? "bg-green-500" : type === "error" ? "bg-red-500" : "bg-blue-500";

  return (
    <div className={`fixed top-[2vw] right-[2vw] ${bgColor} text-white px-[1vw] py-[0.6vw] rounded-lg shadow-lg z-50 text-[0.85vw] flex items-center gap-[0.5vw]`}>
      {type === "success" && <CheckCircle className="w-[1vw] h-[1vw]" />}
      {type === "error" && <AlertCircle className="w-[1vw] h-[1vw]" />}
      {message}
      <button onClick={onClose} className="ml-[0.5vw] hover:opacity-80">
        <X className="w-[0.9vw] h-[0.9vw]" />
      </button>
    </div>
  );
}

// Update Task Modal
function UpdateTaskModal({ task, onClose, onUpdate, loading }) {
  const [status, setStatus] = useState(task.status);
  const [remarks, setRemarks] = useState(task.remarks || "");

  const statuses = ["Not Started", "In Progress", "Completed", "Delayed"];

  const statusConfig = {
    "Not Started": { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
    "In Progress": { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
    "Completed": { bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
    "Delayed": { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300" },
  };

  const handleUpdate = () => {
    onUpdate(task.assignment_id, { status, remarks });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-[1.5vw] w-[35vw] max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-[1vw]">
          <h3 className="text-[1vw] font-semibold text-gray-800 flex items-center gap-[0.4vw]">
            <MessageSquare className="w-[1.2vw] h-[1.2vw] text-blue-600" />
            Update Task
          </h3>
          <button onClick={onClose} className="p-[0.3vw] hover:bg-gray-100 rounded-lg transition">
            <X className="w-[1.2vw] h-[1.2vw] text-gray-500" />
          </button>
        </div>

        {/* Task Info */}
        <div className="bg-gray-50 rounded-lg p-[1vw] mb-[1vw]">
          <h4 className="text-[0.9vw] font-semibold text-gray-800 mb-[0.5vw]">
            {task.task_name}
          </h4>
          <p className="text-[0.75vw] text-gray-600 mb-[0.5vw]">
            {task.task_description}
          </p>
          <div className="flex items-center gap-[1vw] text-[0.75vw]">
            <span className="flex items-center gap-[0.3vw] text-gray-500">
              <CalendarClock className="w-[0.9vw] h-[0.9vw]" />
              Assigned: {formatDate(task.assigned_date)}
            </span>
            <span className="px-[0.4vw] py-[0.15vw] bg-purple-100 text-purple-700 rounded-full">
              {task.task_type}
            </span>
            <span className="px-[0.4vw] py-[0.15vw] bg-gray-200 text-gray-700 rounded-full">
              {task.category_name}
            </span>
          </div>
        </div>

        {/* Status Selection */}
        <div className="mb-[1vw]">
          <label className="block text-[0.75vw] font-medium text-gray-700 mb-[0.5vw]">
            Update Status <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-[0.5vw]">
            {statuses.map((s) => {
              const config = statusConfig[s];
              const isSelected = status === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`px-[0.8vw] py-[0.5vw] rounded-lg text-[0.8vw] font-medium transition cursor-pointer border-2 ${
                    isSelected
                      ? `${config.bg} ${config.text} ${config.border}`
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Remarks */}
        <div className="mb-[1vw]">
          <label className="block text-[0.75vw] font-medium text-gray-700 mb-[0.3vw]">
            Remarks / Notes
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add any notes or comments about this task..."
            rows="4"
            className="w-full px-[0.7vw] py-[0.5vw] text-[0.8vw] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none outline-none"
          />
        </div>

        {/* Previous Remarks */}
        {task.remarks && task.remarks !== remarks && (
          <div className="mb-[1vw] p-[0.8vw] bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-[0.7vw] font-medium text-yellow-700 mb-[0.3vw]">Previous Remarks:</p>
            <p className="text-[0.75vw] text-yellow-800">{task.remarks}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-[0.5vw]">
          <button
            onClick={onClose}
            className="flex-1 px-[1vw] py-[0.6vw] text-[0.8vw] bg-gray-100 text-gray-700 cursor-pointer rounded-lg hover:bg-gray-200 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="flex-1 px-[1vw] py-[0.6vw] text-[0.8vw] bg-blue-600 text-white cursor-pointer rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium flex items-center justify-center gap-[0.3vw]"
          >
            {loading ? (
              <Loader2 className="w-[0.9vw] h-[0.9vw] animate-spin" />
            ) : (
              <Send className="w-[0.9vw] h-[0.9vw]" />
            )}
            Update Task
          </button>
        </div>
      </div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }) {
  const statusConfig = {
    "Not Started": { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300", icon: Clock },
    "In Progress": { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300", icon: PlayCircle },
    "Completed": { bg: "bg-green-100", text: "text-green-700", border: "border-green-300", icon: CheckCircle },
    "Overdue": { bg: "bg-red-100", text: "text-red-700", border: "border-red-300", icon: AlertCircle },
    "Delayed": { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300", icon: PauseCircle },
  };

  const config = statusConfig[status] || statusConfig["Not Started"];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-[0.2vw] px-[0.5vw] py-[0.2vw] text-[0.7vw] ${config.bg} ${config.text} border ${config.border} rounded-full font-medium`}>
      <Icon className="w-[0.8vw] h-[0.8vw]" />
      {status}
    </span>
  );
}

// Task Type Badge
function TaskTypeBadge({ type }) {
  const typeConfig = {
    Daily: { bg: "bg-purple-100", text: "text-purple-700", icon: CalendarDays },
    Weekly: { bg: "bg-indigo-100", text: "text-indigo-700", icon: CalendarRange },
    Monthly: { bg: "bg-teal-100", text: "text-teal-700", icon: CalendarCheck },
  };

  const config = typeConfig[type] || typeConfig["Daily"];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-[0.2vw] px-[0.4vw] py-[0.15vw] text-[0.65vw] ${config.bg} ${config.text} rounded-full font-medium`}>
      <Icon className="w-[0.7vw] h-[0.7vw]" />
      {type}
    </span>
  );
}

// Main Component
export default function EmployeeTaskUpdate() {
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({ message, type });

  const [loading, setLoading] = useState({ tasks: false, submitting: false });
  const [tasks, setTasks] = useState([]);
  const [counts, setCounts] = useState({
    "Not Started": 0,
    "In Progress": 0,
    "Completed": 0,
    "Delayed": 0,
    "Today": 0,
    "OverdueTasks": 0,
  });

  const[employeeId, setEmployeeId]=useState(null)

  const [dateFilter, setDateFilter] = useState("today");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);

  const dateFilters = [
    { value: "today", label: "Today", icon: CalendarClock },
    { value: "week", label: "This Week", icon: CalendarRange },
    { value: "overdue", label: "Overdue", icon: AlertTriangle },
    { value: "", label: "All Tasks", icon: ListTodo },
  ];

  const statusFilters = [
    { value: "", label: "All Status" },
    { value: "Not Started", label: "Not Started" },
    { value: "In Progress", label: "In Progress" },
    { value: "Completed", label: "Completed" },
    { value: "Delayed", label: "Delayed" },
  ];

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    if (!employeeId) return;

    console.log(employeeId);

    try {
      setLoading((prev) => ({ ...prev, tasks: true }));
      const response = await api.getMyTasks({
        employee_id: employeeId,
        date_filter: dateFilter,
        status: statusFilter,
      });

      console.log(response.data)
      if (response.data.success) {
        setTasks(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      showToast("Failed to fetch tasks", "error");
    } finally {
      setLoading((prev) => ({ ...prev, tasks: false }));
    }
  }, [employeeId, dateFilter, statusFilter]);

  // Fetch counts
  const fetchCounts = useCallback(async () => {
    if (!employeeId) return;

    try {
      const response = await api.getMyTaskCounts(employeeId);
      if (response.data.success) {
        setCounts(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching counts:", error);
    }
  }, [employeeId]);

  useEffect(() => {
  const userData = JSON.parse(
    sessionStorage.getItem("user") || localStorage.getItem("user")
  );

  if (userData?.userName) {
    setEmployeeId(userData.userName);
  }
}, []);


  useEffect(() => {
    fetchTasks();
    fetchCounts();
  }, [fetchTasks, fetchCounts]);

  const updateTask = async (assignmentId, data) => {
    try {
      setLoading((prev) => ({ ...prev, submitting: true }));
      const response = await api.updateMyTask(assignmentId, {
        ...data,
        employee_id: employeeId,
      });

      if (response.data.success) {
        showToast("Task updated successfully");
        setSelectedTask(null);
        fetchTasks();
        fetchCounts();
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to update task", "error");
    } finally {
      setLoading((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Filter tasks by search
  const filteredTasks = useMemo(() => {
    return tasks.filter(
      (task) =>
        !searchQuery ||
        task.task_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.task_description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tasks, searchQuery]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((taskDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  };

  // Check if overdue
  const isOverdue = (task) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(task.assigned_date);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate < today && task.status !== "Completed";
  };

  return (
    <div className="text-black min-h-[92%] max-h-[100%] w-[100%] max-w-[100%] overflow-hidden">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="w-[100%] h-[91vh] flex flex-col gap-[1vh]">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-[1vw] flex-shrink-0">
          <div className="flex items-center justify-between mb-[1vw]">
            <h2 className="text-[1.2vw] font-bold text-gray-800 flex items-center gap-[0.5vw]">
              <ListTodo className="w-[1.4vw] h-[1.4vw] text-blue-600" />
              My Tasks
            </h2>
            <button
              onClick={() => {
                fetchTasks();
                fetchCounts();
              }}
              className="p-[0.4vw] hover:bg-gray-100 rounded-lg transition cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-[1.2vw] h-[1.2vw] text-gray-500 ${loading.tasks ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-6 gap-[0.8vw]">
            <div className="bg-blue-50 rounded-lg p-[0.6vw] border border-blue-200">
              <p className="text-[0.7vw] text-blue-600">Today</p>
              <p className="text-[1.2vw] font-bold text-blue-700">{counts.Today}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-[0.6vw] border border-gray-300">
              <p className="text-[0.7vw] text-gray-500">Not Started</p>
              <p className="text-[1.2vw] font-bold text-gray-700">{counts["Not Started"]}</p>
            </div>
            <div className="bg-indigo-50 rounded-lg p-[0.6vw] border border-indigo-200">
              <p className="text-[0.7vw] text-indigo-600">In Progress</p>
              <p className="text-[1.2vw] font-bold text-indigo-700">{counts["In Progress"]}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-[0.6vw] border border-green-200">
              <p className="text-[0.7vw] text-green-600">Completed</p>
              <p className="text-[1.2vw] font-bold text-green-700">{counts.Completed}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-[0.6vw] border border-orange-200">
              <p className="text-[0.7vw] text-orange-600">Delayed</p>
              <p className="text-[1.2vw] font-bold text-orange-700">{counts.Delayed}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-[0.6vw] border border-red-200">
              <p className="text-[0.7vw] text-red-600">Overdue</p>
              <p className="text-[1.2vw] font-bold text-red-700">{counts.OverdueTasks}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-[0.8vw] flex-shrink-0">
          <div className="flex items-center justify-between gap-[1vw]">
            {/* Date Filter Tabs */}
            <div className="flex gap-[0.3vw] bg-gray-100 p-[0.3vw] rounded-lg">
              {dateFilters.map((filter) => {
                const Icon = filter.icon;
                return (
                  <button
                    key={filter.value}
                    onClick={() => setDateFilter(filter.value)}
                    className={`flex items-center gap-[0.3vw] px-[0.8vw] py-[0.4vw] rounded-md text-[0.75vw] cursor-pointer font-medium transition ${
                      dateFilter === filter.value
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="w-[0.9vw] h-[0.9vw]" />
                    {filter.label}
                  </button>
                );
              })}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-[0.5vw]">
              <Filter className="w-[1vw] h-[1vw] text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-[0.7vw] py-[0.4vw] text-[0.8vw] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              >
                {statusFilters.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-[20vw]">
              <Search className="absolute left-[0.6vw] top-1/2 transform -translate-y-1/2 w-[1vw] h-[1vw] text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-[2vw] pr-[0.8vw] py-[0.4vw] text-[0.8vw] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-[0.5vw] top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-[0.9vw] h-[0.9vw]" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="bg-white rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-[1vw]">
            {loading.tasks ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-[2vw] h-[2vw] animate-spin text-gray-400" />
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <ListTodo className="w-[4vw] h-[4vw] mb-[1vw] text-gray-300" />
                <p className="text-[1vw] font-medium mb-[0.5vw]">No tasks found</p>
                <p className="text-[0.85vw] text-gray-400">
                  {dateFilter === "today"
                    ? "You have no tasks scheduled for today"
                    : "Try adjusting your filters"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-[1vw]">
                {filteredTasks.map((task) => (
                  <div
                    key={task.assignment_id}
                    onClick={() => setSelectedTask(task)}
                    className={`p-[1vw] rounded-xl border-2 cursor-pointer transition hover:shadow-md ${
                      isOverdue(task)
                        ? "border-red-300 bg-red-50"
                        : task.status === "Completed"
                        ? "border-green-300 bg-green-50"
                        : task.status === "In Progress"
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    {/* Task Header */}
                    <div className="flex items-start justify-between mb-[0.5vw]">
                      <h4 className="text-[0.9vw] font-semibold text-gray-800 flex-1 pr-[0.5vw]">
                        {task.task_name}
                      </h4>
                      <TaskTypeBadge type={task.task_type} />
                    </div>

                    {/* Description */}
                    <p className="text-[0.75vw] text-gray-600 mb-[0.8vw] line-clamp-2">
                      {task.task_description}
                    </p>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between mb-[0.5vw]">
                      <div className="flex items-center gap-[0.5vw]">
                        <span className="px-[0.4vw] py-[0.15vw] bg-gray-100 text-gray-600 text-[0.65vw] rounded-full">
                          {task.category_name}
                        </span>
                        <span className={`flex items-center gap-[0.2vw] text-[0.7vw] ${
                          isOverdue(task) ? "text-red-600 font-medium" : "text-gray-500"
                        }`}>
                          <CalendarClock className="w-[0.8vw] h-[0.8vw]" />
                          {formatDate(task.assigned_date)}
                        </span>
                      </div>
                      <StatusBadge status={isOverdue(task) ? "Overdue" : task.status} />
                    </div>

                    {/* Remarks Preview */}
                    {task.remarks && (
                      <div className="mt-[0.5vw] pt-[0.5vw] border-t border-gray-200">
                        <p className="text-[0.7vw] text-gray-500 flex items-start gap-[0.3vw]">
                          <MessageSquare className="w-[0.8vw] h-[0.8vw] flex-shrink-0 mt-[0.1vw]" />
                          <span className="line-clamp-1">{task.remarks}</span>
                        </p>
                      </div>
                    )}

                    {/* Quick Action */}
                    <div className="mt-[0.8vw]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTask(task);
                        }}
                        className="w-full px-[0.8vw] py-[0.4vw] text-[0.75vw] bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition font-medium cursor-pointer"
                      >
                        Update Status
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {filteredTasks.length > 0 && (
            <div className="px-[1vw] py-[0.5vw] border-t border-gray-200 bg-gray-50">
              <p className="text-[0.75vw] text-gray-500">
                Showing {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Update Modal */}
      {selectedTask && (
        <UpdateTaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={updateTask}
          loading={loading.submitting}
        />
      )}
    </div>
  );
}