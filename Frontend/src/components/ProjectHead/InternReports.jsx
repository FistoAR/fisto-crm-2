import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  X,
  FileDown,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Notification from "../ToastProp";
import ExportInternReportPDF from "./ExportInternReportPDF";

const RECORDS_PER_PAGE = 9;

const InternReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [toast, setToast] = useState(null);
  const filterRef = useRef(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch employees and reports on mount
  useEffect(() => {
    fetchEmployees();
    fetchReports();
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate, selectedEmployee]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/calendar/employees`);
      const data = await response.json();
      if (data.status) {
        setEmployees(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/intern-reports/all-reports?limit=1000`
      );
      const data = await response.json();
      if (data.success) {
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      showToast("Error", "Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (title, message) => {
    setToast({ title, message });
    setTimeout(() => setToast(null), 5000);
  };

  // ✅ FIXED: Proper date comparison handling timezone issues
  const filterByDate = (report) => {
    if (!startDate && !endDate) return true;

    // Parse report date and normalize to start of day
    const reportDate = new Date(report.report_date);
    reportDate.setHours(0, 0, 0, 0);

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);

    if (start && end) {
      return reportDate >= start && reportDate <= end;
    } else if (start) {
      const dayEnd = new Date(start);
      dayEnd.setHours(23, 59, 59, 999);
      return reportDate >= start && reportDate <= dayEnd;
    } else if (end) {
      return reportDate <= end;
    }
    return true;
  };

  // Combine reports by employee and date
  const combineReportsByEmployeeAndDate = (reports) => {
    const combinedMap = new Map();
    
    reports.forEach(report => {
      const key = `${report.employee_id}_${report.report_date}`;
      
      if (!combinedMap.has(key)) {
        // Create new combined report
        combinedMap.set(key, {
          ...report,
          all_project_names: new Set([report.project_name]),
          all_work_done: new Set([report.work_done]),
          original_reports: [report],
          isCombined: false
        });
      } else {
        // Add to existing combined report
        const existing = combinedMap.get(key);
        existing.all_project_names.add(report.project_name);
        existing.all_work_done.add(report.work_done);
        existing.original_reports.push(report);
        existing.isCombined = existing.original_reports.length > 1;
      }
    });

    // Convert Map to array and format combined fields
    return Array.from(combinedMap.values()).map(report => {
      // Remove duplicates and format
      const projectNames = Array.from(report.all_project_names)
        .filter(name => name && name !== "-")
        .filter((name, index, self) => self.indexOf(name) === index);
      
      const workDoneEntries = Array.from(report.all_work_done)
        .filter(work => work && work !== "-")
        .filter((work, index, self) => self.indexOf(work) === index);

      return {
        ...report,
        id: report.original_reports[0].id,
        employee_id: report.employee_id,
        employee_name: report.employee_name,
        report_date: report.report_date,
        hours: report.hours,
        morning_in: report.morning_in,
        morning_out: report.morning_out,
        afternoon_in: report.afternoon_in,
        afternoon_out: report.afternoon_out,
        section: report.section,
        
        // Combined fields
        project_name: projectNames.length > 0 ? projectNames.join(", ") : "-",
        work_done: workDoneEntries.length > 0 ? workDoneEntries.join(" | ") : "-",
        
        // Original counts
        project_count: projectNames.length,
        work_done_count: workDoneEntries.length,
        
        // Detailed arrays for expansion
        project_names_array: projectNames,
        work_done_array: workDoneEntries
      };
    });
  };

  const getFilteredReports = () => {
    let filtered = reports;

    // Filter by employee
    if (selectedEmployee !== "all") {
      filtered = filtered.filter(
        (report) => report.employee_id === selectedEmployee
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (report) =>
          report.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (report.project_names_array && report.project_names_array.some(name => 
            name.toLowerCase().includes(searchTerm.toLowerCase())
          )) ||
          (report.work_done_array && report.work_done_array.some(work => 
            work.toLowerCase().includes(searchTerm.toLowerCase())
          ))
      );
    }

    // Filter by date
    filtered = filtered.filter(filterByDate);

    // Combine reports by employee and date
    return combineReportsByEmployeeAndDate(filtered);
  };

  const filteredReports = getFilteredReports();
  const totalPages = Math.ceil(filteredReports.length / RECORDS_PER_PAGE);
  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
  const endIndex = startIndex + RECORDS_PER_PAGE;
  const paginatedReports = filteredReports.slice(startIndex, endIndex);

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
    setExpandedRows(new Set());
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    setExpandedRows(new Set());
  };

  const clearAllFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedEmployee("all");
  };

  // ✅ FIXED: Export PDF with proper logging for debugging
  const exportToPDF = async () => {
    try {
      showToast("Info", "Generating PDF...");

      // Use the same filtered data that's shown in the UI table
      const dataToExport = filteredReports;

      console.log("=== PDF Export Debug ===");
      console.log("Start Date:", startDate);
      console.log("End Date:", endDate);
      console.log("Selected Employee:", selectedEmployee);
      console.log("Total Filtered Reports:", dataToExport.length);
      console.log("Sample Data:", dataToExport.slice(0, 2));

      if (dataToExport.length === 0) {
        showToast("Error", "No data to export");
        return;
      }

      // Get employee name
      let employeeName = "All Employees";
      if (selectedEmployee !== "all" && dataToExport.length > 0) {
        employeeName = dataToExport[0].employee_name;
      }

      // Export to PDF using the utility
      const pdfExporter = new ExportInternReportPDF();
      pdfExporter.export(
        dataToExport,
        employeeName,
        selectedEmployee,
        startDate,
        endDate
      );

      showToast("Success", "PDF exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      showToast("Error", "Failed to export PDF");
    }
  };

  const hasActiveFilters = startDate || endDate || selectedEmployee !== "all";
  const activeFilterCount =
    (startDate || endDate ? 1 : 0) + (selectedEmployee !== "all" ? 1 : 0);

  function formatDateToIST(dateString) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatTime(timeString) {
    if (!timeString) return "-";
    const parts = timeString.split(":");
    const hours = parseInt(parts[0]);
    const minutes = parts[1];
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  }

  const toggleRowExpansion = (reportKey) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(reportKey)) {
        newSet.delete(reportKey);
      } else {
        newSet.clear();
        newSet.add(reportKey);
      }
      return newSet;
    });
  };

  // Render project names with count badge
  const renderProjectNames = (report) => {
    if (!report.project_name || report.project_name === "-") {
      return "-";
    }

    const projectNames = report.project_name.split(", ");
    const hasMultiple = projectNames.length > 1;

    return (
      <div className="flex flex-col">
        {projectNames.slice(0, 2).map((project, idx) => (
          <span 
            key={idx} 
            className={`${idx > 0 ? 'mt-0.5' : ''} ${project === '-' ? 'text-gray-400' : 'text-[0.75vw]'}`}
          >
            {project},
          </span>
        ))}
        {hasMultiple && projectNames.length > 2 && (
          <span className="text-[0.75vw] text-blue-600 mt-0.5">
            +{projectNames.length - 2} more
          </span>
        )}
      </div>
    );
  };

  // Render work done with count badge
  const renderWorkDone = (report) => {
    if (!report.work_done || report.work_done === "-") {
      return "-";
    }

    const workEntries = report.work_done.split(" | ");
    const hasMultiple = workEntries.length > 1;

    return (
      <div className="relative">
        <div className="text-gray-700 text-[0.65vw]">
          {workEntries[0]}
          {hasMultiple && (
            <span className="text-[0.75vw] ml-1">
              {workEntries.length > 1 ? ` +${workEntries.length - 1} more` : ""}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="text-black min-h-[92%] max-h-[100%] w-[100%] max-w-[100%] overflow-hidden">
      {toast && (
        <Notification
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="w-[100%] h-[91vh] flex flex-col gap-[1vh]">
        {/* Main Container */}
        <div className="bg-white rounded-xl shadow-sm h-[100%] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-[0.8vw] h-[10%] flex-shrink-0">
            <div className="flex items-center gap-[0.5vw]">
              <span className="font-medium text-[0.95vw] text-gray-800">
                Intern Reports
              </span>
              <span className="text-[0.85vw] text-gray-500">
                ({filteredReports.length} combined records)
              </span>
            </div>
            <div className="flex items-center gap-[0.7vw]">
              {/* Search Input with Icon */}
              <div className="relative">
                <Search
                  className="absolute left-[0.5vw] top-1/2 transform -translate-y-1/2 text-gray-400"
                  size="1.3vw"
                />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-[2.3vw] pr-[1vw] py-[0.24vw] rounded-full text-[0.9vw] bg-gray-200 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Filter Dropdown */}
              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className={`rounded-full hover:bg-gray-100 flex items-center gap-2 text-[0.8vw] px-[0.6vw] py-[0.3vw] text-gray-700 cursor-pointer ${
                    hasActiveFilters
                      ? "bg-blue-100 border border-blue-300"
                      : "bg-gray-200"
                  }`}
                >
                  <Calendar size="1.1vw" />
                  Filter
                  {activeFilterCount > 0 && (
                    <span className="bg-blue-600 text-white text-[0.6vw] px-[0.4vw] py-[0.05vw] rounded-full flex justify-center items-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {showFilterDropdown && (
                  <div className="absolute right-0 mt-[0.3vw] w-[16vw] bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-[0.8vw]">
                      <div className="flex items-center justify-between mb-[0.8vw]">
                        <span className="font-semibold text-[0.85vw]">
                          Filters
                        </span>
                        <button
                          onClick={() => setShowFilterDropdown(false)}
                          className="p-[0.2vw] hover:bg-gray-100 rounded-full"
                        >
                          <X size={"0.9vw"} className="text-gray-500" />
                        </button>
                      </div>

                      {/* Employee Dropdown */}
                      <div className="mb-[1vw]">
                        <label className="block text-[0.75vw] font-medium text-gray-700 mb-[0.3vw]">
                          Employee
                        </label>
                        <select
                          value={selectedEmployee}
                          onChange={(e) => setSelectedEmployee(e.target.value)}
                          className="w-full px-[0.4vw] py-[0.25vw] text-[0.75vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="all">All Employees</option>
                          {employees.map((emp) => (
                            <option
                              key={emp.employee_id}
                              value={emp.employee_id}
                            >
                              {emp.employee_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Date Range */}
                      <div className="mb-[1vw]">
                        <label className="block text-[0.75vw] font-medium text-gray-700 mb-[0.3vw]">
                          Date Range
                        </label>
                        <div className="flex flex-col gap-[0.4vw]">
                          <div className="flex items-center gap-[0.3vw]">
                            <span className="text-[0.7vw] text-gray-500 w-[2.5vw]">
                              From:
                            </span>
                            <input
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="flex-1 px-[0.4vw] py-[0.25vw] text-[0.75vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div className="flex items-center gap-[0.3vw]">
                            <span className="text-[0.7vw] text-gray-500 w-[2.5vw]">
                              To:
                            </span>
                            <input
                              type="date"
                              value={endDate}
                              min={startDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              className="flex-1 px-[0.4vw] py-[0.25vw] text-[0.75vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                              disabled={!startDate}
                            />
                          </div>
                        </div>
                      </div>

                      {hasActiveFilters && (
                        <button
                          onClick={clearAllFilters}
                          className="w-full flex items-center justify-center gap-[0.3vw] text-[0.7vw] text-red-600 hover:text-red-700 cursor-pointer mt-[0.7vw] py-[0.4vw] border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <X size={"0.8vw"} />
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Export PDF Button */}
              <button
                onClick={exportToPDF}
                disabled={filteredReports.length === 0}
                className="rounded-full hover:bg-gray-100 flex items-center gap-2 text-[0.8vw] px-[0.6vw] py-[0.3vw] text-gray-700 cursor-pointer bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileDown size="1.1vw" />
                Export PDF
              </button>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex items-center gap-[0.5vw] px-[0.8vw] pb-[0.5vw] flex-wrap">
              <span className="text-[0.75vw] text-gray-500">
                Active filters:
              </span>
              {selectedEmployee !== "all" && (
                <div className="flex items-center gap-[0.3vw] bg-blue-50 text-blue-700 px-[0.5vw] py-[0.2vw] rounded-full text-[0.7vw]">
                  <span>
                    {employees.find((e) => e.employee_id === selectedEmployee)
                      ?.employee_name || selectedEmployee}
                  </span>
                  <button
                    onClick={() => setSelectedEmployee("all")}
                    className="hover:bg-blue-100 rounded-full p-[0.1vw]"
                  >
                    <X size={"0.7vw"} />
                  </button>
                </div>
              )}
              {(startDate || endDate) && (
                <div className="flex items-center gap-[0.3vw] bg-blue-50 text-blue-700 px-[0.5vw] py-[0.2vw] rounded-full text-[0.7vw]">
                  <Calendar size={"0.8vw"} />
                  <span>
                    {startDate && endDate
                      ? `${startDate} to ${endDate}`
                      : startDate
                      ? `From ${startDate}`
                      : `Until ${endDate}`}
                  </span>
                  <button
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                    }}
                    className="hover:bg-blue-100 rounded-full p-[0.1vw]"
                  >
                    <X size={"0.7vw"} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Table Content */}
          <div className="flex-1 min-h-0">
            {loading ? (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="animate-spin rounded-full h-[2vw] w-[2vw] border-b-2 border-blue-600"></div>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-500">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-[1.1vw] font-medium mb-[0.5vw]">
                  No reports found
                </p>
                <p className="text-[1vw] text-gray-400">
                  {searchTerm ||
                  startDate ||
                  endDate ||
                  selectedEmployee !== "all"
                    ? "Try adjusting your filters"
                    : "No reports available"}
                </p>
              </div>
            ) : (
              <div className="mr-[0.8vw] mb-[0.8vw] ml-[0.8vw] border border-gray-300 rounded-xl overflow-auto max-h-[70vh]">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-[#E2EBFF] sticky top-0">
                    <tr>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 w-[4%]">
                        S.NO
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 w=[10%]">
                        Employee Name
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 w-[8%]">
                        Date
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 w-[7%]">
                        Morning In
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 w=[7%]">
                        Morning Out
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 w-[9%]">
                        Afternoon In
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 w-[10%]">
                        Afternoon Out
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 w-[5%]">
                        Hours
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 w-[8%]">
                        Section
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 w-[15%]">
                        Project Name(s)
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 w-[20%]">
                        Work Done
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 w-[5%]">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedReports.map((report, index) => {
                      const reportKey = `${report.employee_id}_${report.report_date}_${index}`;
                      const isExpanded = expandedRows.has(reportKey);
                      const hasMultipleProjects = report.project_count > 1;
                      const hasMultipleWorkDone = report.work_done_count > 1;

                      return (
                        <React.Fragment key={reportKey}>
                          <tr className={`border-b hover:bg-gray-50 ${isExpanded ? 'bg-blue-50' : ''}`}>
                            <td className="px-[0.7vw] py-[0.56vw] text-[0.8vw] text-gray-900 border border-gray-300 text-center">
                              {startIndex + index + 1}
                            </td>
                            <td className="px-[0.7vw] py-[0.56vw] text-[0.8vw] text-gray-900 border border-gray-300">
                              {report.employee_name}
                            </td>
                            <td className="px-[0.7vw] py-[0.56vw] text-[0.8vw] text-gray-900 border border-gray-300 text-center">
                              {formatDateToIST(report.report_date)}
                            </td>
                            <td className="px-[0.7vw] py-[0.56vw] text-[0.8vw] text-gray-900 border border-gray-300 text-center">
                              {formatTime(report.morning_in)}
                            </td>
                            <td className="px-[0.7vw] py-[0.56vw] text-[0.8vw] text-gray-900 border border-gray-300 text-center">
                              {formatTime(report.morning_out)}
                            </td>
                            <td className="px-[0.7vw] py-[0.56vw] text-[0.8vw] text-gray-900 border border-gray-300 text-center">
                              {formatTime(report.afternoon_in)}
                            </td>
                            <td className="px-[0.7vw] py-[0.56vw] text-[0.8vw] text-gray-900 border border-gray-300 text-center">
                              {formatTime(report.afternoon_out)}
                            </td>
                            <td className="px-[0.7vw] py-[0.56vw] text-[0.8vw] text-gray-900 border border-gray-300 text-center">
                              {report.hours}
                            </td>
                            <td className="px-[0.7vw] py-[0.56vw] text-[0.8vw] text-gray-600 border border-gray-300">
                              {report.section}
                            </td>
                            <td className="px-[0.7vw] py-[0.56vw] border border-gray-300">
                              {renderProjectNames(report)}
                            </td>
                            <td className="px-[0.7vw] py-[0.56vw] border border-gray-300">
                              {renderWorkDone(report)}
                            </td>
                            <td className="px-[0.7vw] py-[0.56vw] border border-gray-300 text-center">
                              {(hasMultipleProjects || hasMultipleWorkDone) && (
                                <button
                                  onClick={() => toggleRowExpansion(reportKey)}
                                  className="p-1 hover:bg-blue-100 rounded-full transition-colors cursor-pointer"
                                  title={isExpanded ? "Collapse details" : "Expand details"}
                                >
                                  {isExpanded ? (
                                    <ChevronUp size="1vw" className="text-blue-600" />
                                  ) : (
                                    <ChevronDown size="1vw" className="text-blue-600" />
                                  )}
                                </button>
                              )}
                            </td>
                          </tr>
                          
                          {/* Expanded Details Row */}
                          {isExpanded && (
                            <tr className="bg-blue-50 border-t border-blue-200">
                              <td colSpan="12" className="px-[1vw] py-[1vw]">
                                <div className="space-y-[0.8vw]">
                                  {/* Header */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-[0.5vw]">
                                      <div className="w-[0.5vw] h-[0.5vw] bg-blue-500 rounded-full"></div>
                                      <span className="text-[0.85vw] font-semibold text-blue-800">
                                        Detailed Breakdown - {report.employee_name} ({formatDateToIST(report.report_date)})
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-[1vw] text-[0.7vw] text-gray-600">
                                      {hasMultipleProjects && (
                                        <span className="bg-blue-100 text-blue-700 px-[0.5vw] py-[0.2vw] rounded-full">
                                          {report.project_count} Projects
                                        </span>
                                      )}
                                      {hasMultipleWorkDone && (
                                        <span className="bg-green-100 text-green-700 px-[0.5vw] py-[0.2vw] rounded-full">
                                          {report.work_done_count} Work Entries
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Projects Section */}
                                  {hasMultipleProjects && (
                                    <div className="bg-white p-[0.8vw] rounded-lg border border-gray-200">
                                      <div className="flex items-center gap-[0.3vw] mb-[0.5vw]">
                                        <div className="w-[0.4vw] h-[0.4vw] bg-purple-500 rounded-full"></div>
                                        <span className="text-[0.8vw] font-semibold text-purple-700">
                                          All Projects
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-2 gap-[0.5vw]">
                                        {report.project_names_array.map((project, idx) => (
                                          <div 
                                            key={idx} 
                                            className="bg-gray-50 p-[0.5vw] rounded border border-gray-200"
                                          >
                                            <div className="text-[0.75vw] text-gray-700">
                                              {project}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Work Done Section */}
                                  {hasMultipleWorkDone && (
                                    <div className="bg-white p-[0.8vw] rounded-lg border border-gray-200">
                                      <div className="flex items-center gap-[0.3vw] mb-[0.5vw]">
                                        <div className="w-[0.4vw] h-[0.4vw] bg-green-500 rounded-full"></div>
                                        <span className="text-[0.8vw] font-semibold text-green-700">
                                          All Work Done Entries
                                        </span>
                                      </div>
                                      <div className="space-y-[0.5vw] max-h-[20vh] overflow-y-auto pr-[0.5vw]">
                                        {report.work_done_array.map((work, idx) => (
                                          <div 
                                            key={idx} 
                                            className="flex items-start gap-[0.4vw] p-[0.6vw] bg-green-50 rounded border border-green-100"
                                          >
                                            <div className="flex-shrink-0 w-[0.3vw] h-[0.3vw] bg-green-400 rounded-full mt-[0.3vw]"></div>
                                            <div className="flex-1">
                                              <div className="flex items-start gap-[0.3vw]">
                                                <span className="text-[0.7vw] text-gray-500 min-w-[2vw]">
                                                  {idx + 1}.
                                                </span>
                                                <div className="text-[0.75vw] text-gray-700">
                                                  {work}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Original Reports Info */}
                                  <div className="bg-gray-50 p-[0.8vw] rounded-lg border border-gray-200">
                                    <div className="text-[0.7vw] text-gray-500">
                                      This combined record represents {report.original_reports?.length || 1} 
                                      {report.original_reports?.length === 1 ? ' report' : ' reports'} for 
                                      {' '}{report.employee_name} on {formatDateToIST(report.report_date)}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {!loading && filteredReports.length > 0 && (
            <div className="flex items-center justify-between px-[0.8vw] py-[0.5vw] h-[8%]">
              <div className="text-[0.85vw] text-gray-600">
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, filteredReports.length)} of{" "}
                {filteredReports.length} combined entries
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
    </div>
  );
};

export default InternReports;