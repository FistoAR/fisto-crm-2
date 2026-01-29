import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import HandIcon from "../assets/ProjectPages/rightHand.png";
import searchIcon from "../assets/ProjectPages/search.webp";
import filterIcon from "../assets/ProjectPages/filter.webp";

const Projects = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const tableBodyRef = useRef(null);

  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [projectStatus, setProjectStatus] = useState("In Progress");
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const tabsRef = useRef([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  const [loggedEmpDetails, setloggedEmpDetails] = useState({});

  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showYoursOnly, setShowYoursOnly] = useState(true);
  const [selectedPercentageRange, setSelectedPercentageRange] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [employeeList, setEmployeeList] = useState([]);
  const filterRef = useRef(null);

  const percentageRanges = [
    { label: "0%", min: 0, max: 0 },
    { label: "1% - 25%", min: 1, max: 25 },
    { label: "26% - 50%", min: 26, max: 50 },
    { label: "51% - 75%", min: 51, max: 75 },
    { label: "76% - 99%", min: 76, max: 99 },
    { label: "100%", min: 100, max: 100 },
  ];

  const statusTabs = [
    { key: "In Progress", label: "In Progress" },
    { key: "Not Started", label: "Not Started" },
    { key: "Completed", label: "Completed" },
    { key: "Hold", label: "Hold" },
    { key: "Canceled", label: "Canceled" },
  ];

  useEffect(() => {
    const calculateItemsPerPage = () => {
      if (tableBodyRef.current) {
        const tableHeight = tableBodyRef.current.offsetHeight;
        const rowHeight = 50;
        const calculatedItems = Math.floor(tableHeight / rowHeight);
        setItemsPerPage(calculatedItems > 0 ? calculatedItems : 10);
      }
    };

    calculateItemsPerPage();
    window.addEventListener("resize", calculateItemsPerPage);
    return () => window.removeEventListener("resize", calculateItemsPerPage);
  }, []);

  useEffect(() => {
    const userData =
      sessionStorage.getItem("user") || localStorage.getItem("user");
    const userObj = userData ? JSON.parse(userData) : null;
    const userRole = {
      role: userObj?.designation || "",
      id: userObj?.userName || "",
    };

    setloggedEmpDetails(userRole);
  }, []);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (loggedEmpDetails.role === "Super Admin") {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/EmployeeRegister`,
          );
          const data = await response.json();

          if (data.success) {
            setEmployeeList(data.data || []);
          }
        } catch (error) {
          console.error("Error fetching employees:", error);
        }
      }
    };

    fetchEmployees();
  }, [loggedEmpDetails.role]);

  useEffect(() => {
    if (loggedEmpDetails.id) {
      fetchProjects();
    }
  }, [searchTerm, loggedEmpDetails.id, selectedEmployee]);

  useEffect(() => {
    if (isBaseRoute && loggedEmpDetails.id) {
      fetchProjects();
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getProjectStatus = (project) => {
    if (project.status === "Hold") return "hold";
    if (project.status === "Canceled") return "canceled";
    if (project.percentage === 100) return "completed";
    if (project.percentage === 0) return "notstarted";
    return "inprogress";
  };

  const fetchProjects = async () => {
    if (!loggedEmpDetails.id) return;

    setLoading(true);
    try {
      let empIDParam = null;

      if (!["Admin", "SBU", "Project Head"].includes(loggedEmpDetails.role)) {
        empIDParam = loggedEmpDetails.id;
      } else if (
        ["Admin", "SBU", "Project Head"].includes(loggedEmpDetails.role) &&
        selectedEmployee
      ) {
        empIDParam = selectedEmployee;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/project?search=${searchTerm}&empID=${empIDParam || ""}&role=${loggedEmpDetails.role}`,
      );
      const data = await response.json();

      if (data.success) {
        setAllProjects(data.data || []);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setLoading(false);
    }
  };

  const getFilteredProjects = () => {
    let filteredProjects = [...allProjects];

    if (
      showYoursOnly &&
      !["Admin", "SBU", "Project Head"].includes(loggedEmpDetails.role)
    ) {
      filteredProjects = filteredProjects.filter(
        (project) =>
          project.employeeID === loggedEmpDetails.id ||
          project.employees?.some((empId) => empId === loggedEmpDetails.id) ||
          project.accessGrantedTo?.some(
            (access) => access.employeeId === loggedEmpDetails.id,
          ),
      );
    }

    if (selectedPercentageRange) {
      const range = percentageRanges.find(
        (r) => r.label === selectedPercentageRange,
      );
      if (range) {
        filteredProjects = filteredProjects.filter(
          (project) =>
            project.percentage >= range.min && project.percentage <= range.max,
        );
      }
    }

    if (projectStatus) {
      if (projectStatus === "Not Started") {
        filteredProjects = filteredProjects.filter(
          (project) =>
            project.percentage === 0 &&
            project.status !== "Hold" &&
            project.status !== "Canceled",
        );
      } else if (projectStatus === "In Progress") {
        filteredProjects = filteredProjects.filter(
          (project) =>
            project.percentage > 0 &&
            project.percentage < 100 &&
            project.status !== "Hold" &&
            project.status !== "Canceled",
        );
      } else if (projectStatus === "Completed") {
        filteredProjects = filteredProjects.filter(
          (project) => project.percentage === 100,
        );
      } else if (projectStatus === "Hold") {
        filteredProjects = filteredProjects.filter(
          (project) => project.status === "Hold",
        );
      } else if (projectStatus === "Canceled") {
        filteredProjects = filteredProjects.filter(
          (project) => project.status === "Canceled",
        );
      }
    }

    return filteredProjects;
  };

  const getBaseFilteredProjects = () => {
    let filteredProjects = [...allProjects];

    if (
      showYoursOnly &&
      !["Admin", "SBU", "Project Head"].includes(loggedEmpDetails.role)
    ) {
      filteredProjects = filteredProjects.filter(
        (project) =>
          project.employeeID === loggedEmpDetails.id ||
          project.employees?.some((empId) => empId === loggedEmpDetails.id) ||
          project.accessGrantedTo?.some(
            (access) => access.employeeId === loggedEmpDetails.id,
          ),
      );
    }

    if (selectedPercentageRange) {
      const range = percentageRanges.find(
        (r) => r.label === selectedPercentageRange,
      );
      if (range) {
        filteredProjects = filteredProjects.filter(
          (project) =>
            project.percentage >= range.min && project.percentage <= range.max,
        );
      }
    }

    return filteredProjects;
  };

  const getPaginatedProjects = () => {
    const filteredProjects = getFilteredProjects();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProjects.slice(startIndex, endIndex);
  };

  const filteredProjects = getFilteredProjects();
  const paginatedProjects = getPaginatedProjects();
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  const baseFiltered = getBaseFilteredProjects();

  const statusCounts = {
    "Not Started": baseFiltered.filter(
      (p) =>
        p.percentage === 0 && p.status !== "Hold" && p.status !== "Canceled",
    ).length,
    "In Progress": baseFiltered.filter(
      (p) =>
        p.percentage > 0 &&
        p.percentage < 100 &&
        p.status !== "Hold" &&
        p.status !== "Canceled",
    ).length,
    Completed: baseFiltered.filter((p) => p.percentage === 100).length,
    Hold: baseFiltered.filter((p) => p.status === "Hold").length,
    Canceled: baseFiltered.filter((p) => p.status === "Canceled").length,
  };

  const handleClearFilters = () => {
    setSelectedPercentageRange("");
    setShowYoursOnly(false);
    setSelectedEmployee("");
  };

  const hasActiveFilters =
    selectedPercentageRange ||
    selectedEmployee ||
    (showYoursOnly &&
      !["Admin", "Software Developer", "3D", "UI/UX"].includes(
        loggedEmpDetails.role,
      ));

  const handleViewProject = (project, status) => {
    navigate("projectOverview/", {
      state: {
        projectId: project._id,
        projectName: project.projectName,
        status: status,
        projectTab: projectStatus,
        statusHistory:
          project.statusHistory?.[project.statusHistory.length - 1],
      },
    });
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const isBaseRoute =
    !location.pathname.includes("newProject") &&
    !location.pathname.includes("projectOverview") &&
    !location.pathname.includes("dayTask");

  const ProgressBar = ({ proj }) => {
    const getColor = () => {
      const status = getProjectStatus(proj);

      const bgcolor =
        status === "completed"
          ? "bg-[#22c55e]"
          : status === "hold"
            ? "bg-[#f97316]"
            : status === "canceled"
              ? "bg-[#ef4444]"
              : status === "inprogress"
                ? "bg-[#6366f1]"
                : "bg-[#d1d5db]";

      return bgcolor;
    };

    return (
      <div className="w-[8vw] bg-gray-200 rounded-full h-[0.8vw] overflow-hidden">
        <div
          className={`h-[0.8vw] rounded-full ${getColor()} transition-all duration-300`}
          style={{ width: `${proj.percentage}%` }}
        />
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      return "N/A";
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedPercentageRange,
    showYoursOnly,
    selectedEmployee,
    itemsPerPage,
    projectStatus,
  ]);

  const handleEditProject = (project) => {
    navigate("newProject", {
      state: {
        projectId: project._id,
        isEditMode: true,
        projectName:project.projectName
      },
    });
  };

  useEffect(() => {
    const activeIndex = statusTabs.findIndex(
      (tab) => tab.key === projectStatus,
    );
    const activeTab = tabsRef.current[activeIndex];

    if (activeTab) {
      setIndicatorStyle({
        left: activeTab.offsetLeft,
        width: activeTab.offsetWidth,
      });
    }
  }, [projectStatus]);

  const getStatusLabel = (status) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "inprogress":
        return "In Progress";
      case "notstarted":
        return "Not Started";
      case "hold":
        return "Hold";
      case "canceled":
        return "Canceled";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-[#22c55e] text-white";
      case "inprogress":
        return "bg-[#6366f1] text-white";
      case "notstarted":
        return "bg-[#9ca3af] text-white";
      case "hold":
        return "bg-[#f97316] text-white";
      case "canceled":
        return "bg-[#ef4444] text-white";
      default:
        return "bg-gray-400 text-white";
    }
  };

  return (
    <div className="text-black min-h-[92%] max-h-[92%] w-[100%] max-w-[100%] overflow-hidden">
      {isBaseRoute ? (
        <>
          <div className="w-[100%] h-[88vh] flex flex-col gap-[1.5vh] mt-[1vw]">
            <div className="flex justify-between bg-white rounded-full shadow-sm p-[0.5vw] gap-[0.8vw] items-center w-full">
              <div
                className={`relative flex gap-[0.8vw] w-full justify-between }`}
              >
                <div className="relative flex w-[48%] rounded-full h-fit p-[0.3vw] bg-black">
                  <div
                    className="absolute top-[0.3vw] bottom-[0.3vw] bg-white rounded-full shadow-md transition-all duration-300 ease-out"
                    style={{
                      left: indicatorStyle.left || 0,
                      width: indicatorStyle.width || 0,
                    }}
                  />
                  {statusTabs.map((tab, index) => (
                    <button
                      key={tab.key}
                      ref={(el) => (tabsRef.current[index] = el)}
                      type="button"
                      onClick={() => setProjectStatus(tab.key)}
                      className={`relative z-10 flex flex-1 items-center justify-center cursor-pointer px-[0.7vw] py-[0.3vw] text-[0.8vw] font-medium rounded-full transition-colors duration-300 ${
                        projectStatus === tab.key
                          ? "text-black"
                          : "text-white hover:text-gray-200"
                      }`}
                    >
                      <span className="whitespace-nowrap">{tab.label}</span>
                      <span
                        className={`ml-[0.4vw] rounded-full px-[0.44vw] py-[0.11vw] text-[0.6vw] font-medium transition-colors duration-300 ${
                          projectStatus === tab.key
                            ? "bg-black text-white"
                            : "bg-white text-black"
                        }`}
                      >
                        {statusCounts?.[tab.key] ?? 0}
                      </span>
                    </button>
                  ))}
                </div>

                {!["Software Developer", "3D", "UI/UX"].includes(
                  loggedEmpDetails.role,
                ) ? (
                  <div className="flex justify-end items-center gap-[0.5vw]">
                    <img
                      src={HandIcon}
                      alt="Click hint"
                      className="h-[4vh] hand-animation"
                    />
                    <button
                      onClick={() => navigate("newProject")}
                      className="px-[1.1vw] py-[0.38vw] bg-black text-white rounded-full hover:bg-gray-700 text-[0.78vw] flex items-center justify-center cursor-pointer transition-colors duration-200"
                    >
                      Add Projects
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-end items-center">
                  <button
                    type="button"
                    onClick={() => navigate("dayTask")}
                    className="px-[1vw] py-[0.4vw] bg-black text-white rounded-full hover:bg-gray-700 font-semibold cursor-pointer min-w-[7vw] text-[0.8vw] rounded-full hover:bg-gray-900 transition-colors duration-200"
                  >
                    Day Task
                  </button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm h-[94%] flex flex-col">
              <div className="flex items-center justify-between p-[0.8vw] h-[10%] flex-shrink-0">
                <div className="flex items-center gap-[0.5vw]">
                  <div className="flex gap-[0.4vw] items-center ml-[0.35vw]">
                    <span className="font-medium text-[0.9vw] text-gray-800">
                      All projects
                    </span>
                    <span className="text-[0.75vw] text-gray-500">
                      ({filteredProjects.length})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-[0.7vw]">
                  <div className="relative">
                    <img
                      src={searchIcon}
                      alt=""
                      className="w-[1.1vw] h-[1.1vw] absolute left-[0.5vw] top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      placeholder="Search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-[2vw] pr-[1vw] py-[0.4vw] rounded-full text-[0.8vw] bg-gray-200 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="relative" ref={filterRef}>
                    <button
                      onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                      className={`rounded-full hover:bg-gray-100 flex items-center gap-2 text-[0.8vw] px-[0.6vw] py-[0.4vw] text-gray-700 cursor-pointer ${
                        hasActiveFilters
                          ? "bg-blue-100 border border-blue-300"
                          : "bg-gray-200"
                      }`}
                    >
                      <img
                        src={filterIcon}
                        alt=""
                        className="w-[1.1vw] h-[1.1vw]"
                      />
                      Filter
                      {hasActiveFilters && (
                        <span className="bg-blue-600 text-white text-[0.6vw] px-[0.4vw] py-[0.05vw] rounded-full flex justify-center items-center">
                          {(selectedPercentageRange ? 1 : 0) +
                            (selectedEmployee ? 1 : 0) +
                            (showYoursOnly &&
                            !["Admin", "SBU", "Project Head"].includes(
                              loggedEmpDetails.role,
                            )
                              ? 1
                              : 0)}
                        </span>
                      )}
                    </button>

                    {showFilterDropdown && (
                      <div className="absolute right-0 mt-[0.3vw] w-[14vw] bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                        <div className="p-[0.8vw]">
                          <div className="flex items-center justify-between mb-[0.8vw]">
                            <span className="font-semibold text-[0.85vw]">
                              Filters
                            </span>
                          </div>

                          {["Admin", "SBU", "Project Head"].includes(
                            loggedEmpDetails.role,
                          ) && (
                            <div className="mb-[1vw]">
                              <label className="block text-[0.75vw] font-medium text-gray-700 mb-[0.3vw]">
                                Employee
                              </label>
                              <select
                                value={selectedEmployee}
                                onChange={(e) =>
                                  setSelectedEmployee(e.target.value)
                                }
                                className="w-full px-[0.5vw] py-[0.3vw] text-[0.75vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">All Employees</option>
                                {employeeList.map((emp) => (
                                  <option key={emp._id} value={emp._id}>
                                    {emp.employeeName}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div className="mb-[1vw]">
                            <label className="block text-[0.75vw] font-medium text-gray-700 mb-[0.3vw]">
                              Progress Range
                            </label>
                            <select
                              value={selectedPercentageRange}
                              onChange={(e) =>
                                setSelectedPercentageRange(e.target.value)
                              }
                              className="w-full px-[0.5vw] py-[0.3vw] text-[0.75vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">All Ranges</option>
                              {percentageRanges.map((range) => (
                                <option key={range.label} value={range.label}>
                                  {range.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {![
                            "Admin",
                            "Software Developer",
                            "3D",
                            "UI/UX",
                          ].includes(loggedEmpDetails.role) && (
                            <div className="mb-[0.5vw] pt-[0.2vw] ml-[0.3vw]">
                              <label className="flex items-center gap-[0.5vw] cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={showYoursOnly}
                                  onChange={(e) =>
                                    setShowYoursOnly(e.target.checked)
                                  }
                                  className="w-[1vw] h-[1vw] cursor-pointer accent-blue-600"
                                />
                                <span className="text-[0.75vw] font-medium text-gray-700">
                                  Your projects
                                </span>
                              </label>
                            </div>
                          )}

                          {hasActiveFilters && (
                            <button
                              onClick={handleClearFilters}
                              className="w-full flex items-center justify-end text-[0.7vw] text-gray-900 cursor-pointer mt-[0.7vw] ml-[0.2vw]"
                            >
                              <img
                                src="/ProjectPages/overview/clear-filter.webp"
                                alt="filter"
                                className="w-auto h-[0.9vw] mr-[0.4vw]"
                              />
                              Clear All Filters
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-0 h-[87%]">
                {loading ? (
                  <div className="flex items-center justify-center h-full min-h-[400px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : paginatedProjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-500">
                    <svg
                      className="w-16 h-16 mb-4 text-gray-300"
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
                    <p className="text-lg font-medium mb-2">
                      No projects found
                    </p>
                    <p className="text-[0.75vw] text-gray-400 mb-4">
                      {searchTerm || hasActiveFilters
                        ? "Try adjusting your search or filters"
                        : "Get started by creating your first project"}
                    </p>
                    {!searchTerm &&
                      !hasActiveFilters &&
                      loggedEmpDetails.role !== "Employee" && (
                        <button
                          onClick={() => navigate("newProject")}
                          className="px-[0.6vw] py-[0.3vw] bg-[#0064ff] text-white rounded-2xl hover:bg-blue-700 text-[0.75vw] cursor-pointer"
                        >
                          + Add Project
                        </button>
                      )}
                  </div>
                ) : (
                  <div className="h-full mr-[0.8vw] mb-[0.8vw] ml-[0.8vw] border border-gray-300 rounded-xl overflow-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead className="bg-[#E2EBFF] sticky top-0">
                        <tr>
                          <th className="px-[0.7vw] py-[0.5vw] text-left text-[0.85vw] font-medium text-gray-800 border border-gray-300">
                            Project Name
                          </th>
                          <th className="px-[0.7vw] py-[0.5vw] text-left text-[0.85vw] font-medium text-gray-800 border border-gray-300">
                            Admin
                          </th>
                          {!["Canceled", "Hold"].includes(projectStatus) ? (
                            <>
                              <th className="px-[0.7vw] py-[0.5vw] text-left text-[0.85vw] font-medium text-gray-800 border border-gray-300">
                                Start Date
                              </th>
                              <th className="px-[0.7vw] py-[0.5vw] text-left text-[0.85vw] font-medium text-gray-800 border border-gray-300">
                                End Date
                              </th>
                            </>
                          ) : (
                            <>
                              <th className="px-[0.7vw] py-[0.5vw] text-left text-[0.85vw] font-medium text-gray-800 border border-gray-300">
                                {projectStatus === "Hold"
                                  ? "Hold At"
                                  : "Canceled At"}
                              </th>
                              <th className="px-[0.7vw] py-[0.5vw] text-left text-[0.85vw] font-medium text-gray-800 border border-gray-300">
                                Reason
                              </th>
                            </>
                          )}
                          <th className="px-[0.7vw] py-[0.5vw] text-left text-[0.85vw] font-medium text-gray-800 border border-gray-300">
                            Progress
                          </th>
                          <th className="px-[0.7vw] py-[0.5vw] text-left text-[0.85vw] font-medium text-gray-800 border border-gray-300">
                            Status
                          </th>
                          <th className="px-[0.7vw] py-[0.5vw] text-left text-[0.85vw] font-medium text-gray-800 border border-gray-300">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody ref={tableBodyRef}>
                        {paginatedProjects.map((project, index) => {
                          const status = getProjectStatus(project);
                          return (
                            <tr key={project._id} className="hover:bg-gray-50">
                              <td className="px-[0.7vw] py-[0.7vw] border border-gray-300">
                                <div className="flex items-center gap-[0.5vw]">
                                  <span
                                    className="font-medium text-[0.85vw] line-clamp-1 break-words max-w-[20vw]"
                                    title={`${project.projectName} - ${project.companyName}`}
                                  >
                                    {project.projectName} -{" "}
                                    <span className="text-gray-700 text-[0.8vw]">
                                      {project.companyName}
                                    </span>
                                  </span>
                                </div>
                              </td>

                              <td className="px-[0.7vw] py-[0.6vw] border border-gray-300 w-fit">
                                <div className="flex items-center gap-[0.8vw]">
                                  <div className="relative w-[1.8vw] h-[1.8vw]">
                                    {project.teamHead?.profile ? (
                                      <img
                                        src={`${import.meta.env.VITE_API_BASE_URL}${project.teamHead.profile}`}
                                        alt={project.teamHead?.name}
                                        className="w-full h-full rounded-full object-cover border-2 border-gray-200 shadow-sm"
                                        onError={(e) => {
                                          e.target.style.display = "none";
                                          e.target.nextSibling.style.display =
                                            "flex";
                                        }}
                                      />
                                    ) : null}
                                    <div
                                      className={`${project.teamHead?.profile ? "hidden" : "flex"} absolute inset-0 bg-blue-500 text-white rounded-full items-center justify-center font-medium text-[0.9vw]`}
                                    >
                                      {project.teamHead?.name?.[0]?.toUpperCase() ||
                                        "?"}
                                    </div>
                                  </div>
                                  <span className="text-[0.8vw]">
                                    {project.teamHead?.name || "Unassigned"}
                                  </span>
                                </div>
                              </td>

                              {!["Canceled", "Hold"].includes(projectStatus) ? (
                                <>
                                  <td className="px-[0.7vw] py-[0.6vw] text-[0.8vw] text-gray-600 border border-gray-300">
                                    {formatDate(project.startDate)}
                                  </td>
                                  <td className="px-[0.7vw] py-[0.6vw] text-[0.8vw] text-gray-600 border border-gray-300">
                                    {formatDate(project.endDate)}
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="px-[0.7vw] py-[0.6vw] text-[0.8vw] text-gray-600 border border-gray-300">
                                    {formatDate(
                                      project.statusHistory?.[
                                        project.statusHistory.length - 1
                                      ]?.createdAt,
                                    )}
                                  </td>
                                  <td
                                    className="px-[0.7vw] py-[0.6vw] text-[0.8vw] text-gray-600 border border-gray-300 truncate max-w-[10vw]"
                                    title={
                                      project.statusHistory?.[
                                        project.statusHistory.length - 1
                                      ]?.reason || "N/A"
                                    }
                                  >
                                    {project.statusHistory?.[
                                      project.statusHistory.length - 1
                                    ]?.reason || "N/A"}
                                  </td>
                                </>
                              )}

                              <td className="px-[0.7vw] py-[0.6vw] border border-gray-300">
                                <div className="flex items-center justify-center gap-[0.8vw]">
                                  <ProgressBar proj={project} />
                                  <span className="text-[0.75vw] text-gray-600">
                                    {project.percentage || 0}%
                                  </span>
                                </div>
                              </td>

                              <td
                                className={`px-[0.7vw] py-[0.82vw] ${
                                  paginatedProjects.length === index + 1
                                    ? ""
                                    : "border-b border-gray-300"
                                } flex justify-center`}
                              >
                                <span
                                  className={`inline-block px-[0.2vw] py-[0.3vw] rounded-[0.5vw] min-w-[7.4vw] flex justify-center items-center text-center text-[0.7vw] font-medium ${getStatusColor(status)}`}
                                >
                                  {getStatusLabel(status)}
                                </span>
                              </td>

                              <td className="px-[0.7vw] py-[0.85vw] border border-gray-300">
                                <div className="flex justify-center items-center gap-[0.5vw]">
                                  {/* {loggedEmpDetails.role === "Super Admin" ||
                                  loggedEmpDetails.role === "Employee" ||
                                  project.employeeID === loggedEmpDetails.id ||
                                  project.accessGrantedTo?.some(
                                    (access) =>
                                      access.employeeId === loggedEmpDetails.id,
                                  ) ||
                                  project.employees?.some(
                                    (empId) => empId === loggedEmpDetails.id,
                                  ) ? ( */}
                                    <>
                                      {loggedEmpDetails.role !== "Employee" && (
                                        <button
                                          onClick={() =>
                                            handleEditProject(project)
                                          }
                                          className="px-[0.9vw] py-[0.18vw] flex items-center justify-center bg-blue-600 text-white rounded-full text-[0.65vw] hover:bg-blue-700 cursor-pointer"
                                        >
                                          Edit
                                        </button>
                                      )}

                                      <button
                                        onClick={() =>
                                          handleViewProject(project, status)
                                        }
                                        className="px-[0.7vw] flex items-center justify-center py-[0.18vw] bg-black text-white rounded-full text-[0.65vw] hover:bg-gray-900 cursor-pointer"
                                      >
                                        View
                                      </button>
                                    </>
                                  {/* ) : (
                                    <span className="text-[0.75vw] text-gray-400">
                                      -
                                    </span>
                                  )} */}
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

              {!loading && paginatedProjects.length > 0 && (
                <div className="flex items-center justify-between p-[1.7vw] h-[5%] flex-shrink-0">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-[0.5vw] text-[0.9vw] ${
                      currentPage === 1
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-600 hover:text-gray-700 cursor-pointer"
                    }`}
                  >
                    ← <span>Previous</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {totalPages > 1 &&
                      getPageNumbers().map((page, index) =>
                        page === "..." ? (
                          <span
                            key={`ellipsis-${index}`}
                            className="text-[0.75vw] text-gray-600"
                          >
                            ...
                          </span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => handlePageClick(page)}
                            className={`px-[0.4vw] py-[0.2vw] text-[0.7vw] rounded cursor-pointer ${
                              currentPage === page
                                ? "bg-blue-600 text-white"
                                : "text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            {String(page).padStart(2, "0")}
                          </button>
                        ),
                      )}
                  </div>

                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className={`flex items-center gap-[0.5vw] text-[0.9vw] ${
                      currentPage === totalPages
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-600 hover:text-gray-700 cursor-pointer"
                    }`}
                  >
                    <span>Next</span> →
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <Outlet />
      )}
    </div>
  );
};

export default Projects;
