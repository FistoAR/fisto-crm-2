import { useLocation } from "react-router-dom";

export function usePageTitle() {
  const location = useLocation();

  const titles = {
    // Marketing Routes
    "/marketing/dashboard": "Dashboard",
    "/marketing/analytics": "Analytics",
    "/marketing/calls": "Calls",
    "/marketing/resource":
      "Search Engine Optimization / Social Media Marketing / Content Management",
    "/marketing/dailyReports": "Daily Reports",
    "/marketing/employeeRequest": "Employee Request",
    "/marketing/hrActivities": "HR Activities",
    "/dairyRemainder": "Dairy Remainder",

    // Project Head Routes
    "/projectHead/analytics": "Analytics",
    "/projectHead/addReports": "Add Reports",
    "/projectHead/internReports": "Intern Reports",
    "/projectHead/addProject": "Add Project",

    // Admin Routes
    "/admin/dashboard": "Dashboard",
    "/admin/analytics": "Analytics",
    "/admin/management": "Management",
    "/admin/followup": "Followup's",
    "/admin/marketingLeeds": "Marketing Leeds",
    "/admin/project": "Project",
    "/admin/hr": "HR",
    "/admin/report": "Report",

    // Intern Routes
    "/intern/dailyReport": "Daily Report",

    // Software Developer Routes
    "/softwareDeveloper/dashboard": "Dashboard",
    "/softwareDeveloper/analytics": "Analytics",
    "/softwareDeveloper/projects": "Projects",

    // UI/UX Routes
    "/designer/dashboard": "Dashboard",
    "/designer/analytics": "Analytics",
    "/designer/projects": "Projects",

    // 3D Designer Routes
    "/threeD/dashboard": "Dashboard",
    "/threeD/analytics": "Analytics",
    "/threeD/projects": "Projects",
    "/notes": "Sticky Notes",
  };

  return titles[location.pathname] || "Dashboard";
}
