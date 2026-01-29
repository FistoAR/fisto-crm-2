import React, { useState, useEffect } from "react";
import { CheckCircle, Loader2, X } from "lucide-react";
import Notification from "../ToastProp";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const EmployeeRequest = () => {
  const [mainTab, setMainTab] = useState("applyLeave");

  const [formData, setFormData] = useState({
    leaveType: "",
    customLeaveType: "",
    fromDate: "",
    toDate: "",
    numberOfDays: "",
    reasonForLeave: "",
    permissionDate: "",
    fromTime: "",
    toTime: "",
    permissionDuration: "",
    reasonPermission: "",
    meetingDetails: "",
    meetingDate: "",
    meetingFromTime: "",
    meetingToTime: "",
    meetingDuration: "",
    attendees: [],
    meetingDescription: "",
    leaveDurationType: "full",
  });

  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Fetch employees from database
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/employee-requests/employees`,
        );
        const data = await response.json();
        if (data.success) {
          setEmployees(data.employees);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  // Auto-calculate number of days
  useEffect(() => {
    if (formData.fromDate) {
      let days = "1";
      if (formData.leaveDurationType === "full" && formData.toDate) {
        const from = new Date(formData.fromDate);
        const to = new Date(formData.toDate);
        const diffTime = to - from;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        days = diffDays > 0 ? diffDays.toString() : "1";
      } else if (formData.leaveDurationType !== "full") {
        days = "0.5";
      }
      setFormData((prev) => ({ ...prev, numberOfDays: days }));
    }
  }, [formData.fromDate, formData.toDate, formData.leaveDurationType]);

  // Time duration calculations
  useEffect(() => {
    if (
      mainTab === "requestPermission" &&
      formData.fromTime &&
      formData.toTime
    ) {
      const from = new Date(`2000-01-01T${formData.fromTime}`);
      const to = new Date(`2000-01-01T${formData.toTime}`);
      const duration = (to - from) / (1000 * 60);
      setFormData((prev) => ({
        ...prev,
        permissionDuration: duration.toFixed(1),
      }));
    } else if (
      mainTab === "scheduleMeeting" &&
      formData.meetingFromTime &&
      formData.meetingToTime
    ) {
      const from = new Date(`2000-01-01T${formData.meetingFromTime}`);
      const to = new Date(`2000-01-01T${formData.meetingToTime}`);
      const duration = (to - from) / (1000 * 60);
      setFormData((prev) => ({
        ...prev,
        meetingDuration: duration.toFixed(0),
      }));
    }
  }, [
    formData.fromTime,
    formData.toTime,
    formData.meetingFromTime,
    formData.meetingToTime,
    mainTab,
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLeaveTypeChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      leaveType: value,
      customLeaveType: value === "Other" ? "" : prev.customLeaveType,
    }));
  };

  const toggleAttendee = (employee) => {
    setFormData((prev) => {
      const exists = prev.attendees.find(
        (a) => a.employee_id === employee.employee_id,
      );
      if (exists) {
        return {
          ...prev,
          attendees: prev.attendees.filter(
            (a) => a.employee_id !== employee.employee_id,
          ),
        };
      } else {
        return {
          ...prev,
          attendees: [
            ...prev.attendees,
            {
              employee_id: employee.employee_id,
              employee_name: employee.employee_name,
            },
          ],
        };
      }
    });
  };

  const removeAttendee = (employee_id) => {
    setFormData((prev) => ({
      ...prev,
      attendees: prev.attendees.filter((a) => a.employee_id !== employee_id),
    }));
  };

  const clearForm = () => {
    setFormData({
      leaveType: "",
      customLeaveType: "",
      fromDate: "",
      toDate: "",
      numberOfDays: "",
      reasonForLeave: "",
      permissionDate: "",
      fromTime: "",
      toTime: "",
      permissionDuration: "",
      reasonPermission: "",
      meetingDetails: "",
      meetingDate: "",
      meetingFromTime: "",
      meetingToTime: "",
      meetingDuration: "",
      attendees: [],
      meetingDescription: "",
      leaveDurationType: "full",
    });
  };

  const showToast = (title, message) => {
    setToast({ title, message });
    setTimeout(() => setToast(null), 5000);
  };

  const handleSubmit = async () => {
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");

    try {
      setIsSubmitting(true);

      // APPLY LEAVE
      if (mainTab === "applyLeave") {
        const leaveTypeValue =
          formData.leaveType === "Other"
            ? formData.customLeaveType
            : formData.leaveType;

        if (
          !leaveTypeValue ||
          !formData.fromDate ||
          !formData.leaveDurationType ||
          !formData.reasonForLeave.trim()
        ) {
          showToast("Error", "Please fill all required fields");
          setIsSubmitting(false);
          return;
        }

        // For full day multi-day leaves, require toDate
        if (
          formData.leaveDurationType === "full" &&
          parseFloat(formData.numberOfDays) > 1 &&
          !formData.toDate
        ) {
          showToast(
            "Error",
            "Please select To Date for multiple full days leave",
          );
          setIsSubmitting(false);
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/employee-requests/leave-requests`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-data": JSON.stringify(userData),
            },
            body: JSON.stringify({
              leave_type: leaveTypeValue,
              from_date: formData.fromDate,
              to_date: formData.toDate || null,
              number_of_days: parseFloat(formData.numberOfDays), // Changed: parseFloat for 0.5 support
              duration_type: formData.leaveDurationType, // NEW: Send duration type (full/morning/afternoon)
              reason: formData.reasonForLeave.trim(),
            }),
          },
        );

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          showToast("Error", "Server returned an invalid response");
          setIsSubmitting(false);
          return;
        }

        const result = await response.json();
        if (result.success) {
          showToast("Success", "Leave request submitted successfully!");
          clearForm();
        } else {
          showToast("Error", result.error || "Failed to submit leave request");
        }
      }

      // REQUEST PERMISSION
      if (mainTab === "requestPermission") {
        if (
          !formData.permissionDate ||
          !formData.fromTime ||
          !formData.toTime ||
          !formData.reasonPermission.trim()
        ) {
          showToast("Error", "Please fill all required fields");
          setIsSubmitting(false);
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/employee-requests/permission-requests`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-data": JSON.stringify(userData),
            },
            body: JSON.stringify({
              permission_date: formData.permissionDate,
              from_time: formData.fromTime,
              to_time: formData.toTime,
              duration_minutes: parseFloat(formData.permissionDuration),
              reason: formData.reasonPermission.trim(),
            }),
          },
        );

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          showToast("Error", "Server returned an invalid response");
          setIsSubmitting(false);
          return;
        }

        const result = await response.json();
        if (result.success) {
          showToast("Success", "Permission request submitted successfully!");
          clearForm();
        } else {
          showToast(
            "Error",
            result.error || "Failed to submit permission request",
          );
        }
      }

      // SCHEDULE MEETING
      if (mainTab === "scheduleMeeting") {
        if (
          !formData.meetingDetails ||
          !formData.meetingDate ||
          !formData.meetingFromTime ||
          !formData.meetingToTime ||
          formData.attendees.length === 0
        ) {
          showToast(
            "Error",
            "Please fill all required fields and select at least one attendee",
          );
          setIsSubmitting(false);
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/employee-requests/meeting-requests`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-data": JSON.stringify(userData),
            },
            body: JSON.stringify({
              meeting_title: formData.meetingDetails,
              meeting_date: formData.meetingDate,
              from_time: formData.meetingFromTime,
              to_time: formData.meetingToTime,
              duration_minutes: parseFloat(formData.meetingDuration),
              attendees: formData.attendees,
              description: formData.meetingDescription || null,
            }),
          },
        );

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          showToast("Error", "Server returned an invalid response");
          setIsSubmitting(false);
          return;
        }

        const result = await response.json();
        if (result.success) {
          showToast("Success", "Meeting scheduled successfully!");
          clearForm();
        } else {
          showToast("Error", result.error || "Failed to schedule meeting");
        }
      }
    } catch (error) {
      console.error("Submit error:", error);
      showToast("Error", `Network error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderForm = () => {
    switch (mainTab) {
      case "applyLeave":
        return (
          <div className="grid grid-cols-2 gap-[1vw]">
            <div className="flex flex-col">
              <label className="text-[0.8vw] font-semibold text-gray-700 mb-[0.3vw]">
                Leave Type <span className="text-red-500">*</span>
              </label>
              {formData.leaveType === "Other" ? (
                <div className="flex gap-[0.5vw]">
                  <input
                    type="text"
                    name="customLeaveType"
                    value={formData.customLeaveType}
                    onChange={handleInputChange}
                    placeholder="Enter leave type..."
                    className="flex-1 px-[0.7vw] py-[0.5vw] text-[0.85vw] border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        leaveType: "",
                        customLeaveType: "",
                      }))
                    }
                    className="px-[0.6vw] py-[0.5vw] text-[0.8vw] bg-gray-200 hover:bg-gray-300 rounded-lg transition-all"
                  >
                    <X size="0.9vw" />
                  </button>
                </div>
              ) : (
                <select
                  name="leaveType"
                  value={formData.leaveType}
                  onChange={handleLeaveTypeChange}
                  className="px-[0.7vw] py-[0.5vw] text-[0.85vw] border border-gray-300 rounded-lg outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="">Select Leave Type</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Annual Leave">Annual Leave</option>
                  <option value="Maternity Leave">Maternity Leave</option>
                  <option value="Paternity Leave">Paternity Leave</option>
                  <option value="Other">Other</option>
                </select>
              )}
            </div>

            <div className="flex flex-col">
              <label className="text-[0.8vw] font-semibold text-gray-700 mb-[0.3vw]">
                From Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="fromDate"
                value={formData.fromDate}
                onChange={handleInputChange}
                className="px-[0.7vw] py-[0.5vw] text-[0.85vw] border border-gray-300 rounded-lg outline-none focus:border-blue-500"
              />
            </div>

            {/* Duration Type - NEW */}
            <div className="flex flex-col">
              <div className="col-span-2 flex flex-col mb-[0.5vw]">
                <label className="text-[0.8vw] font-semibold text-gray-700 mb-[0.3vw]">
                  Leave Duration <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-[1vw]">
                  <label className="flex items-center gap-[0.3vw] cursor-pointer">
                    <input
                      type="radio"
                      name="leaveDurationType"
                      value="full"
                      checked={formData.leaveDurationType === "full"}
                      onChange={handleInputChange}
                      className="w-[1vw] h-[1vw]"
                    />
                    <span className="text-[0.85vw]">Full Day(s)</span>
                  </label>
                  <label className="flex items-center gap-[0.3vw] cursor-pointer">
                    <input
                      type="radio"
                      name="leaveDurationType"
                      value="morning"
                      checked={formData.leaveDurationType === "morning"}
                      onChange={handleInputChange}
                      className="w-[1vw] h-[1vw]"
                    />
                    <span className="text-[0.85vw]">
                      Morning Half (0.5 day)
                    </span>
                  </label>
                  <label className="flex items-center gap-[0.3vw] cursor-pointer">
                    <input
                      type="radio"
                      name="leaveDurationType"
                      value="afternoon"
                      checked={formData.leaveDurationType === "afternoon"}
                      onChange={handleInputChange}
                      className="w-[1vw] h-[1vw]"
                    />
                    <span className="text-[0.85vw]">
                      Afternoon Half (0.5 day)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-[0.8vw] font-semibold text-gray-700 mb-[0.3vw]">
                To Date{" "}
                <span className="text-gray-400 text-[0.7vw]">
                  (Optional for single day)
                </span>
              </label>
              <input
                type="date"
                name="toDate"
                value={formData.toDate}
                onChange={handleInputChange}
                min={formData.fromDate}
                disabled={!formData.fromDate}
                className="px-[0.7vw] py-[0.5vw] text-[0.85vw] border border-gray-300 rounded-lg outline-none focus:border-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[0.8vw] font-semibold text-gray-700 mb-[0.3vw]">
                Number of Days
              </label>
              <input
                type="text"
                value={
                  formData.numberOfDays
                    ? `${formData.numberOfDays} ${parseInt(formData.numberOfDays) === 1 ? "day" : "days"}`
                    : ""
                }
                readOnly
                className="px-[0.7vw] py-[0.5vw] text-[0.85vw] border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>

            <div className="col-span-2 flex flex-col">
              <label className="text-[0.8vw] font-semibold text-gray-700 mb-[0.3vw]">
                Reason for Leave <span className="text-red-500">*</span>
              </label>
              <textarea
                name="reasonForLeave"
                value={formData.reasonForLeave}
                onChange={handleInputChange}
                rows="4"
                className="px-[0.7vw] py-[0.5vw] text-[0.85vw] border border-gray-300 rounded-lg outline-none focus:border-blue-500 resize-none"
                placeholder="Enter reason for leave..."
              />
            </div>
          </div>
        );

      case "requestPermission":
        return (
          <div className="grid grid-cols-2 gap-[1vw]">
            <div className="flex flex-col">
              <label className="text-[0.8vw] font-semibold text-gray-700 mb-[0.3vw]">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="permissionDate"
                value={formData.permissionDate}
                onChange={handleInputChange}
                className="px-[0.7vw] py-[0.5vw] text-[0.85vw] border border-gray-300 rounded-lg outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[0.8vw] font-semibold text-gray-700 mb-[0.3vw]">
                From Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="fromTime"
                value={formData.fromTime}
                onChange={handleInputChange}
                className="px-[0.7vw] py-[0.5vw] text-[0.85vw] border border-gray-300 rounded-lg outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[0.8vw] font-semibold text-gray-700 mb-[0.3vw]">
                To Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="toTime"
                value={formData.toTime}
                onChange={handleInputChange}
                className="px-[0.7vw] py-[0.5vw] text-[0.85vw] border border-gray-300 rounded-lg outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[0.8vw] font-semibold text-gray-700 mb-[0.3vw]">
                Permission Duration
              </label>
              <input
                type="text"
                value={
                  formData.permissionDuration
                    ? `${formData.permissionDuration} mins`
                    : ""
                }
                readOnly
                className="px-[0.7vw] py-[0.5vw] text-[0.85vw] border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
            <div className="col-span-2 flex flex-col">
              <label className="text-[0.8vw] font-semibold text-gray-700 mb-[0.3vw]">
                Reason for Permission <span className="text-red-500">*</span>
              </label>
              <textarea
                name="reasonPermission"
                value={formData.reasonPermission}
                onChange={handleInputChange}
                rows="4"
                className="px-[0.7vw] py-[0.5vw] text-[0.85vw] border border-gray-300 rounded-lg outline-none focus:border-blue-500 resize-none"
                placeholder="Enter reason for permission..."
              />
            </div>
          </div>
        );

      case "scheduleMeeting":
        return (
          <div className="space-y-[1vw]">
            <div className="flex flex-col">
              <label className="text-[0.8vw] font-semibold text-gray-700 mb-[0.3vw]">
                Meeting Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="meetingDetails"
                value={formData.meetingDetails}
                onChange={handleInputChange}
                className="px-[0.7vw] py-[0.5vw] text-[0.85vw] border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                placeholder="Enter meeting title..."
              />
            </div>

            <div className="grid grid-cols-2 gap-[1vw]">
              <div className="flex flex-col">
                <label className="text-[0.8vw] font-semibold text-gray-700 mb-[0.3vw]">
                  Meeting Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="meetingDate"
                  value={formData.meetingDate}
                  onChange={handleInputChange}
                  className="px-[0.7vw] py-[0.5vw] text-[0.85vw] border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-[0.8vw] font-semibold text-gray-700 mb-[0.3vw]">
                  Duration
                </label>
                <input
                  type="text"
                  value={
                    formData.meetingDuration
                      ? `${formData.meetingDuration} mins`
                      : ""
                  }
                  readOnly
                  className="px-[0.7vw] py-[0.5vw] text-[0.85vw] border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-[1vw]">
              <div className="flex flex-col">
                <label className="text-[0.8vw] font-semibold text-gray-700 mb-[0.3vw]">
                  From Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="meetingFromTime"
                  value={formData.meetingFromTime}
                  onChange={handleInputChange}
                  className="px-[0.7vw] py-[0.5vw] text-[0.85vw] border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-[0.8vw] font-semibold text-gray-700 mb-[0.3vw]">
                  To Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="meetingToTime"
                  value={formData.meetingToTime}
                  onChange={handleInputChange}
                  className="px-[0.7vw] py-[0.5vw] text-[0.85vw] border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Attendees from Database */}
            <div className="flex flex-col">
              <label className="text-[0.8vw] font-semibold text-gray-700 mb-[0.3vw]">
                Attendees <span className="text-red-500">*</span>
              </label>

              <select
                onChange={(e) => {
                  const selectedId = e.target.value;
                  if (selectedId) {
                    const selectedEmployee = employees.find(
                      (emp) => emp.employee_id === selectedId,
                    );
                    if (
                      selectedEmployee &&
                      !formData.attendees.find(
                        (a) => a.employee_id === selectedId,
                      )
                    ) {
                      toggleAttendee(selectedEmployee);
                    }
                  }
                  e.target.value = "";
                }}
                disabled={loadingEmployees}
                className="px-[0.7vw] py-[0.5vw] text-[0.85vw] border border-gray-300 rounded-lg outline-none focus:border-blue-500 cursor-pointer disabled:bg-gray-100"
              >
                <option value="">
                  {loadingEmployees
                    ? "Loading employees..."
                    : "Select Employee"}
                </option>
                {employees
                  .filter(
                    (emp) =>
                      !formData.attendees.find(
                        (a) => a.employee_id === emp.employee_id,
                      ),
                  )
                  .map((emp) => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.employee_name} ({emp.employee_id})
                    </option>
                  ))}
              </select>

              {formData.attendees.length > 0 && (
                <div className="mt-[0.5vw] p-[0.5vw] border border-blue-200 rounded-lg bg-blue-50 max-h-[8vw] overflow-y-auto">
                  <div className="flex flex-wrap gap-[0.4vw]">
                    {formData.attendees.map((attendee) => (
                      <div
                        key={attendee.employee_id}
                        className="flex items-center gap-[0.3vw] bg-white border border-blue-200 rounded-lg px-[0.5vw] py-[0.25vw] text-[0.8vw] shadow-sm"
                      >
                        <span className="text-gray-700 font-medium">
                          {attendee.employee_name}
                        </span>
                        <span className="text-gray-400 text-[0.7vw]">
                          ({attendee.employee_id})
                        </span>
                        <button
                          onClick={() => removeAttendee(attendee.employee_id)}
                          className="ml-[0.2vw] text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full p-[0.15vw] transition-all"
                        >
                          <X size="0.8vw" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-[0.3vw] text-[0.75vw] text-blue-600 font-medium">
                {formData.attendees.length}{" "}
                {formData.attendees.length === 1 ? "employee" : "employees"}{" "}
                selected
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-[0.8vw] font-semibold text-gray-700 mb-[0.3vw]">
                Meeting Description
              </label>
              <textarea
                name="meetingDescription"
                value={formData.meetingDescription}
                onChange={handleInputChange}
                rows="4"
                className="px-[0.7vw] py-[0.5vw] text-[0.85vw] border border-gray-300 rounded-lg outline-none focus:border-blue-500 resize-none"
                placeholder="Enter meeting description..."
              />
            </div>
          </div>
        );

      default:
        return null;
    }
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
        {/* TOP TABS */}
        <div className="bg-white flex justify-between overflow-hidden rounded-xl shadow-sm h-[6%] flex-shrink-0">
          <div className="flex border-b border-gray-200 h-full w-full">
            <button
              onClick={() => {
                setMainTab("applyLeave");
                clearForm();
              }}
              className={`px-[1.5vw] cursor-pointer font-medium text-[0.9vw] transition-colors ${mainTab === "applyLeave" ? "border-b-2 border-black text-black" : "text-gray-600 hover:text-gray-900"}`}
            >
              Apply Leave
            </button>
            <button
              onClick={() => {
                setMainTab("requestPermission");
                clearForm();
              }}
              className={`px-[1.5vw] cursor-pointer font-medium text-[0.9vw] transition-colors ${mainTab === "requestPermission" ? "border-b-2 border-black text-black" : "text-gray-600 hover:text-gray-900"}`}
            >
              Request Permission
            </button>
            <button
              onClick={() => {
                setMainTab("scheduleMeeting");
                clearForm();
              }}
              className={`px-[1.5vw] cursor-pointer font-medium text-[0.9vw] transition-colors ${mainTab === "scheduleMeeting" ? "border-b-2 border-black text-black" : "text-gray-600 hover:text-gray-900"}`}
            >
              Schedule Meeting
            </button>
          </div>
        </div>

        {/* Main Form Container */}
        <div className="bg-white rounded-xl shadow-sm h-[93%] flex flex-col overflow-hidden">
          <div className="flex items-center gap-[0.5vw] p-[1vw] border-b border-gray-200">
            <h2 className="text-[1vw] font-semibold text-gray-800">
              New {mainTab.replace(/([A-Z])/g, " $1").trim()} Request
            </h2>
          </div>

          <div className="flex-1 overflow-auto p-[1.2vw]">{renderForm()}</div>

          <div className="p-[1vw] border-t border-gray-200 bg-gray-50">
            <div className="flex gap-[0.8vw]">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-[1.2vw] py-[0.6vw] text-[0.85vw] font-medium rounded-full transition-all flex items-center gap-[0.4vw] ${isSubmitting ? "bg-gray-400 text-white cursor-not-allowed" : "bg-black text-white hover:bg-gray-800 cursor-pointer"}`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-[1vw] h-[1vw] animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle size="1vw" />
                    Submit Request
                  </>
                )}
              </button>
              <button
                onClick={clearForm}
                disabled={isSubmitting}
                className="px-[1.2vw] py-[0.6vw] text-[0.85vw] font-medium rounded-full border border-gray-300 bg-white hover:bg-gray-100 transition-all cursor-pointer"
              >
                Clear Form
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeRequest;
