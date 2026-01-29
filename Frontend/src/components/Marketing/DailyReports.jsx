import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Eye,
  Clock,
  X,
  AlertCircle,
  MessageSquare,
  CheckCircle,
  XCircle,
} from "lucide-react";

const RECORDS_PER_PAGE = 8;
const API_REPORT_TASKS = `${
  import.meta.env.VITE_API_BASE_URL
}/marketing/report-tasks`;
const API_TASK_REQUESTS = `${
  import.meta.env.VITE_API_BASE_URL
}/marketing/task-requests`;

/* ---------- helpers ---------- */

const getLoggedInUser = () => {
  const raw = sessionStorage.getItem("user");
  if (!raw) return { employeeId: null, employeeName: null };
  try {
    const userData = JSON.parse(raw);
    return {
      employeeId: userData.userName || userData.employeeId || null,
      employeeName: userData.employeeName || userData.name || null,
    };
  } catch (e) {
    console.error("Failed to parse session user JSON:", e);
    return { employeeId: null, employeeName: null };
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB");
};

const formatDateTime = (val) => {
  if (!val) return "";
  if (typeof val === "string" && (val.includes("|") || /AM|PM/i.test(val)))
    return val;
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return d
    .toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .replace(",", " |");
};

// Enhanced overdue detection with time-based logic
const isTaskOverdue = (task, timeRange) => {
  if (!task) return false;

  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTime = currentHours * 60 + currentMinutes;

  if (timeRange === "today") {
    const deadlineTime = task.deadline_time || task.emp_deadline_time;

    if (deadlineTime === "MORNING") {
      const morningDeadline = 13 * 60 + 30;
      return currentTime > morningDeadline;
    } else if (deadlineTime === "EVENING") {
      const eveningDeadline = 18 * 60 + 30;
      return currentTime > eveningDeadline;
    }

    return false;
  }

  if (timeRange === "weekly" || timeRange === "monthly") {
    const deadlineDate = task.deadline_date || task.emp_deadline_date;
    const deadlineTime = task.deadline_time || task.emp_deadline_time;

    if (!deadlineDate) return false;

    const deadline = new Date(deadlineDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDay = new Date(deadline);
    deadlineDay.setHours(0, 0, 0, 0);

    if (deadlineDay < today) {
      return true;
    }

    if (deadlineDay.getTime() === today.getTime()) {
      if (deadlineTime === "MORNING") {
        const morningDeadline = 13 * 60 + 30;
        return currentTime > morningDeadline;
      } else if (deadlineTime === "EVENING") {
        const eveningDeadline = 18 * 60 + 30;
        return currentTime > eveningDeadline;
      }
    }

    return false;
  }

  return false;
};

/* ---------- ViewRequestsModal Component ---------- */
const ViewRequestsModal = ({ isOpen, onClose, task }) => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && task?.id) {
      fetchRequests();
    }
  }, [isOpen, task]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_TASK_REQUESTS}/${task.id}`);
      const data = await res.json();
      if (data.status) {
        const { employeeId } = getLoggedInUser();
        const myRequests = data.requests.filter(
          (r) => r.employee_id === employeeId
        );
        setRequests(myRequests);
      }
    } catch (err) {
      console.error("Fetch requests error:", err);
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatRequestDateTime = (isoString) => {
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

  const getStatusBadge = (status) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-700",
      VIEWED: "bg-blue-100 text-blue-700",
      RESOLVED: "bg-green-100 text-green-700",
      REJECTED: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const getStatusIcon = (status) => {
    if (status === "RESOLVED")
      return <CheckCircle size={18} className="text-green-600" />;
    if (status === "REJECTED")
      return <XCircle size={18} className="text-red-600" />;
    if (status === "PENDING")
      return <Clock size={18} className="text-yellow-600" />;
    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-[60vw] max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-[1vw] border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-[1.1vw] font-semibold text-gray-800">
              My Requests
            </h2>
            <p className="text-[0.8vw] text-gray-500 mt-[0.2vw]">
              {task?.task_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-[0.3vw] hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={"1.2vw"} className="text-gray-500" />
          </button>
        </div>

        <div className="p-[1vw] overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-[3vw]">
              <div className="animate-spin rounded-full h-[1.5vw] w-[1.5vw] border-b-2 border-blue-600"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-[3vw] text-gray-500">
              <AlertCircle
                size={48}
                className="mx-auto mb-[1vw] text-gray-400"
              />
              <p className="text-[1vw]">No requests submitted yet</p>
            </div>
          ) : (
            <div className="space-y-[0.8vw]">
              {requests.map((req) => (
                <div
                  key={req.request_id}
                  className={`border rounded-lg p-[1vw] transition-colors ${
                    req.status === "RESOLVED"
                      ? "border-green-300 bg-green-50"
                      : req.status === "REJECTED"
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-[0.5vw]">
                    <div className="flex items-center gap-[0.5vw]">
                      {getStatusIcon(req.status)}
                      <div>
                        <p className="text-[0.75vw] text-gray-500">
                          {formatRequestDateTime(req.created_at)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-[0.5vw] py-[0.2vw] rounded-full text-[0.75vw] font-medium ${getStatusBadge(
                        req.status
                      )}`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <div className="mb-[0.5vw]">
                    <p className="text-[0.75vw] font-medium text-gray-600 mb-[0.2vw]">
                      Your Request:
                    </p>
                    <p className="text-[0.85vw] text-gray-700 whitespace-pre-wrap">
                      {req.comment}
                    </p>
                  </div>

                  {req.manager_remarks && (
                    <div
                      className={`mt-[0.8vw] p-[0.8vw] rounded-md ${
                        req.status === "RESOLVED"
                          ? "bg-green-100 border border-green-300"
                          : "bg-red-100 border border-red-300"
                      }`}
                    >
                      <div className="flex items-center gap-[0.4vw] mb-[0.3vw]">
                        {req.status === "RESOLVED" ? (
                          <CheckCircle size={16} className="text-green-700" />
                        ) : (
                          <XCircle size={16} className="text-red-700" />
                        )}
                        <p
                          className={`text-[0.8vw] font-semibold ${
                            req.status === "RESOLVED"
                              ? "text-green-800"
                              : "text-red-800"
                          }`}
                        >
                          Manager's Response
                        </p>
                      </div>
                      <p
                        className={`text-[0.85vw] whitespace-pre-wrap ${
                          req.status === "RESOLVED"
                            ? "text-green-900"
                            : "text-red-900"
                        }`}
                      >
                        {req.manager_remarks}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-[0.5vw] px-[1vw] py-[1vw] border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-[1vw] py-[0.4vw] text-[0.85vw] text-white bg-black rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------- RequestModal Component ---------- */
const RequestModal = ({ isOpen, onClose, task, onSuccess }) => {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setComment("");
      setError("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!comment.trim()) {
      setError("Comment is required");
      return;
    }

    const { employeeId, employeeName } = getLoggedInUser();
    if (!employeeId || !employeeName) {
      alert("Login user not found in sessionStorage");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch(API_TASK_REQUESTS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketing_task_id: task.id,
          employee_id: employeeId,
          employee_name: employeeName,
          comment: comment.trim(),
        }),
      });

      const data = await res.json();

      if (!data.status) {
        setError(data.message || "Failed to submit request");
      } else {
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      console.error("Request submit error:", err);
      setError("Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-[50vw] max-w-[60vw] overflow-hidden shadow-xl">
        <div className="bg-gray-100 px-[1.2vw] py-[0.8vw] flex items-center justify-between border-b">
          <div className="text-[1.1vw] font-medium text-gray-800">
            Submit Request
          </div>
          <button
            onClick={onClose}
            className="p-[0.3vw] hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-[1.2vw]">
          <div className="mb-[1vw]">
            <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.4vw]">
              Task Name
            </label>
            <input
              type="text"
              value={task?.task_name || ""}
              disabled
              className="w-full rounded-md border border-gray-200 px-[0.8vw] py-[0.6vw] bg-gray-50 text-gray-800 cursor-not-allowed text-[0.9vw]"
            />
          </div>

          <div className="mb-[1vw]">
            <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.4vw]">
              Comment / Request <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setError("");
              }}
              placeholder="Enter your request or comment here..."
              className={`w-full rounded-md border px-[0.8vw] py-[0.6vw] min-h-[8vw] text-[0.9vw] resize-none focus:outline-none focus:ring-2 ${
                error
                  ? "border-red-400 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
            />
            {error && (
              <p className="text-red-500 text-[0.75vw] mt-[0.4vw]">{error}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-[0.8vw] border-t pt-[0.8vw]">
            <button
              type="button"
              onClick={onClose}
              className="px-[1vw] py-[0.6vw] rounded-lg bg-gray-100 text-[0.85vw] hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-[1.2vw] py-[0.6vw] rounded-lg bg-blue-600 text-white text-[0.85vw] hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ---------- AddReportModal (keeping your existing code) ---------- */
const AddReportModal = ({ isOpen, onClose, task, onSuccess, isCompleted }) => {
  const [showHistory, setShowHistory] = useState(isCompleted);
  const [formData, setFormData] = useState({
    progress: "",
    status: "In Progress",
    remarks: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [history, setHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [originalProgress, setOriginalProgress] = useState("");

  useEffect(() => {
    if (task && isOpen) {
      const initProgress = task.progress ?? "";
      setFormData({
        progress: initProgress,
        status: task.status ?? "In Progress",
        remarks: "",
      });
      setOriginalProgress(initProgress);
      setShowHistory(isCompleted);
      setHistory([]);
      if (isCompleted && task?.id) fetchHistory(task.id);
    }
    if (!isOpen) {
      setFormData({ progress: "", status: "In Progress", remarks: "" });
      setValidationErrors({});
      setShowHistory(false);
      setHistory([]);
      setIsHistoryLoading(false);
      setIsSubmitting(false);
      setOriginalProgress("");
    }
  }, [task, isOpen, isCompleted]);

  if (!isOpen) return null;

  const getMinPercentage = () => task?.progress || 0;

  const handlePercentageChange = (e) => {
    const value = e.target.value;
    const min = getMinPercentage();
    const errors = { ...validationErrors };
    if (value === "") delete errors.progress;
    else {
      const n = Number(value);
      if (n < min || n > 100)
        errors.progress = `Please enter percentage between ${min} to 100`;
      else delete errors.progress;
    }
    setValidationErrors(errors);

    const newStatus =
      Number(value) === 100
        ? "Completed"
        : formData.status === "Completed" && Number(value) < 100
        ? "In Progress"
        : formData.status;
    setFormData((p) => ({ ...p, progress: value, status: newStatus }));
  };

  const handleStatusChange = (status) => {
    const errors = { ...validationErrors };

    if (status === "Completed") {
      delete errors.progress;
      setFormData((p) => ({ ...p, status: "Completed", progress: 100 }));
    } else {
      const restored =
        originalProgress !== "" ? originalProgress : formData.progress;
      delete errors.progress;
      setFormData((p) => ({ ...p, status: "In Progress", progress: restored }));
    }

    setValidationErrors(errors);
  };

  const validateForm = () => {
    const errors = {};
    const min = getMinPercentage();
    const pct = Number(formData.progress);
    if (formData.progress === "") errors.progress = "Percentage is required";
    else if (pct < min || pct > 100)
      errors.progress = `Please enter percentage between ${min} to 100`;
    if (formData.status === "Completed" && pct !== 100)
      errors.progress = "Completed status requires 100% progress";
    if (!formData.remarks.trim()) errors.remarks = "Remarks is required";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getCurrentDateTime = () =>
    new Date()
      .toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .replace(",", " |");

  const fetchHistory = async (taskId) => {
    if (!taskId) return;
    try {
      setIsHistoryLoading(true);
      const res = await fetch(`${API_REPORT_TASKS}/${taskId}/history`);
      const data = await res.json();
      if (data.status) setHistory(data.history || []);
      else setHistory([]);
    } catch (e) {
      console.error("History load error:", e);
      setHistory([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!task?.id) return;

    const { employeeId, employeeName } = getLoggedInUser();
    if (!employeeId || !employeeName) {
      alert("Login user not found in sessionStorage");
      return;
    }

    setIsSubmitting(true);

    try {
      const currentDateTime = new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

      const body = {
        progress: Number(formData.progress),
        status: formData.status,
        remarks: formData.remarks,
        employee_id: employeeId,
        employee_name: employeeName,
        submitted_datetime: currentDateTime,
      };

      const res = await fetch(`${API_REPORT_TASKS}/${task.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!data.status) {
        console.error("Report save error:", data.message);
        alert(data.message || "Failed to save report");
      } else {
        onSuccess?.(body);
      }
    } catch (err) {
      console.error("Report save error:", err);
      alert("Failed to save report");
    } finally {
      setIsSubmitting(false);
      setFormData({ progress: "", status: "In Progress", remarks: "" });
      setValidationErrors({});
      setShowHistory(false);
      setHistory([]);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-[60vw] max-w-[70vw] max-h-[80vh] overflow-hidden shadow-xl">
        <div className="bg-gray-100 px-[1.2vw] py-[0.8vw] flex items-center justify-between border-b rounded-tl-xl rounded-tr-xl">
          <div className="text-[1.1vw] font-medium text-gray-800">
            Marketing
          </div>
          <div className="text-[0.9vw] text-gray-700">
            {getCurrentDateTime()}
          </div>
        </div>

        {!showHistory ? (
          <form onSubmit={handleSubmit} className="p-[1.2vw]">
            <div className="grid grid-cols-2 gap-[1vw] mb-[1vw]">
              <div>
                <label className="block text-[0.95vw] font-medium text-gray-700 mb-[0.4vw]">
                  Task Name :
                </label>
                <input
                  type="text"
                  value={task?.task_name || ""}
                  disabled
                  className="w-full rounded-md border border-gray-200 px-[0.8vw] py-[0.8vw] bg-white text-gray-800 cursor-not-allowed text-[0.95vw]"
                />
              </div>

              <div>
                <label className="block text-[0.95vw] font-medium text-gray-700 mb-[0.4vw]">
                  Description:
                </label>
                <input
                  type="text"
                  value={task?.task_description || ""}
                  disabled
                  className="w-full rounded-md border border-gray-200 px-[0.8vw] py-[0.8vw] bg-white text-gray-800 cursor-not-allowed text-[0.95vw]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-[1vw] mb-[1vw]">
              <div>
                <label className="block text-[0.95vw] font-medium text-gray-700 mb-[0.4vw]">
                  Progress (%)
                </label>
                <input
                  type="number"
                  min={getMinPercentage()}
                  max="100"
                  value={formData.progress}
                  onChange={handlePercentageChange}
                  placeholder="Enter progress percentage"
                  className={`w-full rounded-md border px-[0.8vw] py-[0.8vw] text-gray-800 text-[0.95vw] focus:outline-none ${
                    validationErrors.progress
                      ? "border-red-400"
                      : "border-gray-200"
                  }`}
                />
                {validationErrors.progress && (
                  <p className="text-red-500 text-[0.8vw] mt-[0.4vw]">
                    {validationErrors.progress}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[0.95vw] font-medium text-gray-700 mb-[0.4vw]">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full rounded-md border border-gray-200 px-[0.8vw] py-[0.8vw] text-[0.95vw] focus:outline-none"
                >
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>
              </div>
            </div>

            <div className="mb-[1vw]">
              <label className="block text-[0.95vw] font-medium text-gray-700 mb-[0.4vw]">
                Outcomes / Reports
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, remarks: e.target.value }))
                }
                placeholder="Add outcomes or reports"
                className={`w-full rounded-md border px-[0.8vw] py-[0.8vw] min-h-[8vw] text-[0.95vw] resize-none ${
                  validationErrors.remarks
                    ? "border-red-400"
                    : "border-gray-200"
                }`}
              />
              {validationErrors.remarks && (
                <p className="text-red-500 text-[0.8vw] mt-[0.4vw]">
                  {validationErrors.remarks}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between border-t pt-[0.8vw]">
              <div>
                <button
                  type="button"
                  onClick={async () => {
                    if (task?.id) await fetchHistory(task.id);
                    setShowHistory(true);
                  }}
                  className="inline-flex items-center gap-[0.6vw] text-[0.80vw] text-gray-700 hover:text-gray-900 cursor-pointer"
                >
                  <Clock size={16} />
                  <span>History</span>
                </button>
              </div>

              <div className="flex items-center gap-[0.8vw]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-[1vw] py-[0.6vw] rounded-full bg-gray-100 text-[0.80vw] hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-[1.2vw] py-[0.6vw] rounded-full bg-blue-600 text-white text-[0.80vw] hover:bg-blue-700 disabled:opacity-60"
                >
                  {isSubmitting ? "Submitting..." : "submit"}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <>
            <div className="px-[1.2vw] py-[1vw] max-h-[62vh] overflow-auto">
              <h3 className="text-[1.05vw] font-semibold text-gray-800 mb-[0.8vw]">
                Previous Reports
              </h3>

              <div className="mb-[1vw] grid grid-cols-2 gap-[1vw]">
                <div>
                  <label className="block text-[0.85vw] text-black-500 mb-[0.4vw]">
                    Task
                  </label>
                  <input
                    type="text"
                    value={task?.task_name || ""}
                    disabled
                    className="w-full rounded-md border border-gray-200 px-[0.8vw] py-[0.8vw] bg-white text-gray-800 cursor-not-allowed text-[0.95vw]"
                  />
                </div>
                <div>
                  <label className="block text-[0.85vw] text-black-500 mb-[0.4vw]">
                    Description
                  </label>
                  <input
                    type="text"
                    value={task?.task_description || ""}
                    disabled
                    className="w-full rounded-md border border-gray-200 px-[0.8vw] py-[0.8vw] bg-white text-gray-800 cursor-not-allowed text-[0.95vw]"
                  />
                </div>
              </div>

              {isHistoryLoading ? (
                <div className="flex items-center justify-center py-[3vw]">
                  <div
                    className="animate-spin rounded-full"
                    style={{
                      width: "1.6vw",
                      height: "1.6vw",
                      borderTopWidth: "0.15vw",
                      borderRightWidth: "0.15vw",
                      borderColor: "#111",
                    }}
                  />
                </div>
              ) : history.length ? (
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-[0.8vw] py-[0.6vw] text-[0.9vw] text-gray-600">
                          S.No
                        </th>
                        <th className="text-left px-[0.8vw] py-[0.6vw] text-[0.9vw] text-gray-600">
                          Task
                        </th>
                        <th className="text-left px-[0.8vw] py-[0.6vw] text-[0.9vw] text-gray-600">
                          Progress
                        </th>
                        <th className="text-left px-[0.8vw] py-[0.6vw] text-[0.9vw] text-gray-600">
                          Status
                        </th>
                        <th className="text-left px-[0.8vw] py-[0.6vw] text-[0.9vw] text-gray-600">
                          Outcome
                        </th>
                        <th className="text-right px-[0.8vw] py-[0.6vw] text-[0.9vw] text-gray-600">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h, i) => (
                        <tr
                          key={h.id}
                          className={`${
                            i % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                        >
                          <td className="px-[0.8vw] py-[0.6vw] text-[0.95vw] text-gray-800">
                            {i + 1}
                          </td>
                          <td className="px-[0.8vw] py-[0.6vw] text-[0.95vw] text-gray-800">
                            {task?.task_name || "—"}
                          </td>
                          <td className="px-[0.8vw] py-[0.6vw] text-[0.95vw] text-gray-800">
                            {h.progress}%
                          </td>
                          <td className="px-[0.8vw] py-[0.6vw] text-[0.95vw] text-gray-800">
                            {h.status}
                          </td>
                          <td className="px-[0.8vw] py-[0.6vw] text-[0.95vw] text-gray-800">
                            {h.remarks || "—"}
                          </td>
                          <td className="px-[0.8vw] py-[0.6vw] text-[0.95vw] text-gray-600 text-right">
                            {formatDateTime(h.submitted_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-[2.5vw] text-gray-500 text-[0.95vw]">
                  No previous reports found
                </div>
              )}
            </div>

            <div className="px-[1.2vw] py-[0.8vw] border-t flex items-center justify-between">
              {!isCompleted ? (
                <button
                  onClick={() => setShowHistory(false)}
                  className="inline-flex items-center gap-[0.6vw] text-[0.95vw] text-gray-700 hover:text-gray-900 cursor-pointer"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
              ) : (
                <div />
              )}

              <button
                onClick={onClose}
                className="px-[1vw] py-[0.6vw] rounded-full bg-gray-100 text-[0.95vw] hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ---------- main Report component ---------- */

const Report = () => {
  const [timeRange, setTimeRange] = useState("today");
  const [subTab, setSubTab] = useState("inProgress");
  const [tasks, setTasks] = useState({
    today: { inProgress: [], completed: [] },
    weekly: { inProgress: [], completed: [] },
    monthly: { inProgress: [], completed: [] },
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestTask, setRequestTask] = useState(null);

  // New states for viewing requests
  const [isViewRequestsModalOpen, setIsViewRequestsModalOpen] = useState(false);
  const [viewRequestsTask, setViewRequestsTask] = useState(null);
  const [taskRequestCounts, setTaskRequestCounts] = useState({});

  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const employeeName = userData.employeeName || null;

  useEffect(() => {
    if (!employeeName) return;

    const load = async () => {
      try {
        setIsLoading(true);
        const fetchJson = async (url) => {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          if (!data.status) throw new Error(data.message || "API error");
          return data.tasks;
        };

        const todayIso = new Date().toISOString().split("T")[0];

        const [con, todaySeq, weeklySeq, monthlySeq] = await Promise.all([
          fetchJson(
            `${API_REPORT_TASKS}?employee_name=${encodeURIComponent(
              employeeName
            )}&task_type=CONCURRENT&task_date=${todayIso}`
          ),
          fetchJson(
            `${API_REPORT_TASKS}?employee_name=${encodeURIComponent(
              employeeName
            )}&task_type=SEQUENTIAL&seq_range=TODAY`
          ),
          fetchJson(
            `${API_REPORT_TASKS}?employee_name=${encodeURIComponent(
              employeeName
            )}&task_type=SEQUENTIAL&seq_range=WEEKLY`
          ),
          fetchJson(
            `${API_REPORT_TASKS}?employee_name=${encodeURIComponent(
              employeeName
            )}&task_type=SEQUENTIAL&seq_range=MONTHLY`
          ),
        ]);

        const mapTask = (t) => ({
          id: t.marketing_task_id,
          date: formatDate(t.task_date || t.created_at),
          task_name: t.task_name,
          task_description: t.task_description,
          progress: t.emp_progress || 0,
          status: t.emp_status || "In Progress",
          category: t.category || t.emp_category || "N/A",
          deadline_time: t.deadline_time || t.emp_deadline_time,
          deadline_date: t.deadline_date || t.emp_deadline_date,
        });

        const separateTasks = (arr) => {
          const inProgress = [];
          const completed = [];
          arr.forEach((task) => {
            if (task.status === "Completed") completed.push(task);
            else inProgress.push(task);
          });
          return { inProgress, completed };
        };

        const todayList = [...con, ...todaySeq].map(mapTask);
        const weeklyList = weeklySeq.map(mapTask);
        const monthlyList = monthlySeq.map(mapTask);

        setTasks({
          today: separateTasks(todayList),
          weekly: separateTasks(weeklyList),
          monthly: separateTasks(monthlyList),
        });
      } catch (err) {
        console.error("Report load error", err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [employeeName]);

  const getTimeTabs = () => [
    { key: "today", label: "Today" },
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
  ];

  const getSubTabs = () => [
    { key: "inProgress", label: "In Progress" },
    { key: "completed", label: "Completed" },
  ];

  const getSortedTasks = (list) => {
    const copy = [...list];
    copy.sort((a, b) => {
      const aOver = isTaskOverdue(a, timeRange);
      const bOver = isTaskOverdue(b, timeRange);
      if (aOver && !bOver) return -1;
      if (!aOver && bOver) return 1;
      const [da, ma, ya] = a.date.split("/");
      const [db, mb, yb] = b.date.split("/");
      return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db);
    });
    return copy;
  };

  const currentTasks = getSortedTasks(tasks[timeRange][subTab] || []);
  const totalPages = Math.max(
    1,
    Math.ceil(currentTasks.length / RECORDS_PER_PAGE)
  );
  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
  const endIndex = startIndex + RECORDS_PER_PAGE;
  const paginatedTasks = currentTasks.slice(startIndex, endIndex);

  // Fetch request counts for current page tasks
  useEffect(() => {
    const fetchRequestCounts = async () => {
      if (paginatedTasks.length === 0) return;

      const counts = {};
      for (const task of paginatedTasks) {
        try {
          const res = await fetch(`${API_TASK_REQUESTS}/${task.id}`);
          const data = await res.json();
          if (data.status) {
            const { employeeId } = getLoggedInUser();
            const myRequests = data.requests.filter(
              (r) => r.employee_id === employeeId
            );
            const hasResponse = myRequests.some(
              (r) =>
                (r.status === "RESOLVED" || r.status === "REJECTED") &&
                r.manager_remarks
            );
            counts[task.id] = {
              total: myRequests.length,
              hasResponse: hasResponse,
            };
          }
        } catch (err) {
          console.error("Fetch request count error:", err);
        }
      }
      setTaskRequestCounts(counts);
    };

    fetchRequestCounts();
  }, [paginatedTasks.length, currentPage]);

  const handlePrevious = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  const handleAddReport = (task) => {
    const t = { ...task, timeLabel: timeRange, index: startIndex + 1 };
    setSelectedTask(t);
    setIsModalOpen(true);
  };

  const handleSuccess = (data) => {
    const stamp = new Date()
      .toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .replace(",", " |");

    setTasks((prev) => {
      const copy = structuredClone(prev);
      const list = copy[timeRange][subTab];
      const idx = list.findIndex((t) => t.id === selectedTask.id);
      if (idx === -1) return prev;
      const t = list[idx];
      t.progress = data.progress;
      t.status = data.status;
      t.last_report_at = stamp;
      if (data.status === "Completed") {
        list.splice(idx, 1);
        copy[timeRange].completed.push(t);
        setSubTab("completed");
      }
      return copy;
    });
  };

  const handleOpenRequest = (task) => {
    setRequestTask(task);
    setIsRequestModalOpen(true);
  };

  const handleRequestSuccess = () => {
    alert("Request submitted successfully!");
  };

  const handleViewRequests = (task) => {
    setViewRequestsTask(task);
    setIsViewRequestsModalOpen(true);
  };

  return (
    <div className="text-black min-h-[92%] max-h-[100%] w-[100%] max-w-[100%] overflow-hidden">
      <div className="w-[100%] h-[91vh] flex flex-col gap-[1vh]">
        {/* time tabs */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm h-[6%] flex-shrink-0">
          <div className="flex border-b border-gray-200 overflow-x-auto h-full">
            {getTimeTabs().map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setTimeRange(t.key);
                  setSubTab("inProgress");
                  setCurrentPage(1);
                }}
                className={`px-[1.2vw] cursor-pointer font-medium text-[0.80vw] whitespace-nowrap transition-colors ${
                  timeRange === t.key
                    ? "border-b-[0.2vw] border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* sub tabs */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm h-[6%] flex-shrink-0">
          <div className="flex border-b border-gray-200 overflow-x-auto h-full">
            {getSubTabs().map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setSubTab(t.key);
                  setCurrentPage(1);
                }}
                className={`px-[1.2vw] cursor-pointer font-medium text-[0.80vw] whitespace-nowrap transition-colors ${
                  subTab === t.key
                    ? "border-b-[0.2vw] border-black text-black"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* content */}
        <div className="bg-white rounded-xl shadow-sm h-[86%] flex flex-col">
          <div className="flex items-center justify-between p-[0.8vw] h-[10%] flex-shrink-0">
            <div className="flex items-center gap-[0.5vw]">
              <span className="font-medium text-[1vw] text-gray-800">
                All Tasks
              </span>
              <span className="text-[0.95vw] text-gray-500">
                ({currentTasks.length})
              </span>
            </div>
          </div>

          <div className="flex-1 min-h-0 relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10">
                <div className="flex items-center gap-[0.5vw]">
                  <div
                    className="animate-spin rounded-full"
                    style={{
                      width: "1.6vw",
                      height: "1.6vw",
                      borderTopWidth: "0.15vw",
                      borderRightWidth: "0.15vw",
                      borderColor: "#111",
                    }}
                  />
                </div>
              </div>
            )}

            {currentTasks.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <svg
                  className="w-[5vw] h-[5vw] mb-[1vw] text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p className="text-[1.1vw] font-medium mb-[0.5vw]">
                  No tasks found
                </p>
                <p className="text-[1vw] text-gray-400">
                  No tasks available in this category
                </p>
              </div>
            ) : (
              <div className="h-full mr-[0.8vw] mb-[0.8vw] ml-[0.8vw] border border-gray-300 rounded-xl overflow-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-[#E2EBFF] sticky top-0">
                    <tr>
                      <th className="px-[0.7vw] py-[0.6vw] text-center text-[0.85vw] font-medium text-gray-800 border border-gray-300 w-[5%]">
                        S.NO
                      </th>
                      <th className="px-[0.7vw] py-[0.6vw] text-center text-[0.85vw] font-medium text-gray-800 border border-gray-300 w-[8%]">
                        Date
                      </th>
                      <th className="px-[0.7vw] py-[0.6vw] text-center text-[0.85vw] font-medium text-gray-800 border border-gray-300 w-[15%]">
                        Task Name
                      </th>
                      <th className="px-[0.7vw] py-[0.6vw] text-center text-[0.85vw] font-medium text-gray-800 border border-gray-300 w-[20%]">
                        Task Description
                      </th>
                      <th className="px-[0.7vw] py-[0.6vw] text-center text-[0.85vw] font-medium text-gray-800 border border-gray-300 w-[10%]">
                        Category
                      </th>
                      <th className="px-[0.7vw] py-[0.6vw] text-center text-[0.85vw] font-medium text-gray-800 border border-gray-300 w-[10%]">
                        Deadline
                      </th>
                      <th className="px-[0.7vw] py-[0.6vw] text-center text-[0.85vw] font-medium text-gray-800 border border-gray-300 w-[12%]">
                        Progress
                      </th>
                      <th className="px-[0.7vw] py-[0.6vw] text-center text-[0.85vw] font-medium text-gray-800 border border-gray-300 w-[10%]">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTasks.map((task, index) => {
                      const overdue =
                        subTab === "inProgress" &&
                        isTaskOverdue(task, timeRange);
                      const hasResponse =
                        taskRequestCounts[task.id]?.hasResponse;

                      return (
                        <tr
                          key={task.id}
                          className={`transition-colors ${
                            overdue
                              ? "bg-red-50 hover:bg-red-100 border-l-[0.4vw] border-l-red-500"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <td className="px-[0.7vw] py-[0.6vw] text-[0.85vw] text-center text-gray-900 border border-gray-300">
                            {startIndex + index + 1}
                          </td>
                          <td className="px-[0.7vw] py-[0.6vw] text-[0.85vw] text-center border border-gray-300">
                            <div className="flex items-center justify-center gap-[0.4vw]">
                              {overdue && (
                                <AlertCircle
                                  size={16}
                                  className="text-red-600"
                                />
                              )}
                              <span
                                className={
                                  overdue
                                    ? "text-red-600 font-semibold"
                                    : "text-gray-900"
                                }
                              >
                                {task.date}
                              </span>
                            </div>
                          </td>
                          <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] font-medium text-gray-900 border border-gray-300">
                            {task.task_name}
                          </td>
                          <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] text-gray-600 border border-gray-300">
                            {task.task_description}
                          </td>
                          <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] text-gray-900 text-center border border-gray-300">
                            {task.category}
                          </td>
                          <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] border border-gray-300">
                            <div className="flex items-center justify-center gap-[0.4vw]">
                              {timeRange === "today" ? (
                                <>
                                  <span
                                    className={
                                      overdue
                                        ? "text-red-600 font-semibold"
                                        : "text-gray-900"
                                    }
                                  >
                                    {task.deadline_time || "N/A"}
                                  </span>
                                  {overdue && (
                                    <span className="text-[0.7vw] text-red-600 font-medium">
                                      (Overdue)
                                    </span>
                                  )}
                                </>
                              ) : (
                                <div className="flex flex-col items-center gap-[0.2vw] w-full">
                                  <span
                                    className={`font-medium ${
                                      overdue
                                        ? "text-red-600 font-semibold"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {task.deadline_date
                                      ? formatDate(task.deadline_date)
                                      : "N/A"}
                                  </span>
                                  <span
                                    className={`text-[0.75vw] ${
                                      overdue ? "text-red-600" : "text-gray-600"
                                    }`}
                                  >
                                    ({task.deadline_time || "N/A"})
                                  </span>
                                  {overdue && (
                                    <span className="text-[0.7vw] text-red-600 font-medium">
                                      (Overdue)
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="px-[0.7vw] py-[0.5vw] border border-gray-300">
                            <div className="flex items-center justify-center gap-[0.6vw]">
                              <div className="relative w-[6vw] h-[0.85vw] bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    overdue ? "bg-red-600" : "bg-blue-600"
                                  }`}
                                  style={{ width: `${task.progress || 0}%` }}
                                />
                              </div>
                              <span
                                className={`text-[0.85vw] font-semibold ${
                                  overdue ? "text-red-600" : "text-blue-600"
                                }`}
                              >
                                {task.progress || 0}%
                              </span>
                            </div>
                          </td>
                          <td className="px-[0.7vw] py-[0.5vw] border border-gray-300">
                            <div className="flex justify-center gap-[0.4vw]">
                              {subTab === "completed" ? (
                                <button
                                  onClick={() => handleAddReport(task)}
                                  className="px-[0.5vw] py-[0.5vw] flex items-center gap-[0.5vw] text-[0.85vw] font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                                >
                                  <Eye size={14} /> View Report
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleAddReport(task)}
                                    className="px-[0.5vw] py-[0.5vw] flex items-center gap-[0.6vw] text-[0.75vw] font-medium rounded-lg bg-green-600 text-white hover:bg-green-700"
                                    title="Add Report"
                                  >
                                    <Plus size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleOpenRequest(task)}
                                    className="px-[0.5vw] py-[0.5vw] flex items-center gap-[0.6vw] text-[0.75vw] font-medium rounded-lg bg-orange-600 text-white hover:bg-orange-700"
                                    title="Submit Request"
                                  >
                                    <MessageSquare size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleViewRequests(task)}
                                    className="relative px-[0.5vw] py-[0.5vw] flex items-center gap-[0.6vw] text-[0.75vw] font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                                    title="View My Requests"
                                  >
                                    <Eye size={14} />
                                    {hasResponse && (
                                      <span className="absolute -top-[0.3vw] -right-[0.3vw] w-[0.8vw] h-[0.8vw] bg-red-500 rounded-full border-2 border-white"></span>
                                    )}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {currentTasks.length > 0 && (
            <div className="flex items-center justify-between px-[0.8vw] py-[0.6vw] h-[10%] flex-shrink-0">
              <div className="text-[0.80vw] text-gray-600">
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, currentTasks.length)} of{" "}
                {currentTasks.length} entries
              </div>
              <div className="flex items-center gap-[0.8vw]">
                <button
                  onClick={handlePrevious}
                  disabled={currentPage === 1}
                  className="px-[0.8vw] py-[0.6vw] flex items-center gap-[0.6vw] bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-[0.80vw]"
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <span className="text-[0.80vw] text-gray-600 px-[0.5vw]">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                  className="px-[0.8vw] py-[0.6vw] flex items-center gap-[0.6vw] bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-[0.80vw]"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddReportModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onSuccess={handleSuccess}
        isCompleted={subTab === "completed"}
      />

      <RequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        task={requestTask}
        onSuccess={handleRequestSuccess}
      />

      <ViewRequestsModal
        isOpen={isViewRequestsModalOpen}
        onClose={() => setIsViewRequestsModalOpen(false)}
        task={viewRequestsTask}
      />
    </div>
  );
};

export default Report;
