import { useEffect } from "react";
import { getSocket } from "../utils/SocketManager";
import socketManager from "../utils/SocketManager";
import { useNotification } from "../components/NotificationContext";

import Logo from "../assets/NotificationLogo.png";
import LargeLogo from "../assets/NotificationLargeLogo.png";

let SOCKET_INITIALIZED = false;

const getUserData = () => {
  const userData = JSON.parse(
    localStorage.getItem("user") || sessionStorage.getItem("user") || "{}"
  );
  return userData?.userName || userData?.userName;
};

const playNotificationSound = () => {
  const sound = new Audio("/fisto_crm/notificationAudio.wav");
  sound.volume = 0.5;
  sound.play().catch((err) => console.log("Sound error:", err));
};

let notifyFunction = null;

// Helper function to create rich notifications
const createRichNotification = (title, options = {}) => {
  try {
    const notification = new Notification(title, {
      icon: Logo,
      badge: Logo,
      image: LargeLogo, // Large background image
      requireInteraction: false,
      silent: false,
      renotify: true,
      vibrate: [200, 100, 200],
      timestamp: Date.now(),
      ...options, // Merge with custom options
    });

    // Handle notification click
    notification.onclick = () => {
      window.focus();
      notification.close();
      
      // Handle custom click action if provided
      if (options.onClick) {
        options.onClick();
      }
    };

    notification.onerror = (error) => {
      console.error("Notification error:", error);
    };

    if (!options.requireInteraction) {
      setTimeout(() => {
        notification.close();
      }, 10000);
    }

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
};

const handleSystemNotification = (data) => {

  const currentUserId = getUserData();

  if (data.message.senderId === currentUserId) return;

  if (data.receiverIds && Array.isArray(data.receiverIds)) {
    const isReceiver = data.receiverIds.some(
      (receiverId) => receiverId.toString() === currentUserId.toString()
    );
    if (!isReceiver) return;
  }

  if (Notification.permission === "granted") {
    const senderName = data.message.senderDetails?.name || "Unknown";
    const projectName = data.projectName || "Project";
    const messageText = data.message.message || "You have a new update.";

    const body = `From: ${senderName}\nProject: ${projectName}\n\n💬 ${messageText}`;

    createRichNotification(`New Message`, {
      body: body,
      tag: `MESSAGE_${data.message._id || Date.now()}`,
      data: {
        messageId: data.message._id,
        sender: data.message.senderDetails,
        projectName: data.projectName,
        messageData: data.message,
        timestamp: Date.now(),
        type: 'message'
      },
      onClick: () => {
        console.log("Message notification clicked:", data);
      }
    });

    playNotificationSound();
  } else if (notifyFunction) {
    notifyFunction({
      title: "New Message",
      message: `You have a message from ${data.message.senderDetails?.name || 'Unknown'}.\n\nPlease enable notifications in your browser settings for desktop alerts.`,
    });
  }
};

const handleCalendarEventCreated = (data) => {
  const currentUserId = getUserData();

  if (data.data?.employeeID === currentUserId) {
    return;
  }

  if (Notification.permission === "granted") {
    const title = data.data?.title || "New Event";
    const eventType = data.data?.eventtype || "Event";
    const eventDate = data.data?.date ? new Date(data.data.date).toLocaleDateString() : "";
    const eventTime = data.data?.time || "";
    
    let body = `📅 ${title}\n🏷️ Type: ${eventType}`;
    if (eventDate) body += `\n📆 Date: ${eventDate}`;
    if (eventTime) body += `\n🕐 Time: ${eventTime}`;
    if (data.data?.description) {
      body += `\n\n📝 ${data.data.description}`;
    }

    createRichNotification("New Calendar Event", {
      body: body,
      tag: `calendar-${data.data._id || data.data.id}`,
      data: {
        eventId: data.data._id || data.data.id,
        eventData: data.data,
        type: 'calendar_created',
        timestamp: Date.now(),
      },
      onClick: () => {
        console.log("Calendar event clicked:", data);
      }
    });

    setTimeout(() => playNotificationSound(), 100);
  } else if (notifyFunction) {
    notifyFunction({
      title: "New Calendar Event",
      message: `📅 ${data.data?.title || 'New Event'} - ${data.data?.eventtype || 'Event'}\n\nPlease enable notifications in your browser settings for desktop alerts.`,
    });
  }
};

const handleCalendarEventUpdated = (data) => {
  const currentUserId = getUserData();

  if (data.data?.employeeID === currentUserId) {
    return;
  }

  if (Notification.permission === "granted") {
    const title = data.data?.title || "Event";
    const eventType = data.data?.eventtype || "";
    const changes = data.changes || "Event details";
    
    // Create formatted body
    let body = `📅 ${title}`;
    if (eventType) body += `\n🏷️ Type: ${eventType}`;
    body += `\n\n✏️ Updated: ${changes}`;

    createRichNotification("Calendar Event Updated", {
      body: body,
      tag: `calendar-update-${data.data._id || data.data.id}`,
      data: {
        eventId: data.data._id || data.data.id,
        eventData: data.data,
        type: 'calendar_updated',
        timestamp: Date.now(),
      },
      onClick: () => {
        console.log("Calendar update clicked:", data);
      }
    });

    setTimeout(() => playNotificationSound(), 100);
  } else if (notifyFunction) {
    notifyFunction({
      title: "Calendar Event Updated",
      message: `📅 ${data.data?.title || 'Event'} has been updated\n\nPlease enable notifications in your browser settings for desktop alerts.`,
    });
  }
};

const handleCalendarEventDeleted = (data) => {
  const currentUserId = getUserData();

  if (data.empID === currentUserId) {
    return;
  }

  if (Notification.permission === "granted") {
    const title = data.title || "Event";
    const reason = data.reason || "Event has been removed";
    
    // Create formatted body
    const body = `🗑️ ${title}\n\n❌ ${reason}`;

    createRichNotification("Calendar Event Deleted", {
      body: body,
      tag: `calendar-delete-${data.id || Date.now()}`,
      data: {
        eventId: data.id,
        eventTitle: data.title,
        type: 'calendar_deleted',
        timestamp: Date.now(),
      },
      onClick: () => {
        console.log("Calendar delete clicked:", data);
      }
    });

    setTimeout(() => playNotificationSound(), 100);
  } else if (notifyFunction) {
    notifyFunction({
      title: "Calendar Event Deleted",
      message: `🗑️ ${data.title || 'Event'} has been removed\n\nPlease enable notifications in your browser settings for desktop alerts.`,
    });
  }
};

const registerSocketHandlers = (socket) => {
  // Remove existing listeners
  socket.off("system_notification");
  socket.off("calendar_event_created");
  socket.off("calendar_event_updated");
  socket.off("calendar_event_deleted");

  // Register new listeners
  socket.on("system_notification", handleSystemNotification);
  socket.on("calendar_event_created", handleCalendarEventCreated);
  socket.on("calendar_event_updated", handleCalendarEventUpdated);
  socket.on("calendar_event_deleted", handleCalendarEventDeleted);

  console.log("✅ Socket handlers registered");
};

export const SystemNotification = () => {
  const { notify } = useNotification();

  useEffect(() => {
    if (SOCKET_INITIALIZED) {
      return;
    }

    SOCKET_INITIALIZED = true;
    notifyFunction = notify;

    const socket = getSocket();

    // Preload notification sound
    const notifySound = new Audio("/fisto_crm/notificationAudio.wav");
    notifySound.load();

    // Join calendar room for real-time updates
    socketManager.joinCalendarRoom();

    // Register socket handlers with a small delay
    setTimeout(() => {
      registerSocketHandlers(socket);
    }, 500);

    // Request notification permission
    if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          notify({
            title: "Success",
            message: "Desktop notifications enabled! You'll receive alerts for new messages and events.",
          });
        } else if (permission === "denied") {
          notify({
            title: "Info",
            message: "Browser notification permission denied.\n\nTo enable:\n1. Click the lock icon in the address bar\n2. Allow notifications\n3. Refresh the page",
          });
        }
      });
    } else if (Notification.permission === "denied") {
      notify({
        title: "Info",
        message: "Notifications are blocked.\n\nTo enable:\n1. Click the lock icon in the address bar\n2. Allow notifications\n3. Refresh the page",
      });
    }

    return () => {
      // Cleanup is handled by cleanupSocket()
    };
  }, [notify]);
};

export const cleanupSocket = () => {
  const socket = getSocket();

  // Remove all socket listeners
  socket.off("system_notification");
  socket.off("calendar_event_created");
  socket.off("calendar_event_updated");
  socket.off("calendar_event_deleted");

  console.log("🧹 Socket handlers cleaned up");

  notifyFunction = null;
  SOCKET_INITIALIZED = false;

  // Disconnect socket manager
  socketManager.disconnect();
};

// Helper function to test notifications (useful for debugging)
export const testNotification = () => {
  if (Notification.permission === "granted") {
    createRichNotification("Test Notification", {
      body: "📧 This is a test notification\n🎨 With rich formatting\n✨ And a background image!",
      tag: `test-${Date.now()}`,
      data: { type: 'test' }
    });
    playNotificationSound();
  } else {
    console.log("Notification permission not granted");
  }
};