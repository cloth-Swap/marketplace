import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API_URL, { apiFetch } from "../api";

function Dashboard() {
  const [userName, setUserName] = useState(
    localStorage.getItem("clothSwapUserName") ||
    localStorage.getItem("clothswapUserName") ||
    "User"
  );

  const [clothes, setClothes] = useState([]);
  const [swapRequests, setSwapRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  useEffect(function () {
    const savedUser =
      localStorage.getItem("clothSwapUserName") ||
      localStorage.getItem("clothswapUserName");

    if (savedUser) {
      setUserName(savedUser);
    }

    loadDashboardData();
    loadSenderNotifications();
  }, []);

  async function loadDashboardData() {
  try {
    const clothesResponse = await apiFetch(
  `${API_URL}/api/clothes`
);

    const clothesData =
      await clothesResponse.json();

    if (Array.isArray(clothesData)) {
      setClothes(clothesData);
    } else if (
      clothesData &&
      Array.isArray(clothesData.clothes)
    ) {
      setClothes(clothesData.clothes);
    } else {
      setClothes([]);
    }

    const requestsResponse = await apiFetch(
  `${API_URL}/api/swap-requests`
);

    const requestsData =
      await requestsResponse.json();

    if (Array.isArray(requestsData)) {
      setSwapRequests(requestsData);
    } else if (
      requestsData &&
      Array.isArray(requestsData.requests)
    ) {
      setSwapRequests(requestsData.requests);
    } else {
      setSwapRequests([]);
    }
  } catch (error) {
    console.log(
      "Dashboard data loading error:",
      error
    );

    setClothes([]);
    setSwapRequests([]);
  } finally {
    setLoading(false);
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

    if (
      data &&
      Array.isArray(data.notifications)
    ) {
      setNotifications(
        data.notifications
      );
    } else {
      setNotifications([]);
    }

  } catch (error) {
    console.log(
      "Notification loading error:",
      error
    );

    setNotifications([]);

  } finally {
    setNotificationLoading(false);
  }
}
  const normalizedUser =
    (userName || "").trim().toLowerCase();

  const myListings = clothes.filter(function (item) {
    return (
      item.owner &&
      item.owner.trim().toLowerCase() ===
        normalizedUser
    );
  });

  const sentRequests = swapRequests.filter(
    function (request) {
      return (
        request.requester &&
        request.requester.trim().toLowerCase() ===
          normalizedUser
      );
    }
  );

  const receivedRequests = swapRequests.filter(
    function (request) {
      return (
        request.owner &&
        request.owner.trim().toLowerCase() ===
          normalizedUser
      );
    }
  );

  const acceptedSwaps = swapRequests.filter(
    function (request) {
      return (
        request.status === "Accepted" &&
        (
          (
            request.requester &&
            request.requester
              .trim()
              .toLowerCase() ===
              normalizedUser
          ) ||
          (
            request.owner &&
            request.owner
              .trim()
              .toLowerCase() ===
              normalizedUser
          )
        )
      );
    }
  );

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
          userName
            ? userName.charAt(0).toUpperCase()
            : "U"
        ),

        React.createElement(
          "div",
          { className: "dashboard-profile-info" },

          React.createElement(
            "h2",
            null,
            userName
          ),

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
              myListings.length
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
              sentRequests.length
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
              receivedRequests.length
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
              acceptedSwaps.length
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
        className:
          "dashboard-courier-notification"
      },

      React.createElement(
        "div",
        {
          className:
            "dashboard-courier-notification-icon"
        },
        "🚚"
      ),

      React.createElement(
        "div",
        {
          className:
            "dashboard-courier-notification-content"
        },

        React.createElement(
          "strong",
          null,
          "Courier Delivery Update"
        ),

        React.createElement(
          "p",
          null,
          notifications[0]
            .senderNotification ||
            (
              "✅ Your parcel has been received by " +
              (
                notifications[0]
                  .receiver ||
                "the receiver"
              ) +
              "."
            )
        ),

        React.createElement(
          "small",
          null,
          "Tracking ID: " +
            (
              notifications[0]
                .trackingId ||
              "N/A"
            )
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
              className:
                "dashboard-section-card h-100"
            },

            React.createElement(
              "div",
              {
                className:
                  "dashboard-section-header"
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
                  className:
                    "dashboard-view-link"
                },
                "Add New"
              )
            ),

            loading
              ? React.createElement(
                  "p",
                  {
                    className:
                      "dashboard-empty-text"
                  },
                  "Loading..."
                )

              : myListings.length === 0
              ? React.createElement(
                  "div",
                  {
                    className:
                      "dashboard-empty-box"
                  },

                  React.createElement(
                    "div",
                    {
                      className:
                        "dashboard-empty-icon"
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
                      className:
                        "dashboard-primary-btn"
                    },
                    "List Your First Item"
                  )
                )

              : React.createElement(
                  "div",
                  {
                    className:
                      "dashboard-list"
                  },

                  myListings
                    .slice(0, 4)
                    .map(function (item) {

                      return React.createElement(
                        "div",
                        {
                          className:
                            "dashboard-list-item",
                          key:
                            item._id ||
                            item.id
                        },

                        React.createElement(
                          "img",
                          {
                            src:
                              item.image ||
                              "https://via.placeholder.com/100x100?text=Cloth",
                            alt:
                              item.title ||
                              "Clothing",
                            className:
                              "dashboard-item-image"
                          }
                        ),

                        React.createElement(
                          "div",
                          {
                            className:
                              "dashboard-item-details"
                          },

                          React.createElement(
                            "h3",
                            null,
                            item.title ||
                              "Untitled Item"
                          ),

                          React.createElement(
                            "p",
                            null,
                            item.category ||
                              "Clothing",
                            " • Size ",
                            item.size ||
                              "N/A"
                          ),

                          React.createElement(
                            "span",
                            {
                              className:
                                "dashboard-status"
                            },
                            item.status ||
                              "Available"
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
                className:
                  "dashboard-section-header"
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
                  className:
                    "dashboard-view-link"
                },
                "View All"
              )
            ),

            loading
              ? React.createElement(
                  "p",
                  {
                    className:
                      "dashboard-empty-text"
                  },
                  "Loading..."
                )

              : sentRequests.length === 0 &&
                receivedRequests.length === 0

              ? React.createElement(
                  "div",
                  {
                    className:
                      "dashboard-empty-box"
                  },

                  React.createElement(
                    "div",
                    {
                      className:
                        "dashboard-empty-icon"
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
                      className:
                        "dashboard-primary-btn"
                    },
                    "Explore Clothes"
                  )
                )

              : React.createElement(
                  "div",
                  {
                    className:
                      "dashboard-recent-list"
                  },

                  swapRequests
                    .filter(function (request) {

                      return (
                        (
                          request.requester &&
                          request.requester
                            .trim()
                            .toLowerCase() ===
                            normalizedUser
                        ) ||
                        (
                          request.owner &&
                          request.owner
                            .trim()
                            .toLowerCase() ===
                            normalizedUser
                        )
                      );
                    })
                    .slice(0, 5)
                    .map(function (request) {

                      const isSent =
                        request.requester &&
                        request.requester
                          .trim()
                          .toLowerCase() ===
                          normalizedUser;

                      const activityTitle =
                        request.status ===
                        "Accepted"
                          ? "Swap request accepted"
                          : request.status ===
                            "Rejected"
                          ? "Swap request rejected"
                          : isSent
                          ? "Swap request sent"
                          : "New swap request received";

                      const activityText =
                        request.clothingTitle ||
                        "Clothing item";

                      const activityIcon =
                        request.status ===
                        "Accepted"
                          ? "✅"
                          : request.status ===
                            "Rejected"
                          ? "❌"
                          : isSent
                          ? "📤"
                          : "📥";

                      return React.createElement(
                        "div",
                        {
                          className:
                            "dashboard-recent-item",
                          key:
                            request._id ||
                            request.id
                        },

                        React.createElement(
                          "div",
                          {
                            className:
                              "dashboard-recent-icon"
                          },
                          activityIcon
                        ),

                        React.createElement(
                          "div",
                          {
                            className:
                              "dashboard-recent-info"
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
                              (
                                request.status ||
                                "Pending"
                              )
                                .toLowerCase()
                                .replace(
                                  " ",
                                  "-"
                                )
                          },
                          request.status ||
                            "Pending"
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
          className:
            "dashboard-quick-actions mt-4"
        },

        React.createElement(
          "h2",
          null,
          "Quick Actions"
        ),

        React.createElement(
          "div",
          {
            className:
              "row g-3 mt-1"
          },


          React.createElement(
            "div",
            {
              className:
                "col-12 col-md-4"
            },

            React.createElement(
              Link,
              {
                to: "/browse",
                className:
                  "dashboard-action-card"
              },

              React.createElement(
                "span",
                null,
                "🔎"
              ),

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
              className:
                "col-12 col-md-4"
            },

            React.createElement(
              Link,
              {
                to: "/swap-requests",
                className:
                  "dashboard-action-card"
              },

              React.createElement(
                "span",
                null,
                "🔄"
              ),

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
              className:
                "col-12 col-md-4"
            },

            React.createElement(
              Link,
              {
                to: "/chat",
                className:
                  "dashboard-action-card"
              },

              React.createElement(
                "span",
                null,
                "💬"
              ),

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