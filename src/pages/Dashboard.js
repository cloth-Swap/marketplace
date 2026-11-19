
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API_URL, { apiFetch } from "../api";

function getCurrentUserEmail() {
  const possibleKeys = [
    "clothswapUserEmail",
    "clothSwapUserEmail",
    "clothswapEmail",
    "clothSwapEmail",
    "userEmail"
  ];

  for (let i = 0; i < possibleKeys.length; i++) {
    const value = localStorage.getItem(possibleKeys[i]);

    if (value && value.trim()) {
      return value.trim().toLowerCase();
    }
  }

  const possibleUserKeys = [
    "clothswapUser",
    "clothSwapUser",
    "user"
  ];

  for (let i = 0; i < possibleUserKeys.length; i++) {
    try {
      const savedUser = JSON.parse(
        localStorage.getItem(possibleUserKeys[i]) || "null"
      );

      if (savedUser && savedUser.email) {
        return savedUser.email.trim().toLowerCase();
      }
    } catch (error) {
      // Ignore invalid saved user data
    }
  }

  return "";
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}
const dashboardDataCache = {};

function getDashboardCacheKey() {
  const email = getCurrentUserEmail();

  return "clothswapDashboardCache_" +
    normalize(email);
}

const dashboardStorageKey = getDashboardCacheKey();

try {
  const savedDashboardCache = localStorage.getItem(
    dashboardStorageKey
  );

  if (savedDashboardCache) {
    const parsedCache = JSON.parse(savedDashboardCache);

    if (parsedCache && typeof parsedCache === "object") {
      dashboardDataCache[normalize(getCurrentUserEmail())] =
        parsedCache;
    }
  }
} catch (error) {
  console.log("Dashboard cache read error:", error);
}
function Dashboard() {
  const [userName, setUserName] = useState(
    localStorage.getItem("clothSwapUserName") ||
    localStorage.getItem("clothswapUserName") ||
    "User"
  );

  const [clothes, setClothes] = useState([]);
  const [swapRequests, setSwapRequests] = useState([]);
 const [clothesLoading, setClothesLoading] = useState(true);
const [swapRequestsLoading, setSwapRequestsLoading] = useState(true);
const [notifications, setNotifications] = useState([]);
const [notificationLoading, setNotificationLoading] = useState(false);  

  const currentUserEmail = getCurrentUserEmail();
  const dashboardCacheKey = normalize(currentUserEmail);

 useEffect(function () {
  const cachedData = dashboardDataCache[dashboardCacheKey];

if (cachedData) {
  if (Array.isArray(cachedData.clothes)) {
    setClothes(cachedData.clothes);
    setClothesLoading(false);
  }

  if (Array.isArray(cachedData.swapRequests)) {
    setSwapRequests(cachedData.swapRequests);
    setSwapRequestsLoading(false);
  }
}
  const savedUser =
    localStorage.getItem("clothSwapUserName") ||
    localStorage.getItem("clothswapUserName");

  if (savedUser) {
    setUserName(savedUser);
  }

  loadClothesData();
  loadSwapRequestsData();
  loadSenderNotifications();
}, []);
async function loadClothesData() {
  try {
    const response = await apiFetch(API_URL + "/api/clothes");

    if (!response.ok) {
      throw new Error("Failed to load clothes");
    }

  const data = await response.json();

const clothesData = Array.isArray(data) ? data : [];
setClothes(clothesData);

setClothes(clothesData);

if (dashboardCacheKey) {
  dashboardDataCache[dashboardCacheKey] = {
    ...(dashboardDataCache[dashboardCacheKey] || {}),
clothes: clothesData.map(function (item) {
  return {
    ...item,
    image:
      typeof item.image === "string" &&
      item.image.startsWith("data:")
        ? ""
        : item.image
  };
})  };

  try {
    localStorage.setItem(
      dashboardStorageKey,
      JSON.stringify(dashboardDataCache[dashboardCacheKey])
    );
  } catch (error) {
    console.log("Dashboard clothes cache save error:", error);
  }
}
  } catch (error) {
    console.error("Clothes loading error:", error);
  } finally {
    setClothesLoading(false);
  }
}

async function loadSwapRequestsData() {
  try {
    const url =
      API_URL +
      "/api/swap-requests?userEmail=" +
      encodeURIComponent(currentUserEmail);

    const response = await apiFetch(url);

    if (!response.ok) {
      throw new Error("Failed to load swap requests");
    }

   const data = await response.json();

const requestsData = Array.isArray(data) ? data : [];

setSwapRequests(requestsData);

if (dashboardCacheKey) {
  dashboardDataCache[dashboardCacheKey] = {
    ...(dashboardDataCache[dashboardCacheKey] || {}),
    swapRequests: requestsData
  };

  try {
    localStorage.setItem(
      dashboardStorageKey,
      JSON.stringify(dashboardDataCache[dashboardCacheKey])
    );
  } catch (error) {
    console.log("Dashboard swap requests cache save error:", error);
  }
}
  } catch (error) {
    console.error("Swap requests loading error:", error);
    setSwapRequests([]);
  } finally {
    setSwapRequestsLoading(false);
  }
}

  async function loadSenderNotifications() {
    try {
      const currentUser =
        localStorage.getItem("clothSwapUserName") ||
        localStorage.getItem("clothswapUserName") ||
        "";

      if (!currentUser) {
        setNotifications([]);
        return;
      }

      setNotificationLoading(true);

      const response = await apiFetch(
        `${API_URL}/api/shipments/notifications/` +
        encodeURIComponent(currentUser)
      );

      const data = await response.json();

      if (!response.ok) {
        setNotifications([]);
        return;
      }

      if (data && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
      } else {
        setNotifications([]);
      }

    } catch (error) {
      console.log("Notification loading error:", error);
      setNotifications([]);

    } finally {
      setNotificationLoading(false);
    }
  }

  const normalizedUser = normalize(userName);
  const normalizedUserEmail = normalize(currentUserEmail);

  const myListings = clothes.filter(function (item) {
    const ownerEmail = normalize(item.ownerEmail);
    const ownerName = normalize(item.owner);

    return (
      (normalizedUserEmail && ownerEmail === normalizedUserEmail) ||
      (normalizedUser && ownerName === normalizedUser)
    );
  });

  const sentRequests = swapRequests.filter(function (request) {
    const requesterEmail = normalize(request.requesterEmail);
    const requesterName = normalize(request.requester);

    return (
      (normalizedUserEmail &&
        requesterEmail === normalizedUserEmail) ||
      (normalizedUser && requesterName === normalizedUser)
    );
  });

  const receivedRequests = swapRequests.filter(function (request) {
    const ownerEmail = normalize(request.ownerEmail);
    const ownerName = normalize(request.owner);

    return (
      (normalizedUserEmail && ownerEmail === normalizedUserEmail) ||
      (normalizedUser && ownerName === normalizedUser)
    );
  });

  const acceptedSwaps = swapRequests.filter(function (request) {
    const requesterEmail = normalize(request.requesterEmail);
    const ownerEmail = normalize(request.ownerEmail);

    const requesterName = normalize(request.requester);
    const ownerName = normalize(request.owner);

    const isCurrentUser =
      (normalizedUserEmail &&
        (
          requesterEmail === normalizedUserEmail ||
          ownerEmail === normalizedUserEmail
        )) ||
      (normalizedUser &&
        (
          requesterName === normalizedUser ||
          ownerName === normalizedUser
        ));

    return (
      request.completionStatus === "Completed" &&
      isCurrentUser
    );
  });

  const recentRequests = swapRequests.filter(function (request) {
    const requesterEmail = normalize(request.requesterEmail);
    const ownerEmail = normalize(request.ownerEmail);

    const requesterName = normalize(request.requester);
    const ownerName = normalize(request.owner);

    return (
      (normalizedUserEmail &&
        (
          requesterEmail === normalizedUserEmail ||
          ownerEmail === normalizedUserEmail
        )) ||
      (normalizedUser &&
        (
          requesterName === normalizedUser ||
          ownerName === normalizedUser
        ))
    );
  });

  return React.createElement(
    "div",
    { className: "dashboard-page" },

    React.createElement(
      "div",
      { className: "container py-4 py-md-5" },

      React.createElement(
        "div",
        { className: "dashboard-header mb-4" },

        React.createElement(
          "div",
          null,

          React.createElement(
            "p",
            { className: "dashboard-small-title" },
            "MY ACCOUNT"
          ),

          React.createElement(
            "h1",
            null,
            "Welcome, ",
            userName,
            " 👋"
          ),

          React.createElement(
            "p",
            { className: "dashboard-subtitle" },
            "Manage your clothing listings, swap requests and swap history."
          )
        )
      ),

      React.createElement(
        "div",
        { className: "dashboard-profile-card mb-4" },

        React.createElement(
          "div",
          { className: "dashboard-avatar" },
          userName ? userName.charAt(0).toUpperCase() : "U"
        ),

        React.createElement(
          "div",
          { className: "dashboard-profile-info" },

          React.createElement("h2", null, userName),

          React.createElement(
            "p",
            null,
            "ClothSwap Member"
          )
        ),

        React.createElement(
          Link,
          {
            to: "/list-clothes",
            className: "dashboard-list-btn"
          },
          "+ List Your Clothes"
        )
      ),

      React.createElement(
        "div",
        { className: "row g-3 mb-4" },

        React.createElement(
          "div",
          { className: "col-6 col-md-3" },

          React.createElement(
            "div",
            { className: "dashboard-stat-card" },

            React.createElement(
              "div",
              { className: "dashboard-stat-icon" },
              "👕"
            ),

            React.createElement(
              "div",
              { className: "dashboard-stat-number" },
              clothesLoading ? "..." : myListings.length
            ),

            React.createElement(
              "div",
              { className: "dashboard-stat-label" },
              "My Listings"
            )
          )
        ),

        React.createElement(
          "div",
          { className: "col-6 col-md-3" },

          React.createElement(
            "div",
            { className: "dashboard-stat-card" },

            React.createElement(
              "div",
              { className: "dashboard-stat-icon" },
              "📤"
            ),

            React.createElement(
              "div",
              { className: "dashboard-stat-number" },
              swapRequestsLoading ? "..." : sentRequests.length
            ),

            React.createElement(
              "div",
              { className: "dashboard-stat-label" },
              "Sent Requests"
            )
          )
        ),

        React.createElement(
          "div",
          { className: "col-6 col-md-3" },

          React.createElement(
            "div",
            { className: "dashboard-stat-card" },

            React.createElement(
              "div",
              { className: "dashboard-stat-icon" },
              "📥"
            ),

            React.createElement(
              "div",
              { className: "dashboard-stat-number" },
              swapRequestsLoading ? "..." : receivedRequests.length
            ),

            React.createElement(
              "div",
              { className: "dashboard-stat-label" },
              "Received Requests"
            )
          )
        ),

        React.createElement(
          "div",
          { className: "col-6 col-md-3" },

          React.createElement(
            "div",
            { className: "dashboard-stat-card" },

            React.createElement(
              "div",
              { className: "dashboard-stat-icon" },
              "🔄"
            ),

            React.createElement(
              "div",
              { className: "dashboard-stat-number" },
              swapRequestsLoading ? "..." : acceptedSwaps.length
            ),

            React.createElement(
              "div",
              { className: "dashboard-stat-label" },
              "Successful Swaps"
            )
          )
        )
      ),

      notifications.length > 0
        ? React.createElement(
            "div",
            {
              className: "dashboard-courier-notification"
            },

            React.createElement(
              "div",
              {
                className: "dashboard-courier-notification-icon"
              },
              "🚚"
            ),

            React.createElement(
              "div",
              {
                className: "dashboard-courier-notification-content"
              },

              React.createElement(
                "strong",
                null,
                "Courier Delivery Update"
              ),

              React.createElement(
                "p",
                null,
                notifications[0].senderNotification ||
                (
                  "✅ Your parcel has been received by " +
                  (notifications[0].receiver || "the receiver") +
                  "."
                )
              ),

              React.createElement(
                "small",
                null,
                "Tracking ID: " +
                (notifications[0].trackingId || "N/A")
              )
            )
          )
        : null,

      React.createElement(
        "div",
        { className: "row g-4" },

        React.createElement(
          "div",
          { className: "col-12 col-lg-7" },

          React.createElement(
            "div",
            {
              className: "dashboard-section-card h-100"
            },

            React.createElement(
              "div",
              {
                className: "dashboard-section-header"
              },

              React.createElement(
                "div",
                null,

                React.createElement(
                  "h2",
                  null,
                  "My Clothing Listings"
                ),

                React.createElement(
                  "p",
                  null,
                  "Clothes you have listed for swapping."
                )
              ),

              React.createElement(
                Link,
                {
                  to: "/list-clothes",
                  className: "dashboard-view-link"
                },
                "Add New"
              )
            ),

           clothesLoading
  ? React.createElement(
      "p",
      { className: "dashboard-empty-text" },
      "Loading..."
    )

              : myListings.length === 0
              ? React.createElement(
                  "div",
                  {
                    className: "dashboard-empty-box"
                  },

                  React.createElement(
                    "div",
                    {
                      className: "dashboard-empty-icon"
                    },
                    "👕"
                  ),

                  React.createElement(
                    "h3",
                    null,
                    "No clothing listed yet"
                  ),

                  React.createElement(
                    "p",
                    null,
                    "List your unused clothes and start swapping."
                  ),

                  React.createElement(
                    Link,
                    {
                      to: "/list-clothes",
                      className: "dashboard-primary-btn"
                    },
                    "List Your First Item"
                  )
                )

              : React.createElement(
                  "div",
                  {
                    className: "dashboard-list"
                  },

                  myListings.slice(0, 4).map(function (item) {
                    return React.createElement(
                      "div",
                      {
                        className: "dashboard-list-item",
                        key: item._id || item.id
                      },

                      React.createElement(
                        "img",
                        {
                          src:
                            item.image ||
                            "https://via.placeholder.com/100x100?text=Cloth",
                          alt: item.title || "Clothing",
                          className: "dashboard-item-image"
                        }
                      ),

                      React.createElement(
                        "div",
                        {
                          className: "dashboard-item-details"
                        },

                        React.createElement(
                          "h3",
                          null,
                          item.title || "Untitled Item"
                        ),

                        React.createElement(
                          "p",
                          null,
                          item.category || "Clothing",
                          " • Size ",
                          item.size || "N/A"
                        ),

                        React.createElement(
                          "span",
                          {
                            className: "dashboard-status"
                          },
                          item.status || "Available"
                        )
                      )
                    );
                  })
                )
          )
        ),

        React.createElement(
          "div",
          { className: "col-12 col-lg-5" },

          React.createElement(
            "div",
            {
              className:
                "dashboard-section-card dashboard-recent-activities h-100"
            },

            React.createElement(
              "div",
              {
                className: "dashboard-section-header"
              },

              React.createElement(
                "div",
                null,

                React.createElement(
                  "h2",
                  null,
                  "Recent Activities"
                ),

                React.createElement(
                  "p",
                  null,
                  "Your latest swap activities."
                )
              ),

              React.createElement(
                Link,
                {
                  to: "/swap-requests",
                  className: "dashboard-view-link"
                },
                "View All"
              )
            ),

           swapRequestsLoading
  ? React.createElement(
      "p",
      {
        className: "dashboard-empty-text"
      },
      "Loading..."
    )

              : recentRequests.length === 0
              ? React.createElement(
                  "div",
                  {
                    className: "dashboard-empty-box"
                  },

                  React.createElement(
                    "div",
                    {
                      className: "dashboard-empty-icon"
                    },
                    "🕒"
                  ),

                  React.createElement(
                    "h3",
                    null,
                    "No recent activities"
                  ),

                  React.createElement(
                    "p",
                    null,
                    "Your swap activities will appear here."
                  ),

                  React.createElement(
                    Link,
                    {
                      to: "/browse",
                      className: "dashboard-primary-btn"
                    },
                    "Explore Clothes"
                  )
                )

              : React.createElement(
                  "div",
                  {
                    className: "dashboard-recent-list"
                  },

                  recentRequests.slice(0, 5).map(function (request) {
                    const isSent =
                      normalize(request.requesterEmail) === normalizedUserEmail ||
                      normalize(request.requester) === normalizedUser;

                    const activityTitle =
                      request.status === "Accepted"
                        ? "Swap request accepted"
                        : request.status === "Rejected"
                        ? "Swap request rejected"
                        : isSent
                        ? "Swap request sent"
                        : "New swap request received";

                    const activityText =
                      request.clothingTitle || "Clothing item";

                    const activityIcon =
                      request.status === "Accepted"
                        ? "✅"
                        : request.status === "Rejected"
                        ? "❌"
                        : isSent
                        ? "📤"
                        : "📥";

                    return React.createElement(
                      "div",
                      {
                        className: "dashboard-recent-item",
                        key: request._id || request.id
                      },

                      React.createElement(
                        "div",
                        {
                          className: "dashboard-recent-icon"
                        },
                        activityIcon
                      ),

                      React.createElement(
                        "div",
                        {
                          className: "dashboard-recent-info"
                        },

                        React.createElement(
                          "strong",
                          null,
                          activityTitle
                        ),

                        React.createElement(
                          "span",
                          null,
                          activityText
                        ),

                        React.createElement(
                          "small",
                          null,
                          isSent
                            ? "You sent this request"
                            : "You received this request"
                        )
                      ),

                      React.createElement(
                        "span",
                        {
                          className:
                            "dashboard-recent-status " +
                            (request.status || "Pending")
                              .toLowerCase()
                              .replace(" ", "-")
                        },
                        request.status || "Pending"
                      )
                    );
                  })
                )
          )
        )
      ),

      React.createElement(
        "div",
        {
          className: "dashboard-quick-actions mt-4"
        },

        React.createElement(
          "h2",
          null,
          "Quick Actions"
        ),

        React.createElement(
          "div",
          {
            className: "row g-3 mt-1"
          },

          React.createElement(
            "div",
            {
              className: "col-12 col-md-4"
            },

            React.createElement(
              Link,
              {
                to: "/browse",
                className: "dashboard-action-card"
              },

              React.createElement("span", null, "🔎"),

              React.createElement(
                "div",
                null,

                React.createElement(
                  "strong",
                  null,
                  "Browse Clothes"
                ),

                React.createElement(
                  "small",
                  null,
                  "Find clothes to swap"
                )
              )
            )
          ),

          React.createElement(
            "div",
            {
              className: "col-12 col-md-4"
            },

            React.createElement(
              Link,
              {
                to: "/swap-requests",
                className: "dashboard-action-card"
              },

              React.createElement("span", null, "🔄"),

              React.createElement(
                "div",
                null,

                React.createElement(
                  "strong",
                  null,
                  "Swap Requests"
                ),

                React.createElement(
                  "small",
                  null,
                  "Manage your requests"
                )
              )
            )
          ),

          React.createElement(
            "div",
            {
              className: "col-12 col-md-4"
            },

            React.createElement(
              Link,
              {
                to: "/chat",
                className: "dashboard-action-card"
              },

              React.createElement("span", null, "💬"),

              React.createElement(
                "div",
                null,

                React.createElement(
                  "strong",
                  null,
                  "Negotiation Chat"
                ),

                React.createElement(
                  "small",
                  null,
                  "Discuss your swap"
                )
              )
            )
          )
        )
      )
    )
  );
}

export default Dashboard;
