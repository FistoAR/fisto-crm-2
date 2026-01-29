import React, { useState } from "react";
import Followup from "./Followup";
import Reports from "./Reports";

const Analytics = ({ employeeId: propEmployeeId = undefined }) => {
  const [mainTab, setMainTab] = useState("followup");

  return (
    <div className="w-full h-[90vh] flex flex-col gap-[1vh] text-black overflow-hidden">
      {/* Main Tab Header */}
      <div className="bg-white rounded-xl overflow-hidden shadow-sm h-[6%] flex-shrink-0">
        <div className="flex items-center border-b border-gray-200 h-full px-[0.8vw]">
          <div className="flex h-full">
            {["followup", "reports"].map((key) => (
              <button
                key={key}
                onClick={() => setMainTab(key)}
                className={`px-[1.4vw] cursor-pointer font-medium text-[0.9vw] whitespace-nowrap transition-colors ${
                  mainTab === key
                    ? "border-b-[0.22vw] border-sky-500 text-sky-600"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {key === "followup" ? "Follow Up" : "Reports"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content - Render selected tab component */}
      <div className="bg-white rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        {mainTab === "followup" ? (
          <Followup employeeId={propEmployeeId} />
        ) : (
          <Reports employeeId={propEmployeeId} />
        )}
      </div>
    </div>
  );
};

export default Analytics;
