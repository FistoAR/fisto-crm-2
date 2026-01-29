import React, { useState, useMemo } from "react";
import {
  Calendar,
  Plus,
  X,
  Edit2,
  Trash2,
  Save,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  FileText,
  Search,
  Filter,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  Tag,
  CalendarDays,
  CalendarRange,
  CalendarCheck,
} from "lucide-react";

function MultiDatePicker({ selectedDates, onDatesChange, existingDates = [] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isDragging, setIsDragging] = useState(false);

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const formatDate = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const getTodayString = () => {
    const today = new Date();
    return formatDate(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const isDateSelected = (dateStr) => {
    return selectedDates.includes(dateStr);
  };

  const isDateDisabled = (dateStr) => {
    return existingDates.includes(dateStr);
  };

  const isPastDate = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(dateStr);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const isSunday = (dateStr) => {
    const date = new Date(dateStr);
    return date.getDay() === 0;
  };

  const toggleDate = (dateStr) => {
    if (isDateDisabled(dateStr) || isPastDate(dateStr) || isSunday(dateStr))
      return;

    if (isDateSelected(dateStr)) {
      onDatesChange(selectedDates.filter((d) => d !== dateStr));
    } else {
      onDatesChange([...selectedDates, dateStr].sort());
    }
  };

  const handleMouseDown = (dateStr) => {
    if (isDateDisabled(dateStr) || isPastDate(dateStr) || isSunday(dateStr))
      return;
    setIsDragging(true);
    toggleDate(dateStr);
  };

  const handleMouseEnter = (dateStr) => {
    if (
      isDragging &&
      !isDateDisabled(dateStr) &&
      !isPastDate(dateStr) &&
      !isSunday(dateStr)
    ) {
      if (!isDateSelected(dateStr)) {
        onDatesChange([...selectedDates, dateStr].sort());
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const clearDates = () => {
    onDatesChange([]);
  };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-[2.5vw]"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDate(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    const isSelected = isDateSelected(dateStr);
    const isDisabled = isDateDisabled(dateStr);
    const isPast = isPastDate(dateStr);
    const isSundayDate = isSunday(dateStr);
    const isToday = dateStr === getTodayString();

    let dayClasses = "";
    let tooltipText = "";

    if (isPast) {
      dayClasses = "bg-gray-100 text-gray-300 cursor-not-allowed";
      tooltipText = "Past date";
    } else if (isSundayDate) {
      dayClasses =
        "bg-orange-100 text-orange-400 cursor-not-allowed border-2 border-orange-200";
      tooltipText = "Sunday - Holiday";
    } else if (isDisabled) {
      dayClasses =
        "bg-red-100 text-red-600 cursor-not-allowed border-2 border-red-300";
      tooltipText = "Already assigned";
    } else if (isSelected) {
      dayClasses = "bg-blue-600 text-white font-semibold cursor-pointer";
      tooltipText = "Selected";
    } else if (isToday) {
      dayClasses =
        "bg-blue-100 text-blue-600 font-semibold cursor-pointer border-2 border-blue-400";
      tooltipText = "Today";
    } else {
      dayClasses = "bg-gray-50 hover:bg-gray-100 cursor-pointer";
      tooltipText = "";
    }

    days.push(
      <div
        key={day}
        onMouseDown={() => handleMouseDown(dateStr)}
        onMouseEnter={() => handleMouseEnter(dateStr)}
        onMouseUp={handleMouseUp}
        className={`h-[2.3vw] flex items-center justify-center select-none rounded-lg transition ${dayClasses}`}
        title={tooltipText}
      >
        <span className="text-[0.82vw]">{day}</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-[0.8vw] shadow-lg">
      <div className="flex justify-between items-center mb-[0.8vw]">
        <button
          onClick={previousMonth}
          className="p-[0.4vw] hover:bg-gray-100 rounded"
        >
          <ChevronLeft className="w-[1.2vw] h-[1.2vw] cursor-pointer" />
        </button>
        <div className="font-semibold text-gray-800 text-[0.9vw]">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        <button
          onClick={nextMonth}
          className="p-[0.4vw] hover:bg-gray-100 rounded"
        >
          <ChevronRight className="w-[1.2vw] h-[1.2vw] cursor-pointer" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-[0.2vw] mb-[0.4vw] bg-gray-100 rounded-xl">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day, index) => (
          <div
            key={day}
            className={`h-[2vw] flex items-center justify-center text-[0.75vw] font-medium ${
              index === 0 ? "text-orange-500" : "text-gray-600"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      <div
        className="grid grid-cols-7 gap-[0.2vw]"
        onMouseLeave={handleMouseUp}
      >
        {days}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-[0.8vw] mt-[0.6vw] pt-[0.4vw] border-t border-gray-200">
        <div className="flex items-center gap-[0.3vw]">
          <div className="w-[0.8vw] h-[0.8vw] bg-red-100 border-2 border-red-300 rounded"></div>
          <span className="text-[0.65vw] text-gray-600">Assigned</span>
        </div>
        <div className="flex items-center gap-[0.3vw]">
          <div className="w-[0.8vw] h-[0.8vw] bg-orange-100 border-2 border-orange-200 rounded"></div>
          <span className="text-[0.65vw] text-gray-600">Sunday</span>
        </div>
        <div className="flex items-center gap-[0.3vw]">
          <div className="w-[0.8vw] h-[0.8vw] bg-blue-600 rounded"></div>
          <span className="text-[0.65vw] text-gray-600">Selected</span>
        </div>
        <div className="flex items-center gap-[0.3vw]">
          <div className="w-[0.8vw] h-[0.8vw] bg-gray-100 rounded"></div>
          <span className="text-[0.65vw] text-gray-600">Past</span>
        </div>
      </div>

      <div className="flex justify-between items-center mt-[0.6vw] py-[0.4vw] px-[1vw] rounded-lg bg-blue-50">
        <button
          onClick={clearDates}
          className="text-[0.75vw] text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
        >
          Clear
        </button>
        <span className="text-[0.7vw] text-gray-600">
          {selectedDates.length} selected
        </span>
        <button
          onClick={goToToday}
          className="text-[0.75vw] text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
        >
          Today
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status, size = "normal" }) {
  const statusConfig = {
    "Not Started": {
      bg: "bg-gray-100",
      text: "text-gray-700",
      border: "border-gray-300",
      icon: Clock,
    },
    "In Progress": {
      bg: "bg-blue-100",
      text: "text-blue-700",
      border: "border-blue-300",
      icon: PlayCircle,
    },
    Completed: {
      bg: "bg-green-100",
      text: "text-green-700",
      border: "border-green-300",
      icon: CheckCircle,
    },
    Overdue: {
      bg: "bg-red-100",
      text: "text-red-700",
      border: "border-red-300",
      icon: AlertCircle,
    },
    Delayed: {
      bg: "bg-orange-100",
      text: "text-orange-700",
      border: "border-orange-300",
      icon: PauseCircle,
    },
  };

  const config = statusConfig[status] || statusConfig["Not Started"];
  const Icon = config.icon;

  const sizeClasses =
    size === "small"
      ? "px-[0.4vw] py-[0.15vw] text-[0.65vw]"
      : "px-[0.5vw] py-[0.2vw] text-[0.7vw]";

  return (
    <span
      className={`inline-flex items-center gap-[0.2vw] ${sizeClasses} ${config.bg} ${config.text} border ${config.border} rounded-full font-medium`}
    >
      <Icon className="w-[0.8vw] h-[0.8vw]" />
      {status}
    </span>
  );
}

function TaskTypeBadge({ type }) {
  const typeConfig = {
    Daily: {
      bg: "bg-purple-100",
      text: "text-purple-700",
      border: "border-purple-300",
      icon: CalendarDays,
    },
    Weekly: {
      bg: "bg-indigo-100",
      text: "text-indigo-700",
      border: "border-indigo-300",
      icon: CalendarRange,
    },
    Monthly: {
      bg: "bg-teal-100",
      text: "text-teal-700",
      border: "border-teal-300",
      icon: CalendarCheck,
    },
  };

  const config = typeConfig[type] || typeConfig["Daily"];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-[0.2vw] px-[0.4vw] py-[0.15vw] text-[0.65vw] ${config.bg} ${config.text} border ${config.border} rounded-full font-medium`}
    >
      <Icon className="w-[0.7vw] h-[0.7vw]" />
      {type}
    </span>
  );
}

export default function AdminTaskAssignment() {
  const [mainTab, setMainTab] = useState("addTask");
  const [isAddTaskExpanded, setIsAddTaskExpanded] = useState(false);
  const [taskTypeTab, setTaskTypeTab] = useState("Daily");
  
  const [tasks, setTasks] = useState([
    {
      id: 1,
      name: "Social Media Campaign",
      category: "Social Media",
      taskType: "Daily",
      description: "Create and manage social media posts across platforms",
    },
    {
      id: 2,
      name: "Email Marketing",
      category: "Email",
      taskType: "Weekly",
      description: "Design and send marketing emails to subscribers",
    },
    {
      id: 3,
      name: "SEO Optimization",
      category: "SEO",
      taskType: "Monthly",
      description: "Optimize website content for search engines",
    },
    {
      id: 4,
      name: "Content Writing",
      category: "Content",
      taskType: "Daily",
      description: "Write blog posts and articles for the website",
    },
  ]);

  const [categories, setCategories] = useState([
    "Social Media",
    "Email",
    "Content",
    "SEO",
    "Analytics",
    "Advertising",
  ]);

  const [taskTypes] = useState(["Daily", "Weekly", "Monthly"]);

  const [statuses] = useState([
    "Not Started",
    "In Progress",
    "Completed",
    "Overdue",
    "Delayed",
  ]);

  const [marketingPersons] = useState([
    { id: 1, name: "John Doe" },
    { id: 2, name: "Jane Smith" },
    { id: 3, name: "Mike Johnson" },
    { id: 4, name: "Sarah Williams" },
  ]);

  const [assignedTasks, setAssignedTasks] = useState([
    {
      id: 1,
      taskId: 1,
      taskName: "Social Media Campaign",
      taskCategory: "Social Media",
      taskType: "Daily",
      taskDescription: "Create and manage social media posts across platforms",
      personId: 1,
      personName: "John Doe",
      date: "2025-01-20",
      status: "Completed",
    },
    {
      id: 2,
      taskId: 1,
      taskName: "Social Media Campaign",
      taskCategory: "Social Media",
      taskType: "Daily",
      taskDescription: "Create and manage social media posts across platforms",
      personId: 1,
      personName: "John Doe",
      date: "2025-01-22",
      status: "Overdue",
    },
    {
      id: 3,
      taskId: 2,
      taskName: "Email Marketing",
      taskCategory: "Email",
      taskType: "Weekly",
      taskDescription: "Design and send marketing emails to subscribers",
      personId: 2,
      personName: "Jane Smith",
      date: "2025-01-25",
      status: "In Progress",
    },
    {
      id: 4,
      taskId: 3,
      taskName: "SEO Optimization",
      taskCategory: "SEO",
      taskType: "Monthly",
      taskDescription: "Optimize website content for search engines",
      personId: 3,
      personName: "Mike Johnson",
      date: "2025-01-28",
      status: "Not Started",
    },
    {
      id: 5,
      taskId: 4,
      taskName: "Content Writing",
      taskCategory: "Content",
      taskType: "Daily",
      taskDescription: "Write blog posts and articles for the website",
      personId: 4,
      personName: "Sarah Williams",
      date: "2025-01-26",
      status: "Delayed",
    },
  ]);

  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("");
  const [newTaskType, setNewTaskType] = useState("Daily");
  const [customCategory, setCustomCategory] = useState("");
  const [isOtherCategory, setIsOtherCategory] = useState(false);
  const [newTaskDescription, setNewTaskDescription] = useState("");
  
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedDates, setSelectedDates] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState("");
  const [searchTask, setSearchTask] = useState("");

  const [reportSearch, setReportSearch] = useState("");
  const [reportStatusFilter, setReportStatusFilter] = useState("");
  const [reportDateFrom, setReportDateFrom] = useState("");
  const [reportDateTo, setReportDateTo] = useState("");
  const [reportCurrentPage, setReportCurrentPage] = useState(1);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const RECORDS_PER_PAGE = 10;

  const filteredTasksByType = useMemo(() => {
    return tasks.filter((task) => {
      const matchesType = task.taskType === taskTypeTab;
      const matchesSearch =
        !searchTask ||
        task.name.toLowerCase().includes(searchTask.toLowerCase()) ||
        task.category.toLowerCase().includes(searchTask.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTask.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [tasks, taskTypeTab, searchTask]);

  const taskCountByType = useMemo(() => {
    return {
      Daily: tasks.filter((t) => t.taskType === "Daily").length,
      Weekly: tasks.filter((t) => t.taskType === "Weekly").length,
      Monthly: tasks.filter((t) => t.taskType === "Monthly").length,
    };
  }, [tasks]);

  const filteredReportTasks = useMemo(() => {
    return assignedTasks.filter((task) => {
      const searchMatch =
        !reportSearch ||
        task.taskName.toLowerCase().includes(reportSearch.toLowerCase()) ||
        task.personName.toLowerCase().includes(reportSearch.toLowerCase()) ||
        task.taskCategory.toLowerCase().includes(reportSearch.toLowerCase()) ||
        task.taskDescription.toLowerCase().includes(reportSearch.toLowerCase());

      const statusMatch =
        !reportStatusFilter || task.status === reportStatusFilter;

      let dateMatch = true;
      if (reportDateFrom && reportDateTo) {
        dateMatch = task.date >= reportDateFrom && task.date <= reportDateTo;
      } else if (reportDateFrom && !reportDateTo) {
        dateMatch = task.date === reportDateFrom;
      }

      return searchMatch && statusMatch && dateMatch;
    });
  }, [
    assignedTasks,
    reportSearch,
    reportStatusFilter,
    reportDateFrom,
    reportDateTo,
  ]);

  // Status counts for summary
  const statusCounts = useMemo(() => {
    const counts = {
      "Not Started": 0,
      "In Progress": 0,
      Completed: 0,
      Overdue: 0,
      Delayed: 0,
      Total: assignedTasks.length,
    };
    assignedTasks.forEach((task) => {
      if (counts.hasOwnProperty(task.status)) {
        counts[task.status]++;
      }
    });
    return counts;
  }, [assignedTasks]);

  // Check if filters are active
  const hasActiveFilters = reportStatusFilter || reportDateFrom || reportDateTo;

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    if (value === "Other") {
      setIsOtherCategory(true);
      setNewTaskCategory("");
      setCustomCategory("");
    } else {
      setIsOtherCategory(false);
      setNewTaskCategory(value);
      setCustomCategory("");
    }
  };

  const handleCustomCategoryChange = (e) => {
    const value = e.target.value;
    setCustomCategory(value);
    setNewTaskCategory(value);
  };

  const cancelCustomCategory = () => {
    setIsOtherCategory(false);
    setNewTaskCategory("");
    setCustomCategory("");
  };

  const addCategory = () => {
    if (newCategoryName.trim() && !categories.includes(newCategoryName.trim())) {
      setCategories([...categories, newCategoryName.trim()]);
      setNewCategoryName("");
      setShowAddCategory(false);
    }
  };

  const deleteCategory = (categoryToDelete) => {
    if (
      confirm(`Are you sure you want to delete "${categoryToDelete}" category?`)
    ) {
      setCategories(categories.filter((cat) => cat !== categoryToDelete));
      if (newTaskCategory === categoryToDelete) {
        setNewTaskCategory("");
      }
    }
  };

  const addTask = () => {
    const finalCategory = isOtherCategory
      ? customCategory.trim()
      : newTaskCategory;

    if (newTaskName.trim() && finalCategory && newTaskDescription.trim()) {
      // If custom category, add it to categories list
      if (isOtherCategory && !categories.includes(finalCategory)) {
        setCategories([...categories, finalCategory]);
      }

      const newTask = {
        id: tasks.length + 1,
        name: newTaskName.trim(),
        category: finalCategory,
        taskType: newTaskType,
        description: newTaskDescription.trim(),
      };
      setTasks([...tasks, newTask]);
      setNewTaskName("");
      setNewTaskCategory("");
      setNewTaskType("Daily");
      setCustomCategory("");
      setIsOtherCategory(false);
      setNewTaskDescription("");
    }
  };

  const selectTask = (task) => {
    setSelectedTask(task);
    setSelectedDates([]);
    setSelectedPerson("");
  };

  const getExistingDates = (taskId, personId) => {
    return assignedTasks
      .filter(
        (at) => at.taskId === taskId && at.personId === parseInt(personId)
      )
      .map((at) => at.date);
  };

  const assignTask = () => {
    if (selectedTask && selectedDates.length > 0 && selectedPerson) {
      const person = marketingPersons.find(
        (p) => p.id === parseInt(selectedPerson)
      );
      const newAssignments = selectedDates.map((date, index) => ({
        id: assignedTasks.length + index + 1,
        taskId: selectedTask.id,
        taskName: selectedTask.name,
        taskCategory: selectedTask.category,
        taskType: selectedTask.taskType,
        taskDescription: selectedTask.description,
        personId: person.id,
        personName: person.name,
        date: date,
        status: "Not Started",
      }));

      setAssignedTasks([...assignedTasks, ...newAssignments]);
      setSelectedTask(null);
      setSelectedDates([]);
      setSelectedPerson("");
    }
  };

  const clearReportFilters = () => {
    setReportStatusFilter("");
    setReportDateFrom("");
    setReportDateTo("");
    setReportCurrentPage(1);
  };

  const handleDateFromChange = (e) => {
    const value = e.target.value;
    setReportDateFrom(value);
    // If clearing from date, also clear to date
    if (!value) {
      setReportDateTo("");
    }
    setReportCurrentPage(1);
  };

  const handleDateToChange = (e) => {
    setReportDateTo(e.target.value);
    setReportCurrentPage(1);
  };

  const reportTotalPages = Math.ceil(
    filteredReportTasks.length / RECORDS_PER_PAGE
  );
  const reportStartIndex = (reportCurrentPage - 1) * RECORDS_PER_PAGE;
  const reportEndIndex = reportStartIndex + RECORDS_PER_PAGE;
  const paginatedReportTasks = filteredReportTasks.slice(
    reportStartIndex,
    reportEndIndex
  );

  const handleReportPrevious = () => {
    setReportCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleReportNext = () => {
    setReportCurrentPage((prev) => Math.min(prev + 1, reportTotalPages));
  };

  const formatDateToIST = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const toggleAddTaskSection = () => {
    setIsAddTaskExpanded(!isAddTaskExpanded);
  };

  const isFormValid = () => {
    const hasName = newTaskName.trim();
    const hasDescription = newTaskDescription.trim();
    const hasCategory = isOtherCategory
      ? customCategory.trim()
      : newTaskCategory;
    return hasName && hasDescription && hasCategory;
  };

  const renderAddTask = () => {
    return (
      <>
        <div className="flex-1 flex flex-col">
          <div
            className={`rounded-lg transition-all duration-300 ease-in-out ${
              isAddTaskExpanded ? "p-[1vw]" : "p-0"
            }`}
          >
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isAddTaskExpanded
                  ? "max-h-[600px] opacity-100"
                  : "max-h-0 opacity-0"
              }`}
            >
              <div className="flex items-center justify-between mb-[0.8vw]">
                <h3 className="text-[0.9vw] font-semibold text-gray-800 flex items-center gap-[0.4vw]">
                  Add New Task
                </h3>
                <button
                  onClick={() => setShowAddCategory(!showAddCategory)}
                  className="flex items-center gap-[0.3vw] px-[0.8vw] py-[0.4vw] bg-gray-100 text-gray-700 cursor-pointer rounded-lg hover:bg-gray-200 transition text-[0.75vw] font-medium"
                >
                  <Tag className="w-[0.9vw] h-[0.9vw]" />
                  {showAddCategory ? "Hide" : "Add Category"}
                </button>
              </div>

              {showAddCategory && (
                <div className="mb-[1vw] p-[0.8vw] bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-[0.5vw] mb-[0.5vw]">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Enter new category name..."
                      className="flex-1 px-[0.7vw] py-[0.4vw] text-[0.8vw] border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 outline-none"
                    />
                    <button
                      onClick={addCategory}
                      disabled={!newCategoryName.trim()}
                      className="px-[1vw] py-[0.4vw] text-[0.75vw] bg-gray-800 cursor-pointer text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-[0.3vw]">
                    {categories.map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-[0.2vw] px-[0.5vw] py-[0.2vw] bg-white border border-gray-300 rounded-full text-[0.7vw] text-gray-700"
                      >
                        {cat}
                        <button
                          onClick={() => deleteCategory(cat)}
                          className="text-red-400 hover:text-red-600 ml-[0.2vw]"
                          title="Delete category"
                        >
                          <X className="w-[0.7vw] h-[0.7vw]" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-[1vw] items-start w-[90%] p-[1vw] rounded-lg bg-gray-50">
                <div>
                  <label className="block text-[0.75vw] font-medium text-gray-700 mb-[0.3vw]">
                    Task Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder="Enter task name"
                    className="w-full px-[0.7vw] py-[0.5vw] text-[0.8vw] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[0.75vw] font-medium text-gray-700 mb-[0.3vw]">
                    Category <span className="text-red-500">*</span>
                  </label>

                  {isOtherCategory ? (
                    <div className="relative">
                      <input
                        type="text"
                        value={customCategory}
                        onChange={handleCustomCategoryChange}
                        placeholder="Enter custom category..."
                        autoFocus
                        className="w-full px-[0.7vw] py-[0.5vw] pr-[2vw] text-[0.8vw] border border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50"
                      />
                      <button
                        onClick={cancelCustomCategory}
                        className="absolute right-[0.5vw] top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-[0.2vw] hover:bg-gray-200 rounded-full transition"
                        title="Cancel custom category"
                      >
                        <X className="w-[0.9vw] h-[0.9vw]" />
                      </button>
                    </div>
                  ) : (
                    <select
                      value={newTaskCategory}
                      onChange={handleCategoryChange}
                      className="w-full px-[0.7vw] py-[0.5vw] text-[0.8vw] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="" disabled>Select category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="Other">Others</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-[0.75vw] font-medium text-gray-700 mb-[0.3vw]">
                    Task Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newTaskType}
                    onChange={(e) => setNewTaskType(e.target.value)}
                    className="w-full px-[0.7vw] py-[0.5vw] text-[0.8vw] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {taskTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-[0.75vw] font-medium text-gray-700 mb-[0.3vw]">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="Enter task description"
                    rows="2"
                    className="w-full px-[0.7vw] py-[0.5vw] text-[0.8vw] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none outline-none"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={addTask}
                    disabled={!isFormValid()}
                    className="w-full px-[2vw] py-[0.6vw] text-[0.8vw] bg-gray-800 cursor-pointer text-white rounded-lg hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
                  >
                    Add Task
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-[0.5vw]">
              <button
                onClick={toggleAddTaskSection}
                className="flex items-center gap-[0.3vw] px-[1vw] py-[0.3vw] bg-gray-200 hover:bg-gray-300 rounded-full transition-all duration-200 cursor-pointer group"
                title={isAddTaskExpanded ? "Collapse" : "Expand Add Task"}
              >
                {isAddTaskExpanded ? (
                  <>
                    <ChevronUp className="w-[1vw] h-[1vw] text-gray-600 group-hover:text-gray-800" />
                    <span className="text-[0.7vw] text-gray-600 group-hover:text-gray-800 font-medium">
                      Hide Add Task
                    </span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-[1vw] h-[1vw] text-gray-600 group-hover:text-gray-800" />
                    <span className="text-[0.7vw] text-gray-600 group-hover:text-gray-800 font-medium">
                      Show Add Task
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div
            className={`grid grid-cols-1 lg:grid-cols-2 gap-[1.2vw] px-[1.2vw] rounded-lg flex-1 transition-all duration-300 ${
              isAddTaskExpanded ? "" : "pt-[0.5vw]"
            }`}
          >
            <div className="space-y-[0.5vw]">
              <div className="flex items-center justify-between">
                <div className="flex gap-[0.3vw] bg-gray-100 p-[0.3vw] rounded-lg">
                  {taskTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setTaskTypeTab(type);
                        setSelectedTask(null);
                      }}
                      className={`flex items-center gap-[0.3vw] px-[0.8vw] py-[0.4vw] rounded-md text-[0.75vw] cursor-pointer font-medium transition ${
                        taskTypeTab === type
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {type === "Daily" && (
                        <CalendarDays className="w-[0.9vw] h-[0.9vw]" />
                      )}
                      {type === "Weekly" && (
                        <CalendarRange className="w-[0.9vw] h-[0.9vw]" />
                      )}
                      {type === "Monthly" && (
                        <CalendarCheck className="w-[0.9vw] h-[0.9vw]" />
                      )}
                      {type}
                      <span
                        className={`px-[0.4vw] py-[0.1vw] rounded-full text-[0.6vw] ${
                          taskTypeTab === type
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {taskCountByType[type]}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="absolute left-[0.6vw] top-1/2 transform -translate-y-1/2 w-[1vw] h-[1vw] text-gray-400" />
                  <input
                    type="text"
                    value={searchTask}
                    onChange={(e) => setSearchTask(e.target.value)}
                    placeholder="Search tasks..."
                    className="pl-[2vw] pr-[0.8vw] py-[0.4vw] text-[0.8vw] border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-[14vw]"
                  />
                  {searchTask && (
                    <button
                      onClick={() => setSearchTask("")}
                      className="absolute right-[0.5vw] top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-[0.9vw] h-[0.9vw]" />
                    </button>
                  )}
                </div>
              </div>

              <div
                className={`space-y-[0.5vw] overflow-y-auto pr-[0.4vw] transition-all duration-300 ${
                  isAddTaskExpanded
                    ? "min-h-[38vh] max-h-[38vh]"
                    : "min-h-[68vh] max-h-[68vh]"
                }`}
              >
                {filteredTasksByType.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[30vh] text-gray-500">
                    <Search className="w-[3vw] h-[3vw] mb-[0.5vw] text-gray-300" />
                    <p className="text-[0.85vw] font-medium">
                      No {taskTypeTab.toLowerCase()} tasks found
                    </p>
                    <p className="text-[0.75vw] text-gray-400">
                      Add a new task or try a different search
                    </p>
                  </div>
                ) : (
                  filteredTasksByType.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => selectTask(task)}
                      className={`p-[0.8vw] rounded-lg border-2 cursor-pointer transition ${
                        selectedTask?.id === task.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300 bg-white"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-[0.4vw]">
                        <p className="font-semibold text-gray-900 text-[0.85vw]">
                          {task.name}
                        </p>
                        <div className="flex items-center gap-[0.3vw]">
                          <span className="px-[0.4vw] py-[0.2vw] bg-gray-100 text-gray-700 text-[0.7vw] rounded-full">
                            {task.category}
                          </span>
                        </div>
                      </div>
                      <p className="text-[0.75vw] text-gray-600">
                        {task.description}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {searchTask && filteredTasksByType.length > 0 && (
                <div className="text-[0.7vw] text-gray-500 text-center">
                  Showing {filteredTasksByType.length} {taskTypeTab.toLowerCase()}{" "}
                  tasks
                </div>
              )}
            </div>

            {selectedTask ? (
              <div
                className={`bg-gray-50 rounded-lg p-[1vw] transition-all duration-300`}
              >
                <h3 className="text-[0.9vw] font-semibold text-gray-800 mb-[0.8vw] flex items-center gap-[0.4vw]">
                  Assign: {selectedTask.name}
                </h3>

                <div
                  className={`overflow-y-auto pr-[0.4vw] transition-all duration-300 ${
                    isAddTaskExpanded ? "max-h-[38vh]" : "max-h-[70vh]"
                  }`}
                >
                  <div className="mb-[0.8vw]">
                    <label className="block text-[0.75vw] font-medium text-gray-700 mb-[0.3vw]">
                      Select Person <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedPerson}
                      onChange={(e) => {
                        setSelectedPerson(e.target.value);
                        setSelectedDates([]);
                      }}
                      className="w-full px-[0.7vw] py-[0.5vw] text-[0.8vw] border border-gray-300 cursor-pointer rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Choose a person...</option>
                      {marketingPersons.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedPerson && (
                    <div className="mb-[0.8vw]">
                      <label className="block text-[0.75vw] font-medium text-gray-700 mb-[0.5vw]">
                        Select Dates (Click or Drag)
                      </label>
                      <div className="w-[70%] ml-[5vw]">
                        <MultiDatePicker
                          selectedDates={selectedDates}
                          onDatesChange={setSelectedDates}
                          existingDates={getExistingDates(
                            selectedTask.id,
                            selectedPerson
                          )}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={assignTask}
                    disabled={!selectedDates.length || !selectedPerson}
                    className="w-full px-[1vw] py-[0.6vw] text-[0.8vw] bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
                  >
                    Assign Task ({selectedDates.length} date
                    {selectedDates.length !== 1 ? "s" : ""})
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`rounded-lg flex justify-center items-center border-3 bg-gray-100 border-dotted border-gray-500 font-semibold text-[1vw] text-gray-700 transition-all duration-300 ${
                  isAddTaskExpanded ? "max-h-[44vh]" : "max-h-[75vh]"
                }`}
              >
                Select a {taskTypeTab.toLowerCase()} task to assign
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  const renderReports = () => {
    return (
      <>
        <div className="p-[0.8vw] border-b border-gray-200">
          <div className="grid grid-cols-6 gap-[0.8vw]">
            <div className="bg-gray-50 rounded-lg p-[0.6vw] border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[0.7vw] text-gray-500">Total</p>
                  <p className="text-[1.2vw] font-bold text-gray-800">
                    {statusCounts.Total}
                  </p>
                </div>
                <BarChart3 className="w-[1.5vw] h-[1.5vw] text-gray-400" />
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-[0.6vw] border border-gray-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[0.7vw] text-gray-500">Not Started</p>
                  <p className="text-[1.2vw] font-bold text-gray-700">
                    {statusCounts["Not Started"]}
                  </p>
                </div>
                <Clock className="w-[1.5vw] h-[1.5vw] text-gray-400" />
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-[0.6vw] border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[0.7vw] text-blue-600">In Progress</p>
                  <p className="text-[1.2vw] font-bold text-blue-700">
                    {statusCounts["In Progress"]}
                  </p>
                </div>
                <PlayCircle className="w-[1.5vw] h-[1.5vw] text-blue-400" />
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-[0.6vw] border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[0.7vw] text-green-600">Completed</p>
                  <p className="text-[1.2vw] font-bold text-green-700">
                    {statusCounts.Completed}
                  </p>
                </div>
                <CheckCircle className="w-[1.5vw] h-[1.5vw] text-green-400" />
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-[0.6vw] border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[0.7vw] text-red-600">Overdue</p>
                  <p className="text-[1.2vw] font-bold text-red-700">
                    {statusCounts.Overdue}
                  </p>
                </div>
                <AlertCircle className="w-[1.5vw] h-[1.5vw] text-red-400" />
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-[0.6vw] border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[0.7vw] text-orange-600">Delayed</p>
                  <p className="text-[1.2vw] font-bold text-orange-700">
                    {statusCounts.Delayed}
                  </p>
                </div>
                <PauseCircle className="w-[1.5vw] h-[1.5vw] text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-[0.8vw] border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between gap-[1vw]">
            <div className="flex items-center gap-[0.5vw]">
              <span className="text-[0.85vw] font-medium text-gray-700">
                Records:
              </span>
              <span className="px-[0.5vw] py-[0.2vw] bg-blue-100 text-blue-700 rounded-full text-[0.8vw] font-semibold">
                {filteredReportTasks.length}
              </span>
              {filteredReportTasks.length !== assignedTasks.length && (
                <span className="text-[0.75vw] text-gray-500">
                  of {assignedTasks.length}
                </span>
              )}
            </div>

            <div className="relative flex-1 max-w-[25vw]">
              <Search className="absolute left-[0.6vw] top-1/2 transform -translate-y-1/2 w-[1vw] h-[1vw] text-gray-400" />
              <input
                type="text"
                value={reportSearch}
                onChange={(e) => {
                  setReportSearch(e.target.value);
                  setReportCurrentPage(1);
                }}
                placeholder="Search by task, person, category..."
                className="w-full pl-[2vw] pr-[0.8vw] py-[0.5vw] text-[0.8vw] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              />
              {reportSearch && (
                <button
                  onClick={() => setReportSearch("")}
                  className="absolute right-[0.5vw] top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-[0.9vw] h-[0.9vw]" />
                </button>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`flex items-center gap-[0.3vw] px-[0.8vw] py-[0.5vw] rounded-lg transition text-[0.8vw] font-medium ${
                  hasActiveFilters
                    ? "bg-blue-100 text-blue-700 border border-blue-300"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                }`}
                title="Filters"
              >
                <Filter className="w-[1vw] h-[1vw]" />
                Filters
                {hasActiveFilters && (
                  <span className="w-[0.5vw] h-[0.5vw] bg-blue-600 rounded-full"></span>
                )}
              </button>

              {showFilterDropdown && (
                <div className="absolute right-0 top-[110%] w-[20vw] bg-white border border-gray-300 rounded-lg shadow-xl z-50 p-[1vw]">
                  <div className="flex items-center justify-between mb-[0.8vw]">
                    <h4 className="text-[0.85vw] font-semibold text-gray-800">
                      Filters
                    </h4>
                    {hasActiveFilters && (
                      <button
                        onClick={clearReportFilters}
                        className="text-[0.7vw] text-red-600 hover:text-red-700 font-medium"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="mb-[0.8vw]">
                    <label className="block text-[0.75vw] font-medium text-gray-700 mb-[0.3vw]">
                      Status
                    </label>
                    <select
                      value={reportStatusFilter}
                      onChange={(e) => {
                        setReportStatusFilter(e.target.value);
                        setReportCurrentPage(1);
                      }}
                      className="w-full px-[0.7vw] py-[0.5vw] text-[0.8vw] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">All Status</option>
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-[0.8vw]">
                    <label className="block text-[0.75vw] font-medium text-gray-700 mb-[0.3vw]">
                      Date Range
                    </label>
                    <div className="space-y-[0.5vw]">
                      <div>
                        <span className="text-[0.7vw] text-gray-500">From:</span>
                        <input
                          type="date"
                          value={reportDateFrom}
                          onChange={handleDateFromChange}
                          className="w-full px-[0.5vw] py-[0.4vw] text-[0.8vw] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mt-[0.2vw]"
                        />
                      </div>
                      <div>
                        <span className="text-[0.7vw] text-gray-500">
                          To: {!reportDateFrom && "(Select 'From' first)"}
                        </span>
                        <input
                          type="date"
                          value={reportDateTo}
                          onChange={handleDateToChange}
                          min={reportDateFrom}
                          disabled={!reportDateFrom}
                          className="w-full px-[0.5vw] py-[0.4vw] text-[0.8vw] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mt-[0.2vw] disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                    {reportDateFrom && !reportDateTo && (
                      <p className="text-[0.65vw] text-blue-600 mt-[0.3vw]">
                        Filtering for exact date: {formatDateToIST(reportDateFrom)}
                      </p>
                    )}
                  </div>

                  {hasActiveFilters && (
                    <div className="pt-[0.5vw] border-t border-gray-200">
                      <p className="text-[0.7vw] text-gray-500 mb-[0.3vw]">
                        Active:
                      </p>
                      <div className="flex flex-wrap gap-[0.3vw]">
                        {reportStatusFilter && (
                          <span className="px-[0.4vw] py-[0.15vw] bg-purple-100 text-purple-700 text-[0.65vw] rounded-full">
                            {reportStatusFilter}
                          </span>
                        )}
                        {reportDateFrom && (
                          <span className="px-[0.4vw] py-[0.15vw] bg-green-100 text-green-700 text-[0.65vw] rounded-full">
                            {reportDateTo
                              ? `${formatDateToIST(reportDateFrom)} - ${formatDateToIST(reportDateTo)}`
                              : formatDateToIST(reportDateFrom)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setShowFilterDropdown(false)}
                    className="w-full mt-[0.8vw] px-[0.8vw] py-[0.4vw] bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition text-[0.75vw] font-medium"
                  >
                    Apply Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          {filteredReportTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-500">
              <Search className="w-[4vw] h-[4vw] mb-[1vw] text-gray-300" />
              <p className="text-[1vw] font-medium mb-[0.5vw]">
                No results found
              </p>
              <p className="text-[0.85vw] text-gray-400">
                Try adjusting your filters or search terms
              </p>
              {(reportSearch || hasActiveFilters) && (
                <button
                  onClick={() => {
                    setReportSearch("");
                    clearReportFilters();
                  }}
                  className="mt-[1vw] px-[1vw] py-[0.5vw] text-[0.8vw] bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="mr-[0.8vw] mb-[0.8vw] ml-[0.8vw] border border-gray-300 rounded-xl overflow-auto max-h-[55vh]">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-[#E2EBFF] sticky top-0">
                  <tr>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.85vw] font-medium text-gray-800 border border-gray-300">
                      S.NO
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.85vw] font-medium text-gray-800 border border-gray-300">
                      Task Name
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.85vw] font-medium text-gray-800 border border-gray-300">
                      Type
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.85vw] font-medium text-gray-800 border border-gray-300">
                      Category
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.85vw] font-medium text-gray-800 border border-gray-300">
                      Description
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.85vw] font-medium text-gray-800 border border-gray-300">
                      Assigned To
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.85vw] font-medium text-gray-800 border border-gray-300">
                      Date
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.85vw] font-medium text-gray-800 border border-gray-300">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedReportTasks.map((assignment, index) => (
                    <tr
                      key={assignment.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.8vw] text-gray-900 border border-gray-300 text-center">
                        {reportStartIndex + index + 1}
                      </td>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.8vw] text-gray-900 border border-gray-300">
                        {assignment.taskName}
                      </td>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.8vw] text-gray-900 border border-gray-300 text-center">
                        <TaskTypeBadge type={assignment.taskType} />
                      </td>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.8vw] text-gray-900 border border-gray-300 text-center">
                        <span className="px-[0.4vw] py-[0.2vw] bg-gray-100 text-gray-700 text-[0.7vw] rounded-full">
                          {assignment.taskCategory}
                        </span>
                      </td>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.8vw] text-gray-700 border border-gray-300">
                        <div className="max-w-[15vw] line-clamp-2">
                          {assignment.taskDescription}
                        </div>
                      </td>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.8vw] text-gray-900 border border-gray-300">
                        {assignment.personName}
                      </td>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.8vw] text-gray-900 border border-gray-300 text-center whitespace-nowrap">
                        {formatDateToIST(assignment.date)}
                      </td>
                      <td className="px-[0.7vw] py-[0.5vw] text-[0.8vw] text-gray-900 border border-gray-300 text-center">
                        <StatusBadge status={assignment.status} size="small" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {filteredReportTasks.length > 0 && (
          <div className="flex items-center justify-between px-[0.8vw] py-[0.7vw] border-t border-gray-200">
            <div className="text-[0.85vw] text-gray-600">
              Showing {reportStartIndex + 1} to{" "}
              {Math.min(reportEndIndex, filteredReportTasks.length)} of{" "}
              {filteredReportTasks.length} entries
            </div>
            <div className="flex items-center gap-[0.5vw]">
              <button
                onClick={handleReportPrevious}
                disabled={reportCurrentPage === 1}
                className="px-[0.8vw] py-[0.4vw] flex items-center gap-[0.3vw] bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-[0.85vw] transition cursor-pointer"
              >
                <ChevronLeft size="1vw" />
                Previous
              </button>
              <span className="text-[0.85vw] text-gray-600 px-[0.5vw]">
                Page {reportCurrentPage} of {reportTotalPages || 1}
              </span>
              <button
                onClick={handleReportNext}
                disabled={
                  reportCurrentPage === reportTotalPages || reportTotalPages === 0
                }
                className="px-[0.8vw] py-[0.4vw] flex items-center gap-[0.3vw] bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-[0.85vw] transition cursor-pointer"
              >
                Next
                <ChevronRight size="1vw" />
              </button>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="text-black min-h-[92%] max-h-[100%] w-[100%] max-w-[100%] overflow-hidden">
      <div className="w-[100%] h-[91vh] flex flex-col gap-[1vh]">
        <div className="bg-white flex justify-between overflow-hidden rounded-xl shadow-sm h-[6%] flex-shrink-0">
          <div className="flex border-b border-gray-200 h-full w-full">
            <button
              onClick={() => setMainTab("addTask")}
              className={`px-[1.5vw] cursor-pointer font-medium text-[0.9vw] transition-colors ${
                mainTab === "addTask"
                  ? "border-b-2 border-black text-black"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-[0.4vw]">
                Add & Assign Task
              </div>
            </button>
            <button
              onClick={() => setMainTab("reports")}
              className={`px-[1.5vw] cursor-pointer font-medium text-[0.9vw] transition-colors ${
                mainTab === "reports"
                  ? "border-b-2 border-black text-black"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-[0.4vw]">
                <BarChart3 className="w-[1vw] h-[1vw]" />
                Reports
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm h-[93%] flex flex-col overflow-hidden">
          {mainTab === "addTask" && renderAddTask()}
          {mainTab === "reports" && renderReports()}
        </div>
      </div>
    </div>
  );
}