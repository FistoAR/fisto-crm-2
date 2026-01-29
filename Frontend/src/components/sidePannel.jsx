import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import logo from "../assets/Fisto Logo.png";
import dashboardIcon from "../assets/SidePannelLogos/Dashboard.svg";
import ActivityIcon from "../assets/SidePannelLogos/Activity.svg";
import CallsIcon from "../assets/SidePannelLogos/calls.svg";
// import SEOIcon from "../assets/SidePannelLogos/seo.svg";
import DailyReportsIcon from "../assets/SidePannelLogos/dailyReports.svg";
import employeeRequestIcon from "../assets/SidePannelLogos/employeeRequest.svg";
import hrActivityIcon from "../assets/SidePannelLogos/hrActivity.svg";
import AddReportIcon from "../assets/SidePannelLogos/AddReport.svg";
import AnalyticsIcon from "../assets/SidePannelLogos/Analytics.svg";
import CalendarIcon from "../assets/SidePannelLogos/Calendar.svg";
import ProjectIcon from "../assets/SidePannelLogos/Projects.svg";

export default function Sidebar() {
  const [designation, setDesignation] = useState("");
  const [employeementType, setemployeementType] = useState("");
  const [teamHead, setTeamHead] = useState(false); // ✅ Added teamHead state
  const location = useLocation();

  useEffect(() => {
    // Get user data from sessionStorage
    const userData =
      sessionStorage.getItem("user") || localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setDesignation(parsedUser.designation || "");
      setemployeementType(parsedUser.employeementType || "");
      setTeamHead(parsedUser.teamHead || false); // ✅ Get teamHead value
    }
  }, []);

  function linkClasses(path, isLayout = false) {
    const { pathname } = location;
    const isActive = isLayout ? pathname.startsWith(path) : pathname === path;

    return `flex items-center px-4 py-3 rounded-md transition duration-200 gap-3 
          ${
            isActive
              ? "bg-black text-white font-semibold"
              : "text-gray-700 hover:bg-gray-100"
          }`;
  }

  function getPathPrefix(designation) {
    if (designation === "Software Developer") return "softwareDeveloper";
    if (designation === "UI/UX") return "designer";
    if (designation === "3D") return "threeD";
    return "";
  }

  return (
    <aside
      className="flex flex-col bg-white px-1.5 text-[1vw]"
      style={{ maxWidth: "15%", minWidth: "15%" }}
    >
      <div className="flex items-center justify-center h-[15%]">
        <img
          src={logo}
          alt="Fist-O Logo"
          style={{ width: "auto", height: "45%" }}
        />
      </div>

      <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-[1vw]">
          {/* Marketing-only menu items - Only for On Role employees */}
          {employeementType === "On Role" &&
            (designation === "Digital Marketing" ||
              designation === "Digital Marketing & HR") && (
              <>
                <li className="h-[10%] flex items-center">
                  <Link
                    to="/marketing/dashboard"
                    className={`${linkClasses(
                      "/marketing/dashboard",
                      true
                    )} flex items-center gap-[1.3vw] w-full`}
                  >
                    <img
                      src={dashboardIcon}
                      alt="Dashboard"
                      className="w-[1.4vw] h-[1.4vw]"
                      style={{
                        filter: location.pathname.startsWith(
                          "/marketing/dashboard"
                        )
                          ? "brightness(0) invert(1)"
                          : "none",
                      }}
                    />
                    <span>Dashboard</span>
                  </Link>
                </li>

                <li className="h-[10%] flex items-center">
                  <Link
                    to="/marketing/analytics"
                    className={`${linkClasses(
                      "/marketing/analytics",
                      true
                    )} flex items-center gap-[1.3vw] w-full`}
                  >
                    <img
                      src={AnalyticsIcon}
                      alt="Analytics"
                      className="w-[1.4vw] h-[1.4vw]"
                      style={{
                        filter: location.pathname.startsWith(
                          "/marketing/analytics"
                        )
                          ? "brightness(0) invert(1)"
                          : "none",
                      }}
                    />
                    <span>Analytics</span>
                  </Link>
                </li>

                <li className="h-[10%] flex items-center">
                  <Link
                    to="/marketing/calls"
                    className={`${linkClasses(
                      "/marketing/calls",
                      true
                    )} flex items-center gap-[1.3vw] w-full`}
                  >
                    <img
                      src={CallsIcon}
                      alt="Calls"
                      className="w-[1.4vw] h-[1.4vw]"
                      style={{
                        filter: location.pathname.startsWith("/marketing/calls")
                          ? "brightness(0) invert(1)"
                          : "none",
                      }}
                    />
                    <span>Calls</span>
                  </Link>
                </li>

                <li className="h-[10%] flex items-center">
                  <Link
                    to="/marketing/resource"
                    className={`${linkClasses(
                      "/marketing/resource",
                      true
                    )} flex items-center gap-[1.3vw] w-full`}
                  >
                    <img
                      src={ActivityIcon}
                      alt="Resource"
                      className="w-[1.4vw] h-[1.4vw]"
                      style={{
                        filter: location.pathname.startsWith(
                          "/marketing/resource"
                        )
                          ? "brightness(0) invert(1)"
                          : "none",
                      }}
                    />
                    <span>SEO / SMM / CM</span>
                  </Link>
                </li>

                <li className="h-[10%] flex items-center">
                  <Link
                    to="/marketing/dailyReports"
                    className={`${linkClasses(
                      "/marketing/dailyReports",
                      true
                    )} flex items-center gap-[1.3vw] w-full`}
                  >
                    <img
                      src={DailyReportsIcon}
                      alt="DailyReports"
                      className="w-[1.4vw] h-[1.4vw]"
                      style={{
                        filter: location.pathname.startsWith(
                          "/marketing/dailyReports"
                        )
                          ? "brightness(0) invert(1)"
                          : "none",
                      }}
                    />
                    <span>Daily reports</span>
                  </Link>
                </li>

                <li className="h-[10%] flex items-center">
                  <Link
                    to="/marketing/employeeRequest"
                    className={`${linkClasses(
                      "/marketing/employeeRequest",
                      true
                    )} flex items-center gap-[1.3vw] w-full`}
                  >
                    <img
                      src={employeeRequestIcon}
                      alt="employeeRequest"
                      className="w-[1.4vw] h-[1.4vw]"
                      style={{
                        filter: location.pathname.startsWith(
                          "/marketing/employeeRequest"
                        )
                          ? "brightness(0) invert(1)"
                          : "none",
                      }}
                    />
                    <span>Employee request</span>
                  </Link>
                </li>

                {/* HR Activities - Only show for Digital Marketing & HR */}
                {designation === "Digital Marketing & HR" && (
                  <>
                    <li className="h-[10%] flex items-center">
                      <Link
                        to="/marketing/hrActivities"
                        className={`${linkClasses(
                          "/marketing/hrActivities",
                          true
                        )} flex items-center gap-[1.3vw] w-full`}
                      >
                        <img
                          src={hrActivityIcon}
                          alt="hrActivities"
                          className="w-[1.4vw] h-[1.4vw]"
                          style={{
                            filter: location.pathname.startsWith(
                              "/marketing/hrActivities"
                            )
                              ? "brightness(0) invert(1)"
                              : "none",
                          }}
                        />
                        <span>HR Activities</span>
                      </Link>
                    </li>

                    <li className="h-[10%] flex items-center">
                      <Link
                        to="/marketing/reports"
                        className={`${linkClasses(
                          "/marketing/reports",
                          true
                        )} flex items-center gap-[1.3vw] w-full`}
                      >
                        <img
                          src={AddReportIcon}
                          alt="reports"
                          className="w-[1.4vw] h-[1.4vw]"
                          style={{
                            filter: location.pathname.startsWith(
                              "/marketing/reports"
                            )
                              ? "brightness(0) invert(1)"
                              : "none",
                          }}
                        />
                        <span>Reports</span>
                      </Link>
                    </li>
                  </>
                )}
              </>
            )}

          {/* Project Head-only menu items - Only for On Role employees */}
          {employeementType === "On Role" && designation === "Project Head" && (
            <>
              <li className="h-[10%] flex items-center">
                <Link
                  to="/projectHead/analytics"
                  className={`${linkClasses(
                    "/projectHead/analytics",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={AnalyticsIcon}
                    alt="Analytics"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith(
                        "/projectHead/analytics"
                      )
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>Analytics</span>
                </Link>
              </li>

              <li className="h-[10%] flex items-center">
                <Link
                  to="/projectHead/addReports"
                  className={`${linkClasses(
                    "/projectHead/addReports",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={AddReportIcon}
                    alt="addReports"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith(
                        "/projectHead/addReports"
                      )
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>Marketing Task</span>
                </Link>
              </li>

              <li className="h-[10%] flex items-center">
                <Link
                  to="/projectHead/reports"
                  className={`${linkClasses(
                    "/projectHead/reports",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={AddReportIcon}
                    alt="reports"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith(
                        "/projectHead/reports"
                      )
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>Reports</span>
                </Link>
              </li>

              <li className="h-[10%] flex items-center">
                <Link
                  to="/projectHead/projects"
                  className={`${linkClasses(
                    "/projectHead/projects",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={AddReportIcon}
                    alt="projects"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith(
                        "/projectHead/projects"
                      )
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>Projects</span>
                </Link>
              </li>

              <li className="h-[10%] flex items-center">
                <Link
                  to="/projectHead/hrActivities"
                  className={`${linkClasses(
                    "/projectHead/hrActivities",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={hrActivityIcon}
                    alt="hrActivities"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith(
                        "/projectHead/hrActivities"
                      )
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>HR Activities</span>
                </Link>
              </li>

               <li className="h-[10%] flex items-center">
                  <Link
                    to="/marketing/resource"
                    className={`${linkClasses(
                      "/marketing/resource",
                      true
                    )} flex items-center gap-[1.3vw] w-full`}
                  >
                    <img
                      src={ActivityIcon}
                      alt="Resource"
                      className="w-[1.4vw] h-[1.4vw]"
                      style={{
                        filter: location.pathname.startsWith(
                          "/marketing/resource"
                        )
                          ? "brightness(0) invert(1)"
                          : "none",
                      }}
                    />
                    <span>SEO / SMM / CM</span>
                  </Link>
                </li>

              <li className="h-[10%] flex items-center">
                <Link
                  to="/projectHead/workdone"
                  className={`${linkClasses(
                    "/projectHead/workdone",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={AddReportIcon}
                    alt="workdone"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith(
                        "/projectHead/workdone"
                      )
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>Work Done</span>
                </Link>
              </li>
            </>
          )}

          {/* Admin menu items - Only for On Role employees */}
          {employeementType === "On Role" && designation === "Admin" && (
            <>
              <li className="h-[10%] flex items-center">
                <Link
                  to="/admin/dashboard"
                  className={`${linkClasses(
                    "/admin/dashboard",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={dashboardIcon}
                    alt="Dashboard"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith("/admin/dashboard")
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>Dashboard</span>
                </Link>
              </li>

              <li className="h-[10%] flex items-center">
                <Link
                  to="/admin/analytics"
                  className={`${linkClasses(
                    "/admin/analytics",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={ActivityIcon}
                    alt="Analytics"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith("/admin/analytics")
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>Analytics</span>
                </Link>
              </li>

              <li className="h-[10%] flex items-center">
                <Link
                  to="/admin/management"
                  className={`${linkClasses(
                    "/admin/management",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={AddReportIcon}
                    alt="Management"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith("/admin/management")
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>Management</span>
                </Link>
              </li>

              <li className="h-[10%] flex items-center">
                <Link
                  to="/admin/followup"
                  className={`${linkClasses(
                    "/admin/followup",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={CallsIcon}
                    alt="Followup"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith("/admin/followup")
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>Followup's</span>
                </Link>
              </li>

              <li className="h-[10%] flex items-center">
                <Link
                  to="/admin/marketingLeeds"
                  className={`${linkClasses(
                    "/admin/marketingLeeds",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={CallsIcon}
                    alt="marketingLeeds"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith(
                        "/admin/marketingLeeds"
                      )
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>Marketing Leeds</span>
                </Link>
              </li>

              <li className="h-[10%] flex items-center">
                <Link
                  to="/admin/project"
                  className={`${linkClasses(
                    "/admin/project",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={ProjectIcon}
                    alt="Project"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith("/admin/project")
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>Project</span>
                </Link>
              </li>

              <li className="h-[10%] flex items-center">
                <Link
                  to="/admin/hr"
                  className={`${linkClasses(
                    "/admin/hr",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={hrActivityIcon}
                    alt="HR"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith("/admin/hr")
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>HR</span>
                </Link>
              </li>

               <li className="h-[10%] flex items-center">
                  <Link
                    to="/marketing/resource"
                    className={`${linkClasses(
                      "/marketing/resource",
                      true
                    )} flex items-center gap-[1.3vw] w-full`}
                  >
                    <img
                      src={ActivityIcon}
                      alt="Resource"
                      className="w-[1.4vw] h-[1.4vw]"
                      style={{
                        filter: location.pathname.startsWith(
                          "/marketing/resource"
                        )
                          ? "brightness(0) invert(1)"
                          : "none",
                      }}
                    />
                    <span>SEO / SMM / CM</span>
                  </Link>
                </li>

              <li className="h-[10%] flex items-center">
                <Link
                  to="/admin/report"
                  className={`${linkClasses(
                    "/admin/report",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={DailyReportsIcon}
                    alt="Report"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith("/admin/report")
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>Report</span>
                </Link>
              </li>
            </>
          )}

          {/* Intern menu items - Only for Interns */}
          {employeementType === "Intern" && (
            <>
              <li className="h-[10%] flex items-center">
                <Link
                  to="/intern/dailyReport"
                  className={`${linkClasses(
                    "/intern/dailyReport",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={DailyReportsIcon}
                    alt="dailyReport"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith(
                        "/intern/dailyReport"
                      )
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>Daily Report</span>
                </Link>
              </li>

              <li className="h-[10%] flex items-center">
                <Link
                  to="/intern/employeeRequest"
                  className={`${linkClasses(
                    "/intern/employeeRequest",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={employeeRequestIcon}
                    alt="employeeRequest"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith(
                        "/intern/employeeRequest"
                      )
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>Employee request</span>
                </Link>
              </li>
            </>
          )}


          {employeementType === "On Role" &&
            ["Software Developer", "UI/UX", "3D"].includes(designation) && (
              <>
                <li className="h-[10%] flex items-center">
                  <Link
                    to={`/${getPathPrefix(designation)}/dashboard`}
                    className={`${linkClasses(
                      `/${getPathPrefix(designation)}/dashboard`,
                      true
                    )} flex items-center gap-[1.3vw] w-full`}
                  >
                    <img
                      src={dashboardIcon}
                      alt="Dashboard"
                      className="w-[1.4vw] h-[1.4vw]"
                      style={{
                        filter: location.pathname.startsWith(
                          `/${getPathPrefix(designation)}/dashboard`
                        )
                          ? "brightness(0) invert(1)"
                          : "none",
                      }}
                    />
                    <span>Dashboard</span>
                  </Link>
                </li>

                <li className="h-[10%] flex items-center">
                  <Link
                    to={`/${getPathPrefix(designation)}/analytics`}
                    className={`${linkClasses(
                      `/${getPathPrefix(designation)}/analytics`,
                      true
                    )} flex items-center gap-[1.3vw] w-full`}
                  >
                    <img
                      src={AnalyticsIcon}
                      alt="Analytics"
                      className="w-[1.4vw] h-[1.4vw]"
                      style={{
                        filter: location.pathname.startsWith(
                          `/${getPathPrefix(designation)}/analytics`
                        )
                          ? "brightness(0) invert(1)"
                          : "none",
                      }}
                    />
                    <span>Analytics</span>
                  </Link>
                </li>

                <li className="h-[10%] flex items-center">
                  <Link
                    to={`/${getPathPrefix(designation)}/projects`}
                    className={`${linkClasses(
                      `/${getPathPrefix(designation)}/projects`,
                      true
                    )} flex items-center gap-[1.3vw] w-full`}
                  >
                    <img
                      src={DailyReportsIcon}
                      alt="projects"
                      className="w-[1.4vw] h-[1.4vw]"
                      style={{
                        filter: location.pathname.startsWith(
                          `/${getPathPrefix(designation)}/projects`
                        )
                          ? "brightness(0) invert(1)"
                          : "none",
                      }}
                    />
                    <span>Projects</span>
                  </Link>
                </li>

                <li className="h-[10%] flex items-center">
                  <Link
                    to={`/${getPathPrefix(designation)}/employeeRequest`}
                    className={`${linkClasses(
                      `/${getPathPrefix(designation)}/employeeRequest`,
                      true
                    )} flex items-center gap-[1.3vw] w-full`}
                  >
                    <img
                      src={employeeRequestIcon}
                      alt="employeeRequest"
                      className="w-[1.4vw] h-[1.4vw]"
                      style={{
                        filter: location.pathname.startsWith(
                          `/${getPathPrefix(designation)}/employeeRequest`
                        )
                          ? "brightness(0) invert(1)"
                          : "none",
                      }}
                    />
                    <span>Employee request</span>
                  </Link>
                </li>

                {/* ✅ Add Project - Only show if teamHead is true */}
                {teamHead && (
                  <li className="h-[10%] flex items-center">
                    <Link
                      to="/projectHead/addProject"
                      className={`${linkClasses(
                        "/projectHead/addProject",
                        true
                      )} flex items-center gap-[1.3vw] w-full`}
                    >
                      <img
                        src={AddReportIcon}
                        alt="addProject"
                        className="w-[1.4vw] h-[1.4vw]"
                        style={{
                          filter: location.pathname.startsWith(
                            "/projectHead/addProject"
                          )
                            ? "brightness(0) invert(1)"
                            : "none",
                        }}
                      />
                      <span>Add Project</span>
                    </Link>
                  </li>
                )}
              </>
            )}

          <li className="h-[10%] flex items-center">
            <Link
              to="/dairyRemainder"
              className={`${linkClasses(
                "/dairyRemainder",
                true
              )} flex items-center gap-[1.3vw] w-full`}
            >
              <img
                src={CalendarIcon}
                alt="calendar"
                className="w-[1.4vw] h-[1.4vw]"
                style={{
                  filter: location.pathname.startsWith("/dairyRemainder")
                    ? "brightness(0) invert(1)"
                    : "none",
                }}
              />
              <span>Dairy Remainder</span>
            </Link>
          </li>

          <li className="h-[10%] flex items-center">
            <Link
              to={`/notes`}
              className={`${linkClasses(
                `/notes`,
                true
              )} flex items-center gap-[1.3vw] w-full`}
            >
              <img
                src={DailyReportsIcon}
                alt="Reports"
                className="w-[1.4vw] h-[1.4vw]"
                style={{
                  filter: location.pathname.startsWith(`/notes`)
                    ? "brightness(0) invert(1)"
                    : "none",
                }}
              />
              <span>Sticky Notes</span>
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
