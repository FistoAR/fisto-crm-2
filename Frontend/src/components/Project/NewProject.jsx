import { useState, useEffect, useRef } from "react";
import { IoIosArrowDown } from "react-icons/io";
import { Shield, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useNotification } from "../NotificationContext";
import PreviewModal from "../Project/PreviewModal";
import { useConfirm } from "../ConfirmContext";
import namer from "color-namer";

export default function NewProject() {
  const { notify } = useNotification();
  const confirm = useConfirm();

  const navigate = useNavigate();
  const location = useLocation();
  const colorPickerRef = useRef(null);
  const colorPopupContentRef = useRef(null);

  const [employeeID, setEmployeeID] = useState(null);
  const [employeeRole, setEmployeeRole] = useState(null);

  const [previewFile, setPreviewFile] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [projectId, setProjectId] = useState(null);

  const [teamHeads, setTeamHeads] = useState([]);
  const [projectOwners, setProjectOwners] = useState([]);
  const [projectsData, setProjectsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState("");
  const [colorName, setColorName] = useState("");
  const [showColorPopup, setShowColorPopup] = useState(false);
  const [colorCodes, setColorCodes] = useState([]);
  const [showColorWarning, setShowColorWarning] = useState(false);

  const [accessModal, setAccessModal] = useState({
    visible: false,
    currentAccess: [],
    creator: null,
    showTransferSelection: false,
  });

  const getColorName = (hex) => {
    try {
      return namer(hex).ntc[0].name;
    } catch {
      return "";
    }
  };
  

  const [formData, setFormData] = useState({
    clientId: "",
    companyName: "",
    companyId: "",
    employeeID: null,
    employeeName: null,
    projectName: "",
    priority: "",
    projectCategory: "",
    startDate: "",
    endDate: "",
    projectDescription: "",
    accessGrantedTo: [],
    teamHead: "",
    creator: null,
  });

  useEffect(() => {
    if (location.state?.isEditMode && location.state?.projectId) {
      setIsEditMode(true);
      setProjectId(location.state.projectId);
    }
  }, [location.state]);

  useEffect(() => {
    const init = async () => {
      try {
        const storedUser =
          localStorage.getItem("user") || sessionStorage.getItem("user");
        let user = null;
        if (storedUser) {
          try {
            user = JSON.parse(storedUser);
          } catch {
            user = storedUser;
          }
        }

        const userId =
          user?.userName ||
          user?.id ||
          user?.employee_id ||
          user?.employeeId ||
          user?._id ||
          null;
        const userName =
          user?.employeeName || user?.name || user?.fullName || "";
        const userRole =
          user?.designation || user?.role || user?.userRole || null;
        const userProfile = user?.profile || user?.profile_url || "";

        setEmployeeID(userId);
        setEmployeeRole(userRole);
        setFormData((prev) => ({
          ...prev,
          employeeID: userId,
          employeeName: userName,
          creator:
            prev.creator ||
            (userId
              ? { id: userId, name: userName, profile: userProfile, designation: userRole }
              : null),
        }));

        setLoading(true);
        const [companiesRes, teamHeadsRes, ownersRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_BASE_URL}/companies`).then((r) =>
            r.ok ? r.json() : Promise.resolve(null)
          ),
          fetch(
            `${import.meta.env.VITE_API_BASE_URL}/employees/team-heads`
          ).then((r) => (r.ok ? r.json() : Promise.resolve(null))),
          fetch(
            `${import.meta.env.VITE_API_BASE_URL}/employees/project-owners`
          ).then((r) => (r.ok ? r.json() : Promise.resolve(null))),
        ]);

        if (
          companiesRes?.status === "success" &&
          Array.isArray(companiesRes.data)
        ) {
          setProjectsData(companiesRes.data);
        } else if (Array.isArray(companiesRes)) {
          setProjectsData(companiesRes);
        }

        if (
          teamHeadsRes?.status === "success" &&
          Array.isArray(teamHeadsRes.data)
        ) {
          setTeamHeads(
            teamHeadsRes.data.map((r) => ({
              id: r.id || r.employee_id || r.employeeId || r.userName || null,
              employeeId:
                r.employee_id || r.employeeId || r.userName || r.id || null,
              name:
                r.name || r.employee_name || r.employeeName || r.fullName || "",
              department: r.department || r.designation || "",
              profile: r.profile || r.profile_url || "",
              email: r.email_official || r.email || "",
            }))
          );
        }

        if (
          ownersRes?.status === "success" &&
          Array.isArray(ownersRes.data)
        ) {
          setProjectOwners(
            ownersRes.data.map((r) => ({
              id: r.id || r.employee_id || r.employeeId || r.userName || null,
              employeeId:
                r.employee_id || r.employeeId || r.userName || r.id || null,
              name:
                r.name || r.employee_name || r.employeeName || r.fullName || "",
              department: r.department || r.designation || "",
              profile: r.profile || r.profile_url || "",
              email: r.email_official || r.email || "",
            }))
          );
        }

        if (!isEditMode && userId) {
          try {
            const pjRes = await fetch(
              `${import.meta.env.VITE_API_BASE_URL}/Projects/`
            ).then((r) => (r.ok ? r.json() : Promise.reject(r)));

            if (pjRes?.status === "success") {
              setProjectsData((prev) => pjRes.data || prev);
              const formatted = (pjRes.colorCode || []).map((item) => ({
                projectName: item.projectName,
                colorCode: item.colorCode?.code || item.colorCode || "",
              }));
              setColorCodes(formatted);
            }
          } catch (err) {
            console.warn("No NewProjectDetails or failed fetch", err);
          }
        }

        if (isEditMode && projectId) {
          await fetchProjectData({
            ownersArray:
              (ownersRes?.status === "success" && ownersRes.data) || projectOwners,
            teamHeadsArray:
              (teamHeadsRes?.status === "success" && teamHeadsRes.data) || teamHeads,
          });
        }
      } catch (err) {
        console.error("Init fetch error:", err);
        notify({
          title: "Error",
          message: "Failed to initialize project form data",
        });
      } finally {
        setLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, projectId]);

  const fetchProjectData = async ({ ownersArray = null, teamHeadsArray = null } = {}) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}`
      );
      const result = await response.json();

      if (result.success) {
        const project = result.data;

        const owners = ownersArray || projectOwners;
        const heads = teamHeadsArray || teamHeads;

        let creatorObj = project.creator || null;
        const creatorId =
          (creatorObj && (creatorObj.id || creatorObj.employee_id || creatorObj.employeeId)) ||
          creatorObj ||
          null;

        if (creatorId && owners && owners.length > 0) {
          const matchedOwner = owners.find(
            (o) => o.id === creatorId || o.employeeId === creatorId
          );
          if (matchedOwner) creatorObj = matchedOwner;
        }
        if (!creatorObj && heads && heads.length > 0 && project.creator) {
          const matchedHead = heads.find(
            (h) =>
              h.id === project.creator ||
              h.id === creatorId ||
              h.employeeId === creatorId
          );
          if (matchedHead) creatorObj = matchedHead;
        }

        let accessArr = project.accessGrantedTo || [];
        if (typeof accessArr === "string") {
          try {
            accessArr = JSON.parse(accessArr);
          } catch {
            accessArr = [];
          }
        }
        if (!Array.isArray(accessArr)) accessArr = [];

        const formatToYYYYMMDD = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const safeStart = project.startDate || project.start_date || project.start || null;
const safeEnd = project.endDate || project.end_date || project.end || null;

        setFormData((prev) => ({
          ...prev,
          clientId: project.clientId,
          companyName: project.companyName,
          companyId: project.companyId || prev.companyId,
          employeeID: project.employeeID || null,
          employeeName: project.employeeName || prev.employeeName || null,
          projectName: project.projectName,
          priority: project.priority,
          projectCategory: project.projectCategory,
          startDate: formatToYYYYMMDD(safeStart),
          endDate: formatToYYYYMMDD(safeEnd),
          projectDescription: project.projectDescription,
          accessGrantedTo: accessArr,
          teamHead: project.teamHead || "",
          creator: creatorObj || project.creator,
        }));

        if (project.colorCode) {
          setSelectedColor(project.colorCode.code);
          setColorName(project.colorCode.name);
        }

        if (result.data.teamHead && Array.isArray(result.data.teamHead)) {
          setTeamHeads(
            result.data.teamHead.map((r) => ({
              id: r.id || r.employee_id || r.employeeId || null,
              employeeId: r.employee_id || r.employeeId || r.id || null,
              name: r.name || r.employee_name || "",
              department: r.department || r.designation || "",
              profile: r.profile || r.profile_url || "",
              email: r.email_official || "",
            }))
          );
        }
      } else {
        notify({
          title: "Error",
          message: "Failed to load project data",
        });
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      notify({
        title: "Error",
        message: "Failed to load project data",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        colorPopupContentRef.current &&
        !colorPopupContentRef.current.contains(event.target)
      ) {
        setShowColorPopup(false);
      }
    };

    if (showColorPopup) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showColorPopup]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target)
      ) {
        setShowColorPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchTeamHeads = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/employees/team-heads`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (result.status === "success") {
        setTeamHeads(
          result.data.map((r) => ({
            id: r.id || r.employee_id || r.employeeId || null,
            employeeId: r.employee_id || r.employeeId || r.id || null,
            name: r.name || r.employee_name || "",
            department: r.department || r.designation || "",
            profile: r.profile || r.profile_url || "",
            email: r.email_official || "",
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching team heads:", err);
    }
  };

  const fetchProjectOwners = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/employees/project-owners`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (result.status === "success") {
        setProjectOwners(
          result.data.map((r) => ({
            id: r.id || r.employee_id || r.employeeId || null,
            employeeId: r.employee_id || r.employeeId || r.id || null,
            name: r.name || r.employee_name || "",
            department: r.department || r.designation || "",
            profile: r.profile || r.profile_url || "",
            email: r.email_official || "",
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching project owners:", err);
    }
  };

  const handleCompanySelect = (companyId) => {
    const company = projectsData.find((c) => String(c.id) === String(companyId));

    if (company) {
      setFormData((prev) => ({
        ...prev,
        companyId: companyId,
        companyName: company.companyName || company.name || "",
      }));
    }
  };

  const handleProjectSelect = (selectedClientId) => {
    const client = projectsData.find(
      (project) => project.clientId === selectedClientId
    );

    if (client) {
      setFormData((prev) => ({
        ...prev,
        clientId: selectedClientId,
        companyName: client.companyName,
        projectName: client.projectName,
        projectCategory: client.projectCategory || "",
        startDate: client.startDate || "",
        endDate: client.endDate || "",
        projectDescription: client.description || "",
        priority: "",
        teamHead: "",
      }));
      setSelectedColor("");
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };



  const handleColorChange = async (color) => {
    if (!color) return;

    setSelectedColor(color);
    const name = getColorName(color);
    setColorName(name);

    const exists = await checkColorExists(color);

    handleInputChange("colorCode", {
      name: name,
      code: color,
      exists: exists?.exists,
      existProjectName: exists?.projectName,
    });
  };

  const handleAccessManagement = () => {
    const storedUser =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    const currentUser = storedUser ? JSON.parse(storedUser) : null;

    const selectedProject = projectsData.find(
      (project) => project.clientId === formData.clientId
    );

    let creatorObj = formData.creator || null;
    const cId =
      (creatorObj && (creatorObj.id || creatorObj.employee_id || creatorObj.employeeId)) ||
      creatorObj ||
      null;

    if (cId && projectOwners.length > 0) {
      const matchedOwner = projectOwners.find((o) => o.id === cId || o.employeeId === cId);
      if (matchedOwner) creatorObj = matchedOwner;
    }

    if (!creatorObj && selectedProject?.creator) {
      const matched = teamHeads.find(
        (t) =>
          t.id === selectedProject.creator ||
          t.employeeId === selectedProject.creator
      );
      if (matched) creatorObj = matched;
    }

    if (!creatorObj) {
      if (currentUser) {
        creatorObj = {
          id:
            currentUser.userName ||
            currentUser.id ||
            currentUser.employee_id ||
            currentUser.employeeId ||
            null,
          employeeId:
            currentUser.userName ||
            currentUser.employee_id ||
            currentUser.employeeId ||
            currentUser.id ||
            null,
          name:
            currentUser.employeeName ||
            currentUser.name ||
            currentUser.fullName ||
            currentUser.employeeName ||
            "",
          department:
            currentUser.designation ||
            currentUser.department ||
            currentUser.role ||
            currentUser.userRole ||
            "",
          profile:
            currentUser.profile ||
            currentUser.profile_url ||
            currentUser.profileImage ||
            "",
          email:
            currentUser.email ||
            currentUser.email_official ||
            currentUser.officeEmail ||
            "",
        };
      }
    }

    setAccessModal({
      visible: true,
      currentAccess: formData.accessGrantedTo || [],
      creator: isEditMode
        ? creatorObj || formData.creator
        : creatorObj || selectedProject?.creator || currentUser,
      showTransferSelection: false,
    });
  };

  const handleGrantAccess = (headObj) => {
    const id = headObj?.id || headObj?.employeeId || headObj?.userName;
    if (!id) {
      notify({ title: "Warning", message: "Invalid team head" });
      return;
    }

    const alreadyHasAccess = (formData.accessGrantedTo || []).some(
      (access) => String(access.employeeId) === String(id)
    );

    if (alreadyHasAccess) {
      notify({
        title: "Warning",
        message: "Access already granted to this admin",
      });
      return;
    }

    const entry = {
      employeeId: id,
      employeeName: headObj.name || headObj.employeeName || headObj.employee_name || "",
      profile: headObj.profile || headObj.profile_url || "",
      updatedAt: new Date().toISOString(),
    };

    setFormData((prev) => ({
      ...prev,
      accessGrantedTo: [...(prev.accessGrantedTo || []), entry],
    }));
  };

  const handleRevokeAccess = (employeeId) => {
    setFormData((prev) => ({
      ...prev,
      accessGrantedTo: (prev.accessGrantedTo || []).filter(
        (access) => String(access.employeeId) !== String(employeeId)
      ),
    }));
  };



  const handleTransferOwnership = async (newOwnerId) => {
    const confirmed = await confirm({
      type: "warning",
      title: "Transfer Ownership",
      message:
        "Are you sure you want to transfer ownership of this project? This action cannot be undone.",
      confirmText: "Yes, Transfer",
      cancelText: "Cancel",
    });

    if (!confirmed) return;

    const newOwner =
      projectOwners.find((p) => p.id === newOwnerId) ||
      teamHeads.find((head) => head.id === newOwnerId);

    if (!newOwner) {
      notify({
        title: "Error",
        message: "New owner not found",
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      employeeID: newOwnerId,
      creator: newOwner,
      accessGrantedTo: (prev.accessGrantedTo || []).filter(
        (access) => String(access.employeeId) !== String(newOwnerId)
      ),
      teamHead: prev.teamHead === prev.creator ? "" : prev.teamHead,
    }));

    setEmployeeID(newOwnerId);

    setProjectOwners((prev) =>
      prev.map((p) =>
        p.id === newOwnerId ? { ...p, isOwner: true } : { ...p, isOwner: false }
      )
    );
    setTeamHeads((prev) =>
      prev.map((head) =>
        head.id === newOwnerId ? { ...head, isOwner: true } : { ...head, isOwner: false }
      )
    );

    setAccessModal((prev) => ({
      ...prev,
      creator: newOwner,
      showTransferSelection: false,
    }));
  };

  const closeAccessModal = () => {
    setAccessModal({
      visible: false,
      currentAccess: [],
      creator: null,
      showTransferSelection: false,
    });
  };

  const handleSave = async () => {
  const requiredFields = [{ field: "priority", label: "Priority" }];

  for (let item of requiredFields) {
    const value = formData[item.field];
    const isEmpty = !value;
    if (isEmpty) {
      notify({ title: "Warning", message: `${item.label} is required` });
      return;
    }
  }

  setLoading(true);
  try {
    const url = isEditMode
      ? `${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}`
      : `${import.meta.env.VITE_API_BASE_URL}/projects`;

    const method = isEditMode ? "PUT" : "POST";

    const normalizedAccess = (formData.accessGrantedTo || [])
      .map((a) => ({
        employeeId: a.employeeId || a.employeeID || a.id || null,
        employeeName: a.employeeName || a.name || "",
        profile: a.profile || a.profilePath || a.profile_url || "",
        updatedAt:
          a.updatedAt || a.updated_at || a.grantedAt || new Date().toISOString(),
      }))
      .filter((a) => a.employeeId);

    const basePayload = {
      companyName: formData.companyName,
      employeeID: formData.employeeID || employeeID || null,
      employeeName: formData.employeeName,
      projectName: formData.projectName,
      priority: formData.priority,
      projectCategory: formData.projectCategory,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
      projectDescription: formData.projectDescription,
      accessGrantedTo: normalizedAccess,
    };

    // same payload for both add and edit (backend now handles partial update)
    const payload = basePayload;


    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      notify({
        title: "Success",
        message: isEditMode
          ? "Project updated successfully!"
          : "Project added successfully!",
      });
      navigate("/projects");
    } else {
      notify({
        title: "Error",
        message:
          `Error ${isEditMode ? "updating" : "adding"} project: ` +
          (data.message || "Unknown error"),
      });
    }
  } catch (err) {
    console.error("Save error:", err);
    notify({
      title: "Error",
      message: `Error ${isEditMode ? "updating" : "adding"} project`,
    });
  } finally {
    setLoading(false);
  }
};




  const allowedRoles = ["Admin", "SBU", "Project Head", "Super Admin"];
  const canShowManageAccess = () => {
    if (allowedRoles.includes(employeeRole)) return true;
    const creatorDesignation =
      formData.creator?.department ||
      formData.creator?.designation ||
      formData.creator?.role ||
      "";
    if (allowedRoles.includes(creatorDesignation)) return true;
    if (formData.employeeID && employeeID && String(formData.employeeID) === String(employeeID)) return true;
    return false;
  };

  const AccessManagementModal = () => {
    if (!accessModal.visible) return null;

    const currentUserId = employeeID;
    const currentOwnerId = accessModal.creator?.id || formData.employeeID;
const hasAccessIds = (formData.accessGrantedTo || []).map((a) =>
  String(a.employeeId || a.employeeID || a.id || "")
);

const currentUserIdStr = String(employeeID || "");

const currentOwnerIdStr = String(
  accessModal.creator?.employeeId ||
    accessModal.creator?.id ||
    formData.employeeID ||
    ""
);

const availableHeads = (teamHeads || []).filter((head) => {
  const headId = String(head.employeeId || head.id || "");
  if (!headId) return false;
  if (headId === currentUserIdStr) return false;
  if (headId === currentOwnerIdStr) return false;
  if (hasAccessIds.includes(headId)) return false;
  return true;
});

console.log("availableHeads after filter >>>", availableHeads);

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
              Add supporting person's
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
              <div className="flex justify-between items-center mb-[0.9vw]">
                <h3 className="text-[0.95vw] font-medium mb-[0.9vw]">Creator (You)</h3>

                {isEditMode && (
                  <button
                    onClick={() =>
                      setAccessModal((prev) => ({
                        ...prev,
                        showTransferSelection: !prev.showTransferSelection,
                      }))
                    }
                    className="px-[0.8vw] py-[0.2vw] bg-orange-100 text-orange-700 rounded-full text-[0.78vw] font-medium hover:bg-orange-200 transition-colors cursor-pointer"
                  >
                    {accessModal.showTransferSelection ? "Cancel Transfer" : "Transfer Ownership"}
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-[0.6vw] p-[0.7vw] bg-blue-50 rounded-lg">
                <div className="relative w-[2.2vw] h-[2.2vw] bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                  {accessModal.creator?.profile ? (
                    <>
                      <img
                        src={`${import.meta.env.VITE_API_BASE_URL1}${accessModal.creator.profile}`}
                        alt={accessModal.creator.name || accessModal.creator.employee_name || ""}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.classList.remove("hidden");
                        }}
                      />
                      <div className="hidden absolute inset-0 bg-blue-500 text-white rounded-full flex items-center justify-center font-medium text-[0.9vw]">
                        {accessModal.creator.name?.[0]?.toUpperCase() || "?"}
                      </div>
                    </>
                  ) : (
                    accessModal.creator?.name?.charAt(0)?.toUpperCase() || "U"
                  )}
                </div>
                <div>
                  <div className="font-medium">
                    {accessModal.creator?.name ||
                      accessModal.creator?.employee_name ||
                      accessModal.creator?.fullName ||
                      accessModal.creator?.employeeName ||
                      "Unknown"}
                  </div>
                  <div className="text-[0.75vw] text-gray-600">
                    {accessModal.creator?.department ||
                      accessModal.creator?.designation ||
                      accessModal.creator?.role ||
                      ""}
                  </div>
                </div>
                <span className="ml-auto px-[0.7vw] py-[0.2vw] bg-blue-100 text-blue-800 rounded-full text-[0.75vw] font-medium">
                  Owner
                </span>
              </div>
            </div>

            {accessModal.showTransferSelection && (
              <div className="mt-[0.5vw] p-[0.7vw] bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-[0.75vw] text-orange-800 mb-[0.5vw] font-medium">Select new owner:</p>
                <div className="space-y-2 max-h-[15vh] overflow-y-auto">
                  {projectOwners
                    .filter((owner) => String(owner.id) !== String(currentUserId) && !owner.isOwner)
                    .map((owner) => (
                      <div
                        key={owner.id}
                        className="flex items-center justify-between p-[0.5vw] bg-white rounded-lg hover:bg-orange-100 transition-colors cursor-pointer"
                        onClick={() => handleTransferOwnership(owner.id)}
                      >
                        <div className="flex items-center space-x-[0.6vw]">
                          <div className="relative w-[2vw] h-[2vw] bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                            {owner.profile ? (
                              <>
                                <img
                                  src={`${import.meta.env.VITE_API_BASE_URL1}${owner.profile}`}
                                  alt={owner.name}
                                  className="w-full h-full object-cover rounded-full"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.classList.remove("hidden");
                                  }}
                                />
                                <div className="hidden absolute inset-0 bg-blue-500 text-white rounded-full flex items-center justify-center font-medium text-[0.8vw]">
                                  {owner.name?.charAt(0)?.toUpperCase() || "?"}
                                </div>
                              </>
                            ) : (
                              owner.name?.charAt(0)?.toUpperCase() || "U"
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-[0.8vw]">{owner.name}</div>
                            <div className="text-[0.65vw] text-gray-600">{owner.department}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {formData.accessGrantedTo && formData.accessGrantedTo.length > 0 && (
              <div>
                <h3 className="text-[0.95vw] font-medium mb-[0.9vw]">Current Access ({formData.accessGrantedTo.length})</h3>
                <div className="space-y-2">
                  {formData.accessGrantedTo.map((access) => {
                    const employee = teamHeads.find((h) => String(h.id) === String(access.employeeId)) || teamHeads.find((h) => String(h.employeeId) === String(access.employeeId));
                    return (
                      <div key={access.employeeId} className="flex items-center justify-between p-[0.7vw] bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-[0.6vw]">
                          <div className="w-[2.2vw] h-[2.2vw] bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                            {employee?.profile ? (
                              <div className="relative w-full h-full">
                                <img
                                  src={`${import.meta.env.VITE_API_BASE_URL1}${employee.profile}`}
                                  alt={employee.name}
                                  className="w-full h-full object-cover rounded-full"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.style.display = "flex";
                                  }}
                                />
                                <div className="hidden absolute inset-0 bg-blue-500 text-white rounded-full flex items-center justify-center font-medium text-[0.9vw]">
                                  {employee?.name?.[0]?.toUpperCase() || "?"}
                                </div>
                              </div>
                            ) : (
                              (access.employeeName || employee?.name)?.charAt(0)?.toUpperCase() || "U"
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{access.employeeName || employee?.name}</div>
                            <div className="text-[0.7vw] text-gray-600">{employee?.department}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRevokeAccess(access.employeeId)}
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
              <h3 className="text-[0.95vw] font-medium mb-[0.9vw]">Grant Access to Team Head</h3>
              {teamHeads.filter(
                (head) => String(head.id) !== String(currentUserId) && !hasAccessIds.includes(head.id) && String(head.id) !== String(currentOwnerId)
              ).length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-[0.8vw]">No Team Head available for access</p>
              ) : (
                <div className="space-y-2">
                  {teamHeads
                    .filter((head) => String(head.id) !== String(currentUserId) && !hasAccessIds.includes(head.id) && String(head.id) !== String(currentOwnerId))
                    .map((head) => (
                      <div key={head.id} className="flex items-center justify-between p-[0.7vw] bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                        <div className="flex items-center space-x-[0.6vw]">
                          <div className="w-[2.2vw] h-[2.2vw] bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                            {head.profile ? (
                              <div className="relative w-full h-full">
                                <img
                                  src={`${import.meta.env.VITE_API_BASE_URL1}${head.profile}`}
                                  alt={head.name}
                                  className="w-full h-full object-cover rounded-full"
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
                            <div className="font-medium text-[0.85vw]">{head.name}</div>
                            <div className="text-[0.7vw] text-gray-600">{head.department}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleGrantAccess(head)}
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
          <p className="text-gray-600 text-[1vw]">Loading ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[92vh] w-full max-h-full overflow-hidden pb-[1vw]">
      <div className="text-[0.9vw] text-gray-500 ml-[0.3vw] max-h-[5%] h-[4.5%]">
        <span onClick={() => navigate("/projects")} className="cursor-pointer hover:text-[#3B82F6]">Projects</span>{" "}
        <span className="m-[0.3vw] h-[2vw] w-[1w]">{"/"}</span>
        <span className="text-[#3B82F6]">{isEditMode ? "Edit project" : "New project"}</span>
      </div>

      <div className="bg-white rounded-[1vw] border border-gray-200 overflow-y-hidden max-h-[95%] h-[95%]">
        <div className="flex justify-between items-center bg-blue-100 px-[1vw] py-[0.2vw] h-[6%]">
          <h2 className="text-[0.9vw] font-medium text-gray-800">Project details</h2>
        </div>

        <div className="h-[87%] max-h-[87%] overflow-y-auto px-[1vw] py-[0.8vw] pr-[15%]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[1vw] mb-[1vw]">
            <div>
              <label className="block text-[0.85vw] text-gray-700 mb-[0.5vw]">Company Name</label>
              {isEditMode ? (
                <div className="relative">
                  <input type="text" disabled value={formData.companyName} className="appearance-none w-full border border-gray-600 rounded-full px-[0.7vw] py-[0.3vw] text-[0.80vw] text-gray-700 focus:outline-none cursor-not-allowed" />
                </div>
              ) : (
                <div className="relative">
                  <select className="appearance-none w-full border border-gray-600 rounded-full px-[0.7vw] py-[0.3vw] text-[0.80vw] text-gray-700 focus:outline-none" value={formData.companyId || ""} onChange={(e) => handleCompanySelect(e.target.value)} disabled={isEditMode}>
                    <option value="" disabled>Company Name</option>
                    {projectsData.map((company) => (
                      <option key={company.id || company.companyId} value={company.id || company.companyId}>
                        {company.companyName || company.name}
                      </option>
                    ))}
                  </select>

                  <IoIosArrowDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-[0.85vw] text-gray-700 mb-[0.5vw]">Project Name</label>
              <div className="relative">
                <input type="text" placeholder="Project Name" value={formData.projectName || ''} onChange={(e) => handleInputChange("projectName", e.target.value)} className="w-full border border-gray-600 rounded-full px-[0.7vw] py-[0.3vw] text-[0.80vw] text-gray-700" />
              </div>
            </div>

            <div>
              <label className="block text-[0.85vw] text-gray-700 mb-[0.5vw]">Priority</label>
              <div className="relative">
                <select className="appearance-none w-full border border-gray-600 rounded-full px-[0.7vw] py-[0.3vw] text-[0.80vw] text-gray-700 focus:outline-none" value={formData.priority} onChange={(e) => handleInputChange("priority", e.target.value)}>
                  <option value="" disabled>Select Priority</option>
                  {["High", "Medium", "Low"].map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                </select>
                <IoIosArrowDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700" />
              </div>
            </div>

            <div>
              <label className="block text-[0.85vw] text-gray-700 mb-[0.5vw]">Project Category</label>
              <div className="relative">
                <input type="text" placeholder="Project Category" value={formData.projectCategory} onChange={(e) => handleInputChange("projectCategory", e.target.value)} className="w-full border border-gray-600 rounded-full px-[0.7vw] py-[0.3vw] text-[0.80vw] text-gray-700 " />
              </div>
            </div>

            <div>
              <label className="block text-[0.85vw] text-gray-700 mb-[0.5vw]">Start date</label>
              <div className="relative">
                <input type="date" value={formData.startDate} onChange={(e) => handleInputChange("startDate", e.target.value)} className="w-full border border-gray-600 rounded-full px-[0.7vw] py-[0.3vw] text-[0.80vw] text-gray-700" />
              </div>
            </div>

            <div>
              <label className="block text-[0.85vw] text-gray-700 mb-[0.5vw]">End date</label>
              <div className="relative">
                <input type="date" value={formData.endDate} onChange={(e) => handleInputChange("endDate", e.target.value)} className="w-full border border-gray-600 rounded-full px-[0.7vw] py-[0.3vw] text-[0.80vw] text-gray-700 " />
              </div>
            </div>

            {(canShowManageAccess()) && (
              <div>
                <label className="block text-[0.85vw] text-gray-700 mb-[0.5vw]">Supporting Person's ( optional )</label>
                <button onClick={handleAccessManagement} className="flex items-center gap-[0.8vw] px-[1.2vw] py-[0.3vw] text-[0.80vw] text-gray-700 bg-white border border-gray-600 rounded-full  hover:bg-gray-50 cursor-pointer" title="Manage Access">
                  <span>Add supporting person's</span>
                  {formData.accessGrantedTo && formData.accessGrantedTo.length > 0 && (
                    <span className="bg-blue-600 text-white text-[0.6vw] rounded-full min-w-[1vw] h-[1vw] flex items-center justify-center px-[0.15vw]">{formData.accessGrantedTo.length}</span>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="mb-[1vw]">
            <label className="block text-[0.85vw] text-gray-700 mb-[0.5vw]">Project Description</label>
            <textarea rows={4} className="w-full border border-gray-600 rounded-xl px-[0.7vw] py-[0.6vw] text-[0.8vw] text-gray-700 " placeholder="Project Description" value={formData.projectDescription} onChange={(e) => handleInputChange("projectDescription", e.target.value)} />
          </div>
        </div>

        <div className="flex items-center justify-end pr-[1vw] h-[7%] pb-[0.5vw] gap-[1vw]">
          <button className="bg-gray-400 hover:bg-gray-500 text-white px-[1.3vw] py-[0.3vw] rounded-full text-[0.8vw] cursor-pointer" onClick={() => navigate("/projects")}>Cancel</button>
          <button className="bg-[#1B63FF] hover:bg-blue-700 text-white px-[1.6vw] py-[0.3vw] rounded-full text-[0.8vw] cursor-pointer" onClick={handleSave}>{isEditMode ? "Update" : "Save"}</button>
        </div>
      </div>

      {showColorPopup && (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-[0.1px] flex items-center justify-center z-50">
          <div ref={colorPopupContentRef} className="bg-white rounded-xl shadow-xl w-[35vw] p-[1vw]">
            <div className="sticky top-0 flex justify-between items-center border-b pb-[0.5vw] mb-[0.9vw] bg-white z-10">
              <h2 className="text-[1vw] font-medium text-gray-800">Existing Project Color Codes</h2>
              <button onClick={() => setShowColorPopup(false)} className="text-gray-500 hover:text-red-500 text-[1.2vw] font-bold cursor-pointer">✕</button>
            </div>

            {projectsData && projectsData.length > 0 ? (
              <ul className="space-y-[0.6vw] max-h-[60vh] overflow-y-auto">
                {colorCodes.length > 0 ? (
                  <ul className="space-y-[0.6vw]">
                    {colorCodes.map((project, idx) => (
                      <li key={idx} className="flex items-center justify-between border border-gray-200 rounded-lg p-[0.6vw]">
                        <span className="text-[0.85vw] text-gray-700 font-medium">{project.projectName}</span>
                        <div className="flex items-center gap-[1vw] w-[32%] justify-center">
                          <span className="w-[3vw] h-[1.1vw] rounded-xl" style={{ backgroundColor: project.colorCode || "#ccc" }}></span>
                          <span className="text-[0.8vw] text-gray-600">{project.colorCode || "N/A"}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-[0.8vw]">No projects found.</p>
                )}
              </ul>
            ) : (
              <p className="text-gray-500 text-[0.8vw]">No projects found.</p>
            )}
          </div>
        </div>
      )}

      {previewFile && <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}

      <AccessManagementModal />
    </div>
  );
}

const EyeIcon = () => (
  <svg className="w-[1.2vw] h-[1.2vw] text-gray-600 cursor-pointer" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);


