import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Worker from "./Service/useWorker";
import useSocketNotifications from "./Service/useSocketNotifications";
import { SystemNotification } from "./Service/SystemNotification";


// import useTaskWorker from "./Service/Task/useTaskWorker";

import useAttendanceWorker from "./Service/Attendance/useAttendanceWorker";

import Login from "./components/EmployeeManagement/Login";

import Sidebar from "./components/sidePannel";
import NavBar from "./components/NavBar";

import Marketing from "./pages/Marketing/marketing";
import MarketingDashboard from "./components/Marketing/Dashboard";
import MarketingAnalytics from "./components/Analytics/Analytics";
import MarketingCalls from "./components/Marketing/Calls";
import MarketingResourse from "./components/Marketing/Resource";
import MarketingSEO from "./components/Marketing/SEO";
import MarketingDailyReports from "./components/Marketing/DailyReports";
import MarketingTaskUpdate from "./components/Marketing/TaskUpdate";
import MarketingEmployeeRequest from "./components/Marketing/EmployeeRequest";
import MarketingHRactivities from "./components/Marketing/HR";
import MarketingCalendar from "./components/Marketing/Calendar";

import ProjectHead from "./pages/ProjectHead/ProjectHead";
import PHAnalytics from "./components/ProjectHead/Analytics";
import PHAssignTask from "./components/ProjectHead/MarketingTaskAssign";
import PHinternReports from "./components/ProjectHead/InternReports";
import PHaddProject from "./components/ProjectHead/AddProject";
import PHworkdone from "./components/ProjectHead/Workdone";

import Management from "./pages/management/management";
import AdminDashboard from "./components/Management/Dashboard";
import AdminAnalytics from "./components/Management/Analytics";
import AdminManagement from "./components/Management/Management";
import AdminFollowup from "./components/Management/Followup";
import MarketingLeeds from "./components/Management/MarketingLeeds";
import AdminMarketing from "./components/Management/Marketing";
import AdminProject from "./components/Management/Project";
import AdminHR from "./components/Management/HR";
import AdminReport from "./components/Management/Report";
import AdminCalendar from "./components/Management/Calendar";

import DailyReportIntern from "./components/Intern/DailyReport";

import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Task";

import Projects from "./layouts/Projects";
import ProjectOverview from "./layouts/ProjectOverview";
import NewProject from "./components/ProjectModule/NewProject";
import Overview from "./components/ProjectModule/Overview";
import Resource from "./components/ProjectModule/Resource";

import DayTask from "./components/ProjectModule/DayTask"

import { NotificationProvider } from "./components/NotificationContext";
import { ConfirmProvider } from "./components/ConfirmContext";
import { usePageTitle } from "./components/PageTitleNav";

import Notes from "./pages/StickyNotes";

import MobileRequest from "./components/MobileRequest/MobileRequest";

function NavBarWithTitle({ socketData }) {
  const pageTitle = usePageTitle();
  return <NavBar type={pageTitle} socketData={socketData} />;
}

function AppContent() {

    SystemNotification();

  Worker();
  // useTaskWorker();
  useAttendanceWorker();

  const {
    isConnected,
    notifications,
    unreadCount,
    markAsRead,
    clearNotification,
    clearAllNotifications,
    refreshNotifications,
  } = useSocketNotifications();

  return (
    <Router>
      <Routes>
        {/* Login Route - No Sidebar/Navbar */}
        <Route path="/" element={<Login />} />

        {/* Mobile Request Route - No Sidebar/Navbar */}
        <Route path="/mobileRequest" element={<MobileRequest />} />

        {/* All other routes with Sidebar and Navbar */}
        <Route
          path="/*"
          element={
            <div className="flex max-w-[100vw] max-h-[100vh]">
              <Sidebar />
              <main className="flex-1 bg-gray-100 min-h-screen px-[1.2vw] py-[0.4vh] max-w-[85%] min-w-[85%] overflow-hidden">
                <NavBarWithTitle
                  socketData={{
                    isConnected,
                    notifications,
                    unreadCount,
                    markAsRead,
                    clearNotification,
                    clearAllNotifications,
                    refreshNotifications,
                  }}
                />
                <div className="flex-1 overflow-y-auto mt-[1vh] pr-[0.3vw]">
                  <Routes>
                    {/* Marketing Routes */}
                    <Route path="marketing/*" element={<Marketing />}>
                      <Route
                        index
                        element={<Navigate to="dashboard" replace />}
                      />
                      <Route
                        path="dashboard"
                        element={<MarketingDashboard />}
                      />
                      <Route
                        path="analytics"
                        element={<MarketingAnalytics />}
                      />
                      <Route path="calls" element={<MarketingCalls />} />
                      <Route path="resource" element={<MarketingResourse />} />
                      <Route path="seo" element={<MarketingSEO />} />
                      <Route
                        path="dailyReports"
                        element={<MarketingTaskUpdate />}
                      />
                      <Route
                        path="employeeRequest"
                        element={<MarketingEmployeeRequest />}
                      />
                      <Route
                        path="hrActivities"
                        element={<MarketingHRactivities />}
                      />
                      <Route path="reports" element={<PHinternReports />} />
                    </Route>

                    {/* ProjectHead Routes */}
                    <Route path="projectHead/*" element={<ProjectHead />}>
                      <Route
                        index
                        element={<Navigate to="addReport" replace />}
                      />
                      <Route path="analytics" element={<PHAnalytics />} />
                      <Route path="addReports" element={<PHAssignTask />} />
                      <Route path="reports" element={<PHinternReports />} />
                      {/* <Route path="addProject" element={<PHaddProject />} /> */}

                      <Route path="projects" element={<Projects />}>
                        <Route path="newProject" element={<NewProject />} />
                        <Route
                          path="projectOverview"
                          element={<ProjectOverview />}
                        >
                          <Route path="overview" element={<Overview />} />
                          <Route path="resources" element={<Resource />} />
                        </Route>
                        <Route path="dayTask" element={<DayTask />} />
                      </Route>
                      <Route
                        path="hrActivities"
                        element={<MarketingHRactivities />}
                      />
                      <Route path="workdone" element={<PHworkdone />} />
                    </Route>

                    {/* Management/Admin Routes */}
                    <Route path="admin/*" element={<Management />}>
                      <Route
                        index
                        element={<Navigate to="dashboard" replace />}
                      />
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="analytics" element={<AdminAnalytics />} />
                      <Route path="management" element={<AdminManagement />} />
                      <Route path="followup" element={<AdminFollowup />} />
                      <Route
                        path="marketingLeeds"
                        element={<MarketingLeeds />}
                      />
                      <Route path="marketing" element={<AdminMarketing />} />
                      <Route path="project" element={<AdminProject />} />
                      <Route path="hr" element={<AdminHR />} />
                      <Route path="report" element={<AdminReport />} />
                      <Route path="calendar" element={<AdminCalendar />} />
                    </Route>

                    {/* Intern Routes */}
                    <Route path="intern/*" element={<Management />}>
                      <Route
                        index
                        element={<Navigate to="dailyReport" replace />}
                      />
                      <Route
                        path="dailyReport"
                        element={<DailyReportIntern />}
                      />
                      <Route
                        path="employeeRequest"
                        element={<MarketingEmployeeRequest />}
                      />
                    </Route>

                    {/* Software Routes */}
                    <Route path="softwareDeveloper">
                      <Route
                        index
                        element={<Navigate to="dashboard" replace />}
                      />
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="analytics" element={<Analytics />} />
                      {/* <Route path="reports" element={<Reports />} /> */}

                      <Route path="projects" element={<Projects />}>
                        <Route path="newProject" element={<NewProject />} />
                        <Route
                          path="projectOverview"
                          element={<ProjectOverview />}
                        ><Route path="overview" element={<Overview />} />
                        <Route path="resources" element={<Resource />} />
                        </Route>
                        <Route path="dayTask" element={<DayTask />} />
                      </Route>

                      <Route
                        path="employeeRequest"
                        element={<MarketingEmployeeRequest />}
                      />
                    </Route>

                    <Route path="threeD">
                      <Route
                        index
                        element={<Navigate to="dashboard" replace />}
                      />
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="analytics" element={<Analytics />} />
                      {/* <Route path="reports" element={<Reports />} /> */}

                      <Route path="projects" element={<Projects />}>
                        <Route path="newProject" element={<NewProject />} />
                        <Route
                          path="projectOverview"
                          element={<ProjectOverview />}
                        ><Route path="overview" element={<Overview />} />
                        <Route path="resources" element={<Resource />} />
                        </Route>
                        <Route path="dayTask" element={<DayTask />} />
                      </Route>

                      <Route
                        path="employeeRequest"
                        element={<MarketingEmployeeRequest />}
                      />
                    </Route>

                    <Route path="designer">
                      <Route
                        index
                        element={<Navigate to="dashboard" replace />}
                      />
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="analytics" element={<Analytics />} />
                      {/* <Route path="reports" element={<Reports />} /> */}

                      <Route path="projects" element={<Projects />}>
                        <Route path="newProject" element={<NewProject />} />
                        <Route
                          path="projectOverview"
                          element={<ProjectOverview />}
                        ><Route path="overview" element={<Overview />} />
                        <Route path="resources" element={<Resource />} />
                        </Route>
                        <Route path="dayTask" element={<DayTask />} />
                      </Route>

                      <Route
                        path="employeeRequest"
                        element={<MarketingEmployeeRequest />}
                      />
                    </Route>

                    <Route path="notes" element={<Notes />} />
                    <Route
                      path="dairyRemainder"
                      element={<MarketingCalendar />}
                    />

                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </div>
              </main>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <NotificationProvider>
      <ConfirmProvider>
        <AppContent />
      </ConfirmProvider>
    </NotificationProvider>
  );
}

export default App;
