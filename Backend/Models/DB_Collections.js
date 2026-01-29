const mongoose = require("mongoose");

const correction_date = new mongoose.Schema(
  {
    date: { type: Date, default: "" },
    time: { type: String, default: "" },
    employeeID: { type: String, default: "" },
  },
  { timestamps: true, default: "" },
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["In Progress", "Hold", "Canceled"],
      required: true,
    },
    changedBy: { type: String },
    reason: { type: String },
  },
  { timestamps: true },
);

const Project_details = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    projectName: { type: String, required: true },
    category: { type: String, required: true },
    department: { type: [String], required: true, default: [] },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    description: { type: String, default: "" },
    employeeID: { type: String, default: "" },
    percentage: { type: Number, default: 0 },
    priority:{ type: String, default: "Medium" },
    employees: { type: [String], default: [] },
    accessGrantedTo: [
      {
        employeeId: { type: String, required: true },
        grantedAt: { type: Date, default: Date.now },
      },
    ],
    correctionDate: [correction_date],
    status: {
      type: String,
      enum: ["In Progress", "Hold", "Canceled"],
      default: "In Progress",
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
  },
  { timestamps: true },
);

const pointSchema = new mongoose.Schema({
  text: { type: String, default: "" },
  completed: { type: Boolean, default: false },
});

const activitySchema = new mongoose.Schema(
  {
    activityName: { type: String, default: "" },
    department: { type: String, default: "" },
    employee: { type: String, default: "" },
    description: { type: String, default: "" },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    startTime: { type: String, default: "" },
    endTime: { type: String, default: "" },
    percentage: { type: Number, default: 0 },
    points: [pointSchema],
  },
  { timestamps: true },
);

const task = new mongoose.Schema(
  {
    projectId: { type: String, required: true },
    taskName: { type: String, default: "" },
    employeeID: { type: String, default: "" },
    description: { type: String, default: "" },
    startDate: { type: String, default: "" },
    startTime: { type: String, default: "" },
    endDate: { type: String, default: "" },
    endTime: { type: String, default: "" },
    employee: { type: String, default: "" },
    department: { type: String, default: "" },
    percentage: { type: Number, default: 0 },
    activities: [activitySchema],
    points: [pointSchema],
  },
  { timestamps: true },
);


const taskReport = new mongoose.Schema(
  {
    projectId: { type: String, required: true },
    taskId: { type: String, default: "" },
    activityId: { type: String, default: null },
    employeeID: { type: String, default: "" },
    percentage: { type: Number, default: 0 },
    outcome: { type: String, default: "" },
    adminRemarks: { type: String, default: "" },
    verifiedBy: { type: String, default: "" },
    verifiedAt: { type: Date, default: "" },
  },
  { timestamps: true }
);

const taskReportReview = new mongoose.Schema(
  {
    projectId: { type: String, required: true },
    taskId: { type: String, default: "" },
    activityId: { type: String, default: null },
    employeeID: { type: String, default: "" },
    percentage: { type: Number, default: 0 },
    status: { type: String, default: "" },
    outcome: { type: String, default: "" },
    adminRemarks: { type: String, default: "" },
    verifiedBy: { type: String, default: "" },
    verifiedAt: { type: Date, default: "" },
  },
  { timestamps: true }
);

const dayReport = new mongoose.Schema(
  {
    projectId: { type: String, required: true },
    taskId: { type: String, default: "" },
    activityId: { type: String, default: null },
    employeeID: { type: String, default: "" },
  },
  { timestamps: true }
);

const dateChangeRequestSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["denied", "approved", "requested"],
      default: "requested",
    },
    startDate: { type: String, default: "" },
    startTime: { type: String, default: "" },
    endDate: { type: String, default: "" },
    endTime: { type: String, default: "" },
    empRemarks: { type: String, default: "" },
    adminRemarks: { type: String, default: "" },
    updatedBy: { type: String, default: "" },
    updatedTime: { type: String, default: "" },
  },
  { timestamps: true }
);

const taskCommunicate = new mongoose.Schema(
  {
    projectId: { type: String, required: true },
    taskId: { type: String, default: "" },
    activityId: { type: String, default: null },
    employeeID: { type: String, default: "" },

    messages: [
      {
        senderId: { type: String, required: true },
        senderRole: { type: String, required: true },
        message: { type: String, default: "" },
        timestamp: { type: Date, default: Date.now },
      },
    ],

    dateChangeRequest: [dateChangeRequestSchema],

    readReceipts: {
      type: Object,
      default: {
        employee: { lastReadTime: null },
        admin: { lastReadTime: null },
      },
    },
  },
  { timestamps: true }
);


const Project_Details = mongoose.model("Project_details", Project_details);
const Tasks = mongoose.model("tasks", task);
const TaskReports = mongoose.model("taskReports", taskReport);
const TaskReportsReview = mongoose.model("taskReportsReview", taskReportReview);
const DayReport = mongoose.model("dayReport", dayReport);
const TaskCommunicate = mongoose.model("task_Communicate", taskCommunicate);

module.exports = {
  Project_Details,
  Tasks,
  TaskReports,
  TaskReportsReview,
  DayReport,
  TaskCommunicate,
};
