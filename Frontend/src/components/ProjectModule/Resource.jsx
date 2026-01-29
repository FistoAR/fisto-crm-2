import React, { useEffect, useRef, useState } from "react";
import { useNotification } from "../NotificationContext";
import { useLocation } from "react-router-dom";
import PreviewModal from "./PreviewModal";

const FolderIcon = ({ colorClass = "text-yellow-400" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={colorClass}>
    {" "}
    <path d="M10 4H4c-1.11 0-2 .89-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8c0-1.11-.9-2-2-2h-8l-2-2z" />{" "}
  </svg>
);
const BlueFolderIcon = () => (
  <svg viewBox="0 0 44 44" className="w-full h-full">
    {" "}
    <path
      fill="#69bbffff"
      d="M40 12H22l-4-4H8c-2.2 0-4 1.8-4 4v24c0 2.2 1.8 4 4 4h32c2.2 0 4-1.8 4-4V16c0-2.2-1.8-4-4-4z"
    />{" "}
    <path
      fill="#d3edffff"
      d="M40 12H8c-2.2 0-4 1.8-4 4v24c0 2.2 1.8 4 4 4h32c2.2 0 4-1.8 4-4V16c0-2.2-1.8-4-4-4z"
    />{" "}
  </svg>
);
const LinkIcon = () => (
  <svg
    className="h-[1.6vw] w-[1.6vw]"
    viewBox="0 0 45 45"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {" "}
    <path
      d="M31.0497 0.603936C31.5058 0.429818 32.2261 0.215428 32.649 0.125408C33.143 0.0211748 33.9071 -0.0202818 34.7813 0.00933007C35.53 0.034204 36.4375 0.134884 36.7952 0.233196C37.153 0.331507 37.7406 0.519838 38.0983 0.651315C38.4561 0.783976 39.1633 1.16182 39.668 1.48992C40.1727 1.81921 40.8799 2.38065 41.2376 2.73954C41.5954 3.09844 42.1581 3.80438 42.4874 4.30897C42.8156 4.81355 43.1935 5.5195 43.3262 5.8784C43.4577 6.23611 43.6448 6.82242 43.7408 7.18132C43.8368 7.54021 43.9457 8.31249 43.9837 8.8988C44.0216 9.50288 43.9908 10.3498 43.9114 10.8532C43.8344 11.3412 43.6389 12.1407 43.4754 12.6299C43.312 13.1179 42.9613 13.8914 42.6959 14.3474C42.2979 15.0308 41.1429 16.252 36.0987 21.3156C32.7355 24.6926 29.6637 27.6869 29.2728 27.97C28.8818 28.2543 28.2018 28.6487 27.7623 28.8489C27.3228 29.0491 26.5232 29.3191 25.9854 29.4482C25.3279 29.6069 24.6005 29.6851 23.7642 29.6851C22.9503 29.6851 22.1921 29.6069 21.5726 29.4589C21.0513 29.3345 20.3323 29.1047 19.9733 28.9472C19.6144 28.7908 19.0149 28.4663 18.6406 28.227C18.2662 27.9866 17.713 27.5649 17.4133 27.2877C17.1124 27.0106 16.7854 26.6244 16.6859 26.429C16.5876 26.2336 16.5059 25.8344 16.5059 25.5407C16.5059 25.2469 16.5935 24.8347 16.7001 24.6227C16.8068 24.4107 17.0662 24.1193 17.2782 23.9748C17.5294 23.803 17.8907 23.6964 18.3148 23.6704C18.887 23.6336 19.0315 23.6727 19.4995 23.9961C19.7921 24.1986 20.2991 24.5516 20.6249 24.7802C20.9506 25.01 21.4968 25.3014 21.8391 25.4281C22.1815 25.5549 22.8473 25.6923 23.3199 25.7325C23.8352 25.7775 24.4631 25.7491 24.8896 25.6627C25.2805 25.5833 25.9475 25.3535 26.3704 25.1533C27.067 24.8217 27.7043 24.2247 33.0766 18.8567C37.448 14.4895 39.1088 12.7543 39.3778 12.2746C39.578 11.9157 39.8256 11.3033 39.9274 10.9124C40.0305 10.5215 40.1134 9.88191 40.1134 9.49104C40.1134 9.10016 40.0293 8.46055 39.9274 8.06967C39.8256 7.67879 39.5993 7.09248 39.424 6.76675C39.2498 6.44102 38.8127 5.88076 38.4537 5.52305C38.096 5.16416 37.5356 4.72709 37.2099 4.55297C36.8841 4.37767 36.2977 4.15143 35.9068 4.04957C35.5158 3.9477 34.8761 3.86361 34.4852 3.86361C34.0943 3.86361 33.4545 3.94652 33.0636 4.04957C32.6727 4.15143 32.059 4.40017 31.7013 4.6039C31.2641 4.85146 29.9966 6.01461 27.8512 8.13837C24.8398 11.1185 24.6218 11.3092 24.1196 11.3921C23.6824 11.4644 23.4799 11.4288 22.9941 11.1955C22.6364 11.0249 22.2952 10.7478 22.1317 10.4978C21.9446 10.2112 21.8628 9.91034 21.8652 9.52065C21.8676 9.2115 21.9446 8.81115 22.037 8.6323C22.1294 8.45344 23.6883 6.83663 25.502 5.0386C27.7102 2.8497 29.0335 1.63087 29.5097 1.34542C29.9006 1.11089 30.5936 0.776869 31.0497 0.603936Z"
      fill="#549BFF"
    />{" "}
    <path
      d="M17.5154 14.7695C17.9881 14.6428 18.5069 14.5137 18.6704 14.4817C18.8339 14.4509 19.6596 14.4438 20.5066 14.4663C21.4567 14.4912 22.3191 14.5824 22.7574 14.7032C23.1484 14.8122 23.8947 15.1 24.4159 15.3452C24.9372 15.5892 25.7108 16.0677 26.1337 16.4076C26.5566 16.7488 27.0233 17.2238 27.1691 17.4642C27.3349 17.7354 27.4356 18.0932 27.4356 18.4047C27.4368 18.6818 27.3645 19.0549 27.2745 19.2338C27.1856 19.4127 26.9463 19.7064 26.7414 19.8853C26.5376 20.0641 26.1704 20.2442 25.9264 20.2844C25.6823 20.3247 25.2819 20.2986 25.0379 20.2252C24.7938 20.1518 24.3401 19.871 24.0309 19.5986C23.7217 19.3274 23.069 18.9175 22.5797 18.6878C21.8085 18.3253 21.5432 18.2625 20.5659 18.2163C19.8835 18.1832 19.2071 18.2187 18.8481 18.3075C18.5223 18.3881 17.9632 18.5894 17.6042 18.7565C17.0558 19.0111 16.0145 19.993 10.9951 24.9939C7.7184 28.2595 4.86815 31.197 4.66084 31.5227C4.45352 31.8484 4.18698 32.4348 4.06733 32.8256C3.93465 33.2615 3.85054 33.9023 3.85054 34.4839C3.85054 35.0986 3.93465 35.7015 4.08984 36.2014C4.22015 36.6242 4.48077 37.2106 4.66913 37.5043C4.8563 37.798 5.21762 38.2387 5.47232 38.485C5.72701 38.7314 6.17599 39.0939 6.4686 39.2905C6.76121 39.4871 7.34879 39.7536 7.77171 39.8815C8.2657 40.0308 8.88172 40.1149 9.48944 40.1137C10.0107 40.1125 10.7298 40.0272 11.0887 39.923C11.4477 39.8199 11.9807 39.5984 12.2734 39.4314C12.566 39.2656 14.2458 37.7021 16.005 35.9574C18.2546 33.7282 19.3089 32.7617 19.5589 32.7013C19.7544 32.6539 20.1808 32.6444 20.5066 32.6788C21.0113 32.7332 21.1653 32.815 21.5432 33.2284C21.8216 33.5316 22.0147 33.8798 22.0609 34.1582C22.1011 34.4022 22.0715 34.8155 21.9933 35.0761C21.8784 35.4611 21.2612 36.1398 18.6917 38.7042C16.5618 40.8303 15.261 42.0337 14.7019 42.395C14.2458 42.6899 13.4734 43.0915 12.9841 43.2869C12.4961 43.4823 11.6431 43.7323 11.0887 43.8448C10.3838 43.9869 9.77968 44.0284 9.07482 43.9834C8.5204 43.949 7.6414 43.8069 7.12015 43.6695C6.59891 43.5309 5.79928 43.2395 5.34319 43.0204C4.8871 42.8025 4.1005 42.2979 3.59584 41.8999C3.09118 41.5019 2.43489 40.8694 2.13873 40.4951C1.84257 40.1208 1.41965 39.4942 1.19931 39.1033C0.978965 38.7125 0.66385 37.9935 0.501554 37.5043C0.338074 37.0163 0.144977 36.1362 0.0727137 35.5499C-0.0232424 34.7729 -0.0244271 34.1949 0.0703444 33.4179C0.142608 32.8316 0.346366 31.9254 0.522878 31.4043C0.700574 30.8831 1.10691 30.0303 1.42558 29.5091C1.91483 28.7096 2.9123 27.6495 7.82028 22.7197C11.0188 19.5062 13.9555 16.6351 14.3465 16.339C14.7374 16.044 15.4174 15.6212 15.8569 15.4008C16.2964 15.1794 17.0427 14.8963 17.5154 14.7695Z"
      fill="#112D55"
    />{" "}
  </svg>
);
const UploadIcon = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {" "}
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />{" "}
    <polyline points="17 8 12 3 7 8" /> <line x1="12" y1="3" x2="12" y2="15" />{" "}
  </svg>
);
const XIcon = () => (
  <svg
    className="w-[1.2vw] h-[1.2vw]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {" "}
    <line x1="18" y1="6" x2="6" y2="18"></line>{" "}
    <line x1="6" y1="6" x2="18" y2="18"></line>{" "}
  </svg>
);
const FileIcon = () => (
  <svg
    className="w-[1.4vw] h-[1.4vw] text-blue-500"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {" "}
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>{" "}
    <polyline points="13 2 13 9 20 9"></polyline>{" "}
  </svg>
);
const RedXIcon = () => (
  <svg
    className="w-[1.2vw] h-[1.2vw] text-red-500"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {" "}
    <line x1="18" y1="6" x2="6" y2="18"></line>{" "}
    <line x1="6" y1="6" x2="18" y2="18"></line>{" "}
  </svg>
);
const TrashCanIcon = () => (
  <svg
    className="w-[1vw] h-[1vw] text-red-500"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {" "}
    <polyline points="3 6 5 6 21 6"></polyline>{" "}
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>{" "}
    <line x1="10" y1="11" x2="10" y2="17"></line>{" "}
    <line x1="14" y1="11" x2="14" y2="17"></line>{" "}
  </svg>
);
const EyeIcon = () => (
  <svg
    className="w-[1vw] h-[1vw] text-gray-600"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {" "}
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>{" "}
    <circle cx="12" cy="12" r="3"></circle>{" "}
  </svg>
);
const DownloadIcon = () => (
  <svg
    className="w-[1vw] h-[1vw] text-gray-600"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {" "}
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>{" "}
    <polyline points="7 10 12 15 17 10"></polyline>{" "}
    <line x1="12" y1="15" x2="12" y2="3"></line>{" "}
  </svg>
);
const CopyIcon = () => (
  <svg
    className="w-[1vw] h-[1vw] text-gray-600"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {" "}
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>{" "}
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>{" "}
  </svg>
);
const CheckIcon = () => (
  <svg
    className="w-[1vw] h-[1vw] text-green-500"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {" "}
    <polyline points="20 6 9 17 4 12"></polyline>{" "}
  </svg>
);

const API_URL = import.meta.env.VITE_API_BASE_URL;

const formatFileSize = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const UploadModal = ({
  fileType,
  projectId,
  employeeId,
  onClose,
  onUploadSuccess,
  storageInfo,
}) => {
  const [links, setLinks] = useState([{ name: "", url: "" }]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    inProgress: false,
    completed: 0,
    total: 0,
  });
  const [isLinkUploading, setIsLinkUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { notify } = useNotification();

  const handleFileChange = (newFiles) => {
    if (!newFiles) return;
    setUploadedFiles((prev) => [...prev, ...Array.from(newFiles)]);
  };
  const handleRemoveFile = (indexToRemove) =>
    setUploadedFiles((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  const handleLinkChange = (index, field, value) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    setLinks(newLinks);
  };
  const handleRemoveLink = (indexToRemove) => {
    if (links.length > 1)
      setLinks((prev) => prev.filter((_, index) => index !== indexToRemove));
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };
  const commonDragEvents = {
    onDragEnter: (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    },
    onDragLeave: (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    },
    onDragOver: (e) => {
      e.preventDefault();
      e.stopPropagation();
    },
    onDrop: handleDrop,
  };

  const handleFileSubmit = async () => {
    if (uploadedFiles.length === 0) {
      notify({
        title: "Warning",
        message: "Please select at least one file to upload.",
      });
      return;
    }
    if (isOverLimit) {
      notify({
        title: "Error",
        message: `Cannot upload. Storage limit of ${formatFileSize(
          limit
        )} will be exceeded.`,
      });
      return;
    }

    setUploadProgress({
      inProgress: true,
      completed: 0,
      total: uploadedFiles.length,
    });

    let successfulUploads = 0;

    for (const file of uploadedFiles) {
      const formData = new FormData();
      formData.append("files", file);
      if (employeeId) {
        formData.append("employeeID", employeeId);
      }

      try {
        const response = await fetch(
          `${API_URL}/resources/${projectId}/files`,
          {
            method: "POST",
            body: formData,
          }
        );
        const result = await response.json();

        if (!response.ok) {
          notify({
            title: "Error",
            message: `Failed to upload ${file.name}: ${result.message}`,
          });
        } else {
          successfulUploads++;
        }
      } catch (error) {
        notify({
          title: "Error",
          message: `A network error occurred while uploading ${file.name}.`,
        });
      } finally {
        setUploadProgress((prev) => ({
          ...prev,
          completed: prev.completed + 1,
        }));
      }
    }

    setUploadProgress({ inProgress: false, completed: 0, total: 0 });

    if (successfulUploads > 0) {
      notify({
        title: "Success",
        message: `${successfulUploads} out of ${uploadedFiles.length} files uploaded successfully.`,
      });
      onUploadSuccess();
    }

    if (successfulUploads === uploadedFiles.length) {
      onClose();
    }
  };

  const handleLinkSubmit = async () => {
    const validLinks = links
      .filter((link) => link.name.trim() !== "" && link.url.trim() !== "")
      .map((link) => ({ linkname: link.name, linkurl: link.url }));
    if (validLinks.length === 0) {
      notify({
        title: "Warning",
        message: "Please provide a name and URL for at least one link.",
      });
      return;
    }
    if (validLinks.length < links.length) {
      notify({
        title: "Warning",
        message: "Some links are incomplete. Please fill in both name and URL.",
      });
      return;
    }

    setIsLinkUploading(true);
    try {
      const response = await fetch(`${API_URL}/resources/${projectId}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links: validLinks, employeeID: employeeId }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Failed to add links.");
      notify({ title: "Success", message: result.message });
      onUploadSuccess();
      onClose();
    } catch (error) {
      notify({ title: "Error", message: error.message });
    } finally {
      setIsLinkUploading(false);
    }
  };

  const handleSubmit = () => {
    if (fileType === "folder") handleFileSubmit();
    else if (fileType === "link") handleLinkSubmit();
  };

  const isFileModal = fileType === "folder";
  const { used = 0, limit = 1 } = storageInfo || {};
  const newFilesSize = uploadedFiles.reduce((acc, file) => acc + file.size, 0);
  const projectedUsage = used + newFilesSize;
  const isOverLimit = projectedUsage > limit;

  const storageIndicator = () => {
    if (!isFileModal) return null;

    const currentUsagePercent = limit > 0 ? (used / limit) * 100 : 0;
    const projectedPercent = limit > 0 ? (projectedUsage / limit) * 100 : 0;

    const newFilesPercent =
      Math.min(projectedPercent, 100) - currentUsagePercent;
    const barColorClass =
      projectedPercent > 80
        ? "bg-red-500"
        : projectedPercent > 50
        ? "bg-yellow-400"
        : "bg-green-500";

    return (
      <div className="w-[50%] flex items-end flex-col">
        <div className="flex justify-between items-end mb-1">
          {isOverLimit && (
            <p className="text-[0.6vw] text-red-600 font-medium">
              Storage limit exceeded!
            </p>
          )}
          <p
            className={`text-[0.7vw] text-right ml-auto ${
              isOverLimit ? "text-red-600 font-semibold" : "text-gray-600"
            }`}
          >
            {formatFileSize(projectedUsage)} / {formatFileSize(limit)}
          </p>
        </div>
        <div
          className="relative w-[29%] h-[0.5vw] bg-gray-200 rounded-full overflow-hidden"
          title={`Used: ${formatFileSize(used)} | New: ${formatFileSize(
            newFilesSize
          )}`}
        >
          <div
            className={`absolute h-full ${barColorClass}`}
            style={{ width: `${currentUsagePercent}%` }}
          />
          <div
            className={`absolute h-full ${barColorClass} transition-all duration-300`}
            style={{
              left: `${currentUsagePercent}%`,
              width: `${newFilesPercent > 0 ? newFilesPercent : 0}%`,
            }}
          />
        </div>
      </div>
    );
  };

  const fileUploadContent = (
    <>
      <div
        {...commonDragEvents}
        onClick={() => fileInputRef.current.click()}
        className={`border-2 border-dashed hover:border-blue-500 hover:bg-blue-50 rounded-2xl p-[2vw] mt-[1.5vw] cursor-pointer text-center transition-colors ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept=".doc,.docx,.webp,.jpg,.jpeg,.pdf,.zip"
          onChange={(e) => handleFileChange(e.target.files)}
        />
        <div className="w-[2.8vw] h-[2.8vw] mx-auto bg-gray-100 rounded-full flex items-center justify-center">
          {" "}
          <UploadIcon className="w-[1.5vw] h-[1.5vw] text-gray-500" />{" "}
        </div>
        <p className="text-[0.9vw] font-medium text-gray-700 mt-[1vw]">
          {" "}
          Drag & drop your files here or click to browse{" "}
        </p>
        <p className="text-[0.75vw] text-gray-500 mt-[0.2vw]">
          {" "}
          Allowed formats: .DOC, .DOCX, .PNG, .JPG, .JPEG, .PDF, .ZIP | Max
          size: 50MB{" "}
        </p>
      </div>
      {uploadedFiles.length > 0 && (
        <div className="mt-[0.7vw] space-y-[0.5vw]">
          <p className="text-[0.9vw] font-medium text-gray-800">
            {" "}
            Selected Files:{" "}
          </p>
          <div
            className="max-h-[20vh] overflow-y-auto p-[0.2vw] space-y-[0.5vw]"
            style={{ scrollbarWidth: "thin" }}
          >
            {uploadedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="border border-gray-200 rounded-lg px-[1vw] py-[0.6vw] flex items-center justify-between"
              >
                <div className="flex items-center gap-[0.8vw]">
                  <FileIcon />
                  <div>
                    {" "}
                    <p className="text-[0.8vw] font-medium text-gray-900">
                      {file.name}
                    </p>{" "}
                    <p className="text-[0.7vw] text-gray-500">
                      {formatFileSize(file.size)}
                    </p>{" "}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="cursor-pointer p-[0.4vw] rounded-full hover:bg-red-100 transition-colors"
                  aria-label={`Remove ${file.name}`}
                >
                  {" "}
                  <RedXIcon />{" "}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  const linkInputContent = (
    <div className="mt-[1.5vw] space-y-[1vw]">
      <div
        className="max-h-[32vh] overflow-y-auto p-1 space-y-[1vw]"
        style={{ scrollbarWidth: "thin" }}
      >
        {links.map((link, index) => (
          <div key={index} className="flex items-center gap-[0.8vw]">
            <input
              type="text"
              value={link.name}
              onChange={(e) => handleLinkChange(index, "name", e.target.value)}
              placeholder="Link name"
              className="w-1/3 border border-gray-300 rounded-full px-[1vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={link.url}
              onChange={(e) => handleLinkChange(index, "url", e.target.value)}
              placeholder="https://example.com"
              className="flex-grow border border-gray-300 rounded-full px-[1vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {links.length > 1 && (
              <button
                onClick={() => handleRemoveLink(index)}
                className="flex-shrink-0 w-[1.5vw] h-[1.5vw] p-1 cursor-pointer bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                aria-label="Remove link"
              >
                <XIcon />
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={() => setLinks([...links, { name: "", url: "" }])}
        className="flex items-center cursor-pointer gap-[0.5vw] text-[0.8vw] font-medium text-white bg-black rounded-full px-[1vw] py-[0.5vw] hover:bg-black/75 transition-colors"
      >
        {" "}
        <span className="text-[1.2vw] leading-none">+</span> Add another link{" "}
      </button>
    </div>
  );

  const getButtonText = () => {
    if (isFileModal) {
      if (uploadProgress.inProgress) {
        return `Uploading ${uploadProgress.completed + 1} of ${
          uploadProgress.total
        }...`;
      }
      if (uploadedFiles.length > 0) {
        return `Upload ${uploadedFiles.length} file${
          uploadedFiles.length !== 1 ? "s" : ""
        }`;
      }
      return "Upload";
    }
    if (isLinkUploading) {
      return "Uploading...";
    }
    return "Upload";
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[1vw]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[45vw] p-[1vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-[1.23vw] ">
            {isFileModal ? "Upload assets" : "Upload link"}
          </h2>
          {storageIndicator()}
        </div>
        {isFileModal ? fileUploadContent : linkInputContent}
        <div className="flex justify-end gap-[0.5vw] mt-[2vw]">
          <button
            onClick={onClose}
            className="bg-gray-200 cursor-pointer text-gray-800 text-[0.8vw] font-medium px-[1.1vw] py-[0.4vw] rounded-full hover:bg-gray-300 transition-colors"
          >
            {" "}
            Cancel{" "}
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              uploadProgress.inProgress ||
              isLinkUploading ||
              (isFileModal && (isOverLimit || uploadedFiles.length === 0))
            }
            className="bg-blue-600 cursor-pointer text-white text-[0.8vw] font-medium px-[1.1vw] py-[0.4vw] rounded-full hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {getButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
};

const ViewModal = ({
  type,
  data,
  projectId,
  onClose,
  onDeleteSuccess,
  userRole,
}) => {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const { notify } = useNotification();

  // NEW: State for staging deletions
  const [itemsToDelete, setItemsToDelete] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDownload = async (file) => {
    if (downloadingId === file._id) return;
    setDownloadingId(file._id);

    try {
      const fileUrl = `${API_URL}/${file.filepath}`;
      const response = await fetch(fileUrl);
      if (!response.ok)
        throw new Error(`Failed to download file: ${response.statusText}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", file.filename);
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        link.parentNode.removeChild(link);
      }, 100);
    } catch (error) {
      console.error("Download error:", error);
      notify({
        title: "Error",
        message: "Could not download the file. Please try again.",
      });
    } finally {
      setTimeout(() => setDownloadingId(null), 2000);
    }
  };

  const isPreviewable = (file) => {
    const fileType = file.mimetype || "";
    const nonPreviewableTypes = [
      "application/zip",
      "application/x-zip-compressed",
      "application/octet-stream",
    ];
    return !nonPreviewableTypes.includes(fileType);
  };

  const toggleItemForDeletion = (id) => {
    setItemsToDelete((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleConfirmDeletions = async () => {
    if (itemsToDelete.length === 0) return;

    if (
      !window.confirm(
        `Are you sure you want to delete ${itemsToDelete.length} item(s)? This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    const endpoint = isFileView ? "files" : "links";
    const deletePromises = itemsToDelete.map((id) =>
      fetch(`${API_URL}/resources/${projectId}/${endpoint}/${id}`, {
        method: "DELETE",
      })
    );

    const results = await Promise.allSettled(deletePromises);

    let successCount = 0;
    let failureCount = 0;

    results.forEach((result) => {
      if (result.status === "fulfilled" && result.value.ok) {
        successCount++;
      } else {
        failureCount++;
      }
    });

    if (successCount > 0) {
      notify({
        title: "Success",
        message: `${successCount} item(s) deleted successfully.`,
      });
      onDeleteSuccess();
    }
    if (failureCount > 0) {
      notify({
        title: "Error",
        message: `Failed to delete ${failureCount} item(s). Please try again.`,
      });
    }

    setIsDeleting(false);
    setItemsToDelete([]);
    onClose();
  };

  const handleCopyLink = (url, index) => {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      })
      .catch((err) =>
        notify({ title: "Error", message: "Failed to copy link." })
      );
  };

  const isFileView = type === "folder";

  const fileViewContent = (
    <div className="space-y-[0.8vw]">
      {data.map((file) => {
        const isMarkedForDeletion = itemsToDelete.includes(file._id);
        return (
          <div
            key={file._id}
            className={`border border-gray-300 rounded-lg p-[0.8vw] flex items-center justify-between transition-colors ${
              isMarkedForDeletion ? "bg-red-50 opacity-70" : "hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-[0.8vw] min-w-0">
              <FileIcon />
              <div className="truncate">
                <p className="text-[0.8vw] font-medium text-gray-900 truncate">
                  {file.filename}
                </p>
                <p className="text-[0.7vw] text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-[0.8vw] flex-shrink-0">
              <button
                onClick={() => setPreviewFile(file)}
                disabled={!isPreviewable(file) || isMarkedForDeletion}
                className="cursor-pointer p-[0.4vw] rounded-full hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                title={
                  isPreviewable(file) ? "Preview" : "Preview not available"
                }
              >
                <EyeIcon />
              </button>
              <button
                onClick={() => handleDownload(file)}
                disabled={downloadingId === file._id || isMarkedForDeletion}
                className="cursor-pointer p-[0.4vw] rounded-full hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-40"
                title="Download"
              >
                {downloadingId === file._id ? <CheckIcon /> : <DownloadIcon />}
              </button>
              {userRole !== "Employee" && (
                <button
                  onClick={() => toggleItemForDeletion(file._id)}
                  className="cursor-pointer p-[0.4vw] rounded-full hover:bg-red-100"
                  title={`Mark ${file.filename} for deletion`}
                >
                  <TrashCanIcon />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const linkViewContent = (
    <div className="space-y-[0.8vw]">
      {data.map((link, index) => {
        const isMarkedForDeletion = itemsToDelete.includes(link._id);
        return (
          <div
            key={link._id}
            className={`border border-gray-200 rounded-lg p-[0.8vw] flex items-center justify-between transition-colors ${
              isMarkedForDeletion ? "bg-red-50 opacity-70" : "hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-[0.8vw] overflow-hidden">
              <div className="w-[1.5vw] h-[1.5vw] flex-shrink-0 flex items-center justify-center">
                <LinkIcon />
              </div>
              <div className="overflow-hidden">
                <p className="text-[0.8vw] font-medium text-gray-900 truncate">
                  {link.linkname}
                </p>
                <a
                  href={link.linkurl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-[0.7vw] text-blue-600 hover:underline truncate block ${
                    isMarkedForDeletion ? "pointer-events-none" : ""
                  }`}
                >
                  {link.linkurl}
                </a>
              </div>
            </div>
            <div className="flex items-center gap-[0.8vw] flex-shrink-0">
              <button
                onClick={() => handleCopyLink(link.linkurl, index)}
                disabled={isMarkedForDeletion}
                className="cursor-pointer p-[0.4vw] rounded-full hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Copy link"
              >
                {copiedIndex === index ? <CheckIcon /> : <CopyIcon />}
              </button>
              {userRole !== "Employee" && (
                <button
                  onClick={() => toggleItemForDeletion(link._id)}
                  className="cursor-pointer p-[0.4vw] rounded-full hover:bg-red-100"
                  title={`Mark ${link.linkname} for deletion`}
                >
                  <TrashCanIcon />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-[45vw] p-[1vw] "
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start">
            <h2 className="text-[1.1vw] mb-[1.5vw]">
              {" "}
              {isFileView ? "View Uploaded Files" : "View Saved Links"}{" "}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full p-1 cursor-pointer"
            >
              {" "}
              <XIcon />{" "}
            </button>
          </div>
          <div
            className="max-h-[50vh] overflow-y-auto p-1"
            style={{ scrollbarWidth: "thin" }}
          >
            {data.length > 0 ? (
              isFileView ? (
                fileViewContent
              ) : (
                linkViewContent
              )
            ) : (
              <p className="text-center text-gray-500 text-[0.9vw] py-[2vw]">
                {" "}
                No items to display.{" "}
              </p>
            )}
          </div>
          <div className="flex justify-end items-center gap-[0.5vw] mt-[2vw]">
            <button
              onClick={onClose}
              className="bg-gray-200 cursor-pointer text-gray-800 text-[0.8vw] font-medium px-[1.5vw] py-[0.6vw] rounded-full hover:bg-gray-300 transition-colors"
            >
              {itemsToDelete.length > 0 ? "Cancel" : "Close"}
            </button>
            {userRole !== "Employee" && itemsToDelete.length > 0 && (
              <button
                onClick={handleConfirmDeletions}
                disabled={isDeleting}
                className="bg-red-600 cursor-pointer text-white text-[0.8vw] font-medium px-[1.5vw] py-[0.6vw] rounded-full hover:bg-red-700 transition-colors disabled:bg-red-300 disabled:cursor-wait"
              >
                {isDeleting
                  ? "Deleting..."
                  : `Deletion (${itemsToDelete.length})`}
              </button>
            )}
          </div>
        </div>
      </div>

      {previewFile && (
        <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </>
  );
};

const ResourceRow = ({
  title,
  tag,
  type,
  onUploadClick,
  onViewClick,
  userRole,
}) => {
  const getIcon = () => {
    switch (type) {
      case "folder":
        return <BlueFolderIcon />;
      case "link":
        return <LinkIcon />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-[1vw] flex items-center justify-between w-full">
      <div className="flex items-center gap-[1vw]">
        <div className="w-[2vw] h-[2vw] flex-shrink-0 flex items-center justify-center">
          {getIcon()}
        </div>
        <div>
          <h3 className="text-[0.8vw] font-medium text-gray-800">{title}</h3>
          {tag && (
            <span className="text-[0.75vw] text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-[0.8vw] py-[0.2vw] mt-[0.5vw] inline-block">
              {tag}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-[0.8vw]">
        {userRole !== "Employee" && (
          <button
            onClick={() => onUploadClick(type)}
            className="flex cursor-pointer items-center gap-[0.5vw] bg-blue-600 text-white text-[0.7vw] font-medium px-[1.5vw] py-[0.5vw] rounded-full hover:bg-blue-700 transition-colors"
          >
            <UploadIcon className="w-[0.9vw] h-[0.9vw] text-white" />
            <span>Upload</span>
          </button>
        )}
        <button
          onClick={() => onViewClick(type)}
          className="bg-gray-800 text-white text-[0.7vw] cursor-pointer font-medium px-[1.2vw] py-[0.3vw] rounded-full hover:bg-gray-900 transition-colors"
        >
          View
        </button>
      </div>
    </div>
  );
};

// --- Main Resource Component (No Changes Needed) ---
export default function Resource() {
  const location = useLocation();
  const { notify } = useNotification();

  const [resources, setResources] = useState({ files: [], links: [] });
  const [storageInfo, setStorageInfo] = useState({ used: 0, limit: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [uploadModalState, setUploadModalState] = useState({
    isOpen: false,
    type: "folder",
  });
  const [viewModalState, setViewModalState] = useState({
    isOpen: false,
    type: "folder",
  });

  const { projectId, projectName } = location.state || {};
  const userData =
    sessionStorage.getItem("user") || localStorage.getItem("user");
  const employeeId = userData ? JSON.parse(userData).id : null;
  const userRole = userData ? JSON.parse(userData).role : null;

  const fetchResources = async () => {
    if (!projectId) return;
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/resources/${projectId}`);
      if (response.status === 404) {
        setResources({ files: [], links: [] });
        setStorageInfo({ used: 0, limit: 50 * 1024 * 1024 }); // Default on 404
        return;
      }
      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(
          errorResult.message || "Could not fetch project resources."
        );
      }

      const result = await response.json();

      if (result.ok) {
        if (result.message === "No resources found for this project.") return;
      }

      const data = result.data || {};

      setResources({ files: data.files || [], links: data.links || [] });

      const used =
        data.storageUsed ??
        (data.files || []).reduce((acc, file) => acc + (file.size || 0), 0);
      const limit = data.storageLimit ?? 50 * 1024 * 1024; // Fallback to 50MB

      setStorageInfo({ used, limit });
    } catch (error) {
      notify({ title: "Error", message: error.message });
      setResources({ files: [], links: [] });
      setStorageInfo({ used: 0, limit: 50 * 1024 * 1024 }); // Reset on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchResources();
    } else {
      setIsLoading(false);
    }
  }, [projectId]);

  const handleOpenUploadModal = (type) =>
    setUploadModalState({ isOpen: true, type });
  const handleCloseUploadModal = () =>
    setUploadModalState({ isOpen: false, type: "folder" });
  const handleOpenViewModal = (type) =>
    setViewModalState({ isOpen: true, type });
  const handleCloseViewModal = () =>
    setViewModalState({ isOpen: false, type: "folder" });

  if (!projectId) {
    return (
      <div className="  text-center">
        <h2 className="text-lg font-semibold text-gray-700">
          No Project Selected
        </h2>
        <p className="text-gray-500">
          Please select a project to view its resources.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-[1.8vw] w-[1.8vw] border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="bg-white rounded-2xl shadow-sm p-[0.8vw] mt-[0.4vw] flex items-center">
        <div className="flex items-center gap-[0.8vw]">
          <div className="w-[1.5vw] h-[1.5vw]">
            <FolderIcon />
          </div>
          <h1 className="text-[0.8vw] font-medium text-gray-800">
            Assets & Shared Links -{" "}
            <span className="text-gray-500">{projectName || "Project"}</span>
          </h1>
        </div>
      </header>

      <main className="mt-[2vh] space-y-[2vh]">
        <ResourceRow
          title="Project requirements"
          tag="Note : File type is folder please compress to Zip and upload"
          type="folder"
          onUploadClick={handleOpenUploadModal}
          onViewClick={handleOpenViewModal}
          userRole={userRole}
        />
        <ResourceRow
          title="Reference links"
          tag="Link"
          type="link"
          onUploadClick={handleOpenUploadModal}
          onViewClick={handleOpenViewModal}
          userRole={userRole}
        />
      </main>

      {uploadModalState.isOpen && (
        <UploadModal
          fileType={uploadModalState.type}
          projectId={projectId}
          employeeId={employeeId}
          onClose={handleCloseUploadModal}
          onUploadSuccess={fetchResources}
          storageInfo={storageInfo}
        />
      )}

      {viewModalState.isOpen && (
        <ViewModal
          type={viewModalState.type}
          data={
            viewModalState.type === "folder"
              ? resources.files || []
              : resources.links || []
          }
          projectId={projectId}
          onClose={handleCloseViewModal}
          onDeleteSuccess={fetchResources}
          userRole={userRole}
        />
      )}
    </div>
  );
}
