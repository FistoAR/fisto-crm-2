import { useState, useEffect, useRef } from "react";
import { IoIosClose } from "react-icons/io";
import { Shield, X, ChevronDown, Check } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useNotification } from "../NotificationContext";
import searchIcon from "../../assets/ProjectPages/search.webp";

export default function NewProject() {
  const { notify } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const [employeeID, setEmployeeID] = useState(null);
  const [employeeRole, setEmployeeRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingProject, setFetchingProject] = useState(false);
  const [teamHeads, setTeamHeads] = useState([]);

  const [companyType, setCompanyType] = useState("new");
  const [companyOptions, setCompanyOptions] = useState([]);
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);

  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const priorityRef = useRef(null);

  const [showReasonModal, setShowReasonModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [statusReason, setStatusReason] = useState("");
  const [originalStatus, setOriginalStatus] = useState(null);

  const priorityOptions = [
    { value: "High", label: "High", color: "bg-red-100 text-red-700" },
    {
      value: "Medium",
      label: "Medium",
      color: "bg-yellow-100 text-yellow-700",
    },
    { value: "Low", label: "Low", color: "bg-green-100 text-green-700" },
  ];

  const statusOptions = [
    {
      value: "In Progress",
      label: "In Progress",
      color: "bg-blue-100 text-blue-700",
    },
    { value: "Hold", label: "Hold", color: "bg-yellow-500 text-white" },
    { value: "Canceled", label: "Canceled", color: "bg-red-400 text-white" },
  ];

  const companyRef = useRef(null);
  const categoryRef = useRef(null);
  const departmentRef = useRef(null);

  const [accessModal, setAccessModal] = useState({
    visible: false,
    currentAccess: [],
    creator: null,
  });

  const [formData, setFormData] = useState({
    companyName: "",
    projectName: "",
    category: "",
    department: [],
    startDate: "",
    endDate: "",
    description: "",
    accessGrantedTo: [],
    employeeID: "",
    priority: "Medium",
    status: "In Progress",
    statusHistory: [],
    pendingStatusReason: "",
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [projectId, setProjectId] = useState(null);

  useEffect(() => {
    if (location.state?.isEditMode && location.state?.projectId) {
      setIsEditMode(true);
      setProjectId(location.state.projectId);
      setFormData((prev) => ({
        ...prev,
        projectName: location.state.projectName,
      }));
    }
  }, [location.state]);

  useEffect(() => {
    const storedUser =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setEmployeeID(user.userName);
      setEmployeeRole(user.designation);
      setFormData((prev) => ({
        ...prev,
        employeeID: user.userName,
      }));

      fetchTeamHeads();
      fetchDepartments();
      fetchCompanyOptions();
      fetchCategoryOptions("");
    }
  }, []);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!isEditMode || !projectId) return;

      setFetchingProject(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/project/${projectId}`,
        );
        const result = await response.json();

        if (result.success && result.data) {
          const project = result.data;

          const existingCompany = companyOptions.includes(project.companyName);
          setCompanyType(existingCompany ? "existing" : "new");

          let departmentData = [];
          if (
            project.departmentDetails &&
            project.departmentDetails.length > 0
          ) {
            departmentData = project.departmentDetails.map((dept) => ({
              id: dept.id,
              name: dept.name,
            }));
          } else if (project.department && project.department.length > 0) {
            departmentData = project.department
              .map((deptId) => {
                const found = departments.find(
                  (d) => d.id.toString() === deptId.toString(),
                );
                return found ? { id: found.id, name: found.name } : null;
              })
              .filter(Boolean);
          }

          const projectStatus = project.status || "In Progress";

          setFormData({
            companyName: project.companyName || "",
            projectName: project.projectName || "",
            category: project.category || "",
            department: departmentData,
            startDate: project.startDate || "",
            endDate: project.endDate || "",
            description: project.description || "",
            accessGrantedTo: project.accessGrantedTo || [],
            employeeID: project.employeeID || "",
            priority: project.preiority || project.priority || "Medium",
            status: projectStatus,
            statusHistory: project.statusHistory || [],
            pendingStatusReason: "",
          });

          setOriginalStatus(projectStatus);
        } else {
          notify({
            title: "Error",
            message: "Failed to fetch project details",
          });
        }
      } catch (error) {
        console.error("Error fetching project details:", error);
        notify({
          title: "Error",
          message: "Failed to fetch project details",
        });
      } finally {
        setFetchingProject(false);
      }
    };

    if (departments.length > 0 && companyOptions.length >= 0) {
      fetchProjectDetails();
    }
  }, [isEditMode, projectId, departments, companyOptions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (companyRef.current && !companyRef.current.contains(event.target)) {
        setShowCompanyDropdown(false);
        setCompanySearchTerm("");
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
      if (
        departmentRef.current &&
        !departmentRef.current.contains(event.target)
      ) {
        setShowDepartmentDropdown(false);
      }
      if (priorityRef.current && !priorityRef.current.contains(event.target)) {
        setShowPriorityDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchTeamHeads = async (userId, role) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/project/teamHeads`,
      );
      const result = await response.json();
      if (result.success) {
        setTeamHeads(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching team heads:", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/project/departments`,
      );
      const result = await response.json();
      if (result.success) {
        setDepartments(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchCompanyOptions = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/project/autocomplete/company`,
      );
      const result = await response.json();
      if (result.success) {
        setCompanyOptions(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching company options:", error);
    }
  };

  const fetchCategoryOptions = async (search) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/project/autocomplete/category?search=${encodeURIComponent(search)}`,
      );
      const result = await response.json();
      if (result.success) {
        setCategoryOptions(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching category options:", error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCategoryChange = (value) => {
    handleInputChange("category", value);
    fetchCategoryOptions(value);
    setShowCategoryDropdown(true);
  };

  const handleDepartmentToggle = (dept) => {
    setFormData((prev) => {
      const isSelected = prev.department.some((d) => d.id === dept.id);
      return {
        ...prev,
        department: isSelected
          ? prev.department.filter((d) => d.id !== dept.id)
          : [...prev.department, { id: dept.id, name: dept.name }],
      };
    });
  };

  const removeDepartment = (deptId) => {
    setFormData((prev) => ({
      ...prev,
      department: prev.department.filter((d) => d.id !== deptId),
    }));
  };

  const handleAccessManagement = () => {
    const storedUser =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    const currentUser = storedUser ? JSON.parse(storedUser) : null;

    setAccessModal({
      visible: true,
      currentAccess: formData.accessGrantedTo || [],
      creator: currentUser,
    });
  };

  const handleGrantAccess = (employeeId) => {
    const alreadyHasAccess = formData.accessGrantedTo?.some(
      (access) => access.employeeId === employeeId,
    );

    if (alreadyHasAccess) {
      notify({
        title: "Warning",
        message: "Access already granted to this admin",
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      accessGrantedTo: [
        ...(prev.accessGrantedTo || []),
        {
          employeeId,
          grantedAt: new Date(),
        },
      ],
    }));
  };

  const handleRevokeAccess = (employeeId) => {
    setFormData((prev) => ({
      ...prev,
      accessGrantedTo: prev.accessGrantedTo.filter(
        (access) => access.employeeId !== employeeId,
      ),
    }));
  };

  const closeAccessModal = () => {
    setAccessModal({
      visible: false,
      currentAccess: [],
      creator: null,
    });
  };

  const getProjectsPath = (designation) => {
    if (designation === "Software Developer")
      return "/softwareDeveloper/projects";
    if (designation === "UI/UX") return "/designer/projects";
    if (designation === "3D") return "/threeD/projects";
    if (designation === "Project Head") return "/projectHead/projects";
    if (designation === "Admin") return "/admin/project";
    return "/projects";
  };

  const getPriorityColor = (priority) => {
    const option = priorityOptions.find((p) => p.value === priority);
    return option ? option.color : "bg-gray-100 text-gray-700";
  };

  const getStatusColor = (status) => {
    const option = statusOptions.find((s) => s.value === status);
    return option ? option.color : "bg-gray-100 text-gray-700";
  };

  const handleStatusChange = (newStatus) => {
    if (newStatus === formData.status) return;
    setPendingStatus(newStatus);
    setShowReasonModal(true);
  };

  const handleConfirmStatusChange = () => {
    if (!statusReason.trim()) {
      notify({
        title: "Warning",
        message: "Please provide a reason for the status change",
      });
      return;
    }

    handleInputChange("status", pendingStatus);

    setFormData((prev) => ({
      ...prev,
      status: pendingStatus,
      pendingStatusReason: statusReason,
    }));

    setShowReasonModal(false);
    setPendingStatus(null);
    setStatusReason("");
  };

  const handleCancelStatusChange = () => {
    setShowReasonModal(false);
    setPendingStatus(null);
    setStatusReason("");
  };

  const getEmployeeNameById = (id) => {
    const teamHead = teamHeads.find((h) => h.id === id);
    if (teamHead) return teamHead.name;

    const storedUser =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.userName === id || user.id === id) {
        return user.employeeName || user.name || id;
      }
    }

    const accessPerson = formData.accessGrantedTo?.find(
      (a) => a.employeeId === id,
    );
    if (accessPerson?.name) return accessPerson.name;

    return id;
  };

  const handleSave = async () => {
    const requiredFields = [
      { field: "companyName", label: "Company Name" },
      { field: "projectName", label: "Project Name" },
      { field: "category", label: "Category" },
      { field: "department", label: "Department", isArray: true },
      { field: "startDate", label: "Start Date" },
      { field: "endDate", label: "End Date" },
    ];

    for (let item of requiredFields) {
      const value = formData[item.field];
      const isEmpty = item.isArray ? !value || value.length === 0 : !value;
      if (isEmpty) {
        notify({ title: "Warning", message: `Please select ${item.label}` });
        return;
      }
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      notify({
        title: "Warning",
        message: "End date cannot be before start date",
      });
      return;
    }

    setLoading(true);

    try {
      let payload = {
        companyName: formData.companyName,
        projectName: formData.projectName,
        category: formData.category,
        department: formData.department.map((d) => d.id),
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description,
        accessGrantedTo: formData.accessGrantedTo,
        employeeID: formData.employeeID,
        preiority: formData.priority,
        isNewCompany: companyType === "new",
      };

      if (isEditMode && formData.status && formData.status !== originalStatus) {
        payload.status = formData.status;
        payload.statusHistory = [
          ...(formData.statusHistory || []),
          {
            status: formData.status,
            changedBy: employeeID,
            reason: formData.pendingStatusReason || "",
          },
        ];
      }

      let response;
      if (isEditMode && projectId) {
        response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/project/${projectId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
      } else {
        response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/project`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();

      if (response.ok) {
        notify({
          title: "Success",
          message: isEditMode
            ? "Project updated successfully!"
            : "Project created successfully!",
        });

        if (
          isEditMode &&
          formData.status &&
          formData.status !== originalStatus
        ) {
          setOriginalStatus(formData.status);
          setFormData((prev) => ({
            ...prev,
            pendingStatusReason: "",
          }));
        }

        navigate(getProjectsPath(employeeRole));
      } else {
        notify({
          title: "Error",
          message: `Error ${isEditMode ? "updating" : "creating"} project: ${data.message}`,
        });
      }
    } catch (err) {
      notify({
        title: "Error",
        message: `Error ${isEditMode ? "updating" : "creating"} project: ${err}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const AccessManagementModal = () => {
    if (!accessModal.visible) return null;

    const currentUserId = employeeID;
    const hasAccessIds =
      formData.accessGrantedTo?.map((a) => a.employeeId) || [];

    return (
      <div
        className="fixed inset-0 bg-black/25 backdrop-blur-[0.1px] flex items-center justify-center z-50"
        onClick={closeAccessModal}
      >
        <div
          className="bg-white rounded-lg w-[28%] max-h-[60vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center px-[1.2vw] py-[0.8vw] border-b border-gray-200">
            <h2 className="text-[1.1vw] font-semibold flex items-center">
              <Shield className="w-[1.2vw] h-[1.2vw] mr-[0.3vw] text-blue-600" />
              Add Supporting Person's
            </h2>
            <button
              onClick={closeAccessModal}
              className="p-[0.4vw] hover:bg-gray-100 rounded-full cursor-pointer"
            >
              <X className="w-[1.2vw] h-[1.2vw]" />
            </button>
          </div>

          <div className="overflow-y-auto p-[1.2vw] space-y-[1vw]">
            <div>
              <h3 className="text-[0.95vw] font-medium mb-[0.9vw]">
                Creator (You)
              </h3>
              <div className="flex items-center space-x-[0.6vw] p-[0.7vw] bg-blue-50 rounded-lg">
                <div className="relative w-[2.2vw] h-[2.2vw] bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                  {accessModal.creator?.profile ? (
                    <>
                      <img
                        src={`${import.meta.env.VITE_API_BASE_URL1}${accessModal.creator.profile}`}
                        alt={accessModal.creator.employeeName}
                        className="w-full h-full rounded-full bg-white object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.classList.remove("hidden");
                        }}
                      />
                      <div className="hidden absolute inset-0 bg-blue-500 text-white rounded-full flex items-center justify-center font-medium text-[0.9vw]">
                        {accessModal.creator.employeeName?.[0]?.toUpperCase() ||
                          "?"}
                      </div>
                    </>
                  ) : (
                    accessModal.creator?.employeeName
                      ?.charAt(0)
                      ?.toUpperCase() || "U"
                  )}
                </div>
                <div>
                  <div className="font-medium">
                    {accessModal.creator?.employeeName}
                  </div>
                  <div className="text-[0.75vw] text-gray-600">
                    {accessModal.creator?.designation}
                  </div>
                </div>
                <span className="ml-auto px-[0.7vw] py-[0.2vw] bg-blue-100 text-blue-800 rounded-full text-[0.75vw] font-medium">
                  Owner
                </span>
              </div>
            </div>

            {formData.accessGrantedTo &&
              formData.accessGrantedTo.length > 0 && (
                <div>
                  <h3 className="text-[0.95vw] font-medium mb-[0.9vw]">
                    Current Access ({formData.accessGrantedTo.length})
                  </h3>
                  <div className="space-y-2">
                    {formData.accessGrantedTo.map((access) => {
                      const employee = teamHeads.find(
                        (h) => h.id === access.employeeId,
                      );
                      return (
                        <div
                          key={access.employeeId}
                          className="flex items-center justify-between p-[0.7vw] bg-green-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-[0.6vw]">
                            <div className="w-[2.2vw] h-[2.2vw] bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                              {employee?.profile ? (
                                <div className="relative w-full h-full">
                                  <img
                                    src={`${import.meta.env.VITE_API_BASE_URL1}${employee.profile}`}
                                    alt={employee.name}
                                    className="w-full h-full object-cover bg-white rounded-full"
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                      e.target.nextSibling.style.display =
                                        "flex";
                                    }}
                                  />
                                  <div className="hidden absolute inset-0 bg-blue-500 text-white rounded-full flex items-center justify-center font-medium text-[0.9vw]">
                                    {employee?.name?.[0]?.toUpperCase() || "?"}
                                  </div>
                                </div>
                              ) : (
                                employee?.name?.charAt(0)?.toUpperCase() || "U"
                              )}
                            </div>
                            <div>
                              <div className="font-medium">
                                {employee?.name}
                              </div>
                              <div className="text-[0.7vw] text-gray-600">
                                {employee?.department}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              handleRevokeAccess(access.employeeId)
                            }
                            className="px-[0.7vw] py-[0.2vw] bg-red-100 text-red-700 rounded-full text-[0.75vw] font-medium hover:bg-red-200 transition-colors cursor-pointer"
                          >
                            Revoke
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            <div>
              <h3 className="text-[0.95vw] font-medium mb-[0.9vw]">
                Grant Access to Admins
              </h3>
              {teamHeads.filter(
                (head) =>
                  head.id !== currentUserId && !hasAccessIds.includes(head.id),
              ).length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-[0.8vw]">
                  No Admins available for access
                </p>
              ) : (
                <div className="space-y-2">
                  {teamHeads
                    .filter(
                      (head) =>
                        head.id !== currentUserId &&
                        !hasAccessIds.includes(head.id),
                    )
                    .map((head) => (
                      <div
                        key={head.id}
                        className="flex items-center justify-between p-[0.7vw] bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <div className="flex items-center space-x-[0.6vw]">
                          <div className="w-[2.2vw] h-[2.2vw] bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                            {head.profile ? (
                              <div className="relative w-full h-full">
                                <img
                                  src={`${import.meta.env.VITE_API_BASE_URL1}${head.profile}`}
                                  alt={head.name}
                                  className="w-full h-full object-cover bg-white rounded-full"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.style.display = "flex";
                                  }}
                                />
                                <div className="hidden absolute inset-0 bg-blue-500 text-white rounded-full flex items-center justify-center font-medium text-[0.9vw]">
                                  {head?.name?.[0]?.toUpperCase() || "?"}
                                </div>
                              </div>
                            ) : (
                              head.name?.charAt(0)?.toUpperCase() || "U"
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-[0.85vw]">
                              {head.name}
                            </div>
                            <div className="text-[0.7vw] text-gray-600">
                              {head.department}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleGrantAccess(head.id)}
                          className="px-[0.7vw] py-[0.2vw] bg-blue-100 text-blue-700 rounded-full text-[0.75vw] font-medium hover:bg-blue-200 transition-colors cursor-pointer"
                        >
                          Grant
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-[92vh] w-full max-h-full overflow-hidden pb-[1vw] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-[2vw] w-[2vw] border-b-2 border-blue-600 mx-auto mb-[1vw]"></div>
          <p className="text-gray-600 text-[0.85vw]">
            {fetchingProject ? "Loading project details..." : "Saving..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[92vh] w-full max-h-full overflow-hidden pb-[1vw]">
      <div className="text-[0.9vw] text-gray-500 ml-[0.3vw] max-h-[5%] h-[4.5%]">
        <span
          onClick={() => navigate(getProjectsPath(employeeRole))}
          className="cursor-pointer hover:text-[#3B82F6]"
        >
          Projects
        </span>{" "}
        <span className="m-[0.3vw] h-[2vw] w-[1w]">{"/"}</span>
        <span className="text-black">
          {isEditMode ? `${formData.projectName}` : "New Project"}
        </span>
      </div>

      <div className="bg-white rounded-[1vw] border border-gray-200 overflow-y-hidden max-h-[95%] h-[95%]">
        <div className="flex justify-between items-center bg-gray-200 px-[1vw] py-[0.2vw] h-[6%]">
          <h2 className="text-[0.9vw] font-medium text-gray-800">
            {isEditMode ? "Edit Project Details" : "Project Details"}
          </h2>

          {fetchingProject && <p>Fetching {formData.projectName} details</p>}
        </div>

        <div className="h-[87%] max-h-[87%] overflow-y-auto px-[1vw] py-[0.8vw] pr-[15%]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[1vw] mb-[1vw]">
            <div ref={companyRef} className="relative">
              <div className="flex gap-[0.5vw] mb-[0.5vw] justify-between">
                <label className="block text-[0.85vw] text-gray-700 ">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <div className="absolute right-0 -top-[0.3vw] flex gap-[0.5vw] bg-black rounded-full p-[0.15vw]">
                  <button
                    type="button"
                    onClick={() => {
                      setCompanyType("existing");
                      setFormData((prev) => ({ ...prev, companyName: "" }));
                      setCompanySearchTerm("");
                    }}
                    className={`min-w-[3.7vw] py-[0.15vw] text-[0.75vw] rounded-full transition-colors cursor-pointer ${
                      companyType === "existing"
                        ? "bg-white text-gray-800"
                        : "bg-black text-white hover:bg-white hover:text-black"
                    }`}
                  >
                    Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCompanyType("new");
                      setFormData((prev) => ({ ...prev, companyName: "" }));
                      setCompanySearchTerm("");
                    }}
                    className={`min-w-[3.7vw] py-[0.15vw] text-[0.75vw] rounded-full transition-colors cursor-pointer ${
                      companyType === "new"
                        ? "bg-white text-gray-800"
                        : "bg-black text-white hover:bg-white hover:text-black"
                    }`}
                  >
                    New
                  </button>
                </div>
              </div>

              {companyType === "new" ? (
                <input
                  type="text"
                  placeholder="Enter new company name"
                  value={formData.companyName}
                  onChange={(e) =>
                    handleInputChange("companyName", e.target.value)
                  }
                  className="w-full border border-gray-600 rounded-full px-[0.7vw] py-[0.3vw] text-[0.80vw] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <>
                  <div
                    className="w-full border border-gray-600 rounded-full px-[0.7vw] py-[0.3vw] text-[0.80vw] text-gray-700 cursor-pointer flex items-center justify-between"
                    onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                  >
                    <span
                      className={
                        formData.companyName ? "text-gray-700" : "text-gray-400"
                      }
                    >
                      {formData.companyName || "Select existing company"}
                    </span>
                    <ChevronDown
                      className={`w-[1vw] h-[1vw] text-gray-500 transition-transform ${
                        showCompanyDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  {showCompanyDropdown && (
                    <div className="absolute z-20 w-full mt-[0.2vw] bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
                      <div className="p-[0.5vw] border-b border-gray-200">
                        <div className="relative">
                          <img
                            src={searchIcon}
                            className="w-[0.9vw] h-[0.9vw] absolute left-[0.6vw] top-1/2 -translate-y-1/2 opacity-60"
                            alt="search"
                          />
                          <input
                            type="text"
                            placeholder="Search company..."
                            value={companySearchTerm}
                            onChange={(e) =>
                              setCompanySearchTerm(e.target.value)
                            }
                            onMouseDown={(e) => e.stopPropagation()}
                            autoFocus
                            className="w-full border border-gray-300 rounded-full px-[0.6vw] py-[0.25vw] text-[0.75vw] pl-[1.8vw] focus:outline-none focus:ring-1 focus:ring-gray-500"
                          />
                          {companySearchTerm && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCompanySearchTerm("");
                              }}
                              className="absolute right-[0.5vw] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <X className="w-[0.8vw] h-[0.8vw]" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="max-h-[12vw] overflow-y-auto">
                        {companyOptions.filter((option) =>
                          option
                            .toLowerCase()
                            .includes(companySearchTerm.toLowerCase()),
                        ).length === 0 ? (
                          <div className="px-[0.7vw] py-[0.8vw] text-[0.8vw] text-gray-500 text-center">
                            No companies found
                          </div>
                        ) : (
                          companyOptions
                            .filter((option) =>
                              option
                                .toLowerCase()
                                .includes(companySearchTerm.toLowerCase()),
                            )
                            .map((option, index) => (
                              <div
                                key={index}
                                className={`px-[0.7vw] py-[0.4vw] text-[0.8vw] cursor-pointer flex items-center justify-between border-b border-gray-100 transition-colors ${
                                  formData.companyName === option
                                    ? "bg-blue-50 text-blue-700"
                                    : "hover:bg-gray-50"
                                }`}
                                onClick={() => {
                                  handleInputChange("companyName", option);
                                  setShowCompanyDropdown(false);
                                  setCompanySearchTerm("");
                                }}
                              >
                                <span>{option}</span>
                                {formData.companyName === option && (
                                  <Check className="w-[0.9vw] h-[0.9vw] text-blue-600" />
                                )}
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div>
              <label className="block text-[0.85vw] text-gray-700 mb-[0.5vw]">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter project name"
                value={formData.projectName}
                onChange={(e) =>
                  handleInputChange("projectName", e.target.value)
                }
                className="w-full border border-gray-600 rounded-full px-[0.7vw] py-[0.3vw] text-[0.80vw] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div ref={categoryRef} className="relative">
              <label className="block text-[0.85vw] text-gray-700 mb-[0.5vw]">
                Category <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter category"
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                onFocus={() => setShowCategoryDropdown(true)}
                className="w-full border border-gray-600 rounded-full px-[0.7vw] py-[0.3vw] text-[0.80vw] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {showCategoryDropdown && categoryOptions.length > 0 && (
                <div className="absolute z-10 w-full mt-[0.2vw] bg-white border border-gray-300 rounded-lg shadow-lg max-h-[15vw] overflow-y-auto">
                  {categoryOptions
                    .filter((option) =>
                      option
                        .toLowerCase()
                        .includes(formData.category.toLowerCase()),
                    )
                    .map((option, index) => (
                      <div
                        key={index}
                        className="px-[0.7vw] py-[0.4vw] text-[0.8vw] hover:bg-blue-50 cursor-pointer"
                        onClick={() => {
                          handleInputChange("category", option);
                          setShowCategoryDropdown(false);
                        }}
                      >
                        {option}
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[0.85vw] text-gray-700 mb-[0.5vw]">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                min={
                  isEditMode
                    ? undefined
                    : new Date().toISOString().split("T")[0]
                }
                onChange={(e) => handleInputChange("startDate", e.target.value)}
                className="w-full border border-gray-600 rounded-full px-[0.7vw] py-[0.3vw] text-[0.80vw] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[0.85vw] text-gray-700 mb-[0.5vw]">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.endDate}
                min={formData.startDate}
                disabled={!formData.startDate}
                onChange={(e) => handleInputChange("endDate", e.target.value)}
                className="w-full border border-gray-600 rounded-full px-[0.7vw] py-[0.3vw] text-[0.80vw] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div ref={departmentRef} className="relative">
              <label className="block text-[0.85vw] text-gray-700 mb-[0.5vw]">
                Department <span className="text-red-500">*</span>
              </label>
              <div
                className="w-full border border-gray-600 rounded-[0.8vw] px-[0.7vw] py-[0.3vw] text-[0.80vw] text-gray-700 cursor-pointer min-h-[2vw] flex items-center flex-wrap gap-[0.3vw]"
                onClick={() =>
                  setShowDepartmentDropdown(!showDepartmentDropdown)
                }
              >
                {formData.department.length === 0 ? (
                  <span className="text-gray-400">Select departments</span>
                ) : (
                  formData.department.map((dept) => (
                    <span
                      key={dept.id}
                      className="bg-blue-100 text-blue-800 px-[0.5vw] py-[0.1vw] rounded-full text-[0.7vw] flex items-center gap-[0.2vw]"
                    >
                      {dept.name}
                      <IoIosClose
                        className="w-[0.9vw] h-[0.9vw] cursor-pointer hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeDepartment(dept.id);
                        }}
                      />
                    </span>
                  ))
                )}
                <ChevronDown className="w-[1vw] h-[1vw] ml-auto text-gray-500" />
              </div>

              {showDepartmentDropdown && (
                <div
                  className="absolute z-20 w-full mt-[0.2vw] bg-white border border-gray-300 rounded-lg shadow-lg max-h-[15vw] overflow-y-auto"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {departments.length === 0 ? (
                    <div className="px-[0.7vw] py-[0.4vw] text-[0.8vw] text-gray-500">
                      No departments available
                    </div>
                  ) : (
                    departments.map((dept) => {
                      const isSelected = formData.department.some(
                        (d) => d.id === dept.id,
                      );

                      return (
                        <div
                          key={dept.id}
                          className={`px-[0.7vw] py-[0.4vw] border-b border-gray-200 text-[0.8vw] cursor-pointer flex items-center justify-between transition ${
                            isSelected
                              ? "bg-blue-50 text-blue-700"
                              : "hover:bg-gray-50"
                          }`}
                          onClick={() => handleDepartmentToggle(dept)}
                        >
                          <span>{dept.name}</span>

                          {isSelected && (
                            <Check className="w-[0.9vw] h-[0.9vw] text-blue-600" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Priority Dropdown */}
            <div ref={priorityRef} className="relative">
              <label className="block text-[0.85vw] text-gray-700 mb-[0.5vw]">
                Priority
              </label>
              <div
                className="w-full border border-gray-600 rounded-full px-[0.7vw] py-[0.3vw] text-[0.80vw] text-gray-700 cursor-pointer flex items-center justify-between"
                onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
              >
                <span
                  className={`px-[0.5vw] py-[0.1vw] rounded-full text-[0.75vw] font-medium ${getPriorityColor(formData.priority)}`}
                >
                  {formData.priority}
                </span>
                <ChevronDown
                  className={`w-[1vw] h-[1vw] text-gray-500 transition-transform ${
                    showPriorityDropdown ? "rotate-180" : ""
                  }`}
                />
              </div>

              {showPriorityDropdown && (
                <div className="absolute z-20 w-full mt-[0.2vw] bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
                  {priorityOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`px-[0.7vw] py-[0.4vw] text-[0.8vw] cursor-pointer flex items-center justify-between border-b border-gray-100 transition-colors ${
                        formData.priority === option.value
                          ? "bg-gray-50"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => {
                        handleInputChange("priority", option.value);
                        setShowPriorityDropdown(false);
                      }}
                    >
                      <span
                        className={`px-[0.5vw] py-[0.1vw] rounded-full text-[0.75vw] font-medium ${option.color}`}
                      >
                        {option.label}
                      </span>
                      {formData.priority === option.value && (
                        <Check className="w-[0.9vw] h-[0.9vw] text-blue-600" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isEditMode && (
              <div className="relative">
                <label className="block text-[0.85vw] text-gray-700 mb-[0.5vw]">
                  Project Status
                </label>

                {originalStatus === "Canceled" ? (
                  <div className="w-full border border-gray-600 rounded-full px-[0.7vw] py-[0.3vw] text-[0.80vw] text-gray-700 bg-gray-100 cursor-not-allowed flex items-center">
                    <span
                      className={`px-[0.5vw] py-[0.1vw] rounded-full text-[0.75vw] font-medium ${getStatusColor(originalStatus)}`}
                    >
                      {originalStatus}
                    </span>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      className="appearance-none w-full border border-gray-600 rounded-full px-[0.7vw] py-[0.3vw] text-[0.80vw] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      value={formData.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                    >
                      {statusOptions.map((status) => (
                        <option
                          key={status.value}
                          value={status.value}
                          disabled={status.value === originalStatus}
                        >
                          {status.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-[0.7vw] top-1/2 -translate-y-1/2 w-[1vw] h-[1vw] text-gray-500 pointer-events-none" />
                  </div>
                )}

                {formData.status !== originalStatus && (
                  <p className="text-[0.7vw] text-gray-600 mt-[0.2vw] ml-[0.3vw]">
                    Status will change from "{originalStatus}" to "
                    {formData.status}"
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-[0.85vw] text-gray-700 mb-[0.5vw]">
                Supporting Person's (Optional)
              </label>
              <button
                onClick={handleAccessManagement}
                className="flex items-center gap-[0.8vw] px-[1.2vw] py-[0.3vw] text-[0.80vw] text-gray-700 bg-white border border-gray-600 rounded-full hover:bg-gray-50 cursor-pointer"
                title="Manage Access"
              >
                <span>Add supporting person's</span>
                {formData.accessGrantedTo &&
                  formData.accessGrantedTo.length > 0 && (
                    <span className="bg-blue-600 text-white text-[0.6vw] rounded-full min-w-[1vw] h-[1vw] flex items-center justify-center px-[0.15vw]">
                      {formData.accessGrantedTo.length}
                    </span>
                  )}
              </button>
            </div>
          </div>

          <div className="mb-[1vw]">
            <label className="block text-[0.85vw] text-gray-700 mb-[0.5vw]">
              Project Description
            </label>
            <textarea
              rows={4}
              className="w-full border border-gray-600 rounded-xl px-[0.7vw] py-[0.6vw] text-[0.8vw] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter project description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
            />
          </div>

          {isEditMode &&
            formData.statusHistory &&
            formData.statusHistory.length > 0 && (
              <div className="mb-[1vw]">
                <label className="block text-[0.85vw] text-gray-700 mb-[0.5vw]">
                  Status History
                </label>
                <div className="border border-gray-300 rounded-lg  max-w-[30vw] overflow-hidden">
                  <div className="max-h-[10vw] overflow-y-auto">
                    {formData.statusHistory.map((history, index) => (
                      <div
                        key={index}
                        className={`p-[0.6vw] flex items-center gap-[0.8vw] ${
                          index !== formData.statusHistory.length - 1
                            ? "border-b border-gray-200"
                            : ""
                        }`}
                      >
                        <div
                          className={`px-[0.9vw] py-[0.15vw] rounded-xl text-[0.7vw] font-medium ${getStatusColor(history.status)}`}
                        >
                          {history.status}
                        </div>
                        <div className="flex-1">
                          <p className="text-[0.75vw] text-gray-600">
                            Reason : {history.reason || "No reason provided"}
                          </p>
                          <p className="text-[0.65vw] text-gray-400 mt-[0.2vw]">
                            Changed by:{" "}
                            {getEmployeeNameById(history.changedBy) ||
                              "Unknown"}
                            {history.createdAt &&
                              ` • ${new Date(history.createdAt).toLocaleString()}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
        </div>

        <div className="flex items-center justify-end pr-[1vw] h-[7%] pb-[0.5vw] gap-[1vw]">
          <button
            className="bg-gray-300 hover:bg-gray-200 text-black px-[1.3vw] py-[0.3vw] rounded-full text-[0.8vw] cursor-pointer"
            onClick={() => navigate(getProjectsPath(employeeRole))}
          >
            Cancel
          </button>
          {originalStatus === "Canceled" ? null : (
            <button
              className="bg-black hover:bg-gray-900 text-white px-[1.6vw] py-[0.3vw] rounded-full text-[0.8vw] cursor-pointer"
              onClick={handleSave}
              disabled={loading}
            >
              {isEditMode ? "Update" : "Save"}
            </button>
          )}
        </div>
      </div>

      <AccessManagementModal />

      {showReasonModal && (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-[0.1px] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[28%] p-[1.2vw]">
            <div className="flex justify-between items-center mb-[1vw]">
              <h3 className="text-[1vw] font-semibold">
                Change Status to{" "}
                <span
                  className={` rounded-full text-[1vw] font-semibold `}
                >
                  {pendingStatus}
                </span>
              </h3>
              <button
                onClick={handleCancelStatusChange}
                className="p-[0.4vw] hover:bg-gray-100 rounded-full cursor-pointer"
              >
                <X className="w-[1.2vw] h-[1.2vw]" />
              </button>
            </div>

            <div className="mb-[1vw]">
              <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Please provide a reason for this status change..."
                rows={4}
                className="w-full border border-gray-600 rounded-lg px-[0.7vw] py-[0.6vw] text-[0.8vw] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-[1vw] justify-end">
              <button
                onClick={handleCancelStatusChange}
                className="px-[1.3vw] py-[0.3vw] bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-full text-[0.8vw] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStatusChange}
                className="px-[1.3vw] py-[0.3vw] bg-blue-600 hover:bg-blue-700 text-white rounded-full text-[0.8vw] cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
