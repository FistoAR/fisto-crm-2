import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import CreateTask from "./AddTask";
import Timeline from "./Timeline";
import EmployeeModal from "./AddEmployeeModal";
import EmplyeeReportsTable from "./EmplyeeReportsTable";
import AdminReportsTable from "./AdminReportsTable";
import assEmp from "../../assets/ProjectPages/overview/assEmp.webp";
import totalTask from "../../assets/ProjectPages/overview/totalTask.webp";
import completed from "../../assets/ProjectPages/overview/completed.webp";
import onGoing from "../../assets/ProjectPages/overview/onGoing.webp";
import delayed from "../../assets/ProjectPages/overview/delayed.webp";
import overdue from "../../assets/ProjectPages/overview/overdue.webp";
import crown from "../../assets/ProjectPages/overview/crown.svg";
import addEmp from "../../assets/ProjectPages/overview/addEmp.svg";

export default function Overview() {
  const location = useLocation();

  const [role, setRole] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showYours, setShowYours] = useState(true);
  const [activeTab, setactiveTab] = useState("Both");

  const [tableShow, setTableShow] = useState("timeline");
  const { projectId, projectName } = location.state || {};
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [allEmployees, setAllEmployees] = useState([]);

  const [stats, setStats] = useState({
    totalTasks: 0,
    totalActivities: 0,
    completed: 0,
    completedActivities: 0,
    ongoing: 0,
    ongoingActivities: 0,
    delayed: 0,
    delayedActivities: 0,
    overdue: 0,
    overdueActivities: 0,
  });

  const handleShow = (view) => {
    setTableShow(view);
  };
  const [showCreateTask, setShowCreateTask] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-GB");
    } catch {
      return dateString;
    }
  };

  useEffect(() => {
    const fetchAllEmployees = async () => {
      try {
        const base = import.meta.env.VITE_API_BASE_URL;
        if (!base) {
          console.warn("No API base URL");
          return;
        }

        const response = await fetch(`${base}/Projects/getAllEmployees`);

        if (!response.ok) {
          console.error("Failed to fetch employees");
          return;
        }

        const data = await response.json();

        if (data.success && data.employees) {
          // Format employees to match modal's expected format
          const formattedEmployees = data.employees.map((emp) => ({
            id: emp.id || emp.employee_id,
            name: emp.employee_name,
            profile: emp.profile_url,
            designation: emp.designation,
            email: emp.email_official,
          }));

          console.log("All employees fetched:", formattedEmployees);
          setAllEmployees(formattedEmployees);
        }
      } catch (error) {
        console.error("Error fetching all employees:", error);
      }
    };

    fetchAllEmployees();
  }, []);

  const calculateStats = (tasks, filterByUserId = null) => {
    let totalTasks = 0;
    let totalActivities = 0;
    let completed = 0;
    let completedActivities = 0;
    let ongoing = 0;
    let ongoingActivities = 0;
    let delayed = 0;
    let delayedActivities = 0;
    let overdue = 0;
    let overdueActivities = 0;

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    tasks.forEach((task) => {
      const hasActivities =
        task.activities &&
        Array.isArray(task.activities) &&
        task.activities.length > 0;

      if (filterByUserId) {
        if (!hasActivities) {
          if (
            task.employee &&
            String(task.employee) !== String(filterByUserId)
          ) {
            return;
          }
        } else {
          const hasUserActivities = task.activities.some(
            (activity) =>
              activity.employee &&
              String(activity.employee) === String(filterByUserId)
          );

          if (!hasUserActivities) {
            return;
          }
        }
      }

      if (!hasActivities) {
        totalTasks++;
        const taskPercentage = task.percentage || 0;
        const taskEndDate = new Date(task.endDate);
        const taskEndTime = task.endTime || "23:59";
        const [endHour, endMinute] = (taskEndTime || "23:59")
          .split(":")
          .map(Number);
        taskEndDate.setHours(endHour, endMinute, 59, 999);

        if (taskPercentage === 100) {
          if (task.latestReportDate) {
            const completionDate = new Date(task.latestReportDate);
            if (completionDate > taskEndDate) {
              delayed++;
            } else {
              completed++;
            }
          } else {
            completed++;
          }
        } else if (taskPercentage > 0 && taskPercentage < 100) {
          if (currentDate > taskEndDate) {
            overdue++;
          } else {
            ongoing++;
          }
        } else if (taskPercentage === 0) {
          if (currentDate > taskEndDate) {
            overdue++;
          } else {
            ongoing++;
          }
        }
      }

      if (hasActivities) {
        task.activities.forEach((activity) => {
          if (
            filterByUserId &&
            activity.employee &&
            String(activity.employee) !== String(filterByUserId)
          ) {
            return;
          }

          totalActivities++;
          const activityPercentage = activity.percentage || 0;
          const activityEndDate = new Date(activity.endDate);
          const activityEndTime = activity.endTime || "23:59";
          const [endHour, endMinute] = (activityEndTime || "23:59")
            .split(":")
            .map(Number);
          activityEndDate.setHours(endHour, endMinute, 59, 999);

          if (activityPercentage === 100) {
            if (activity.completedDate || activity.latestReportDate) {
              const activityCompletionDate = new Date(
                activity.completedDate || activity.latestReportDate
              );
              if (activityCompletionDate > activityEndDate) {
                delayedActivities++;
              } else {
                completedActivities++;
              }
            } else {
              completedActivities++;
            }
          } else if (activityPercentage > 0 && activityPercentage < 100) {
            if (currentDate > activityEndDate) {
              overdueActivities++;
            } else {
              ongoingActivities++;
            }
          } else if (activityPercentage === 0) {
            if (currentDate > activityEndDate) {
              overdueActivities++;
            } else {
              ongoingActivities++;
            }
          }
        });
      }
    });

    return {
      totalTasks,
      totalActivities,
      completed,
      completedActivities,
      ongoing,
      ongoingActivities,
      delayed,
      delayedActivities,
      overdue,
      overdueActivities,
    };
  };

  useEffect(() => {
    const handleCloseAddTask = () => {
      if (showCreateTask) {
        setShowCreateTask(false);
      }
    };

    window.addEventListener("closeAddTask", handleCloseAddTask);

    return () => {
      window.removeEventListener("closeAddTask", handleCloseAddTask);
    };
  }, [showCreateTask]);

  useEffect(() => {
    if (showEmployeeModal) return;

    const loadData = async () => {
      const userData =
        sessionStorage.getItem("user") || localStorage.getItem("user");
      const userObj = userData ? JSON.parse(userData) : null;
      const userRole = userObj?.role || "";
      const userId =
        userObj?.id || userObj?.employee_id || userObj?.employeeId || "";

      setRole(userRole);
      setCurrentUserId(userId);

      if (!projectId) {
        // No projectId: show mock UI (user asked to show UI without backend)
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      try {
        const base = import.meta.env.VITE_API_BASE_URL;
        if (!base) {
          // offline fallback
          setError(null);
          return;
        }

        const response = await fetch(`${base}/projects/${projectId}`);
        if (!response.ok) {
          // fallback to mock on non-ok response
          console.warn(
            "projects fetch returned non-ok, falling back to mock:",
            response.status
          );
          return;
        }

        const data = await response.json();

        if (data && data.success && data.data) {
          const p = data.data;

          // build createdBy and creator here
          let accessArr = p.accessGrantedTo;
          if (typeof accessArr === "string") {
            try {
              accessArr = JSON.parse(accessArr);
            } catch {
              accessArr = [];
            }
          }
          if (!Array.isArray(accessArr)) accessArr = [];

          let creatorObj = null;
          if (accessArr.length > 0) {
            const first = accessArr[0];
            creatorObj = {
              name: first.employeeName || first.name || "",
              profile: first.profile || "",
              employeeId: first.employeeId || first.employeeID || null,
            };
          }

          const createdBy = {
            name: p.employeeName || "",
            profile: "",
            employeeId: p.employeeID || null,
          };

          setProjectData({
            ...p,
            accessGrantedTo: accessArr,
            createdBy,
            creator: creatorObj,
          });
        } else if (data && data.data) {
          setProjectData(data.data);
        } else {
        }
      } catch (err) {
        console.error("Error fetching project, falling back to mock:", err);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    // allow manual refresh via custom event
    window.addEventListener("RefreshLoad", loadData);

    loadData();

    return () => {
      window.removeEventListener("RefreshLoad", loadData);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, refreshTrigger, showEmployeeModal]);

  useEffect(() => {
    if (projectData) {
      const tasks = projectData.tasks || [];
      const calculatedStats = calculateStats(
        tasks,
        role === "Employee" && showYours ? currentUserId : null
      );
      setStats(calculatedStats);
    } else {
      setStats({
        totalTasks: 0,
        totalActivities: 0,
        completed: 0,
        completedActivities: 0,
        ongoing: 0,
        ongoingActivities: 0,
        delayed: 0,
        delayedActivities: 0,
        overdue: 0,
        overdueActivities: 0,
      });
    }
  }, [projectData, refreshTrigger, showYours, role, currentUserId]);

  const handleTaskCancel = () => {
    setShowCreateTask(false);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleTaskUpdate = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleAddEmployee = () => {
    setShowEmployeeModal(false);
    setRefreshTrigger((prev) => prev + 1);
  };

  if (showCreateTask) {
    return (
      <CreateTask
        onBack={handleTaskCancel}
        currentEmployees={projectData?.employees || []}
        projectId={projectId}
        startDate={projectData?.startDate}
        endDate={projectData?.endDate}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-[1.8vw] w-[1.8vw] border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  // When backend is intentionally disabled we don't treat missing projectData as an auth error.
  if (error && !projectData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md flex flex-col items-center">
          <h3 className="text-red-800 font-semibold mb-2 text-[0.82vw]">
            Please re login
          </h3>
          <p className="text-red-600">
            {error || "Project data not available"}
          </p>
        </div>
      </div>
    );
  }

  const displayProject = projectData;

  const addEmployee = () => {
    setShowEmployeeModal(true);
  };

  const handleEmployeeUpdate = (updatedEmployees) => {
    setProjectData((prev) => ({
      ...prev,
      employees: updatedEmployees?.data?.employees || prev?.employees || [],
    }));
  };

  return (
    <div className={` min-h-screen h-[100%] max-h-[100%]`}>
      <div className="flex justify-between w-[100%] ">
        <div className="bg-white rounded-lg shadow-sm flex flex-col  p-[0.6vw] gap-[0.7vw] w-[16%]">
          <div className="flex items-center justify-between ">
            <p className="text-[1.1vw] font-bold text-black ">
              {displayProject.employees?.length ?? 0}
            </p>
            <img
              src={assEmp}
              alt="Assigned Employees"
              className="w-[1.5vw] h-[1.5vw]"
            />
          </div>
          <p className="text-[0.8vw] text-gray-700">Assigned Employees</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm flex flex-col p-[0.6vw] gap-[0.7vw] w-[16%]">
          <div className="flex items-center justify-between">
            <p className="text-[1.1vw] font-bold text-[#08C1CE]">
              {activeTab === "Task" ? (
                <>{stats.totalTasks}</>
              ) : activeTab === "Activity" ? (
                <>{stats.totalActivities && <>{stats.totalActivities}</>}</>
              ) : (
                <>
                  {stats.totalTasks}
                  {stats.totalActivities > 0 && (
                    <span className="text-[0.7vw] ml-[0.2vw]">
                      ({stats.totalActivities})
                    </span>
                  )}
                </>
              )}
            </p>
            <img
              src={totalTask}
              alt="Total Tasks"
              className="w-[1.5vw] h-[1.5vw]"
            />
          </div>
          <p className="text-[0.8vw] text-gray-700">
            {activeTab === "Activity" ? "Total Activities" : "Total Tasks"}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm flex flex-col  p-[0.6vw] gap-[0.7vw] w-[16%]">
          <div className="flex items-center justify-between">
            <p className="text-[1.1vw] font-bold text-green-500">
              {activeTab === "Task" ? (
                <>{stats.completed}</>
              ) : activeTab === "Activity" ? (
                <>
                  {stats.completedActivities && (
                    <>{stats.completedActivities}</>
                  )}
                </>
              ) : (
                <>
                  {stats.completed}
                  {stats.completedActivities > 0 && (
                    <span className="text-[0.7vw] ml-[0.2vw]">
                      ({stats.completedActivities})
                    </span>
                  )}
                </>
              )}
            </p>
            <img
              src={completed}
              alt="Completed Tasks"
              className="w-[1.5vw] h-[1.5vw]"
            />
          </div>
          <p className="text-[0.8vw] text-gray-700">
            {activeTab === "Activity"
              ? "Completed Activities"
              : "Completed Tasks"}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm flex flex-col p-[0.6vw] gap-[0.7vw] w-[16%]">
          <div className="flex items-center justify-between">
            <p className="text-[1.1vw] font-bold text-indigo-500">
              {activeTab === "Task" ? (
                <>{stats.ongoing}</>
              ) : activeTab === "Activity" ? (
                <>{stats.ongoingActivities && <>{stats.ongoingActivities}</>}</>
              ) : (
                <>
                  {stats.ongoing}
                  {stats.ongoingActivities > 0 && (
                    <span className="text-[0.7vw] ml-[0.2vw]">
                      ({stats.ongoingActivities})
                    </span>
                  )}
                </>
              )}
            </p>
            <img
              src={onGoing}
              alt="Ongoing Tasks"
              className="w-[1.5vw] h-[1.5vw]"
            />
          </div>
          <p className="text-[0.8vw] text-gray-700">
            {activeTab === "Activity" ? "Ongoing Activities" : "Ongoing Tasks"}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm flex flex-col  p-[0.6vw] gap-[0.7vw] w-[16%]">
          <div className="flex items-center justify-between">
            <p className="text-[1.1vw] font-bold text-yellow-500">
              {activeTab === "Task" ? (
                <>{stats.delayed}</>
              ) : activeTab === "Activity" ? (
                <>{stats.delayedActivities && <>{stats.delayedActivities}</>}</>
              ) : (
                <>
                  {stats.delayed}
                  {stats.delayedActivities > 0 && (
                    <span className="text-[0.7vw] ml-[0.2vw]">
                      ({stats.delayedActivities})
                    </span>
                  )}
                </>
              )}
            </p>
            <img
              src={delayed}
              alt="Delayed Tasks"
              className="w-[1.5vw] h-[1.5vw]"
            />
          </div>
          <p className="text-[0.8vw] text-gray-700">
            {activeTab === "Activity" ? "Delayed Activities" : "Delayed Tasks"}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm flex flex-col  p-[0.6vw] gap-[0.7vw] w-[16%]">
          <div className="flex items-center justify-between">
            <p className="text-[1.1vw] font-bold text-red-500">
              {activeTab === "Task" ? (
                <>{stats.overdue}</>
              ) : activeTab === "Activity" ? (
                <>{stats.overdueActivities && <>{stats.overdueActivities}</>}</>
              ) : (
                <>
                  {stats.overdue}
                  {stats.overdueActivities > 0 && (
                    <span className="text-[0.7vw] ml-[0.2vw]">
                      ({stats.overdueActivities})
                    </span>
                  )}
                </>
              )}
            </p>
            <img
              src={overdue}
              alt="Overdue Tasks"
              className="w-[1.5vw] h-[1.5vw]"
            />
          </div>
          <p className="text-[0.8vw] text-gray-700">
            {activeTab === "Activity" ? "Overdue Activities" : "Overdue Tasks"}
          </p>
        </div>
      </div>

      <div className="flex mt-[0.5vw] mb-[0.5vw] w-[100%] justify-between h-[17%]">
        <div className="bg-white p-[0.8vw] pt-0 rounded-lg shadow-sm w-[55.2%]">
          <div className="flex gap-[0.8vw] items-center justify-between ">
            <div className="flex items-center gap-[0.9vw]">
              <h2 className="text-[0.9vw] text-gray-900">
                {displayProject.projectName}
              </h2>
              <span
                className={`text-white text-[0.7vw] px-[0.7vw] py-[0.12vw] rounded-full ${
                  displayProject.priority === "High"
                    ? "bg-[#ef4444]"
                    : displayProject.priority === "Medium"
                    ? "bg-[#facc15]"
                    : "bg-[#86efac]"
                }`}
              >
                {displayProject.priority}
              </span>
            </div>
            <div className="flex items-center pt-[0.5vw]">
              <div className="relative w-[2vw] h-[2vw]">
                <img
                  src={
                    (import.meta.env.VITE_API_BASE_URL || "") +
                    (displayProject.createdBy?.profile || "")
                  }
                  alt={displayProject.createdBy?.name}
                  className="w-full h-full rounded-full   object-cover  shadow-sm"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
                <div className="hidden absolute inset-0 bg-blue-500 text-white  rounded-full  flex items-center justify-center font-medium text-[0.9vw]">
                  {displayProject.createdBy?.name?.[0]?.toUpperCase() || "?"}
                </div>
              </div>
              <div className="ml-[0.5vw]">
                <p className="text-[0.85vw] text-gray-900">
                  {displayProject.createdBy?.name}
                </p>
                <p className="text-gray-400 text-[0.75vw]">Initiated By</p>
              </div>
            </div>
          </div>
          <p className="text-[0.76vw] text-gray-600 mt-[0.4vw] line-clamp-3">
            {displayProject.projectDescription}
          </p>
        </div>

        <div className=" flex flex-col w-[44%] h-[100%] max-[100%] justify-between ">
          <div className="flex h-[47%] justify-between">
            <div className="flex items-center justify-center bg-white p-[0.5vw] rounded-lg shadow-sm w-[49%] gap-[0.7vw]">
              <img src={crown} alt="crown_icon" className="w-[2vw] h-[2vw]" />
              <div className="relative w-[1.8vw] h-[1.8vw]">
                <img
                  src={
                    (import.meta.env.VITE_API_BASE_URL1 || "") +
                    (displayProject.creator?.profile || "")
                  }
                  alt={displayProject.creator?.name}
                  className="w-full h-full rounded-full   object-cover  shadow-sm"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
                <div className="hidden absolute inset-0 bg-blue-500 text-white  rounded-full  flex items-center justify-center font-medium text-[0.9vw]">
                  {displayProject.creator?.name?.[0]?.toUpperCase() || "?"}
                </div>
              </div>
              <div>
                <p className="font-medium text-[0.85vw] text-black">
                  {displayProject.creator?.name}
                </p>
                <p className=" text-[0.75vw] text-gray-500">Team Head</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm w-[49%] gap-[0.3vw] flex flex-col justify-center">
              <p className="font-medium text-[0.85vw] text-center">Employees</p>
              <div className="flex justify-center items-center gap-[0.5vw]">
                <div
                  className="bg-blue-600 px-[0.5vw] py-[0.2vw] flex items-center justify-center rounded-full cursor-pointer gap-[0.3vw]"
                  onClick={() => addEmployee()}
                >
                  {role !== "Employee" ? (
                    <>
                      <img src={addEmp} className="w-[0.9vw] h-[0.9vw]" />
                      <button className="text-white text-[0.65vw] rounded-full cursor-pointer">
                        Add / view
                      </button>
                    </>
                  ) : (
                    <button className="text-white text-[0.65vw] rounded-full cursor-pointer">
                      view
                    </button>
                  )}
                </div>

                {displayProject.employees?.length > 0 && (
                  <div className="flex -space-x-[0.35vw] items-center">
                    {displayProject.employees?.slice(0, 3).map((emp, index) => (
                      <div key={index} className="relative w-[1.3vw] h-[1.3vw]">
                        <img
                          src={
                            (import.meta.env.VITE_API_BASE_URL || "") +
                            (emp.profile || "")
                          }
                          alt={emp.name}
                          className="w-full h-full rounded-full   object-cover  shadow-sm"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                        <div className="hidden absolute inset-0 bg-blue-500 text-white  rounded-full  flex items-center justify-center font-medium text-[0.68vw]">
                          {emp.name?.[0]?.toUpperCase() || "?"}
                        </div>
                      </div>
                    ))}
                    {displayProject.employees.length > 3 && (
                      <div className="w-[1.5vw] h-[1.5vw] rounded-full border-2 border-white bg-gray-400 flex items-center justify-center text-[0.7vw] text-white font-medium">
                        +{displayProject.employees.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex h-[47%] justify-between">
            <div className="bg-white p-[0.2vw] rounded-lg shadow-sm  w-[49%] flex flex-col items-center justify-around">
              <p className="text-[0.85vw] text-center">Starting Date</p>
              <p className="text-gray-700 text-[0.75vw] w-fit font-medium bg-[#D7E2FF] rounded-full px-[1vw] py-[0.2vw] text-center">
                {formatDate(displayProject.startDate)}
              </p>
            </div>
            <div className="bg-white p-[0.2vw] rounded-lg shadow-sm  w-[49%] flex flex-col items-center justify-around">
              <p className="text-[0.85vw] text-center">Deadline Date</p>
              <p className="text-gray-700 text-[0.75vw] w-fit font-medium bg-[#D7E2FF] rounded-full px-[1vw] py-[0.2vw] text-center">
                {formatDate(displayProject.endDate)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center ">
        <div className="space-x-2 bg-white p-[0.5vw] rounded-full">
          <button
            onClick={() => handleShow("timeline")}
            className={`px-[0.5vw] py-[0.2vw] rounded-full cursor-pointer transition  text-[0.8vw] ${
              tableShow === "timeline"
                ? "bg-blue-500 text-white hover:bg-blue-400 hover:text-black"
                : "bg-gray-300 text-gray-700 hover:bg-gray-500 hover:text-white"
            }`}
          >
            Timeline
          </button>

          <button
            onClick={() => handleShow("list")}
            className={`px-[1.5vw] py-[0.2vw] rounded-full cursor-pointer transition  text-[0.8vw] ${
              tableShow === "list"
                ? "bg-blue-500 text-white hover:bg-blue-400 hover:text-black"
                : "bg-gray-300 text-gray-700 hover:bg-gray-500 hover:text-white"
            }`}
          >
            List
          </button>
        </div>

        {role !== "Employee" && (
          <button
            className="bg-blue-600 hover:bg-blue-500 cursor-pointer text-white px-[0.6vw] py-[0.35vw] text-[0.75vw] rounded-full"
            onClick={() => setShowCreateTask(true)}
          >
            + Add Task
          </button>
        )}
      </div>

      <div className="mt-[0.5vw] mb-[0.5vw] ">
        {tableShow === "timeline" ? (
          <div>
            <Timeline
              EmployeeData={displayProject.employees || []}
              projectData={displayProject.tasks || []}
            />
          </div>
        ) : role === "Employee" ? (
          <EmplyeeReportsTable
            tasks={displayProject.tasks || []}
            projectName={displayProject.projectName}
            companyName={displayProject.companyName}
            onBack={handleTaskCancel}
            onTaskUpdate={handleTaskUpdate}
            startDate={displayProject.startDate}
            endDate={displayProject.endDate}
          />
        ) : (
          <AdminReportsTable
            tasks={displayProject.tasks || []}
            projectName={displayProject.projectName}
            companyName={displayProject.companyName}
            currentEmployees={displayProject.employees || []}
            onBack={handleTaskCancel}
            onTaskUpdate={handleTaskUpdate}
          />
        )}
      </div>

      {showEmployeeModal && (
        <EmployeeModal
          isOpen={showEmployeeModal}
          projectName={projectName || displayProject.projectName}
          onClose={handleAddEmployee}
          projectId={projectId}
          currentEmployees={displayProject.employees || []}
          allEmployees={allEmployees} // ✅ ADD THIS
          onUpdate={handleEmployeeUpdate}
        />
      )}
    </div>
  );
}
