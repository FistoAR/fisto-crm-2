import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import fistoLogo from "../../assets/Fisto Logo.png";

class ExportInternReportPDF {
  export(data, employeeName, employeeId, startDate, endDate) {
    const doc = new jsPDF("l", "mm", "a4");

    // Logo with auto height
    const img = new Image();
    img.src = fistoLogo;

    img.onload = () => {
      const desiredWidth = 42; // mm
      const ratio = img.height / img.width;
      const desiredHeight = desiredWidth * ratio;

      doc.addImage(img, "PNG", 14, 8, desiredWidth, desiredHeight);

      // Format report title with date range
      const reportDate = startDate ? new Date(startDate) : new Date();
      const monthYear = reportDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });

      // Format date range for header
      let dateRangeText = monthYear;
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const startFormatted = start.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        const endFormatted = end.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        dateRangeText = `${startFormatted} to ${endFormatted}`;
      } else if (startDate) {
        const start = new Date(startDate);
        dateRangeText = `From ${start.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}`;
      } else if (endDate) {
        const end = new Date(endDate);
        dateRangeText = `Until ${end.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}`;
      }

      // Employee info (top right)
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const empName = employeeName || "All Employees";
      const empId = employeeId || "All";
      doc.text(empName, 240, 15);
      doc.text(empId, 240, 21);

      // Centered report title
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(
        `${monthYear} Monthly Report`,
        doc.internal.pageSize.width / 2,
        30,
        { align: "center" }
      );

      // Date range subtitle
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Period: ${dateRangeText}`,
        doc.internal.pageSize.width / 2,
        35,
        { align: "center" }
      );

      // Generation timestamp
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Generated on: ${new Date().toLocaleDateString(
          "en-IN"
        )} ${new Date().toLocaleTimeString("en-IN")}`,
        14,
        40
      );

      const isAllEmployees = !employeeId || employeeId === "all";

      const headers = isAllEmployees
        ? [[
            "Employee Name",
            "Date",
            "Day",
            "Morning In",
            "Morning Out",
            "Afternoon In",
            "Afternoon Out",
            "Hours",
            "Section",
            "Project Name",
            "Work Done",
          ]]
        : [[
            "Date",
            "Day",
            "Morning In",
            "Morning Out",
            "Afternoon In",
            "Afternoon Out",
            "Hours",
            "Section",
            "Project Name",
            "Work Done",
          ]];

      // ✅ SORT DATA BY DATE (Chronological Order - Oldest to Newest)
      const sortedData = [...data].sort((a, b) => {
        return new Date(a.report_date) - new Date(b.report_date);
      });

      const rows = sortedData.map((row) => {
        const date = new Date(row.report_date);
        const formattedDate = date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });

        // Get day of week
        const dayOfWeek = date.toLocaleDateString("en-GB", {
          weekday: "short",
        });

        // Check if Sunday
        const isSunday = date.getDay() === 0;

        const morningIn = formatTime(row.morning_in);
        const morningOut = formatTime(row.morning_out);
        const afternoonIn = formatTime(row.afternoon_in);
        const afternoonOut = formatTime(row.afternoon_out);

        const isLate = checkIfLate(row.morning_in);

        return {
          employeeName: row.employee_name || "-",
          date: formattedDate,
          dayOfWeek: dayOfWeek,
          morningIn,
          morningOut,
          afternoonIn,
          afternoonOut,
          hours: row.hours || "0",
          section: row.section || "-",
          projectName: row.project_name || "-",
          workDone: row.work_done || "-",
          isLate,
          isSunday: isSunday,
        };
      });

      const body = rows.map((row) =>
        isAllEmployees
          ? [
              row.employeeName,
              row.date,
              row.dayOfWeek,
              row.morningIn,
              row.morningOut,
              row.afternoonIn,
              row.afternoonOut,
              row.hours,
              row.section,
              row.projectName,
              row.workDone,
            ]
          : [
              row.date,
              row.dayOfWeek,
              row.morningIn,
              row.morningOut,
              row.afternoonIn,
              row.afternoonOut,
              row.hours,
              row.section,
              row.projectName,
              row.workDone,
            ]
      );

      const columnStyles = isAllEmployees
        ? {
            0: { cellWidth: 26 },
            1: { cellWidth: 18, halign: "center" },
            2: { cellWidth: 12, halign: "center" },
            3: { cellWidth: 15, halign: "center" },
            4: { cellWidth: 15, halign: "center" },
            5: { cellWidth: 15, halign: "center" },
            6: { cellWidth: 15, halign: "center" },
            7: { cellWidth: 11, halign: "center" },
            8: { cellWidth: 18 },
            9: { cellWidth: 28 },
            10: { cellWidth: 85 },
          }
        : {
            0: { cellWidth: 18, halign: "center" },
            1: { cellWidth: 12, halign: "center" },
            2: { cellWidth: 15, halign: "center" },
            3: { cellWidth: 15, halign: "center" },
            4: { cellWidth: 15, halign: "center" },
            5: { cellWidth: 15, halign: "center" },
            6: { cellWidth: 11, halign: "center" },
            7: { cellWidth: 18 },
            8: { cellWidth: 28 },
            9: { cellWidth: 100 },
          };

      autoTable(doc, {
        head: headers,
        body: body,
        startY: 44,
        styles: {
          fontSize: 8,
          cellPadding: 3,
          overflow: "linebreak",
          halign: "left",
          valign: "middle",
          lineColor: [0, 0, 0],
          lineWidth: 0.3,
        },
        headStyles: {
          fillColor: [76, 175, 80],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
          lineColor: [0, 0, 0],
          lineWidth: 0.3,
        },
        alternateRowStyles: {
          fillColor: [249, 249, 249],
        },
        columnStyles,
        margin: { left: 10, right: 10 },
        didParseCell: function (dataCell) {
          if (dataCell.section !== "body") return;

          const rowData = rows[dataCell.row.index];
          if (!rowData) return;

          dataCell.cell.styles.lineColor = [0, 0, 0];
          dataCell.cell.styles.lineWidth = 0.3;

          // Sunday Holiday - Green background
          if (rowData.isSunday) {
            dataCell.cell.styles.fillColor = [204, 255, 204];
            return;
          }

          // Late arrival - Yellow background
          if (rowData.isLate) {
            dataCell.cell.styles.fillColor = [255, 255, 204];
          }
        },
        didDrawPage: function (dataCell) {
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(102, 102, 102);
          doc.text(
            `Page ${dataCell.pageNumber} of ${pageCount}`,
            dataCell.settings.margin.left,
            doc.internal.pageSize.height - 10
          );
        },
      });

      const fileName = `${empName.replace(/\s+/g, "_")}_${dateRangeText.replace(
        /\s+/g,
        "_"
      )}_Report.pdf`;
      doc.save(fileName);
    };
  }
}

// Helper function to format time from HH:MM:SS to 12-hour format
function formatTime(timeString) {
  if (!timeString) return "-";

  try {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const minute = parseInt(minutes);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;

    return `${displayHour}:${minute.toString().padStart(2, "0")} ${ampm}`;
  } catch (error) {
    return timeString;
  }
}

// Helper function to check if late (after 9:45 AM)
function checkIfLate(timeString) {
  if (!timeString) return false;

  try {
    const [hours, minutes] = timeString.split(":");
    const timeInMinutes = parseInt(hours) * 60 + parseInt(minutes);
    const thresholdMinutes = 9 * 60 + 45; // 9:45 AM
    return timeInMinutes > thresholdMinutes;
  } catch (error) {
    return false;
  }
}

export default ExportInternReportPDF;