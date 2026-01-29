
import React, { useState, useEffect, useRef } from "react";
import { Plus, X, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useConfirm } from "../../ConfirmContext";
import { useNotification } from "../../NotificationContext";
import AddTask from "./AddTask";

const RECORDS_PER_PAGE = 8;

const AddProjectDashboard = () => {
  const confirm = useConfirm();
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProject, setEditingProject] = useState(null);

  // Task modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    companyName: "",
    projectName: "",
    categories: "",
    team: [],
    employees: [],
    startDate: "",
    endDate: "",
    description: "",
  });

  // Category autocomplete
  const [categorySearch, setCategorySearch] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [allCategories, setAllCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const categoryRef = useRef(null);

  // Dropdown options
  const [teamOptions, setTeamOptions] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);

  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  const teamRef = useRef(null);
  const employeeRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  const getEmployeeId = () => {
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    return userData.userName || null;
  };

  useEffect(() => {
    fetchDesignations();
    fetchProjects();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (categorySearch.trim()) {
      const filtered = allCategories.filter((cat) =>
        cat.toLowerCase().startsWith(categorySearch.toLowerCase())
      );
      setFilteredCategories(filtered);
      setShowCategoryDropdown(true);
    } else {
      setFilteredCategories([]);
      setShowCategoryDropdown(false);
    }
  }, [categorySearch, allCategories]);

  useEffect(() => {
    if (formData.team.length > 0) {
      const selectedDesignations = formData.team.map((t) => t.designation);
      const filtered = employeeOptions.filter((emp) =>
        selectedDesignations.includes(emp.designation)
      );
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees([]);
    }
  }, [formData.team, employeeOptions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (teamRef.current && !teamRef.current.contains(event.target)) {
        setShowTeamDropdown(false);
      }
      if (employeeRef.current && !employeeRef.current.contains(event.target)) {
        setShowEmployeeDropdown(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/projects/categories`);
      const data = await response.json();
      if (data.success) {
        setAllCategories(data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchDesignations = async () => {
    try {
      const response = await fetch(`${API_URL}/projects/designations`);
      const data = await response.json();
      if (data.success) {
        setTeamOptions(data.data);
      }
    } catch (error) {
      console.error("Error fetching designations:", error);
      notify({
        title: "Error",
        message: "Failed to fetch designations",
      });
    }
  };

  const fetchEmployeesByDesignation = async (designation) => {
    try {
      const response = await fetch(
        `${API_URL}/projects/employees/${encodeURIComponent(designation)}`
      );
      const data = await response.json();

      if (data.success) {
        return data.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching employees:", error);
      return [];
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/projects`);
      const data = await response.json();
      if (data.success) {
        setProjects(data.data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      notify({
        title: "Error",
        message: "Failed to fetch projects",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategorySearch = (e) => {
    setCategorySearch(e.target.value);
  };

  const handleCategorySelect = (category) => {
    setFormData((prev) => ({ ...prev, categories: category }));
    setCategorySearch(category);
    setShowCategoryDropdown(false);
  };

  const handleTeamToggle = async (member) => {
    const isSelected = formData.team.some((t) => t.id === member.id);

    if (isSelected) {
      const updatedTeam = formData.team.filter((t) => t.id !== member.id);
      const updatedEmployees = formData.employees.filter(
        (emp) => emp.designation !== member.designation
      );
      setFormData((prev) => ({
        ...prev,
        team: updatedTeam,
        employees: updatedEmployees,
      }));
    } else {
      const newTeam = [...formData.team, member];
      setFormData((prev) => ({ ...prev, team: newTeam }));

      const employees = await fetchEmployeesByDesignation(member.designation);
      setEmployeeOptions((prev) => {
        const existingIds = prev.map((e) => e.id);
        const newEmployees = employees.filter(
          (e) => !existingIds.includes(e.id)
        );
        return [...prev, ...newEmployees];
      });
    }
  };

  const handleEmployeeToggle = (employee) => {
    setFormData((prev) => {
      const isSelected = prev.employees.some((e) => e.id === employee.id);
      return {
        ...prev,
        employees: isSelected
          ? prev.employees.filter((e) => e.id !== employee.id)
          : [...prev.employees, employee],
      };
    });
  };

  const removeTeamMember = (memberId) => {
    const teamMember = formData.team.find((t) => t.id === memberId);
    if (teamMember) {
      const updatedTeam = formData.team.filter((t) => t.id !== memberId);
      const updatedEmployees = formData.employees.filter(
        (emp) => emp.designation !== teamMember.designation
      );
      setFormData((prev) => ({
        ...prev,
        team: updatedTeam,
        employees: updatedEmployees,
      }));
    }
  };

  const removeEmployee = (employeeId) => {
    setFormData((prev) => ({
      ...prev,
      employees: prev.employees.filter((e) => e.id !== employeeId),
    }));
  };

  const handleEdit = async (project) => {
    setEditingProject(project);

    const allEmployees = [];
    for (const teamMember of project.team) {
      const employees = await fetchEmployeesByDesignation(
        teamMember.designation
      );
      allEmployees.push(...employees);
    }
    setEmployeeOptions(allEmployees);

    setFormData({
      companyName: project.company_name,
      projectName: project.project_name,
      categories: project.categories,
      team: project.team,
      employees: project.all_employees || project.employees,
      startDate: project.start_date,
      endDate: project.end_date,
      description: project.description,
    });
    setCategorySearch(project.categories);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        company_name: formData.companyName,
        project_name: formData.projectName,
        categories: formData.categories,
        team: formData.team,
        employees: formData.employees,
        start_date: formData.startDate,
        end_date: formData.endDate,
        description: formData.description,
        created_by: getEmployeeId(),
      };

      const url = editingProject
        ? `${API_URL}/projects/${editingProject.id}`
        : `${API_URL}/projects`;

      const method = editingProject ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        notify({
          title: "Success",
          message: editingProject
            ? "Project updated successfully!"
            : "Project created successfully!",
        });
        fetchProjects();
        setIsModalOpen(false);
        setEditingProject(null);
        resetForm();
      } else {
        notify({
          title: "Error",
          message: data.error || "Failed to save project",
        });
      }
    } catch (error) {
      console.error("Error saving project:", error);
      notify({
        title: "Error",
        message: "Failed to save project",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      companyName: "",
      projectName: "",
      categories: "",
      team: [],
      employees: [],
      startDate: "",
      endDate: "",
      description: "",
    });
    setCategorySearch("");
    setEmployeeOptions([]);
    setFilteredEmployees([]);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingProject(null);
    resetForm();
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      type: "error",
      title: "Delete Project",
      message:
        "Are you sure you want to delete this project?\nThis action cannot be undone.",
      confirmText: "Yes, Delete",
      cancelText: "Cancel",
    });

    if (ok) {
      try {
        const response = await fetch(`${API_URL}/projects/${id}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (data.success) {
          notify({
            title: "Delete",
            message: "Project deleted successfully!",
          });
          fetchProjects();
        } else {
          notify({
            title: "Error",
            message: "Failed to delete project",
          });
        }
      } catch (error) {
        console.error("Error deleting project:", error);
        notify({
          title: "Error",
          message: "Failed to delete project",
        });
      }
    }
  };

  const handleAddTask = (project) => {
    setSelectedProject(project);
    setIsTaskModalOpen(true);
  };

  const handleTaskModalClose = () => {
    setIsTaskModalOpen(false);
    setSelectedProject(null);
    fetchProjects();
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`;
  };

  // Role-based project filtering
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.project_name?.toLowerCase().includes(searchTerm.toLowerCase());

    if (isProjectHead) {
      return matchesSearch;
    } else if (isRestrictedRole) {
      const hasMatchingDepartment = project.team?.some(
        (member) => member.designation === userInfo.designation
      );
      return matchesSearch && hasMatchingDepartment;
    }

    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredProjects.length / RECORDS_PER_PAGE);
  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
  const endIndex = startIndex + RECORDS_PER_PAGE;
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

  // ✅ Group paginated projects by company name
  const paginatedGroupedProjects = paginatedProjects.reduce((groups, project) => {
    const company = project.company_name || "Unknown Company";
    if (!groups[company]) {
      groups[company] = [];
    }
    groups[company].push(project);
    return groups;
  }, {});

  const handlePrevious = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <>
      <div className="bg-white rounded-b-xl rounded-tr-xl shadow-sm h-[100%] flex flex-col">
        {/* Search Bar */}
        <div className="flex items-center justify-between p-[0.8vw] h-[10%] flex-shrink-0">
          <div className="flex items-center gap-[0.5vw]">
            <span className="font-medium text-[0.95vw] text-gray-800">
              All Projects
            </span>
            <span className="text-[0.85vw] text-gray-500">
              ({filteredProjects.length})
            </span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div className="relative">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-[1vw] pr-[1vw] py-[0.24vw] rounded-full text-[0.9vw] bg-gray-200 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {isProjectHead && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-[0.8vw] py-[0.4vw] bg-black text-white rounded-full hover:bg-gray-800 text-[0.78vw] flex items-center justify-center cursor-pointer"
              >
                <Plus size={"1vw"} className="mr-[0.3vw]" />
                Add Project
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-[2vw] w-[2vw] border-b-2 border-blue-600"></div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="text-[1.1vw] font-medium mb-[0.5vw]">
                No projects found
              </p>
              <p className="text-[1vw] text-gray-400">
                Click "Add Project" to create one
              </p>
            </div>
          ) : (
            <div className="mr-[0.8vw] mb-[0.8vw] ml-[0.8vw] border border-gray-300 rounded-xl overflow-auto h-full">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-[#E2EBFF] sticky top-0 z-10">
                  <tr>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                      S.NO
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                      Project Name
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                      Start Date
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                      End Date
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                      Categories
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                      Department
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                      Team Members
                    </th>
                    <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* ✅ Grouped by Company Name */}
                  {Object.keys(paginatedGroupedProjects)
                    .sort()
                    .map((companyName) => {
                      const companyProjects = paginatedGroupedProjects[companyName];
                      return (
                        <React.Fragment key={companyName}>
                          {/* Company Header Row */}
                          <tr className="bg-gray-200">
                            <td
                              colSpan="8"
                              className="px-[0.7vw] py-[0.4vw] text-[0.9vw] font-semibold text-gray-800 border border-gray-300"
                            >
                              {companyName} ({companyProjects.length} projects)
                            </td>
                          </tr>
                          {/* Company Projects */}
                          {companyProjects.map((project) => {
                            const globalIndex = filteredProjects.findIndex(
                              (p) => p.id === project.id
                            );

                            return (
                              <tr
                                key={project.id}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-center text-gray-900 border border-gray-300">
                                  {globalIndex + 1}
                                </td>
                                <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-900 border border-gray-300">
                                  {project.project_name}
                                </td>
                                <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-center text-gray-900 border border-gray-300">
                                  {formatDisplayDate(project.start_date)}
                                </td>
                                <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-center text-gray-900 border border-gray-300">
                                  {formatDisplayDate(project.end_date)}
                                </td>
                                <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-900 border border-gray-300">
                                  {project.categories}
                                </td>
                                <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-900 border border-gray-300">
                                  <div className="flex flex-wrap gap-[0.2vw]">
                                    {project.team?.map((member, idx) => (
                                      <span
                                        key={idx}
                                        className="bg-purple-100 text-purple-700 px-[0.4vw] py-[0.1vw] rounded-full text-[0.7vw]"
                                      >
                                        {member.designation}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-900 border border-gray-300">
                                  <div className="flex flex-wrap gap-[0.2vw]">
                                    {project.all_employees?.map((emp, idx) => (
                                      <span
                                        key={idx}
                                        className="bg-green-100 text-green-700 px-[0.4vw] py-[0.1vw] rounded-full text-[0.7vw]"
                                      >
                                        {emp.name}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-[0.7vw] py-[0.52vw] border border-gray-300">
                                  <div className="flex justify-center items-center gap-[0.3vw]">
                                    <button
                                      onClick={() => handleAddTask(project)}
                                      className="p-[0.6vw] text-blue-600 hover:bg-blue-50 rounded-full transition-colors cursor-pointer"
                                      title="Add Task"
                                    >
                                      <Plus size={"1.02vw"} />
                                    </button>

                                    {isProjectHead && (
                                      <>
                                        <button
                                          onClick={() => handleEdit(project)}
                                          className="p-[0.6vw] text-gray-600 hover:bg-gray-50 rounded-full transition-colors cursor-pointer"
                                          title="Edit"
                                        >
                                          <Edit size={"1.02vw"} />
                                        </button>
                                        <button
                                          onClick={() => handleDelete(project.id)}
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
                        </React.Fragment>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && filteredProjects.length > 0 && (
          <div className="flex items-center justify-between px-[0.8vw] py-[0.5vw] h-[10%]">
            <div className="text-[0.85vw] text-gray-600">
              Showing {startIndex + 1} to{" "}
              {Math.min(endIndex, filteredProjects.length)} of{" "}
              {filteredProjects.length} entries
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

      {/* Project Modal - Same as before */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[60vw] max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-[1vw] border-b border-gray-200 flex-shrink-0">
              <h2 className="text-[1.1vw] font-semibold text-gray-800">
                {editingProject ? "Edit Project" : "Add New Project"}
              </h2>
              <button
                onClick={handleModalClose}
                className="p-[0.3vw] hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={"1.2vw"} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="p-[1vw] overflow-y-auto flex-1">
                <div className="grid grid-cols-3 gap-[1vw]">
                  {/* Company Name */}
                  <div>
                    <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.3vw]">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-[0.6vw] py-[0.4vw] text-[0.85vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter company name"
                    />
                  </div>

                  {/* Project Name */}
                  <div>
                    <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.3vw]">
                      Project Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="projectName"
                      value={formData.projectName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-[0.6vw] py-[0.4vw] text-[0.85vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter project name"
                    />
                  </div>

                  {/* Category with Autocomplete */}
                  <div ref={categoryRef} className="relative">
                    <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.3vw]">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={categorySearch}
                      onChange={handleCategorySearch}
                      onFocus={() =>
                        categorySearch && setShowCategoryDropdown(true)
                      }
                      onBlur={(e) => {
                        if (!formData.categories && categorySearch) {
                          setFormData((prev) => ({
                            ...prev,
                            categories: categorySearch,
                          }));
                        }
                      }}
                      required
                      className="w-full px-[0.6vw] py-[0.4vw] text-[0.85vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Type to search category"
                      autoComplete="off"
                    />
                    {showCategoryDropdown && filteredCategories.length > 0 && (
                      <div className="absolute z-[70] bg-white border border-gray-300 rounded-lg shadow-lg max-h-[10vw] overflow-y-auto w-full mt-[0.2vw]">
                        {filteredCategories.map((category, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleCategorySelect(category)}
                            className="px-[0.6vw] py-[0.4vw] text-[0.85vw] cursor-pointer hover:bg-gray-100"
                          >
                            {category}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Department */}
                  <div ref={teamRef} className="relative">
                    <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.3vw]">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div
                        onClick={() => setShowTeamDropdown(!showTeamDropdown)}
                        className="w-full px-[0.6vw] py-[0.4vw] text-[0.85vw] border border-gray-300 rounded-lg cursor-pointer bg-white min-h-[2.5vw] flex flex-wrap gap-[0.3vw] items-center"
                      >
                        {formData.team.length > 0 ? (
                          formData.team.map((member) => (
                            <span
                              key={member.id}
                              className="bg-purple-100 text-purple-700 px-[0.4vw] py-[0.1vw] rounded-full text-[0.75vw] flex items-center gap-[0.2vw]"
                            >
                              {member.designation}
                              <X
                                size={"0.8vw"}
                                className="cursor-pointer hover:text-purple-900"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeTeamMember(member.id);
                                }}
                              />
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">
                            Select department
                          </span>
                        )}
                      </div>

                      {showTeamDropdown && (
                        <div
                          className="fixed z-[60] bg-white border border-gray-300 rounded-lg shadow-lg max-h-[15vw] overflow-y-auto"
                          style={{
                            width: teamRef.current?.offsetWidth,
                            top:
                              teamRef.current?.getBoundingClientRect().bottom +
                              4,
                            left: teamRef.current?.getBoundingClientRect().left,
                          }}
                        >
                          {teamOptions.map((member) => (
                            <div
                              key={member.id}
                              onClick={() => handleTeamToggle(member)}
                              className={`px-[0.6vw] py-[0.4vw] text-[0.85vw] cursor-pointer hover:bg-gray-100 flex items-center gap-[0.5vw] ${
                                formData.team.some((t) => t.id === member.id)
                                  ? "bg-purple-50"
                                  : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={formData.team.some(
                                  (t) => t.id === member.id
                                )}
                                onChange={() => {}}
                                className="w-[1vw] h-[1vw] accent-purple-600"
                              />
                              <div className="flex-1">
                                <div className="font-medium">
                                  {member.designation}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Team Members */}
                  <div ref={employeeRef} className="relative">
                    <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.3vw]">
                      Team Members <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div
                        onClick={() => {
                          if (formData.team.length > 0) {
                            setShowEmployeeDropdown(!showEmployeeDropdown);
                          }
                        }}
                        className={`w-full px-[0.6vw] py-[0.4vw] text-[0.85vw] border border-gray-300 rounded-lg ${
                          formData.team.length > 0
                            ? "cursor-pointer bg-white"
                            : "cursor-not-allowed bg-gray-100"
                        } min-h-[2.5vw] flex flex-wrap gap-[0.3vw] items-center`}
                      >
                        {formData.employees.length > 0 ? (
                          formData.employees.map((emp) => (
                            <span
                              key={emp.id}
                              className="bg-green-100 text-green-700 px-[0.4vw] py-[0.1vw] rounded-full text-[0.75vw] flex items-center gap-[0.2vw]"
                            >
                              {emp.name}
                              <X
                                size={"0.8vw"}
                                className="cursor-pointer hover:text-green-900"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeEmployee(emp.id);
                                }}
                              />
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">
                            {formData.team.length === 0
                              ? "Select department first"
                              : "Select team members"}
                          </span>
                        )}
                      </div>

                      {showEmployeeDropdown && filteredEmployees.length > 0 && (
                        <div
                          className="fixed z-[60] bg-white border border-gray-300 rounded-lg shadow-lg max-h-[15vw] overflow-y-auto"
                          style={{
                            width: employeeRef.current?.offsetWidth,
                            top:
                              employeeRef.current?.getBoundingClientRect()
                                .bottom + 4,
                            left: employeeRef.current?.getBoundingClientRect()
                              .left,
                          }}
                        >
                          {filteredEmployees.map((employee) => (
                            <div
                              key={employee.id}
                              onClick={() => handleEmployeeToggle(employee)}
                              className={`px-[0.6vw] py-[0.4vw] text-[0.85vw] cursor-pointer hover:bg-gray-100 flex items-center gap-[0.5vw] ${
                                formData.employees.some(
                                  (e) => e.id === employee.id
                                )
                                  ? "bg-green-50"
                                  : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={formData.employees.some(
                                  (e) => e.id === employee.id
                                )}
                                onChange={() => {}}
                                className="w-[1vw] h-[1vw] accent-green-600"
                              />
                              <div>
                                <div className="font-medium">
                                  {employee.name}
                                </div>
                                <div className="text-[0.7vw] text-gray-500">
                                  {employee.designation}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.3vw]">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                      className="w-full px-[0.6vw] py-[0.4vw] text-[0.85vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.3vw]">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      min={formData.startDate}
                      required
                      className="w-full px-[0.6vw] py-[0.4vw] text-[0.85vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Description - Full Width */}
                  <div className="col-span-3">
                    <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.3vw]">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows="4"
                      className="w-full px-[0.6vw] py-[0.4vw] text-[0.85vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-none"
                      placeholder="Enter project description"
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
                      <span>
                        {editingProject ? "Updating..." : "Creating..."}
                      </span>
                    </>
                  ) : (
                    <span>
                      {editingProject ? "Update Project" : "Create Project"}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AddTask Component */}
      <AddTask
        isOpen={isTaskModalOpen}
        onClose={handleTaskModalClose}
        projectData={selectedProject}
      />
    </>
  );
};

export default AddProjectDashboard;