import React, { useState } from "react";
import AddProjectDashboard from "./AddProject/AddProjectDashboard";
import ViewTask from "./AddProject/ViewTask";
import Analytics from "./AddProject/Analytics";

const AddProject = () => {
  const [activeTab, setActiveTab] = useState("projects"); 

  return (
    <div className="text-black min-h-[92%] max-h-[100%] w-[100%] max-w-[100%] overflow-hidden">
      <div className="w-[100%] h-[91vh] flex flex-col gap-[1vh]">
        {/* TOP TABS - Same style as EmployeeRequest */}
        <div className="bg-white flex justify-between overflow-hidden rounded-xl shadow-sm h-[6%] flex-shrink-0">
          <div className="flex border-b border-gray-200 h-full w-full">
            <button
              onClick={() => setActiveTab("projects")}
              className={`px-[1.5vw] cursor-pointer font-medium text-[0.9vw] transition-colors ${
                activeTab === "projects"
                  ? "border-b-2 border-black text-black"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Add Project
            </button>
            <button
              onClick={() => setActiveTab("tasks")}
              className={`px-[1.5vw] cursor-pointer font-medium text-[0.9vw] transition-colors ${
                activeTab === "tasks"
                  ? "border-b-2 border-black text-black"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              View Tasks
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-[1.5vw] cursor-pointer font-medium text-[0.9vw] transition-colors ${
                activeTab === "analytics"
                  ? "border-b-2 border-black text-black"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Analytics
            </button>
          </div>
        </div>

        {/* Content based on active tab */}
        <div className="h-[93%] flex flex-col overflow-hidden">
          {activeTab === "projects" && <AddProjectDashboard />}
          {activeTab === "tasks" && <ViewTask />}
          {activeTab === "analytics" && <Analytics />}
        </div>
      </div>
    </div>
  );
};

export default AddProject;
