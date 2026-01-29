import React, { useState } from "react";
import ConcurrentTasks from "./ReportTasks/ConcurrentTasks";
import SequentialTasks from "./ReportTasks/SequentialTasks";
import ViewTasks from "./ReportTasks/ViewTask";
import Client from "./ReportTasks/Client"


const ReportTasks = () => {
  const [activeTab, setActiveTab] = useState("concurrent");


  return (
    <div className="text-black min-h-[92%] max-h-[100%] w-[100%] max-w-[100%] overflow-hidden">
      <div className="w-[100%] h-[91vh] flex flex-col gap-[1vh]">
        {/* TOP TABS */}
        <div className="bg-white flex justify-between overflow-hidden rounded-xl shadow-sm h-[6%] flex-shrink-0">
          <div className="flex border-b border-gray-200 h-full w-full">
            <button
              onClick={() => setActiveTab("concurrent")}
              className={`px-[1.5vw] cursor-pointer font-medium text-[0.9vw] transition-colors ${
                activeTab === "concurrent"
                  ? "border-b-2 border-black text-black"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Concurrent Tasks
            </button>
            <button
              onClick={() => setActiveTab("sequential")}
              className={`px-[1.5vw] cursor-pointer font-medium text-[0.9vw] transition-colors ${
                activeTab === "sequential"
                  ? "border-b-2 border-black text-black"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Sequential Tasks
            </button>
            <button
              onClick={() => setActiveTab("view")}
              className={`px-[1.5vw] cursor-pointer font-medium text-[0.9vw] transition-colors ${
                activeTab === "view"
                  ? "border-b-2 border-black text-black"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              View Tasks
            </button>
            <button
              onClick={() => setActiveTab("Client")}
              className={`px-[1.5vw] cursor-pointer font-medium text-[0.9vw] transition-colors ${
                activeTab === "Client"
                  ? "border-b-2 border-black text-black"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Client
            </button>
          </div>
        </div>


        {/* Content based on active tab */}
        <div className="h-[93%] flex flex-col overflow-hidden">
          {activeTab === "concurrent" && <ConcurrentTasks />}
          {activeTab === "sequential" && <SequentialTasks />}
          {activeTab === "view" && <ViewTasks />}
          {activeTab === "Client" && <Client />}
        </div>
      </div>
    </div>
  );
};


export default ReportTasks;
