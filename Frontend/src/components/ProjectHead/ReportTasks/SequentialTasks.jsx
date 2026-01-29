import React, { useState, useEffect } from "react";
import { Edit, Trash2, Save, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useConfirm } from "../../ConfirmContext";
import { useNotification } from "../../NotificationContext";
import MultiSelectEmployee from "./MultiSelectEmployee";
import CategoryInput from "./CategoryInput";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/marketing-tasks`;
const API_EMPLOYEES = `${
  import.meta.env.VITE_API_BASE_URL
}/marketing/employees-list`;

// ✅ Define records per page
const RECORDS_PER_PAGE = 8;

const SequentialTasks = () => {
  const confirm = useConfirm();
  const { notify } = useNotification();

  const [isLoading, setIsLoading] = useState(true);
  const [seqRange, setSeqRange] = useState("today");
  const [todayTasks, setTodayTasks] = useState([]);
  const [weeklyTasks, setWeeklyTasks] = useState([]);
  const [monthlyTasks, setMonthlyTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [categories, setCategories] = useState([]);

  // ✅ Add pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Form states
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [categoryInput, setCategoryInput] = useState("");
  const [taskName, setTaskName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("MORNING");
  const [deadlineDate, setDeadlineDate] = useState("");

  // Edit states
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editData, setEditData] = useState(null);

  // Assignment changes
  const [assignmentChanges, setAssignmentChanges] = useState({});

  const fetchJson = async (url, options = {}) => {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  useEffect(() => {
    loadData();
  }, []);

  // ✅ Reset to page 1 when switching tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [seqRange]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      const empData = await fetchJson(API_EMPLOYEES);
      if (empData.status) {
        setEmployees(empData.employees || []);
      }

      const [today, weekly, monthly] = await Promise.all([
        fetchJson(`${API_BASE}?task_type=SEQUENTIAL&seq_range=TODAY`),
        fetchJson(`${API_BASE}?task_type=SEQUENTIAL&seq_range=WEEKLY`),
        fetchJson(`${API_BASE}?task_type=SEQUENTIAL&seq_range=MONTHLY`),
      ]);

      setTodayTasks(today || []);
      setWeeklyTasks(weekly || []);
      setMonthlyTasks(monthly || []);

      const all = [...(today || []), ...(weekly || []), ...(monthly || [])];
      const uniqCategories = Array.from(
        new Set(all.map((t) => t.category).filter(Boolean))
      );
      setCategories(uniqCategories);
    } catch (err) {
      console.error("Load data error", err);
      notify({ title: "Error", message: "Failed to load data" });
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentTaskList = () => {
    if (seqRange === "today") return todayTasks;
    if (seqRange === "weekly") return weeklyTasks;
    return monthlyTasks;
  };

  const setCurrentTaskList = (updater) => {
    if (seqRange === "today") setTodayTasks(updater);
    else if (seqRange === "weekly") setWeeklyTasks(updater);
    else setMonthlyTasks(updater);
  };

  const sequentialTasks = getCurrentTaskList();
  const totalSequentialCount =
    todayTasks.length + weeklyTasks.length + monthlyTasks.length;

  const handleAddTask = async () => {
    if (
      !taskName.trim() ||
      !taskDescription.trim() ||
      selectedEmployees.length === 0
    ) {
      notify({
        title: "Warning",
        message:
          "Please fill all required fields and select at least one employee",
      });
      return;
    }

    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const createdByName = userData.employeeName || null;

    const seqValue =
      seqRange === "today"
        ? "TODAY"
        : seqRange === "weekly"
        ? "WEEKLY"
        : "MONTHLY";

    const body = {
      task_name: taskName.trim(),
      task_description: taskDescription.trim(),
      task_type: "SEQUENTIAL",
      seq_range: seqValue,
      category: categoryInput.trim() || null,
      assign_status: "ASSIGN",
      created_by: createdByName,
      deadline_time: deadlineTime,
      deadline_date:
        seqRange === "weekly" || seqRange === "monthly" ? deadlineDate : null,
      employees: selectedEmployees.map((emp) => ({
        employee_id: emp.employee_id,
        employee_name: emp.employee_name,
      })),
    };

    try {
      const res = await fetchJson(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const ids = res.ids || [];
      const newTasks = selectedEmployees.map((emp, idx) => ({
        marketing_task_id: ids[idx] || Date.now() + idx,
        ...body,
        employee_id: emp.employee_id,
        employee_name: emp.employee_name,
      }));

      setCurrentTaskList((prev) => [...newTasks, ...prev]);

      if (body.category && !categories.includes(body.category)) {
        setCategories((prev) => [...prev, body.category]);
      }

      resetForm();

      notify({
        title: "Success",
        message: `Task added for ${newTasks.length} employee${
          newTasks.length > 1 ? "s" : ""
        }`,
      });
    } catch (err) {
      console.error("Create task error", err);
      notify({ title: "Error", message: "Failed to add task" });
    }
  };

  const handleSaveEdit = async () => {
    if (
      !editData ||
      !editData.task_name?.trim() ||
      !editData.task_description?.trim()
    ) {
      notify({
        title: "Warning",
        message: "Task name and description are required",
      });
      return;
    }

    try {
      await fetchJson(`${API_BASE}/${editingTaskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });

      setCurrentTaskList((prev) =>
        prev.map((t) =>
          t.marketing_task_id === editingTaskId ? { ...t, ...editData } : t
        )
      );
      setEditingTaskId(null);
      setEditData(null);
      notify({ title: "Success", message: "Task updated successfully" });
    } catch (err) {
      console.error("Update task error", err);
      notify({ title: "Error", message: "Failed to update task" });
    }
  };

  const handleDelete = async (task) => {
    const ok = await confirm({
      type: "error",
      title: `Are you sure want to delete ${task.task_name}?`,
      message: "This action cannot be undone.\nAre you sure?",
      confirmText: "Yes, Delete",
      cancelText: "Cancel",
    });

    if (!ok) return;

    try {
      await fetch(`${API_BASE}/${task.marketing_task_id}`, {
        method: "DELETE",
      });
      setCurrentTaskList((prev) =>
        prev.filter((t) => t.marketing_task_id !== task.marketing_task_id)
      );
      setAssignmentChanges((prev) => {
        const c = { ...prev };
        delete c[task.marketing_task_id];
        return c;
      });
      notify({ title: "Delete", message: "Task deleted successfully" });
    } catch (err) {
      console.error("Delete task error", err);
      notify({ title: "Error", message: "Failed to delete task" });
    }
  };

  const handleToggleAssign = (taskId, type) => {
    const task = sequentialTasks.find((t) => t.marketing_task_id === taskId);
    if (!task) return;
    const current = assignmentChanges[taskId] ?? task.assign_status;
    if (current === type) return;
    setAssignmentChanges((prev) => ({ ...prev, [taskId]: type }));
  };

  const handleSaveAssignment = async (taskId) => {
    const newType = assignmentChanges[taskId];
    if (!newType) return;
    const task = sequentialTasks.find((t) => t.marketing_task_id === taskId);
    if (!task) return;

    try {
      await fetchJson(`${API_BASE}/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...task, assign_status: newType }),
      });

      setCurrentTaskList((prev) =>
        prev.map((t) =>
          t.marketing_task_id === taskId ? { ...t, assign_status: newType } : t
        )
      );
      setAssignmentChanges((prev) => {
        const c = { ...prev };
        delete c[taskId];
        return c;
      });
      notify({ title: "Success", message: "Assignment status updated" });
    } catch (err) {
      console.error("Save assign error", err);
      notify({ title: "Error", message: "Failed to update assignment" });
    }
  };

  const handleCancelAssignment = (taskId) => {
    setAssignmentChanges((prev) => {
      const c = { ...prev };
      delete c[taskId];
      return c;
    });
  };

  const resetForm = () => {
    setTaskName("");
    setTaskDescription("");
    setCategoryInput("");
    setSelectedEmployees([]);
    setDeadlineTime("MORNING");
    setDeadlineDate("");
  };

  const canAddTask =
    taskName.trim() && taskDescription.trim() && selectedEmployees.length > 0;

  // ✅ Pagination calculations
  const totalPages = Math.ceil(sequentialTasks.length / RECORDS_PER_PAGE);
  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
  const endIndex = startIndex + RECORDS_PER_PAGE;
  const paginatedTasks = sequentialTasks.slice(startIndex, endIndex);

  const handlePrevious = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <div className="bg-white rounded-b-xl rounded-tr-xl shadow-sm h-[100%] flex flex-col">
      {/* Header with Range Tabs */}
      <div className="flex items-center justify-between p-[0.8vw] h-[8%] flex-shrink-0 border-b border-gray-200">
        <div className="flex items-center gap-[0.5vw]">
          <h2 className="text-[1vw] font-semibold text-gray-800">
            Frequent Sequential Task
          </h2>
          <span className="text-[0.85vw] text-gray-500">
            ({totalSequentialCount})
          </span>
        </div>
        <div className="inline-flex items-center bg-black rounded-full p-[0.12vw]">
          <button
            onClick={() => setSeqRange("today")}
            className={`px-[1.2vw] py-[0.4vw] text-[0.8vw] font-semibold rounded-full transition-all cursor-pointer ${
              seqRange === "today"
                ? "bg-white text-black shadow-sm"
                : "bg-transparent text-white hover:bg-gray-800"
            }`}
          >
            Today ({todayTasks.length})
          </button>
          <button
            onClick={() => setSeqRange("weekly")}
            className={`px-[1.2vw] py-[0.4vw] text-[0.8vw] font-semibold rounded-full transition-all cursor-pointer ${
              seqRange === "weekly"
                ? "bg-white text-black shadow-sm"
                : "bg-transparent text-white hover:bg-gray-800"
            }`}
          >
            Weekly ({weeklyTasks.length})
          </button>
          <button
            onClick={() => setSeqRange("monthly")}
            className={`px-[1.2vw] py-[0.4vw] text-[0.8vw] font-semibold rounded-full transition-all cursor-pointer ${
              seqRange === "monthly"
                ? "bg-white text-black shadow-sm"
                : "bg-transparent text-white hover:bg-gray-800"
            }`}
          >
            Monthly ({monthlyTasks.length})
          </button>
        </div>
      </div>

      {/* Form Section */}
      <div className="p-[0.8vw] flex-shrink-0">
        <div className="flex items-start gap-[0.8vw] mb-[0.8vw]">
          <MultiSelectEmployee
            employees={employees}
            selectedEmployees={selectedEmployees}
            setSelectedEmployees={setSelectedEmployees}
            label="Employee"
          />

          <CategoryInput
            categories={categories}
            categoryInput={categoryInput}
            setCategoryInput={setCategoryInput}
          />

          <div className="flex flex-col">
            <label className="text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">
              Deadline <span className="text-red-500">*</span>
            </label>
            <select
              value={deadlineTime}
              onChange={(e) => setDeadlineTime(e.target.value)}
              className="px-[0.6vw] py-[0.4vw] text-[0.85vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
            >
              <option value="MORNING">Morning</option>
              <option value="EVENING">Evening</option>
            </select>
          </div>

          {(seqRange === "weekly" || seqRange === "monthly") && (
            <div className="flex flex-col">
              <label className="text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">
                Deadline Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="px-[0.6vw] py-[0.4vw] text-[0.85vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </div>

        <div className="flex items-end gap-[0.7vw]">
          <div className="flex-1 flex flex-col">
            <label className="text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">
              Task Name <span className="text-red-500">*</span>
            </label>
            <input
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canAddTask) handleAddTask();
              }}
              placeholder="Enter task name"
              className="w-full px-[0.6vw] py-[0.4vw] text-[0.85vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex-1 flex flex-col">
            <label className="text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">
              Task Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Enter task description"
              rows="2"
              className="w-full px-[0.6vw] py-[0.4vw] text-[0.85vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
          <button
            onClick={handleAddTask}
            disabled={!canAddTask}
            className={`px-[1vw] py-[0.4vw] text-[0.85vw] font-semibold rounded-lg h-[2.5vw] whitespace-nowrap transition-colors cursor-pointer ${
              !canAddTask
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-black hover:bg-gray-800 text-white"
            }`}
          >
            Add Task
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 min-h-0 p-[0.8vw] pt-0 flex flex-col">
        <div className="flex-1 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-[2vw] w-[2vw] border-b-2 border-blue-600"></div>
            </div>
          ) : sequentialTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="text-[1.1vw] font-medium mb-[0.5vw]">
                No tasks found
              </p>
              <p className="text-[1vw] text-gray-400">
                Tasks will appear here once created
              </p>
            </div>
          ) : (
            <div className="border border-gray-300 rounded-xl overflow-auto h-full">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-[#E2EBFF] sticky top-0">
                  <tr>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                      S.NO
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                      Date
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                      Task Name
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                      Task Description
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                      Employee
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                      Category
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                      Deadline
                    </th>
                    {(seqRange === "weekly" || seqRange === "monthly") && (
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                        Deadline Date
                      </th>
                    )}
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                      Assign
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* ✅ Use paginatedTasks instead of sequentialTasks */}
                  {paginatedTasks.map((task, index) => {
                    const id = task.marketing_task_id;
                    const hasUnsaved = assignmentChanges[id] !== undefined;
                    const currentType = hasUnsaved
                      ? assignmentChanges[id]
                      : task.assign_status;

                    return (
                      <tr
                        key={id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-center text-gray-900 border border-gray-300">
                          {/* ✅ Use startIndex for correct numbering */}
                          {startIndex + index + 1}
                        </td>
                        <td className="w-[7vw] px-[0.7vw] py-[0.56vw] text-[0.86vw] text-center text-gray-900 border border-gray-300">
                          {formatDisplayDate(task.created_at)}
                        </td>
                        <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-900 border border-gray-300">
                          {editingTaskId === id ? (
                            <input
                              value={editData?.task_name || ""}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  task_name: e.target.value,
                                })
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit();
                                if (e.key === "Escape") {
                                  setEditingTaskId(null);
                                  setEditData(null);
                                }
                              }}
                              className="w-full px-[0.6vw] py-[0.4vw] text-[0.85vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                              autoFocus
                            />
                          ) : (
                            <span className="font-semibold">
                              {task.task_name}
                            </span>
                          )}
                        </td>
                        <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-900 border border-gray-300">
                          {editingTaskId === id ? (
                            <textarea
                              value={editData?.task_description || ""}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  task_description: e.target.value,
                                })
                              }
                              rows="2"
                              className="w-full px-[0.6vw] py-[0.4vw] text-[0.85vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-none"
                            />
                          ) : (
                            <div className="whitespace-pre-wrap">
                              {task.task_description}
                            </div>
                          )}
                        </td>
                        <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-900 border border-gray-300">
                          {task.employee_name}
                        </td>
                        <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-900 border border-gray-300">
                          {task.category}
                        </td>
                        <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-center text-gray-900 border border-gray-300">
                          {task.deadline_time || "N/A"}
                        </td>
                        {(seqRange === "weekly" || seqRange === "monthly") && (
                          <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-center text-gray-900 border border-gray-300">
                            {task.deadline_date
                              ? new Date(task.deadline_date).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  }
                                )
                              : "N/A"}
                          </td>
                        )}
                        <td className="px-[0.7vw] py-[0.56vw] border border-gray-300">
                          <div className="flex bg-gray-100 rounded-full p-[0.2vw] gap-[0.2vw]">
                            <button
                              onClick={() => handleToggleAssign(id, "ASSIGN")}
                              className={`px-[0.8vw] py-[0.3vw] rounded-full text-[0.75vw] font-medium transition-all cursor-pointer ${
                                currentType === "ASSIGN"
                                  ? "bg-blue-600 text-white"
                                  : "bg-transparent text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              Assign
                            </button>
                            <button
                              onClick={() => handleToggleAssign(id, "HOLD")}
                              className={`px-[0.8vw] py-[0.3vw] rounded-full text-[0.75vw] font-medium transition-all cursor-pointer ${
                                currentType === "HOLD"
                                  ? "bg-blue-600 text-white"
                                  : "bg-transparent text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              Hold
                            </button>
                          </div>
                        </td>
                        <td className="px-[0.7vw] py-[0.52vw] border border-gray-300">
                          <div className="flex justify-center items-center gap-[0.3vw]">
                            {editingTaskId === id ? (
                              <>
                                <button
                                  onClick={handleSaveEdit}
                                  disabled={
                                    !editData?.task_name?.trim() ||
                                    !editData?.task_description?.trim()
                                  }
                                  className={`p-[0.6vw] rounded-full transition-colors cursor-pointer ${
                                    !editData?.task_name?.trim() ||
                                    !editData?.task_description?.trim()
                                      ? "text-gray-400 cursor-not-allowed"
                                      : "text-blue-600 hover:bg-blue-50"
                                  }`}
                                  title="Save"
                                >
                                  <Save size={"1.02vw"} />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingTaskId(null);
                                    setEditData(null);
                                  }}
                                  className="p-[0.6vw] text-gray-600 hover:bg-gray-50 rounded-full transition-colors cursor-pointer"
                                  title="Cancel"
                                >
                                  <X size={"1.02vw"} />
                                </button>
                              </>
                            ) : hasUnsaved ? (
                              <>
                                <button
                                  onClick={() => handleSaveAssignment(id)}
                                  className="p-[0.6vw] text-blue-600 hover:bg-blue-50 rounded-full transition-colors cursor-pointer"
                                  title="Save Assignment"
                                >
                                  <Save size={"1.02vw"} />
                                </button>
                                <button
                                  onClick={() => handleCancelAssignment(id)}
                                  className="p-[0.6vw] text-gray-600 hover:bg-gray-50 rounded-full transition-colors cursor-pointer"
                                  title="Cancel"
                                >
                                  <X size={"1.02vw"} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingTaskId(id);
                                    setEditData({ ...task });
                                  }}
                                  className="p-[0.6vw] text-gray-600 hover:bg-gray-50 rounded-full transition-colors cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit size={"1.02vw"} />
                                </button>
                                <button
                                  onClick={() => handleDelete(task)}
                                  className="p-[0.6vw] text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 size={"1.02vw"} />
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

        {/* ✅ Pagination Controls */}
        {!isLoading && sequentialTasks.length > 0 && (
          <div className="flex items-center justify-between px-[0.8vw] py-[0.5vw] mt-[0.5vw] flex-shrink-0">
            <div className="text-[0.85vw] text-gray-600">
              Showing {startIndex + 1} to{" "}
              {Math.min(endIndex, sequentialTasks.length)} of{" "}
              {sequentialTasks.length} entries
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
  );
};

export default SequentialTasks;
