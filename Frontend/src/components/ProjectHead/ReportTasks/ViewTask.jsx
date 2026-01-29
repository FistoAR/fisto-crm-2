import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  Search,
  X,
  Clock,
  MessageSquare,
  AlertCircle,
  Check,
  XCircle,
} from 'lucide-react';

const RECORDS_PER_PAGE = 8;
const API_REPORT_TASKS = `${import.meta.env.VITE_API_BASE_URL}/marketing/report-tasks`;
const API_EMPLOYEES = `${import.meta.env.VITE_API_BASE_URL}/marketing/employees-list`;
const API_TASK_REQUESTS = `${import.meta.env.VITE_API_BASE_URL}/marketing/task-requests`;

/* ---------- RequestsModal Component ---------- */
const RequestsModal = ({ isOpen, onClose, task, onRequestUpdate }) => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [remarksModal, setRemarksModal] = useState({ open: false, request: null, action: null });
  const [remarks, setRemarks] = useState('');

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
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Fetch requests error:", err);
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (request, action) => {
    setRemarksModal({ open: true, request, action });
    setRemarks('');
  };

  const handleActionSubmit = async () => {
    if (!remarks.trim()) {
      alert('Please enter remarks');
      return;
    }

    const { request, action } = remarksModal;
    setActionLoading(request.request_id);

    try {
      const res = await fetch(`${API_TASK_REQUESTS}/${request.request_id}/respond`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action,
          remarks: remarks.trim(),
        }),
      });

      const data = await res.json();

      if (data.status) {
        setRequests((prev) =>
          prev.map((r) =>
            r.request_id === request.request_id
              ? { ...r, status: action === 'APPROVE' ? 'RESOLVED' : 'REJECTED', manager_remarks: remarks.trim() }
              : r
          )
        );
        
        setRemarksModal({ open: false, request: null, action: null });
        setRemarks('');
        
        onRequestUpdate?.();
        
        alert(`Request ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully!`);
      } else {
        alert(data.message || 'Failed to update request');
      }
    } catch (err) {
      console.error('Action submit error:', err);
      alert('Failed to update request');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDateTime = (isoString) => {
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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl w-[65vw] max-h-[85vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-[1vw] border-b border-gray-200 flex-shrink-0">
            <div>
              <h2 className="text-[1.1vw] font-semibold text-gray-800">
                Task Requests
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
                <AlertCircle size={48} className="mx-auto mb-[1vw] text-gray-400" />
                <p className="text-[1vw]">No requests found for this task</p>
              </div>
            ) : (
              <div className="space-y-[0.8vw]">
                {requests.map((req) => (
                  <div
                    key={req.request_id}
                    className="border border-gray-200 rounded-lg p-[1vw] hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-[0.5vw]">
                      <div className="flex items-center gap-[0.5vw]">
                        <div className="w-[2vw] h-[2vw] bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-[0.9vw] font-semibold text-blue-600">
                            {req.employee_name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-[0.9vw] font-semibold text-gray-800">
                            {req.employee_name}
                          </p>
                          <p className="text-[0.75vw] text-gray-500">
                            {formatDateTime(req.created_at)}
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
                      <p className="text-[0.75vw] font-medium text-gray-600 mb-[0.2vw]">Request:</p>
                      <p className="text-[0.85vw] text-gray-700 whitespace-pre-wrap">
                        {req.comment}
                      </p>
                    </div>

                    {req.manager_remarks && (
                      <div className="mb-[0.5vw] bg-blue-50 p-[0.5vw] rounded-md">
                        <p className="text-[0.75vw] font-medium text-blue-800 mb-[0.2vw]">Manager's Remarks:</p>
                        <p className="text-[0.85vw] text-blue-900 whitespace-pre-wrap">
                          {req.manager_remarks}
                        </p>
                      </div>
                    )}

                    {req.status === 'PENDING' && (
                      <div className="flex items-center gap-[0.5vw] mt-[0.5vw] pt-[0.5vw] border-t border-gray-200">
                        <button
                          onClick={() => handleActionClick(req, 'APPROVE')}
                          disabled={actionLoading === req.request_id}
                          className="flex items-center gap-[0.3vw] px-[0.8vw] py-[0.4vw] text-[0.8vw] bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Check size={14} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleActionClick(req, 'REJECT')}
                          disabled={actionLoading === req.request_id}
                          className="flex items-center gap-[0.3vw] px-[0.8vw] py-[0.4vw] text-[0.8vw] bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <XCircle size={14} />
                          Reject
                        </button>
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

      {remarksModal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-xl w-[40vw] overflow-hidden">
            <div className="p-[1vw] border-b border-gray-200">
              <h3 className="text-[1vw] font-semibold text-gray-800">
                {remarksModal.action === 'APPROVE' ? 'Approve Request' : 'Reject Request'}
              </h3>
            </div>
            <div className="p-[1vw]">
              <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                Remarks <span className="text-red-500">*</span>
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter your remarks here..."
                className="w-full px-[0.8vw] py-[0.6vw] border border-gray-300 rounded-md text-[0.85vw] min-h-[8vw] resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center justify-end gap-[0.5vw] px-[1vw] py-[1vw] border-t border-gray-200">
              <button
                onClick={() => {
                  setRemarksModal({ open: false, request: null, action: null });
                  setRemarks('');
                }}
                className="px-[1vw] py-[0.4vw] text-[0.85vw] text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleActionSubmit}
                disabled={!remarks.trim() || actionLoading}
                className={`px-[1vw] py-[0.4vw] text-[0.85vw] text-white rounded-lg transition-colors ${
                  remarksModal.action === 'APPROVE'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {actionLoading ? 'Processing...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ---------- Main ViewTask Component ---------- */

const ViewTask = () => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewTask, setViewTask] = useState(null);
  const [taskHistory, setTaskHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
  const [requestsTask, setRequestsTask] = useState(null);
  const [taskRequests, setTaskRequests] = useState({});

  useEffect(() => {
    loadEmployeesAndTasks();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedEmployee, filterType, filterStatus, selectedDate]);

  useEffect(() => {
    if (selectedEmployee) {
      setFilterType('all');
      setFilterStatus('all');
      setSelectedDate('');
      setSearchTerm('');
    }
  }, [selectedEmployee]);

  const loadEmployeesAndTasks = async () => {
    try {
      setLoading(true);

      const empResponse = await fetch(API_EMPLOYEES);
      const empData = await empResponse.json();

      if (empData.status) {
        setEmployees(empData.employees || []);
        
        if (empData.employees && empData.employees.length > 0) {
          setSelectedEmployee(empData.employees[0].employee_name);
        }

        const taskPromises = empData.employees.map(async (emp) => {
          try {
            const response = await fetch(
              `${API_REPORT_TASKS}?employee_name=${encodeURIComponent(emp.employee_name)}`
            );
            const data = await response.json();

            if (data.status && data.tasks) {
              return data.tasks.map((task) => ({
                id: task.marketing_task_id,
                task_code: task.task_code,
                task_name: task.task_name,
                task_description: task.task_description,
                task_type: task.task_type,
                seq_range: task.seq_range,
                category: task.category || task.emp_category || 'N/A',
                deadline_time: task.deadline_time || task.emp_deadline_time,
                deadline_date: task.deadline_date || task.emp_deadline_date,
                progress: task.emp_progress || 0,
                status: task.emp_status || 'In Progress',
                task_date: task.task_date,
                created_at: task.created_at,
                employee_id: task.employee_id,
                employee_name: task.employee_name,
                time_range: task.emp_time_range || 'today',
              }));
            }
            return [];
          } catch (err) {
            console.error(`Error fetching tasks for ${emp.employee_name}:`, err);
            return [];
          }
        });

        const allTasksData = await Promise.all(taskPromises);
        const flattenedTasks = allTasksData.flat();
        setTasks(flattenedTasks);
      }
    } catch (error) {
      console.error('Error loading employees and tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '-';

    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;

    return `${day}-${month}-${year} ${hour12}:${minutes} ${ampm}`;
  };

  const isTaskOverdue = (task) => {
    if (task.status === 'Completed') return false;
    if (!task.deadline_date) return false;

    const now = new Date();
    const deadlineDate = new Date(task.deadline_date);
    
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const deadline = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate());

    const isMorningDeadline = task.deadline_time?.toUpperCase() === 'MORNING';
    const isEveningDeadline = task.deadline_time?.toUpperCase() === 'EVENING';
    
    if ((task.task_type === 'SEQUENTIAL' && task.seq_range === 'TODAY') || 
        task.task_type === 'CONCURRENT') {
      
      if (isMorningDeadline) {
        if (deadline < today) {
          return true;
        } else if (deadline.getTime() === today.getTime()) {
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          const currentTimeInMinutes = currentHour * 60 + currentMinute;
          const morningEndTime = 13 * 60 + 30;
          
          return currentTimeInMinutes > morningEndTime;
        }
        return false;
      }
      
      if (isEveningDeadline) {
        if (deadline < today) {
          return true;
        } else if (deadline.getTime() === today.getTime()) {
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          const currentTimeInMinutes = currentHour * 60 + currentMinute;
          const eveningEndTime = 18 * 60 + 30;
          
          return currentTimeInMinutes > eveningEndTime;
        }
        return false;
      }
    }
    
    if (task.deadline_time && !isMorningDeadline && !isEveningDeadline) {
      const timeMatch = task.deadline_time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (timeMatch) {
        let [_, hours, minutes, period] = timeMatch;
        hours = parseInt(hours);
        minutes = parseInt(minutes);
        
        if (period) {
          if (period.toUpperCase() === 'PM' && hours !== 12) {
            hours += 12;
          } else if (period.toUpperCase() === 'AM' && hours === 12) {
            hours = 0;
          }
        }
        
        const deadlineDateTime = new Date(deadlineDate);
        deadlineDateTime.setHours(hours, minutes, 0, 0);
        
        return now > deadlineDateTime;
      }
    }
    
    return deadline < today;
  };

  const filterByDate = (task) => {
    if (!selectedDate) return true;

    const selectedDateObj = new Date(selectedDate);
    
    const taskDate = new Date(task.task_date || task.created_at);
    const matchesTaskDate = (
      taskDate.getFullYear() === selectedDateObj.getFullYear() &&
      taskDate.getMonth() === selectedDateObj.getMonth() &&
      taskDate.getDate() === selectedDateObj.getDate()
    );
    
    let matchesDeadlineDate = false;
    if (task.deadline_date) {
      const deadlineDate = new Date(task.deadline_date);
      matchesDeadlineDate = (
        deadlineDate.getFullYear() === selectedDateObj.getFullYear() &&
        deadlineDate.getMonth() === selectedDateObj.getMonth() &&
        deadlineDate.getDate() === selectedDateObj.getDate()
      );
    }
    
    return matchesTaskDate || matchesDeadlineDate;
  };

  const clearAllFilters = () => {
    setFilterType('all');
    setFilterStatus('all');
    setSelectedDate('');
  };

  const getTaskTypeFilter = (task) => {
    if (filterType === 'all') return true;
    
    if (filterType === 'CONCURRENT') {
      return task.task_type === 'CONCURRENT';
    }
    
    if (filterType === 'SEQ_TODAY') {
      return task.task_type === 'SEQUENTIAL' && task.seq_range === 'TODAY';
    }
    
    if (filterType === 'SEQ_WEEKLY') {
      return task.task_type === 'SEQUENTIAL' && task.seq_range === 'WEEKLY';
    }
    
    if (filterType === 'SEQ_MONTHLY') {
      return task.task_type === 'SEQUENTIAL' && task.seq_range === 'MONTHLY';
    }
    
    return true;
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesEmployee = task.employee_name === selectedEmployee;
    if (!matchesEmployee) return false;

    const matchesSearch = !searchTerm || 
      task.task_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.task_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.task_code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    const matchesType = getTaskTypeFilter(task);
    if (!matchesType) return false;

    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    if (!matchesStatus) return false;

    const matchesDate = filterByDate(task);
    if (!matchesDate) return false;

    return true;
  });

  const totalPages = Math.ceil(filteredTasks.length / RECORDS_PER_PAGE);
  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
  const endIndex = startIndex + RECORDS_PER_PAGE;
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

  useEffect(() => {
    const fetchRequestCounts = async () => {
      const counts = {};
      for (const task of paginatedTasks) {
        try {
          const res = await fetch(`${API_TASK_REQUESTS}/${task.id}`);
          const data = await res.json();
          if (data.status) {
            const pendingCount = data.requests.filter(
              (r) => r.status === "PENDING"
            ).length;
            counts[task.id] = {
              total: data.requests.length,
              pending: pendingCount,
            };
          }
        } catch (err) {
          console.error("Fetch request count error:", err);
        }
      }
      setTaskRequests(counts);
    };

    if (paginatedTasks.length > 0) {
      fetchRequestCounts();
    }
  }, [paginatedTasks.length, currentPage, selectedEmployee]);

  const handleRequestUpdate = () => {
    const fetchRequestCounts = async () => {
      const counts = {};
      for (const task of paginatedTasks) {
        try {
          const res = await fetch(`${API_TASK_REQUESTS}/${task.id}`);
          const data = await res.json();
          if (data.status) {
            const pendingCount = data.requests.filter(
              (r) => r.status === "PENDING"
            ).length;
            counts[task.id] = {
              total: data.requests.length,
              pending: pendingCount,
            };
          }
        } catch (err) {
          console.error("Fetch request count error:", err);
        }
      }
      setTaskRequests(counts);
    };

    if (paginatedTasks.length > 0) {
      fetchRequestCounts();
    }
  };

  const handlePrevious = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleViewClick = async (task) => {
    setViewTask(task);
    setIsViewModalOpen(true);
    setIsHistoryLoading(true);

    try {
      const response = await fetch(`${API_REPORT_TASKS}/${task.id}/history`);
      const data = await response.json();

      if (data.status) {
        setTaskHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error fetching task history:', error);
      setTaskHistory([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleViewRequests = (task) => {
    setRequestsTask(task);
    setIsRequestsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsViewModalOpen(false);
    setViewTask(null);
    setTaskHistory([]);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-700';
      case 'In Progress':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTaskTypeLabel = (type, seqRange) => {
    if (type === 'CONCURRENT') return 'Concurrent';
    if (type === 'SEQUENTIAL') {
      if (seqRange === 'TODAY') return 'Seq - Today';
      if (seqRange === 'WEEKLY') return 'Seq - Weekly';
      if (seqRange === 'MONTHLY') return 'Seq - Monthly';
    }
    return type;
  };

  const hasActiveFilters =
    filterType !== 'all' ||
    filterStatus !== 'all' ||
    selectedDate !== '';

  if (!selectedEmployee) {
    return (
      <div className="bg-white rounded-b-xl rounded-tr-xl shadow-sm h-[100%] flex items-center justify-center">
        <div className="text-gray-500">Loading employees...</div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-b-xl rounded-tr-xl shadow-sm h-[100%] flex flex-col">
        <div className="bg-white overflow-hidden rounded-t-xl flex-shrink-0 border-b border-gray-200">
          <div className="flex h-full w-full">
            {employees.map((emp) => {
              const empTaskCount = tasks.filter(t => t.employee_name === emp.employee_name).length;
              return (
                <button
                  key={emp.employee_id}
                  onClick={() => setSelectedEmployee(emp.employee_name)}
                  className={`px-[1.5vw] py-[0.8vw] cursor-pointer font-medium text-[0.9vw] transition-colors whitespace-nowrap ${
                    selectedEmployee === emp.employee_name
                      ? 'border-b-[3px] border-black text-black bg-white'
                      : 'text-gray-600 hover:text-gray-900 bg-white'
                  }`}
                >
                  {emp.employee_name} ({empTaskCount})
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-[0.8vw] py-[0.8vw] border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-[0.8vw] flex-wrap">
            <div className="flex items-center gap-[0.4vw]">
              <label className="text-[0.8vw] font-medium text-gray-700 whitespace-nowrap">
                Date:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-[0.6vw] py-[0.35vw] text-[0.8vw] border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
                style={{ minWidth: '150px' }}
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="text-gray-500 hover:text-red-600"
                  title="Clear date"
                >
                  <X size={'1vw'} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-[0.4vw]">
              <label className="text-[0.8vw] font-medium text-gray-700 whitespace-nowrap">
                Task Type:
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-[0.6vw] py-[0.35vw] text-[0.8vw] border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
              >
                <option value="all">All</option>
                <option value="CONCURRENT">Concurrent</option>
                <option value="SEQ_TODAY">Seq - Today</option>
                <option value="SEQ_WEEKLY">Seq - Weekly</option>
                <option value="SEQ_MONTHLY">Seq - Monthly</option>
              </select>
            </div>

            <div className="flex items-center gap-[0.4vw]">
              <label className="text-[0.8vw] font-medium text-gray-700 whitespace-nowrap">
                Status:
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-[0.6vw] py-[0.35vw] text-[0.8vw] border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
              >
                <option value="all">All</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-[0.3vw] px-[0.6vw] py-[0.35vw] text-[0.75vw] text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors cursor-pointer"
              >
                <X size={'0.9vw'} />
                Clear All Filters
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-[0.8vw] flex-shrink-0">
          <div className="flex items-center gap-[0.5vw]">
            <span className="font-medium text-[0.95vw] text-gray-800">
              {selectedEmployee}'s Tasks
            </span>
            <span className="text-[0.85vw] text-gray-500">({filteredTasks.length})</span>
          </div>
          <div className="relative">
            <Search
              className="absolute left-[0.5vw] top-1/2 transform -translate-y-1/2 text-gray-400"
              size="1.3vw"
            />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-[2.3vw] pr-[1vw] py-[0.24vw] rounded-full text-[0.9vw] bg-gray-200 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center gap-[0.5vw] px-[0.8vw] pb-[0.5vw] flex-wrap">
            <span className="text-[0.75vw] text-gray-500">Active filters:</span>
            {filterType !== 'all' && (
              <div className="flex items-center gap-[0.3vw] bg-blue-50 text-blue-700 px-[0.5vw] py-[0.2vw] rounded-full text-[0.7vw]">
                <span>
                  {filterType === 'CONCURRENT' ? 'Concurrent' : 
                   filterType === 'SEQ_TODAY' ? 'Seq - Today' :
                   filterType === 'SEQ_WEEKLY' ? 'Seq - Weekly' :
                   filterType === 'SEQ_MONTHLY' ? 'Seq - Monthly' : filterType}
                </span>
                <button
                  onClick={() => setFilterType('all')}
                  className="hover:bg-blue-100 rounded-full p-[0.1vw]"
                >
                  <X size={'0.7vw'} />
                </button>
              </div>
            )}
            {filterStatus !== 'all' && (
              <div className="flex items-center gap-[0.3vw] bg-blue-50 text-blue-700 px-[0.5vw] py-[0.2vw] rounded-full text-[0.7vw]">
                <span>{filterStatus}</span>
                <button
                  onClick={() => setFilterStatus('all')}
                  className="hover:bg-blue-100 rounded-full p-[0.1vw]"
                >
                  <X size={'0.7vw'} />
                </button>
              </div>
            )}
            {selectedDate && (
              <div className="flex items-center gap-[0.3vw] bg-blue-50 text-blue-700 px-[0.5vw] py-[0.2vw] rounded-full text-[0.7vw]">
                <Calendar size={'0.8vw'} />
                <span>{selectedDate}</span>
                <button
                  onClick={() => setSelectedDate('')}
                  className="hover:bg-blue-100 rounded-full p-[0.1vw]"
                >
                  <X size={'0.7vw'} />
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 min-h-0 px-[0.8vw] pb-[0.8vw]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-[2vw] w-[2vw] border-b-2 border-blue-600"></div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="text-[1.1vw] font-medium mb-[0.5vw]">No tasks found</p>
              <p className="text-[1vw] text-gray-400">
                {hasActiveFilters ? 'Try adjusting your filters' : 'Tasks will appear here once created'}
              </p>
            </div>
          ) : (
            <div className="border border-gray-300 rounded-xl overflow-auto h-full">
              <table className="w-full border-collapse border border-gray-300 min-w-[1400px]">
                <thead className="bg-[#E2EBFF] sticky top-0 z-10">
                  <tr>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 min-w-[50px]">
                      S.NO
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 min-w-[100px]">
                      Date
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 min-w-[150px]">
                      Task Name
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 min-w-[200px]">
                      Description
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 min-w-[120px]">
                      Task Type
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 min-w-[100px]">
                      Category
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 min-w-[100px]">
                      Deadline
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 min-w-[100px]">
                      Status
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 min-w-[120px]">
                      Progress
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 min-w-[100px] sticky right-0 bg-[#E2EBFF] z-10">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTasks.map((task, index) => {
                    const isOverdue = isTaskOverdue(task);
                    
                    return (
                      <tr 
                        key={task.id} 
                        className={`transition-colors ${
                          isOverdue 
                            ? 'bg-red-200 hover:bg-red-100' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-center text-gray-900 border border-gray-300">
                          {startIndex + index + 1}
                        </td>
                        <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-center text-gray-900 border border-gray-300">
                          {formatDisplayDate(task.task_date || task.created_at)}
                        </td>
                        <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-900 border border-gray-300">
                          {task.task_name}
                        </td>
                        <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-900 border border-gray-300">
                          <div className="max-w-[200px] truncate" title={task.task_description}>
                            {task.task_description || '-'}
                          </div>
                        </td>
                        <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-center text-gray-900 border border-gray-300">
                          <span className="inline-block px-[0.5vw] py-[0.2vw] rounded-full text-[0.75vw] bg-purple-100 text-purple-700">
                            {getTaskTypeLabel(task.task_type, task.seq_range)}
                          </span>
                        </td>
                        <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-center text-gray-900 border border-gray-300">
                          {task.category}
                        </td>
                        <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-center text-gray-900 border border-gray-300">
                          <div className="flex flex-col items-center gap-[0.2vw]">
                            {task.deadline_date && (
                              <span className="text-[0.75vw]">{formatDisplayDate(task.deadline_date)}</span>
                            )}
                            <span className="text-[0.75vw] text-gray-600">{task.deadline_time || '-'}</span>
                          </div>
                        </td>
                        <td className="px-[0.7vw] py-[0.56vw] text-center border border-gray-300">
                          <span
                            className={`px-[0.5vw] py-[0.2vw] rounded-full text-[0.75vw] inline-block font-medium ${getStatusColor(
                              task.status
                            )}`}
                          >
                            {task.status}
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
                            <span className="text-[0.75vw] font-medium text-gray-700 whitespace-nowrap">
                              {task.progress || 0}%
                            </span>
                          </div>
                        </td>
                        <td className="px-[0.7vw] py-[0.52vw] border border-gray-300 sticky right-0 bg-white">
                          <div className="flex justify-center items-center gap-[0.3vw]">
                            <button
                              onClick={() => handleViewClick(task)}
                              className="p-[0.6vw] text-blue-600 hover:bg-blue-50 rounded-full transition-colors cursor-pointer"
                              title="View Task"
                            >
                              <Eye size={'1.02vw'} />
                            </button>

                            <button
                              onClick={() => handleViewRequests(task)}
                              className="relative p-[0.6vw] text-orange-600 hover:bg-orange-50 rounded-full transition-colors cursor-pointer"
                              title="View Requests"
                            >
                              <MessageSquare size={'1.02vw'} />
                              {taskRequests[task.id]?.pending > 0 && (
                                <span className="absolute -top-[0.2vw] -right-[0.2vw] bg-red-500 text-white text-[0.6vw] font-bold rounded-full w-[1vw] h-[1vw] flex items-center justify-center">
                                  {taskRequests[task.id].pending}
                                </span>
                              )}
                            </button>
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

        {!loading && filteredTasks.length > 0 && (
          <div className="flex items-center justify-between px-[0.8vw] py-[0.5vw] h-[10%] flex-shrink-0 border-t border-gray-200">
            <div className="text-[0.85vw] text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredTasks.length)} of{' '}
              {filteredTasks.length} entries
            </div>
            <div className="flex items-center gap-[0.5vw]">
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className="px-[0.8vw] py-[0.4vw] flex items-center gap-[0.3vw] bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-[0.85vw] transition cursor-pointer"
              >
                <ChevronLeft size={'1vw'} />
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
                <ChevronRight size={'1vw'} />
              </button>
            </div>
          </div>
        )}
      </div>

      {isViewModalOpen && viewTask && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[55vw] max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-[1vw] border-b border-gray-200 flex-shrink-0">
              <div>
                <h2 className="text-[1.1vw] font-semibold text-gray-800">Task Details</h2>
                <p className="text-[0.8vw] text-gray-500 mt-[0.2vw]">{viewTask.task_name}</p>
              </div>
              <button
                onClick={handleModalClose}
                className="p-[0.3vw] hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={'1.2vw'} className="text-gray-500" />
              </button>
            </div>

            <div className="p-[1vw] overflow-y-auto flex-1">
              <div className="mb-[1.5vw]">
                <h3 className="text-[0.95vw] font-semibold text-gray-800 mb-[0.5vw]">
                  Basic Information
                </h3>
                <table className="w-full border-collapse border border-gray-300">
                  <tbody>
                    <tr className="bg-gray-50">
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] font-medium text-gray-700 border border-gray-300 w-[30%]">
                        Employee Name
                      </td>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] text-gray-900 border border-gray-300">
                        {viewTask.employee_name}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] font-medium text-gray-700 border border-gray-300">
                        Task Code
                      </td>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] text-gray-900 border border-gray-300">
                        {viewTask.task_code || '-'}
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] font-medium text-gray-700 border border-gray-300">
                        Task Name
                      </td>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] text-gray-900 border border-gray-300">
                        {viewTask.task_name}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] font-medium text-gray-700 border border-gray-300">
                        Description
                      </td>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] text-gray-900 border border-gray-300 whitespace-pre-wrap">
                        {viewTask.task_description || 'No description'}
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] font-medium text-gray-700 border border-gray-300">
                        Task Type
                      </td>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] border border-gray-300">
                        <span className="inline-block px-[0.5vw] py-[0.2vw] rounded-full text-[0.75vw] font-medium bg-purple-100 text-purple-700">
                          {getTaskTypeLabel(viewTask.task_type, viewTask.seq_range)}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] font-medium text-gray-700 border border-gray-300">
                        Category
                      </td>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] text-gray-900 border border-gray-300">
                        {viewTask.category}
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] font-medium text-gray-700 border border-gray-300">
                        Status
                      </td>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] border border-gray-300">
                        <span
                          className={`inline-block px-[0.5vw] py-[0.2vw] rounded-full text-[0.75vw] font-medium ${getStatusColor(
                            viewTask.status
                          )}`}
                        >
                          {viewTask.status}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] font-medium text-gray-700 border border-gray-300">
                        Progress
                      </td>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] text-gray-900 border border-gray-300">
                        <div className="flex items-center gap-[0.5vw]">
                          <div className="w-[10vw] bg-gray-200 rounded-full h-[0.6vw]">
                            <div
                              className="bg-blue-600 h-[0.6vw] rounded-full transition-all"
                              style={{ width: `${viewTask.progress || 0}%` }}
                            ></div>
                          </div>
                          <span className="font-medium">{viewTask.progress || 0}%</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mb-[1.5vw]">
                <h3 className="text-[0.95vw] font-semibold text-gray-800 mb-[0.5vw]">Schedule</h3>
                <table className="w-full border-collapse border border-gray-300">
                  <tbody>
                    <tr className="bg-gray-50">
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] font-medium text-gray-700 border border-gray-300 w-[30%]">
                        Task Date
                      </td>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] text-gray-900 border border-gray-300">
                        {formatDisplayDate(viewTask.task_date)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] font-medium text-gray-700 border border-gray-300">
                        Deadline Date
                      </td>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] text-gray-900 border border-gray-300">
                        {viewTask.deadline_date ? formatDisplayDate(viewTask.deadline_date) : '-'}
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] font-medium text-gray-700 border border-gray-300">
                        Deadline Time
                      </td>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.85vw] text-gray-900 border border-gray-300">
                        {viewTask.deadline_time || '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {taskHistory.length > 0 && (
                <div>
                  <h3 className="text-[0.95vw] font-semibold text-gray-800 mb-[0.5vw] flex items-center gap-[0.5vw]">
                    <Clock size={16} />
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
                            Progress
                          </th>
                          <th className="px-[0.7vw] py-[0.5vw] text-[0.85vw] font-medium text-gray-800 border-b border-gray-300 text-center">
                            Status
                          </th>
                          <th className="px-[0.7vw] py-[0.5vw] text-[0.85vw] font-medium text-gray-800 border-b border-gray-300 text-left">
                            Remarks
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {isHistoryLoading ? (
                          <tr>
                            <td colSpan="4" className="text-center py-[2vw]">
                              <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-[1.5vw] w-[1.5vw] border-b-2 border-blue-600"></div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          taskHistory.map((entry, index) => (
                            <tr key={entry.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                              <td className="px-[0.7vw] py-[0.5vw] text-[0.8vw] text-gray-900 border-b border-gray-300">
                                {formatDateTime(entry.submitted_at)}
                              </td>
                              <td className="px-[0.7vw] py-[0.5vw] text-[0.8vw] text-center text-gray-900 border-b border-gray-300">
                                <span className="font-medium">{entry.progress}%</span>
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
                              <td className="px-[0.7vw] py-[0.5vw] text-[0.8vw] text-gray-900 border-b border-gray-300">
                                {entry.remarks || '-'}
                              </td>
                            </tr>
                          ))
                        )}
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

      <RequestsModal
        isOpen={isRequestsModalOpen}
        onClose={() => setIsRequestsModalOpen(false)}
        task={requestsTask}
        onRequestUpdate={handleRequestUpdate}
      />
    </>
  );
};

export default ViewTask;
