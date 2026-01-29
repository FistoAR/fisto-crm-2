import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useNotification } from "../../NotificationContext";

const AddTask = ({
  isOpen,
  onClose,
  editingTask = null,
  projectData = null,
}) => {
  const { notify } = useNotification();
  const [submitting, setSubmitting] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [teamHead, setTeamHead] = useState(null);
  const [loadingTeamHead, setLoadingTeamHead] = useState(false);

  const [taskFormData, setTaskFormData] = useState({
    taskName: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    assignedTo: null,
    description: "",
  });

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  // ✅ Get logged-in user info
  const getEmployeeInfo = () => {
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    return {
      employeeId: userData.userName || "UNKNOWN",
      employeeName: userData.employeeName || "Unknown User",
    };
  };

  // ✅ Fetch team head when assigned employee changes
  const fetchTeamHead = async (designation) => {
    if (!designation) {
      setTeamHead(null);
      return;
    }

    setLoadingTeamHead(true);
    try {
      const response = await fetch(
        `${API_URL}/projects/team-head/${encodeURIComponent(designation)}`
      );
      const data = await response.json();

      if (data.success && data.data) {
        setTeamHead(data.data);
      } else {
        setTeamHead(null);
      }
    } catch (error) {
      console.error("Error fetching team head:", error);
      setTeamHead(null);
    } finally {
      setLoadingTeamHead(false);
    }
  };

  // Pre-fill form if editing
  useEffect(() => {
    if (editingTask) {
      setTaskFormData({
        taskName: editingTask.taskName || "",
        startDate: editingTask.startDate || "",
        endDate: editingTask.endDate || "",
        startTime: editingTask.startTime || "",
        endTime: editingTask.endTime || "",
        assignedTo: editingTask.assignedTo || null,
        description: editingTask.description || "",
      });

      // Fetch team head for editing task
      if (editingTask.assignedTo) {
        const employee = selectedProject?.all_employees?.find(
          (emp) => emp.id === editingTask.assignedTo.employeeId
        );
        if (employee) {
          fetchTeamHead(employee.designation);
        }
      }

      // Fetch project details for editing
      if (editingTask.project_id) {
        fetchProjectById(editingTask.project_id);
      }
    } else if (projectData) {
      setSelectedProject(projectData);
    }
  }, [editingTask, projectData]);

  const fetchProjectById = async (projectId) => {
    try {
      const response = await fetch(`${API_URL}/projects`);
      const data = await response.json();
      if (data.success) {
        const project = data.data.find((p) => p.id === projectId);
        if (project) {
          setSelectedProject(project);
        }
      }
    } catch (error) {
      console.error("Error fetching project:", error);
    }
  };

  const handleTaskInputChange = (e) => {
    const { name, value } = e.target;
    setTaskFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAssignedToChange = (employee) => {
    setTaskFormData((prev) => ({
      ...prev,
      assignedTo: {
        employeeId: employee.id,
        employeeName: employee.name,
      },
    }));

    // ✅ Fetch team head when employee is selected
    fetchTeamHead(employee.designation);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingTask) {
        // UPDATE existing task
        const response = await fetch(
          `${API_URL}/employee-tasks/tasks/${editingTask.project_id}/${editingTask.taskId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(taskFormData),
          }
        );

        const data = await response.json();

        if (data.success) {
          notify({
            title: "Success",
            message: "Task updated successfully!",
          });
          onClose();
        } else {
          notify({
            title: "Error",
            message: data.error || "Failed to update task",
          });
        }
      } else {
        // ✅ CREATE new task - add createdBy field
        const creatorInfo = getEmployeeInfo();

        const response = await fetch(
          `${API_URL}/projects/${selectedProject.id}/tasks`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...taskFormData,
              createdBy: creatorInfo,
            }),
          }
        );

        const data = await response.json();

        if (data.success) {
          notify({
            title: "Success",
            message: "Task added successfully!",
          });
          onClose();
        } else {
          notify({
            title: "Error",
            message: data.error || "Failed to add task",
          });
        }
      }
    } catch (error) {
      console.error("Error saving task:", error);
      notify({
        title: "Error",
        message: "Failed to save task",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !selectedProject) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-[50vw] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-[1vw] border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-[1.1vw] font-semibold text-gray-800">
              {editingTask ? "Edit Task" : "Add Task"}
            </h2>
            <p className="text-[0.8vw] text-gray-500 mt-[0.2vw]">
              {selectedProject.company_name} - {selectedProject.project_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-[0.3vw] hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={"1.2vw"} className="text-gray-500" />
          </button>
        </div>

        {/* Modal Body */}
        <form
          onSubmit={handleTaskSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="p-[1vw] overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-[1vw]">
              {/* Task Name */}
              <div className="col-span-2">
                <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.3vw]">
                  Task Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="taskName"
                  value={taskFormData.taskName}
                  onChange={handleTaskInputChange}
                  required
                  className="w-full px-[0.6vw] py-[0.4vw] text-[0.85vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter task name"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.3vw]">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={taskFormData.startDate}
                  onChange={handleTaskInputChange}
                  min={selectedProject.start_date}
                  max={selectedProject.end_date}
                  required
                  className="w-full px-[0.6vw] py-[0.4vw] text-[0.85vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.3vw]">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={taskFormData.endDate}
                  onChange={handleTaskInputChange}
                  min={taskFormData.startDate || selectedProject.start_date}
                  max={selectedProject.end_date}
                  className="w-full px-[0.6vw] py-[0.4vw] text-[0.85vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.3vw]">
                  Start Time
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={taskFormData.startTime}
                  onChange={handleTaskInputChange}
                  className="w-full px-[0.6vw] py-[0.4vw] text-[0.85vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* End Time */}
              <div>
                <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.3vw]">
                  End Time
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={taskFormData.endTime}
                  onChange={handleTaskInputChange}
                  className="w-full px-[0.6vw] py-[0.4vw] text-[0.85vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* ✅ Team Head - NEW FIELD */}
              <div className="col-span-2">
                <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.3vw]">
                  Team Head
                </label>
                <div className="w-full px-[0.6vw] py-[0.4vw] text-[0.85vw] border border-gray-300 rounded-lg bg-gray-50">
                  {loadingTeamHead ? (
                    <span className="text-gray-400">Loading...</span>
                  ) : teamHead ? (
                    <span className="text-gray-900">{teamHead.name}</span>
                  ) : (
                    <span className="text-gray-400">
                      {taskFormData.assignedTo
                        ? "No team head assigned"
                        : "Select an employee first"}
                    </span>
                  )}
                </div>
              </div>

              {/* Assigned To */}
              <div className="col-span-2">
                <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.3vw]">
                  Assigned To <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={taskFormData.assignedTo?.employeeId || ""}
                  onChange={(e) => {
                    const selectedEmp = selectedProject.all_employees.find(
                      (emp) => emp.id === e.target.value
                    );
                    if (selectedEmp) {
                      handleAssignedToChange(selectedEmp);
                    }
                  }}
                  className="w-full px-[0.6vw] py-[0.4vw] text-[0.85vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select team member</option>
                  {selectedProject.all_employees?.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} - {emp.designation}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="col-span-2">
                <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.3vw]">
                  Description
                </label>
                <textarea
                  name="description"
                  value={taskFormData.description}
                  onChange={handleTaskInputChange}
                  rows="4"
                  className="w-full px-[0.6vw] py-[0.4vw] text-[0.85vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Enter task description"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-[0.5vw] px-[1vw] py-[1vw] border-t border-gray-200 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
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
                  <span>{editingTask ? "Updating..." : "Adding..."}</span>
                </>
              ) : (
                <span>{editingTask ? "Update Task" : "Add Task"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTask;
