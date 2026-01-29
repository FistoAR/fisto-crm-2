import React from "react";
import { X } from "lucide-react";

const MultiSelectEmployee = ({
  employees,
  selectedEmployees,
  setSelectedEmployees,
  label = "Employee",
}) => {
  const handleSelect = (e) => {
    const id = e.target.value;
    if (!id) return;

    const emp = employees.find((x) => x.employee_id === id);
    if (emp && !selectedEmployees.some((s) => s.employee_id === id)) {
      setSelectedEmployees([...selectedEmployees, emp]);
    }
    e.target.value = "";
  };

  const handleRemove = (empId) => {
    setSelectedEmployees(
      selectedEmployees.filter((e) => e.employee_id !== empId)
    );
  };

  const availableEmployees = employees.filter(
    (emp) =>
      emp.employee_id &&
      !selectedEmployees.some((s) => s.employee_id === emp.employee_id)
  );

  return (
    <div className="flex flex-col">
      <label className="text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">
        {label} <span className="text-red-500">*</span>
      </label>

      <select
        value=""
        onChange={handleSelect}
        className="px-[0.6vw] py-[0.4vw] text-[0.85vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
      >
        <option value="">Select Employee</option>
        {availableEmployees.map((emp) => (
          <option key={emp.employee_id} value={emp.employee_id}>
            {emp.employee_name}
          </option>
        ))}
      </select>

      {selectedEmployees.length > 0 && (
        <div className="mt-[0.5vw] p-[0.5vw] border border-blue-200 rounded-lg bg-blue-50 max-h-[6vw] overflow-y-auto">
          <div className="flex flex-wrap gap-[0.3vw]">
            {selectedEmployees.map((emp) => (
              <div
                key={emp.employee_id}
                className="flex items-center gap-[0.3vw] bg-white border border-blue-300 rounded-full px-[0.5vw] py-[0.2vw] text-[0.75vw] shadow-sm"
              >
                <span className="text-gray-900 font-medium">
                  {emp.employee_name}
                </span>
                <button
                  onClick={() => handleRemove(emp.employee_id)}
                  className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full p-[0.1vw] transition-all cursor-pointer"
                  title="Remove"
                >
                  <X size={"0.8vw"} />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-[0.3vw] text-[0.7vw] text-blue-600 font-medium">
            {selectedEmployees.length} employee
            {selectedEmployees.length !== 1 ? "s" : ""} selected
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectEmployee;
