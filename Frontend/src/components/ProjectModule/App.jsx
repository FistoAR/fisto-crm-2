import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { SystemNotification } from "./Services/SystemNotification";
import Login from "./components/Login";
import Sidebar from "./components/SidePannel";
import { NotificationProvider } from "./components/NotificationContext";
import { ConfirmProvider } from "./components/ConfirmContext";
import Messages from "./pages/Messages";
import Analytics from "./pages/Analytics";
import Projects from "./layouts/Projects";
import Calendar from "./pages/Calendar";
import ColorCodes from "./pages/ColorCodes";
import Dashboard from "./pages/Dashboard";
import ActivityPopupRouter from "./components/Activity_Popup_Router";
import ActivityMain from "./pages/Activity";
import NewProject from "./components/Project/NewProject";
import ProjectOverview from "./layouts/ProjectOverview";
import NavBar from "./components/NavBar";
import { usePageTitle } from "./components/PageTitleNav";
import Overview from "./components/Project/Overview";
import Resource from "./components/Project/Resource";
import DayTask from "./components/Project/DayTask";
import EmployeeCalendar from "./pages/EmployeeCalendar";
import UnscheduledTask from "./pages/UnscheduledTask";
import ConnectionStatus from "./utils/ConnectionStatus";

function NavBarWithTitle() {
  const pageTitle = usePageTitle();
  return <NavBar type={pageTitle} />;
}

function AppContent() {
  SystemNotification();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/*"
          element={
            <div>
              <ActivityPopupRouter />
              <ConnectionStatus />
              <div className="flex max-w-[100vw] max-h-[100vh]">
                <Sidebar />
                <main className="flex-1 bg-gray-100 min-h-screen px-[1.2vw] py-[0.4vh] max-w-[84%] min-w-[84%] overflow-hidden">
                  <NavBarWithTitle />
                  <Routes>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="activity" element={<ActivityMain />} />
                    <Route path="messages" element={<Messages />} />
                    <Route path="analytics" element={<Analytics />} />
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
                    <Route path="calendar" element={<Calendar />} />
                    <Route path="color-codes" element={<ColorCodes />} />
                    <Route path="taskCalendar" element={<EmployeeCalendar/>} />
                    <Route path="unscheduledTask" element={<UnscheduledTask/>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
              </div>
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
