import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectAll, setSelectAll] = useState(false);

  /* ================= MARK AS READ ================= */

  async function markAsRead(notificationId) {
    try {
      const response = await fetch(
        "http://localhost:5000/api/notifications/" +
          notificationId +
          "/read",
        {
          method: "PUT"
        }
      );

      if (response.ok) {
        setNotifications(function (
          currentNotifications
        ) {
          return currentNotifications.map(
            function (notification) {
              if (
                notification._id ===
                notificationId
              ) {
                return {
                  ...notification,
                  isRead: true
                };
              }

              return notification;
            }
          );
        });

        window.dispatchEvent(
          new Event("notificationsUpdated")
        );
      }
    } catch (error) {
      console.error(
        "Notification read error:",
        error
      );
    }
  }

  /* ================= DELETE NOTIFICATION ================= */

  async function deleteNotification(
    notificationId
  ) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this notification?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/notifications/" +
          notificationId,
        {
          method: "DELETE"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Failed to delete notification."
        );
        return;
      }

      setNotifications(function (
        currentNotifications
      ) {
        return currentNotifications.filter(
          function (notification) {
            return (
              notification._id !==
              notificationId
            );
          }
        );
      });

      window.dispatchEvent(
        new Event("notificationsUpdated")
      );

    } catch (error) {
      console.error(
        "Notification delete error:",
        error
      );

      alert(
        "Something went wrong while deleting notification."
      );
    }
  }  /* ================= DELETE ALL NOTIFICATIONS ================= */

  async function deleteAllNotifications() {
    try {
      const notificationIds =
        notifications.map(function (notification) {
          return notification._id;
        });

      for (const notificationId of notificationIds) {
        const response = await fetch(
          "http://localhost:5000/api/notifications/" +
            notificationId,
          {
            method: "DELETE"
          }
        );

        if (!response.ok) {
          console.error(
            "Failed to delete notification:",
            notificationId
          );
        }
      }

      setNotifications([]);

      setSelectAll(false);

      window.dispatchEvent(
        new Event("notificationsUpdated")
      );

    } catch (error) {
      console.error(
        "Delete all notifications error:",
        error
      );

      alert(
        "Something went wrong while deleting notifications."
      );
    }
  }
    /* ================= DELETE ALL NOTIFICATIONS ================= */

  async function deleteAllNotifications() {
    try {
      const notificationIds =
        notifications.map(function (notification) {
          return notification._id;
        });

      for (const notificationId of notificationIds) {
        const response = await fetch(
          "http://localhost:5000/api/notifications/" +
            notificationId,
          {
            method: "DELETE"
          }
        );

        if (!response.ok) {
          console.error(
            "Failed to delete notification:",
            notificationId
          );
        }
      }

      setNotifications([]);

      setSelectAll(false);

      window.dispatchEvent(
        new Event("notificationsUpdated")
      );

    } catch (error) {
      console.error(
        "Delete all notifications error:",
        error
      );

      alert(
        "Something went wrong while deleting notifications."
      );
    }
  }
  function openNotification(notification) {
  if (!notification) {
    return;
  }

  if (!notification.isRead) {
    markAsRead(notification._id);
  }

  if (
    notification.type === "chat" &&
    notification.relatedId
  ) {
    navigate(
      "/chat?requestId=" +
        encodeURIComponent(notification.relatedId)
    );

    return;
  }

  if (notification.relatedId) {
    navigate("/swap-requests");
    return;
  }

  navigate("/swap-requests");
}

  /* ================= LOAD NOTIFICATIONS ================= */

  async function loadNotifications() {
    const email =
      localStorage.getItem(
        "clothswapUserEmail"
      ) ||
      localStorage.getItem(
        "clothswapEmail"
      ) ||
      "";
      const notificationKey =
  "clothSwapNotifications_" +
  email.trim().toLowerCase();

const notificationsEnabled =
  localStorage.getItem(notificationKey) !== "false";

    if (!email) {
      setNotifications([]);
      setLoading(false);
      return;
    }
if (!notificationsEnabled) {
  setNotifications([]);
  setLoading(false);
  return;
}
    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/notifications/" +
          encodeURIComponent(email)
      );

      const data = await response.json();

      if (
        response.ok &&
        Array.isArray(
          data.notifications
        )
      ) {
        setNotifications(
          data.notifications
        );
      } else {
        setNotifications([]);
      }

    } catch (error) {
      console.error(
        "Notification loading error:",
        error
      );

      setNotifications([]);

    } finally {
      setLoading(false);
    }
  }

  /* ================= LOAD ================= */

  useEffect(function () {
    loadNotifications();
  }, []);

  /* ================= PAGE ================= */

  return React.createElement(
    "div",
    {
      className:
        "container py-5"
    },

    /* ================= HEADER ================= */

    React.createElement(
      "div",
      {
        className:
          "d-flex justify-content-between align-items-center mb-4"
      },

      React.createElement(
        "h2",
        {
          className:
            "fw-bold mb-0"
        },
        "Notifications"
      ),

      notifications.length > 0 &&
  React.createElement(
    "div",
    {
      className:
        "d-flex align-items-center gap-3"
    },

    React.createElement(
      "span",
      {
        className:
           "clothswap-notification-count"
      },
      notifications.length +
        (notifications.length === 1
          ? " notification"
          : " notifications")
    ),

    React.createElement(
      "button",
      {
        type: "button",
        className:
           "clothswap-select-all-btn",
        onClick:
          function () {
            setSelectAll(
              !selectAll
            );
          }
      },
      "☑ Select All"
    ),

    selectAll &&
      React.createElement(
        "button",
        {
          type: "button",
          className:
            "clothswap-delete-all-btn",
          onClick:
            deleteAllNotifications
        },
        "🗑️ Delete All"
      )
  )
    ),

    /* ================= CONTENT ================= */

    loading

      ? React.createElement(
          "p",
          {
            className:
              "text-muted"
          },
          "Loading notifications..."
        )

      : notifications.length === 0

      ? React.createElement(
          "div",
          {
            className:
              "text-center py-5"
          },

          React.createElement(
            "i",
            {
              className:
                "bi bi-bell-slash",
              style: {
                fontSize: "45px"
              }
            }
          ),

          React.createElement(
            "h5",
            {
              className:
                "mt-3"
            },
            "No notifications yet"
          ),

          React.createElement(
            "p",
            {
              className:
                "text-muted"
            },
            "You will see swap requests, messages and updates here."
          )
        )

      : React.createElement(
          "div",
          {
            className:
              "d-flex flex-column gap-3"
          },

          notifications.map(
            function (notification) {
              return React.createElement(
                "div",
                {
                  key:
                    notification._id,

                  className:
  "p-3 border rounded-3 " +
  (
    selectAll
      ? "bg-danger-subtle"
      : notification.isRead
      ? "bg-white"
      : "bg-light"
  ),

                  style: {
                    cursor: "pointer"
                  },

                  onClick:
  function () {
    openNotification(
      notification
    );
  }
                },

                /* ================= TOP ROW ================= */

                React.createElement(
                  "div",
                  {
                    className:
                      "d-flex justify-content-between align-items-start"
                  },

                  /* LEFT */

                  React.createElement(
                    "div",
                    {
                      className:
                        "d-flex align-items-start gap-3"
                    },

                    React.createElement(
                      "i",
                      {
                        className:
                          "bi bi-bell-fill fs-4"
                      }
                    ),

                    React.createElement(
                      "div",
                      null,

                      React.createElement(
                        "h6",
                        {
                          className:
                            "fw-bold mb-1"
                        },
                        notification.title
                      ),

                      React.createElement(
                        "p",
                        {
                          className:
                            "mb-1"
                        },
                        notification.message
                      ),

                      notification.senderName &&
                        React.createElement(
                          "small",
                          {
                            className:
                              "text-muted"
                          },
                          "From: " +
                            notification.senderName
                        )
                    )
                  ),

                  /* DELETE BUTTON */

                  React.createElement(
                    "button",
                    {
                      type: "button",

                      className:
                        "btn btn-sm btn-outline-danger",

                      onClick:
                        function (event) {
                          event.preventDefault();
                          event.stopPropagation();

                          deleteNotification(
                            notification._id
                          );
                        },

                      title:
                        "Delete notification"
                    },

                    React.createElement(
                      "i",
                      {
                        className:
                          "bi bi-trash"
                      }
                    ),

                    " Delete"
                  )
                )
              );
            }
          )
        )
  );
}

export default Notifications;