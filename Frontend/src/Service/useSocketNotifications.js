import { useEffect, useRef, useCallback, useState } from "react";
import { io } from "socket.io-client";
import Logo from "../assets/NotificationLogo.png";
import LargeLogo from "../assets/NotificationLargeLogo.png";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function useSocketNotifications() {
  const socketRef = useRef(null);
  const audioRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const audioContextRef = useRef(null);
  const audioBufferRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get current employee ID
  const getCurrentEmployeeId = useCallback(() => {
    try {
      const storedUser =
        sessionStorage.getItem("user") || localStorage.getItem("user");
      if (!storedUser) return null;

      const userData = JSON.parse(storedUser);
      return (
        userData.userName ||
        userData.employeeId ||
        userData.employee_id ||
        userData._id ||
        userData.id ||
        null
      );
    } catch (error) {
      console.error(
        "useSocketNotifications: Error getting employee ID:",
        error
      );
      return null;
    }
  }, []);

  // Fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    const employeeId = getCurrentEmployeeId();
    if (!employeeId) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/notifications/${employeeId}`
      );
      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentEmployeeId]);

  // Save notification to database (ENTIRE NOTIFICATION AS JSON)
  const saveNotificationToDatabase = useCallback(
    async (notification) => {
      const employeeId = getCurrentEmployeeId();
      if (!employeeId) return;

      try {
        const response = await fetch(`${API_BASE_URL}/notifications`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId,
            notification,
          }),
        });

        if (response.ok) {
        } else {
          console.error(
            "❌ Failed to save notification:",
            await response.text()
          );
        }
      } catch (error) {
        console.error("❌ Failed to save notification:", error);
      }
    },
    [getCurrentEmployeeId]
  );

  // Initialize audio
  const initAudioContext = useCallback(async () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();

      const response = await fetch("/fisto_crm/notificationAudio.wav");
      const arrayBuffer = await response.arrayBuffer();
      audioBufferRef.current = await audioContextRef.current.decodeAudioData(
        arrayBuffer
      );
    } catch (error) {
      console.warn("useSocketNotifications: Audio init failed:", error.message);
      audioRef.current = new Audio("/fisto_crm/notificationAudio.wav");
      audioRef.current.volume = 0.7;
      audioRef.current.load();
    }
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(async () => {
    try {
      if (audioContextRef.current && audioBufferRef.current) {
        if (audioContextRef.current.state === "suspended") {
          await audioContextRef.current.resume();
        }

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBufferRef.current;
        const gainNode = audioContextRef.current.createGain();
        gainNode.gain.value = 0.7;

        source.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
        source.start(0);
      } else if (audioRef.current) {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
      }
    } catch (error) {
      console.warn(
        "useSocketNotifications: Audio playback failed:",
        error.message
      );
    }
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback(async (title, body, data) => {
    if (Notification.permission !== "granted") {
      console.warn(
        "useSocketNotifications: Notification permission not granted"
      );
      return;
    }

    try {
      const notification = new Notification(title, {
        body: body,
        icon: Logo,
        badge: Logo,
        requireInteraction: true,
        tag: `${data.type}_${data.data?.requestId || data.id}_${Date.now()}`,
        renotify: true,
        data: data,
        silent: false,
        timestamp: Date.now(),
        image: LargeLogo,
        vibrate: [200, 100, 200],
      });

      notification.onclick = () => {
        window.focus();
        window.dispatchEvent(
          new CustomEvent("socket-notification-clicked", {
            detail: data,
          })
        );
        notification.close();
      };

      notification.onerror = (error) => {
        console.error("useSocketNotifications: Notification error:", error);
      };

    } catch (error) {
      console.error(
        "useSocketNotifications: Failed to create notification:",
        error
      );
    }
  }, []);

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Format time
  const formatTime = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  // Load notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Socket.IO setup
  useEffect(() => {
    let cleanup = () => {};

    const startForEmployee = async (currentEmployeeId) => {
      if (!currentEmployeeId) return;

      initAudioContext();

      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification("🔔 Real-Time Notifications Enabled", {
              body: "You'll receive instant alerts for requests, meetings, and tasks",
              icon: Logo,
              tag: "welcome",
            });
          } else {
            console.warn("⚠️ Notification permission denied");
          }
        });
      }

      let socketUrl = API_BASE_URL;
      if (socketUrl.endsWith("/api")) {
        socketUrl = socketUrl.slice(0, -4);
      }

      try {
        const socket = io(socketUrl, {
          path: "/socket.io/",
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
          autoConnect: true,
          forceNew: true,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
          setIsConnected(true);
          socket.emit("register", currentEmployeeId);
        });

        socket.on("connect_error", (error) => {
          console.error("❌ Socket connection error:", error.message);
          setIsConnected(false);
        });

        socket.on("disconnect", (reason) => {
          console.warn("⚠️ Socket disconnected:", reason);
          setIsConnected(false);
          if (reason === "io server disconnect") {
            socket.connect();
          }
        });

        socket.on("reconnect", (attemptNumber) => {
          setIsConnected(true);
          socket.emit("register", currentEmployeeId);
        });

        // --- Reuse existing handlers (new-request, new-meeting, new-task, task-updated, approvals, rejections) ---
        socket.on("new-request-notification", async (data) => {
          await playNotificationSound();

          const notification = {
            ...data,
            timestamp: data.timestamp || new Date().toISOString(),
            read: false,
          };

          setNotifications((prev) => [notification, ...prev]);
          await saveNotificationToDatabase(notification);

          let body = "";
          let title = data.title || "🔔 New Request";

          if (data.type === "leave") {
            body = `${data.data.employee_name} requested ${data.data.leaveType}\n`;
            body += `${data.data.numberOfDays} day${
              data.data.numberOfDays > 1 ? "s" : ""
            } from ${formatDate(data.data.fromDate)}`;
            if (data.data.toDate) body += ` to ${formatDate(data.data.toDate)}`;
            body += `\n\nReason: ${data.data.reason}`;
          } else if (data.type === "permission") {
            body = `${data.data.employee_name} requested permission\n`;
            body += `${data.data.duration} minutes on ${formatDate(
              data.data.permissionDate
            )}\n`;
            body += `${formatTime(data.data.fromTime)} - ${formatTime(
              data.data.toTime
            )}`;
            body += `\n\nReason: ${data.data.reason}`;
          }

          await showBrowserNotification(title, body, notification);
        });

        socket.on("new-meeting-notification", async (data) => {
          await playNotificationSound();

          const notification = {
            ...data,
            timestamp: data.timestamp || new Date().toISOString(),
            read: false,
          };

          setNotifications((prev) => [notification, ...prev]);
          await saveNotificationToDatabase(notification);

          const body =
            `${data.data.organizer_name} scheduled a meeting\n` +
            `${data.data.meetingTitle}\n` +
            `${formatDate(data.data.meetingDate)} at ${formatTime(
              data.data.fromTime
            )}` +
            (data.data.description ? `\n\n${data.data.description}` : "");

          await showBrowserNotification(data.title, body, notification);
        });

        socket.on("new-task-notification", async (data) => {
          await playNotificationSound();

          const notification = {
            ...data,
            timestamp: data.timestamp || new Date().toISOString(),
            read: false,
          };

          setNotifications((prev) => [notification, ...prev]);
          await saveNotificationToDatabase(notification);

          const body =
            `Task: ${data.data.taskName}\n` +
            `Project: ${data.data.projectName}\n` +
            `Company: ${data.data.companyName}\n` +
            `Start Date: ${formatDate(data.data.startDate)}` +
            (data.data.endDate
              ? `\nEnd Date: ${formatDate(data.data.endDate)}`
              : "") +
            `\n\nAssigned by: ${data.data.assignedBy}`;

          await showBrowserNotification(
            data.title || "🎯 New Task Assigned",
            body,
            notification
          );
        });

        socket.on("task-updated-notification", async (data) => {
          await playNotificationSound();

          const notification = {
            ...data,
            timestamp: data.timestamp || new Date().toISOString(),
            read: false,
          };

          setNotifications((prev) => {
            return [notification, ...prev];
          });

          await saveNotificationToDatabase(notification);

          let body = `Task: ${data.data.taskName}\n`;
          body += `Project: ${data.data.projectName}\n`;
          body += `Company: ${data.data.companyName}\n`;
          body += `Updated by: ${data.data.updatedBy}\n`;

          const changes = [];
          if (data.data.changes.taskName) changes.push("Task name");
          if (data.data.changes.dates) changes.push("Dates");
          if (data.data.changes.status) {
            changes.push(
              `Status (${data.data.oldStatus} → ${data.data.newStatus})`
            );
          }
          if (data.data.changes.progress) {
            changes.push(
              `Progress (${data.data.oldProgress}% → ${data.data.newProgress}%)`
            );
          }

          if (changes.length > 0) {
            body += `\nChanges: ${changes.join(", ")}`;
          }

          await showBrowserNotification(
            data.title || "Task Updated",
            body,
            notification
          );
        });

        socket.on("request-approved", async (data) => {
          await playNotificationSound();

          const notification = {
            id: `${data.type}_${data.requestId}_${Date.now()}`,
            title: "✅ Request Approved!",
            type: data.type,
            status: "approved",
            data: data,
            timestamp: new Date().toISOString(),
            read: false,
          };

          setNotifications((prev) => [notification, ...prev]);
          await saveNotificationToDatabase(notification);

          let body = "";
          if (data.type === "leave") {
            body = `Your ${data.leaveType} request has been approved!\n`;
            body += `${data.numberOfDays} day${
              data.numberOfDays > 1 ? "s" : ""
            } from ${formatDate(data.fromDate)}`;
            if (data.toDate) body += ` to ${formatDate(data.toDate)}`;
          } else if (data.type === "permission") {
            body = `Your Permission request has been approved!\n`;
            body += `${data.duration} minutes on ${formatDate(
              data.permissionDate
            )}`;
            body += `\n${formatTime(data.fromTime)} - ${formatTime(data.toTime)}`;
          }

          if (data.approvedBy) {
            body += `\n\nApproved by: ${data.approvedBy}`;
          }

          await showBrowserNotification(
            "✅ Request Approved!",
            body,
            notification
          );
        });

        socket.on("request-rejected", async (data) => {
          await playNotificationSound();

          const notification = {
            id: `${data.type}_${data.requestId}_${Date.now()}`,
            title: "❌ Request Rejected",
            type: data.type,
            status: "rejected",
            data: data,
            timestamp: new Date().toISOString(),
            read: false,
          };

          setNotifications((prev) => [notification, ...prev]);
          await saveNotificationToDatabase(notification);

          let body = "";
          if (data.type === "leave") {
            body = `Your ${data.leaveType} request was rejected\n`;
            body += `${data.numberOfDays} day${
              data.numberOfDays > 1 ? "s" : ""
            } from ${formatDate(data.fromDate)}`;
          } else if (data.type === "permission") {
            body = `Your Permission request was rejected\n`;
            body += `${formatDate(data.permissionDate)} - ${formatTime(
              data.fromTime
            )} to ${formatTime(data.toTime)}`;
          }

          if (data.rejectedBy) {
            body += `\n\nRejected by: ${data.rejectedBy}`;
          }

          await showBrowserNotification(
            "❌ Request Rejected",
            body,
            notification
          );
        });

        // setup cleanup to disconnect socket and stop audio
        cleanup = () => {
          try {
            if (socket) {
              // socket.disconnect();
            }
          } catch (e) {
            console.warn("Error during socket disconnect:", e);
          }
          try {
            if (audioRef.current) audioRef.current.pause();
          } catch (e) {}
          try {
            if (audioContextRef.current) audioContextRef.current.close();
          } catch (e) {}
        };
      } catch (error) {
        console.error("❌ useSocketNotifications: Failed to initialize:", error);
      }
    };

    const currentEmployeeId = getCurrentEmployeeId();

    let eventHandler = null;
    if (currentEmployeeId) {
      startForEmployee(currentEmployeeId);
    } else {
      // Listen for login events when there's no stored user yet
      eventHandler = (ev) => {
        const user = ev?.detail;
        if (!user) return;
        const employeeId =
          user.userName || user.employeeId || user._id || user.id || null;
        if (employeeId) startForEmployee(employeeId);
      };
      window.addEventListener("user-logged-in", eventHandler);
    }

    return () => {
      if (eventHandler) window.removeEventListener("user-logged-in", eventHandler);
      cleanup();
    };
  }, [
    getCurrentEmployeeId,
    initAudioContext,
    playNotificationSound,
    showBrowserNotification,
    saveNotificationToDatabase,
  ]);

  // Mark as read
  const markAsRead = useCallback(
    async (notificationId) => {
      const employeeId = getCurrentEmployeeId();

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );

      try {
        await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeeId }),
        });
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    },
    [getCurrentEmployeeId]
  );

  // Clear notification
  const clearNotification = useCallback(
    async (notificationId) => {
      const employeeId = getCurrentEmployeeId();

      setNotifications((prev) =>
        prev.filter((notif) => notif.id !== notificationId)
      );

      try {
        await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeeId }),
        });
      } catch (error) {
        console.error("Failed to delete notification:", error);
      }
    },
    [getCurrentEmployeeId]
  );

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    const employeeId = getCurrentEmployeeId();

    setNotifications([]);

    try {
      await fetch(`${API_BASE_URL}/notifications/clear/${employeeId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Failed to clear all notifications:", error);
    }
  }, [getCurrentEmployeeId]);

  return {
    isConnected,
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    markAsRead,
    clearNotification,
    clearAllNotifications,
    playSound: playNotificationSound,
    isLoading,
    refreshNotifications: fetchNotifications,
  };
}
