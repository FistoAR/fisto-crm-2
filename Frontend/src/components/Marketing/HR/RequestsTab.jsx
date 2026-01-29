import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Trash2,
} from "lucide-react";
import searchIcon from "../../../assets/Marketing/search.webp";
import { renderEmployeeCell, formatDate } from "./utils.jsx";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const RequestsTab = ({
  leaveRequests,
  permissionRequests,
  loading,
  fetchAllData,
  showToast,
}) => {
  const [requestSubTab, setRequestSubTab] = useState("Leave Request");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleting, setDeleting] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    requestId: null,
    type: null,
  });
  
  const RECORDS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, requestSubTab]);

  const handleAction = async (requestId, action, type) => {
    try {
      const userDataString = sessionStorage.getItem("user");
      let approvedBy = null;

      if (userDataString) {
        const userData = JSON.parse(userDataString);
        approvedBy = userData.employeeName || userData.userName || null;
      }

      const endpoint =
        type === "leave"
          ? `${API_BASE_URL}/hr/leave-requests/${requestId}/${action}`
          : `${API_BASE_URL}/hr/permission-requests/${requestId}/${action}`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedBy }),
      });

      if (!response.ok) {
        showToast("Error", "Failed to update request");
        return;
      }

      showToast("Success", "Request updated successfully");
      fetchAllData();
    } catch (error) {
      console.error("Action error:", error);
      showToast("Error", "Network error");
    }
  };

  // Add helper function at the top of the file (after imports)
const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const getDurationDisplay = (numberOfDays, durationType) => {
  // If it's 0.5 days, show the duration type
  if (parseFloat(numberOfDays) === 0.5) {
    if (durationType === 'morning') {
      return 'Morning Half Day';
    } else if (durationType === 'afternoon') {
      return 'Afternoon Half Day';
    }
    return '0.5 day'; // fallback
  }
  
  // For full days
  const days = parseFloat(numberOfDays);
  return days === 1 ? '1 day' : `${days} days`;
};

  const openDeleteModal = (requestId, type) => {
    setDeleteModal({
      isOpen: true,
      requestId,
      type,
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      requestId: null,
      type: null,
    });
    setDeleting(false);
  };

  const handleDeleteConfirm = async () => {
    if (deleting || !deleteModal.requestId) return;
    
    setDeleting(true);
    try {
      const endpoint =
        deleteModal.type === "leave"
          ? `${API_BASE_URL}/hr/leave-requests/${deleteModal.requestId}`
          : `${API_BASE_URL}/hr/permission-requests/${deleteModal.requestId}`;

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        showToast("Error", data.error || "Failed to delete request");
        return;
      }

      showToast("Success", "Request deleted successfully");
      fetchAllData();
      closeDeleteModal();
    } catch (error) {
      console.error("Delete error:", error);
      showToast("Error", "Network error while deleting");
    } finally {
      setDeleting(false);
    }
  };

  const getFilteredRequests = () => {
    let filtered = [];
    if (requestSubTab === "Leave Request") {
      filtered = leaveRequests.filter(
        (req) =>
          req.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.leave_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.reason?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      filtered = permissionRequests.filter(
        (req) =>
          req.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.reason?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  };

  const filteredRequests = getFilteredRequests();
  const totalPages = Math.ceil(filteredRequests.length / RECORDS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
  const paginatedRequests = filteredRequests.slice(
    startIndex,
    startIndex + RECORDS_PER_PAGE
  );

  const handlePrevious = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <div className="flex flex-col h-full">
      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[30vw] p-[1.5vw]">
            <h3 className="text-[1.1vw] font-semibold text-gray-800 mb-[0.5vw]">
              Delete Request
            </h3>
            <p className="text-[0.9vw] text-gray-600 mb-[1vw]">
              Are you sure you want to delete this request? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-[0.5vw]">
              <button
                onClick={closeDeleteModal}
                disabled={deleting}
                className="px-[1vw] py-[0.4vw] text-[0.85vw] text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-[1vw] py-[0.4vw] text-[0.85vw] text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-[0.3vw]"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-[0.8vw] w-[0.8vw] border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  "Delete Request"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="bg-white rounded-xl overflow-hidden shadow-sm h-[6%] flex-shrink-0 mb-[1vh]">
        <div className="flex border-b border-gray-200 overflow-x-auto h-full">
          <button
            onClick={() => {
              setRequestSubTab("Leave Request");
              setSearchTerm("");
            }}
            className={`px-[1.2vw] cursor-pointer font-medium text-[0.85vw] whitespace-nowrap transition-colors ${
              requestSubTab === "Leave Request"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Leave Requests ({leaveRequests.length})
          </button>
          <button
            onClick={() => {
              setRequestSubTab("Permission Request");
              setSearchTerm("");
            }}
            className={`px-[1.2vw] cursor-pointer font-medium text-[0.85vw] whitespace-nowrap transition-colors ${
              requestSubTab === "Permission Request"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Permission Requests ({permissionRequests.length})
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between p-[0.8vw] h-[8%] flex-shrink-0 bg-white border-b border-gray-200">
        <div className="flex items-center gap-[0.5vw]">
          <span className="font-medium text-[0.95vw] text-gray-800">
            All Requests
          </span>
          <span className="text-[0.85vw] text-gray-500">
            ({filteredRequests.length})
          </span>
        </div>
        <div className="relative">
          <img
            src={searchIcon}
            alt=""
            className="w-[1.3vw] h-[1.3vw] absolute left-[0.5vw] top-1/2 transform -translate-y-1/2"
          />
          <input
            type="text"
            placeholder="Search by name, ID, reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-[2.3vw] pr-[1vw] py-[0.25vw] rounded-full text-[0.95vw] bg-gray-200 focus:ring-blue-500 focus:border-blue-500 w-[20vw]"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="animate-spin rounded-full h-[2vw] w-[2vw] border-b-2 border-blue-600"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-500">
            <Calendar className="w-[5vw] h-[5vw] mb-[1vw] text-gray-300" />
            <p className="text-[1.1vw] font-medium mb-[0.5vw]">No requests found</p>
            <p className="text-[1vw] text-gray-400">
              {searchTerm ? "Try adjusting your search" : "No requests in this category"}
            </p>
          </div>
        ) : (
          <div className="h-full mr-[0.8vw] mb-[0.8vw] ml-[0.8vw] border border-gray-300 rounded-xl overflow-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-[#E2EBFF] sticky top-0">
                <tr>
                  {requestSubTab === "Leave Request" ? (
                    <>
        <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
          S.NO
        </th>
        <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
          Employee
        </th>
        {/* ✅ NEW COLUMN */}
        <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
          Submitted Date
        </th>
        <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
          Leave Type
        </th>
        <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
          From
        </th>
        <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
          To
        </th>
        <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
          Duration {/* Changed from "Days" */}
        </th>
        <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
          Reason
        </th>
        <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
          Action
        </th>
        <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
          Approve By
        </th>
      </>
                  ) : (
                    <>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                        S.NO
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                        Employee
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                        Date
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                        From
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                        To
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                        Duration
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                        Reason
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                        Action
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                        Approve By
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedRequests.map((req, index) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-900 border border-gray-300 text-center">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-[0.7vw] py-[0.56vw] border border-gray-300">
                      {renderEmployeeCell(req)}
                    </td>
                    {requestSubTab === "Leave Request" ? (
                       <>
          {/* ✅ NEW COLUMN - Submitted Date */}
          <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-600 border border-gray-300 text-center">
            {formatDateTime(req.created_at)}
          </td>
          <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-600 border border-gray-300">
            {req.leave_type}
          </td>
          <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-600 border border-gray-300">
            {formatDate(req.from_date)}
          </td>
          <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-600 border border-gray-300">
            {formatDate(req.to_date)}
          </td>
          {/* ✅ MODIFIED - Duration Display */}
          <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] font-medium text-gray-900 border border-gray-300 text-center">
            {getDurationDisplay(req.number_of_days, req.duration_type)}
          </td>
          <td
            className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-600 border border-gray-300 max-w-[12vw] truncate"
            title={req.reason}
          >
            {req.reason}
          </td>
        </>
                    ) : (
                      <>
                        <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-600 border border-gray-300">
                          {formatDate(req.permission_date)}
                        </td>
                        <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-600 border border-gray-300">
                          {req.from_time}
                        </td>
                        <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-600 border border-gray-300">
                          {req.to_time}
                        </td>
                        <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] font-medium text-gray-900 border border-gray-300 text-center">
                          {req.duration_minutes} mins
                        </td>
                        <td
                          className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-600 border border-gray-300 max-w-[12vw] truncate"
                          title={req.reason}
                        >
                          {req.reason}
                        </td>
                      </>
                    )}
                    <td className="px-[0.7vw] py-[0.56vw] border border-gray-300">
                      {req.status === "pending" ? (
                        <div className="flex justify-center items-center gap-[0.3vw]">
                          <button
                            onClick={() =>
                              handleAction(
                                req.id,
                                "approve",
                                requestSubTab === "Leave Request" ? "leave" : "permission"
                              )
                            }
                            className="p-[0.4vw] flex items-center justify-center bg-green-600 text-white rounded-full hover:bg-green-700 cursor-pointer transition-all"
                            title="Approve Request"
                          >
                            <CheckCircle size={"0.8vw"} />
                          </button>
                          <button
                            onClick={() =>
                              handleAction(
                                req.id,
                                "reject",
                                requestSubTab === "Leave Request" ? "leave" : "permission"
                              )
                            }
                            className="p-[0.4vw] flex items-center justify-center bg-red-600 text-white rounded-full hover:bg-red-700 cursor-pointer transition-all"
                            title="Reject Request"
                          >
                            <XCircle size={"0.8vw"} />
                          </button>
                          <button
                            onClick={() =>
                              openDeleteModal(
                                req.id,
                                requestSubTab === "Leave Request" ? "leave" : "permission"
                              )
                            }
                            disabled={deleting}
                            className="p-[0.4vw] flex items-center justify-center bg-gray-600 text-white rounded-full hover:bg-gray-700 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete Request"
                          >
                            <Trash2 size={"0.8vw"} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-center items-center gap-[0.3vw]">
                          <span
                            className={`px-[0.8vw] py-[0.3vw] rounded-full text-[0.75vw] font-medium ${
                              req.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                          </span>
                          <button
                            onClick={() =>
                              openDeleteModal(
                                req.id,
                                requestSubTab === "Leave Request" ? "leave" : "permission"
                              )
                            }
                            disabled={deleting}
                            className="p-[0.4vw] flex items-center justify-center bg-gray-600 text-white rounded-full hover:bg-gray-700 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete Request"
                          >
                            <Trash2 size={"0.8vw"} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-700 border border-gray-300 text-center">
                      {req.approved_by || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredRequests.length > 0 && (
        <div className="flex items-center justify-between px-[0.8vw] py-[0.5vw] h-[8%] bg-white border-t border-gray-200">
          <div className="text-[0.85vw] text-gray-600">
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + RECORDS_PER_PAGE, filteredRequests.length)} of{" "}
            {filteredRequests.length} entries
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className="px-[0.8vw] py-[0.4vw] flex items-center gap-[0.3vw] bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-[0.85vw] transition cursor-pointer"
            >
              <ChevronLeft size={"1vw"} />
              Previous
            </button>
            <span className="text-[0.85vw] text-gray-600 px-[0.5vw]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="px-[0.8vw] py-[0.4vw] flex items-center gap-[0.3vw] bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-[0.85vw] transition cursor-pointer"
            >
              Next
              <ChevronRight size={"1vw"} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestsTab;