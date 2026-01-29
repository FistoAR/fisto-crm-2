import React, { useState, useEffect } from "react";
import { Calendar } from "lucide-react";

import Notification from "../ToastProp";
import EmployeeOverview from "./management/EmployeeDeatils";
import SalaryCalculationTab from "../Marketing/HR/SalaryCalculationTab";
import SalaryModal from "../Marketing/HR/SalaryModal";
import AddEmployeeModal from "./management/AddEmployeeModal";
import ProjectBudget from "./management/ProjectBudget";
import CompanyBudget from "./management/CompanyBudget";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Management = () => {
  const [activeTab, setActiveTab] = useState("Employee Details");
  const [employees, setEmployees] = useState([]);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Salary states
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [selectedMonthYear, setSelectedMonthYear] = useState({
    month: null,
    year: null,
  });

  // 👇 Add refresh trigger state
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const empRes = await fetch(`${API_BASE_URL}/hr/employees`);
      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData.employees || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      showToast("Error", "Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (title, message) => {
    setToast({ title, message });
    setTimeout(() => setToast(null), 5000);
  };

  const handleEditEmployee = (emp) => {
    setEditingEmployee(emp);
    setShowAddEmployeeModal(true);
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/employeeRegister/${employeeId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.status) {
        showToast("Success", "Employee deleted successfully");
        fetchEmployees();
      } else {
        showToast("Error", data.message || "Failed to delete employee");
      }
    } catch (error) {
      console.error("Delete error:", error);
      showToast("Error", "Failed to delete employee");
    }
  };

  const handleViewSalaryEmployee = (employee) => {
    setCurrentEmployee({
      employee_id: employee.employeeId,
      employee_name: employee.employeeName,
      designation: employee.designation,
      job_role: employee.jobRole,
      profile_url: employee.profile_url,
      basic_salary: employee.salaryData?.basicSalary || 0,
      total_leave_days: employee.salaryData?.totalLeaveDays || 0,
      paid_leave_days: employee.salaryData?.paidLeaveDays || 0,
      deduction_amount: employee.salaryData?.deductionAmount || 0,
      total_deduction_days: employee.salaryData?.totalDeductionDays || 0,
      incentive: employee.salaryData?.incentive || 0,
      bonus: employee.salaryData?.bonus || 0,
      medical: employee.salaryData?.medical || 0,
      other_allowance: employee.salaryData?.otherAllowance || 0,
      total_salary: employee.salaryData?.totalSalary || 0,
      salaryId: employee.salaryData?.id || null,
    });
    setShowSalaryModal(true);
  };

  // 👇 Add callback function to trigger refresh
  const handleSalaryUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "Employee Details":
        return (
          <EmployeeOverview
            employees={employees}
            loading={loading}
            onEdit={handleEditEmployee}
            onDelete={handleDeleteEmployee}
            onAddEmployee={() => {
              setEditingEmployee(null);
              setShowAddEmployeeModal(true);
            }}
          />
        );

      case "Salary Calculation":
        return (
          <SalaryCalculationTab
            loading={loading}
            setLoading={setLoading}
            selectedMonthYear={selectedMonthYear}
            setSelectedMonthYear={setSelectedMonthYear}
            handleViewEmployee={handleViewSalaryEmployee}
            showToast={showToast}
            refreshTrigger={refreshTrigger} // 👈 Pass refresh trigger
          />
        );

      case "Project Budget":
        return (
            <ProjectBudget showToast={showToast} />
        );

      case "Company Budget":
        return (
           <CompanyBudget showToast={showToast} />
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
        <div className="bg-white flex justify-between overflow-hidden rounded-xl shadow-sm h-[6%] flex-shrink-0">
          <div className="flex border-b border-gray-200 h-full w-[60vw]">
            {["Employee Details", "Salary Calculation", "Project Budget", "Company Budget"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-[1.5vw] cursor-pointer font-medium text-[0.9vw] transition-colors flex-1 ${
                  activeTab === tab
                    ? "border-b-2 border-black text-black"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm h-[93%] flex flex-col overflow-hidden">
          {renderTabContent()}
        </div>
      </div>

      <SalaryModal
        showSalaryModal={showSalaryModal}
        setShowSalaryModal={setShowSalaryModal}
        currentEmployee={currentEmployee}
        setCurrentEmployee={setCurrentEmployee}
        selectedMonthYear={selectedMonthYear}
        showToast={showToast}
        onSalaryUpdated={handleSalaryUpdated} // 👈 Pass callback
      />

      <AddEmployeeModal
        show={showAddEmployeeModal}
        onClose={() => {
          setShowAddEmployeeModal(false);
          setEditingEmployee(null);
        }}
        editingEmployee={editingEmployee}
        reload={fetchEmployees}
        showToast={showToast}
      />
    </div>
  );
};

export default Management;
