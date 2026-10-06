import React, { useEffect, useState } from "react";

function AdminPanel() {
  const [clothes, setClothes] = useState([]);
  const [swapRequests, setSwapRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [disputes, setDisputes] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  useEffect(function () {
  loadAdminData();
  loadUsers();
  loadDisputes();
}, []);


  async function loadAdminData() {
  try {

    const clothesResponse = await fetch(
      "http://localhost:5000/api/clothes"
    );

    const clothesData = await clothesResponse.json();

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

    const requestsResponse = await fetch(
      "http://localhost:5000/api/admin/swap-requests",
      {
        headers: {
          Authorization:
            "Bearer " +
            localStorage.getItem("clothswapToken")
        }
      }
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
      "Admin data loading error:",
      error
    );

    setClothes([]);
    setSwapRequests([]);

  } finally {
    setLoading(false);
  }
}

  async function loadUsers() {
    try {
      setUsersLoading(true);

     const response = await fetch(
  "http://localhost:5000/api/admin/users",
  {
    headers: {
      Authorization:
        "Bearer " +
        localStorage.getItem("clothswapToken")
    }
  }
);

      const data = await response.json();

      if (
        response.ok &&
        data &&
        Array.isArray(data.users)
      ) {
        setUsers(data.users);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.log("Users loading error:", error);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }


async function loadDisputes() {
  try {
   const response = await fetch(
  "http://localhost:5000/api/admin/disputes",
  {
    headers: {
      Authorization:
        "Bearer " +
        localStorage.getItem("clothswapToken")
    }
  }
);

    const data = await response.json();

    if (
      response.ok &&
      data &&
      Array.isArray(data.disputes)
    ) {
      setDisputes(data.disputes);
    } else {
      setDisputes([]);
    }
  } catch (error) {
    console.log("Disputes loading error:", error);
    setDisputes([]);
  }
}

  

  const pendingRequests = swapRequests.filter(function (request) {
    return request.status === "Pending";
  });

  const acceptedRequests = swapRequests.filter(function (request) {
    return request.status === "Accepted";
  });

  const rejectedRequests = swapRequests.filter(function (request) {
    return request.status === "Rejected";
  });

  const completedSwaps = swapRequests.filter(function (request) {
    return (
      request.completionStatus === "Completed" ||
      request.agreementStatus === "Completed"
    );
  });

  
  const activeUsers = users.filter(function (user) {
    return user.status === "Active";
  });

  const blockedUsers = users.filter(function (user) {
    return user.status === "Blocked";
  });

  async function deleteClothing(id) {
    const confirmDelete = window.confirm(
      "Are you sure you want to remove this clothing listing?"
    );

    if (!confirmDelete) {
      return;
    }
try {
      const response = await fetch(
  "http://localhost:5000/api/admin/clothes/" + id,
  {
    method: "DELETE",
    headers: {
      "Authorization":
        "Bearer " +
        localStorage.getItem("clothswapToken")
    }
  }
);

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to remove listing");
        return;
      }

      setClothes(function (previous) {
        return previous.filter(function (item) {
          return item._id !== id;
        });
      });

      alert("Clothing listing removed successfully.");
    } catch (error) {
      console.log("Admin delete error:", error);
      alert("Failed to remove clothing listing.");
    }
  }

  
  async function changeUserStatus(user) {
    const newStatus =
      user.status === "Blocked"
        ? "Active"
        : "Blocked";

    const actionText =
      newStatus === "Blocked"
        ? "block"
        : "unblock";

    const confirmChange = window.confirm(
      "Are you sure you want to " +
        actionText +
        " " +
        (user.name || "this user") +
        "?"
    );

    if (!confirmChange) {
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/admin/users/" +
          user._id +
          "/status",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
             "Authorization":
    "Bearer " +
    localStorage.getItem("clothswapToken")
          },
          body: JSON.stringify({
            status: newStatus
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Failed to update user status."
        );
        return;
      }

      setUsers(function (previous) {
        return previous.map(function (item) {
          if (item._id === user._id) {
            return data.user || {
              ...item,
              status: newStatus
            };
          }

          return item;
        });
      });

      alert(
        "User " +
          (newStatus === "Blocked"
            ? "blocked"
            : "unblocked") +
          " successfully."
      );
    } catch (error) {
      console.log("User status error:", error);
      alert("Failed to update user status.");
    }
  }

  
  async function deleteUser(user) {
    if (user.role === "Admin") {
      alert("Admin user cannot be deleted.");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete " +
        (user.name || "this user") +
        "?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
     const response = await fetch(
  "http://localhost:5000/api/admin/users/" +
    user._id,
  {
    method: "DELETE",
    headers: {
      "Authorization":
        "Bearer " +
        localStorage.getItem("clothswapToken")
    }
  }
);

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Failed to delete user."
        );
        return;
      }

      setUsers(function (previous) {
        return previous.filter(function (item) {
          return item._id !== user._id;
        });
      });

      alert("User deleted successfully.");
    } catch (error) {
      console.log("User delete error:", error);
      alert("Failed to delete user.");
    }
  }
  
async function resolveDispute(dispute) {
  const adminNote = window.prompt(
    "Enter admin note for this dispute:"
  );

  if (adminNote === null) {
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:5000/api/admin/disputes/" +
        dispute._id +
        "/resolve",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization":
    "Bearer " +
    localStorage.getItem("clothswapToken")
        },
        body: JSON.stringify({
          adminNote: adminNote
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(
        data.message ||
          "Failed to resolve dispute."
      );
      return;
    }

    setDisputes(function (previous) {
      return previous.map(function (item) {
        if (item._id === dispute._id) {
          return data.dispute || {
            ...item,
            status: "Resolved",
            adminNote: adminNote,
            resolvedAt: new Date()
          };
        }

        return item;
      });
    });

    alert("Dispute resolved successfully.");

  } catch (error) {
    console.log("Dispute resolve error:", error);
    alert("Failed to resolve dispute.");
  }
}

  

  function getStatusClass(status) {
    if (!status) {
      return "admin-status-badge";
    }

    if (status === "Pending") {
      return "admin-status-badge pending";
    }

    if (status === "Accepted") {
      return "admin-status-badge accepted";
    }

    if (status === "Rejected") {
      return "admin-status-badge rejected";
    }

    if (status === "Completed") {
      return "admin-status-badge completed";
    }

    if (status === "Active") {
      return "admin-status-badge active";
    }

    if (status === "Blocked") {
      return "admin-status-badge blocked";
    }

    return "admin-status-badge";
  }

  function getClothingImage(item) {
    if (!item) {
      return "";
    }

    if (item.image) {
      return item.image;
    }

    if (item.imageUrl) {
      return item.imageUrl;
    }

    if (
      Array.isArray(item.images) &&
      item.images.length > 0
    ) {
      return item.images[0];
    }

    return "";
  }

 

  function getClothingTitle(item) {
    if (!item) {
      return "Unknown Item";
    }

    return (
      item.title ||
      item.name ||
      item.clothingName ||
      item.itemName ||
      "Untitled Clothing"
    );
  }

  
  function getOwnerName(item) {
    if (!item) {
      return "Unknown";
    }

    if (item.ownerName) {
      return item.ownerName;
    }

    if (item.userName) {
      return item.userName;
    }

    if (item.username) {
      return item.username;
    }

    if (item.user) {
      return item.user;
    }

    return "Unknown";
  }

  
  function getLocation(item) {
    if (!item) {
      return "Not specified";
    }

    if (item.location) {
      return item.location;
    }

    if (item.city) {
      return item.city;
    }

    return "Not specified";
  }

 
  function getCategory(item) {
    if (!item) {
      return "Other";
    }

    return (
      item.category ||
      item.type ||
      item.clothingType ||
      "Other"
    );
  }

  

  function getValue(item) {
    if (!item) {
      return "—";
    }

    const value =
      item.estimatedValue ||
      item.swapValue ||
      item.value ||
      item.price;

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return "—";
    }

    return "₹" + value;
  }

  

  function getListingDate(item) {
    if (!item) {
      return "Recently added";
    }

    const dateValue =
      item.createdAt ||
      item.created_at ||
      item.date ||
      item.createdDate;

    if (!dateValue) {
      return "Recently added";
    }

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
      return "Recently added";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

 

  function getRequestClothing(request) {
    if (!request) {
      return "Unknown Item";
    }

    if (request.clothingTitle) {
      return request.clothingTitle;
    }

    if (request.itemName) {
      return request.itemName;
    }

    if (request.clothingName) {
      return request.clothingName;
    }

    if (
      request.clothing &&
      typeof request.clothing === "object"
    ) {
      return (
        request.clothing.title ||
        request.clothing.name ||
        "Unknown Item"
      );
    }

    return "Clothing Item";
  }

  

  function getRequesterName(request) {
    if (!request) {
      return "Unknown";
    }

    return (
      request.requesterName ||
      request.userName ||
      request.username ||
      request.requester ||
      "Unknown"
    );
  }

 

  function getRequestOwner(request) {
    if (!request) {
      return "Unknown";
    }

    return (
      request.ownerName ||
      request.clothingOwner ||
      request.owner ||
      "Unknown"
    );
  }

  

  function getAgreementStatus(request) {
    if (!request) {
      return "Not Started";
    }

    if (request.agreementStatus) {
      return request.agreementStatus;
    }

    if (request.completionStatus) {
      return request.completionStatus;
    }

    return "Not Started";
  }

 

  if (loading) {
    return React.createElement(
      "div",
      {
        className: "admin-panel-page"
      },
      React.createElement(
        "div",
        {
          className: "admin-loading"
        },
        "Loading Admin Panel..."
      )
    );
  }



  return React.createElement(
    "div",
    {
      className: "admin-panel-page"
    },

  

    React.createElement(
      "div",
      {
        className: "admin-panel-header"
      },

      React.createElement(
        "div",
        null,

        React.createElement(
          "h1",
          null,
          "Admin Panel"
        ),

        React.createElement(
          "p",
          null,
          "Manage users, clothing listings and monitor swap requests."
        )
      ),

      React.createElement(
        "div",
        {
          className: "admin-panel-badge"
        },
        "Admin Access"
      )
    ),

  

    React.createElement(
      "div",
      {
        className: "admin-stats-grid"
      },

      React.createElement(
        "div",
        {
          className: "admin-stat-card"
        },

        React.createElement(
          "div",
          {
            className: "admin-stat-icon"
          },
          "👕"
        ),

        React.createElement(
          "div",
          null,

          React.createElement(
            "span",
            {
              className: "admin-stat-label"
            },
            "Total Listings"
          ),

          React.createElement(
            "strong",
            {
              className: "admin-stat-number"
            },
            clothes.length
          )
        )
      ),

      React.createElement(
        "div",
        {
          className: "admin-stat-card"
        },

        React.createElement(
          "div",
          {
            className: "admin-stat-icon"
          },
          "🔄"
        ),

        React.createElement(
          "div",
          null,

          React.createElement(
            "span",
            {
              className: "admin-stat-label"
            },
            "Total Swap Requests"
          ),

          React.createElement(
            "strong",
            {
              className: "admin-stat-number"
            },
            swapRequests.length
          )
        )
      ),

      React.createElement(
        "div",
        {
          className: "admin-stat-card"
        },

        React.createElement(
          "div",
          {
            className: "admin-stat-icon"
          },
          "⏳"
        ),

        React.createElement(
          "div",
          null,

          React.createElement(
            "span",
            {
              className: "admin-stat-label"
            },
            "Pending Requests"
          ),

          React.createElement(
            "strong",
            {
              className: "admin-stat-number"
            },
            pendingRequests.length
          )
        )
      ),

      React.createElement(
        "div",
        {
          className: "admin-stat-card"
        },

        React.createElement(
          "div",
          {
            className: "admin-stat-icon"
          },
          "✅"
        ),

        React.createElement(
          "div",
          null,

          React.createElement(
            "span",
            {
              className: "admin-stat-label"
            },
            "Accepted Swaps"
          ),

          React.createElement(
            "strong",
            {
              className: "admin-stat-number"
            },
            acceptedRequests.length
          )
        )
      ),

      React.createElement(
        "div",
        {
          className: "admin-stat-card"
        },

        React.createElement(
          "div",
          {
            className: "admin-stat-icon"
          },
          "❌"
        ),

        React.createElement(
          "div",
          null,

          React.createElement(
            "span",
            {
              className: "admin-stat-label"
            },
            "Rejected Requests"
          ),

          React.createElement(
            "strong",
            {
              className: "admin-stat-number"
            },
            rejectedRequests.length
          )
        )
      ),

      React.createElement(
        "div",
        {
          className: "admin-stat-card"
        },

        React.createElement(
          "div",
          {
            className: "admin-stat-icon"
          },
          "🎉"
        ),

        React.createElement(
          "div",
          null,

          React.createElement(
            "span",
            {
              className: "admin-stat-label"
            },
            "Completed Swaps"
          ),

          React.createElement(
            "strong",
            {
              className: "admin-stat-number"
            },
            completedSwaps.length
          )
        )
      )
    ),

    /* =================================================
       MANAGE USERS
    ================================================= */

    React.createElement(
      "div",
      {
        className: "admin-section-card"
      },

      React.createElement(
        "div",
        {
          className: "admin-section-header"
        },

        React.createElement(
          "div",
          null,

          React.createElement(
            "h2",
            null,
            "Manage Users"
          ),

          React.createElement(
            "p",
            null,
            "Manage registered users and control account status."
          )
        ),

        React.createElement(
          "span",
          {
            className: "admin-section-count"
          },
          users.length + " Users"
        )
      ),

      React.createElement(
        "div",
        {
          className: "admin-user-summary"
        },

        React.createElement(
          "div",
          {
            className: "admin-user-summary-item"
          },

          React.createElement(
            "strong",
            null,
            users.length
          ),

          React.createElement(
            "span",
            null,
            "Total Users"
          )
        ),

        React.createElement(
          "div",
          {
            className: "admin-user-summary-item"
          },

          React.createElement(
            "strong",
            null,
            activeUsers.length
          ),

          React.createElement(
            "span",
            null,
            "Active Users"
          )
        ),

        React.createElement(
          "div",
          {
            className: "admin-user-summary-item"
          },

          React.createElement(
            "strong",
            null,
            blockedUsers.length
          ),

          React.createElement(
            "span",
            null,
            "Blocked Users"
          )
        )
      ),

      usersLoading
        ? React.createElement(
            "div",
            {
              className: "admin-empty-state"
            },
            "Loading users..."
          )
        : users.length === 0
        ? React.createElement(
            "div",
            {
              className: "admin-empty-state"
            },
            "No registered users found."
          )
        : React.createElement(
            "div",
            {
              className: "admin-table-wrapper"
            },

            React.createElement(
              "table",
              {
                className: "admin-table admin-users-table"
              },

              React.createElement(
                "thead",
                null,

                React.createElement(
                  "tr",
                  null,

                  React.createElement(
                    "th",
                    null,
                    "Name"
                  ),

                  React.createElement(
                    "th",
                    null,
                    "Email"
                  ),

                  React.createElement(
                    "th",
                    null,
                    "Location"
                  ),

                  React.createElement(
                    "th",
                    null,
                    "Role"
                  ),

                  React.createElement(
                    "th",
                    null,
                    "Status"
                  ),

                  React.createElement(
                    "th",
                    null,
                    "Action"
                  )
                )
              ),

              React.createElement(
                "tbody",
                null,

                users.map(function (user) {
                  const isAdmin =
                    user.role === "Admin";

                  return React.createElement(
                    "tr",
                    {
                      key: user._id
                    },

                    React.createElement(
                      "td",
                      null,

                      React.createElement(
                        "div",
                        {
                          className: "admin-user-name"
                        },

                        React.createElement(
                          "strong",
                          null,
                          user.name || "Unknown User"
                        )
                      )
                    ),

                    React.createElement(
                      "td",
                      null,
                      user.email || "Not specified"
                    ),

                    React.createElement(
                      "td",
                      null,
                      user.location || "Not specified"
                    ),

                    React.createElement(
                      "td",
                      null,

                      React.createElement(
                        "span",
                        {
                          className:
                            "admin-user-role"
                        },
                        user.role || "User"
                      )
                    ),

                    React.createElement(
                      "td",
                      null,

                      React.createElement(
                        "span",
                        {
                          className:
                            getStatusClass(
                              user.status
                            )
                        },
                        user.status || "Active"
                      )
                    ),

                    React.createElement(
                      "td",
                      null,

                      React.createElement(
                        "div",
                        {
                          className:
                            "admin-user-actions"
                        },

                        isAdmin
                          ? React.createElement(
                              "span",
                              {
                                className:
                                  "admin-protected-label"
                              },
                              "🔒 Protected"
                            )
                          : React.createElement(
                              React.Fragment,
                              null,

                              React.createElement(
                                "button",
                                {
                                  className:
                                    user.status ===
                                    "Blocked"
                                      ? "admin-user-action-btn unblock"
                                      : "admin-user-action-btn block",
                                  onClick:
                                    function () {
                                      changeUserStatus(
                                        user
                                      );
                                    }
                                },
                                user.status ===
                                "Blocked"
                                  ? "🔓 Unblock"
                                  : "🚫 Block"
                              ),

                              React.createElement(
                                "button",
                                {
                                  className:
                                    "admin-user-action-btn delete",
                                  onClick:
                                    function () {
                                      deleteUser(
                                        user
                                      );
                                    }
                                },
                                "🗑️ Delete"
                              )
                            )
                      )
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
        className: "admin-section-card"
      },

      React.createElement(
        "div",
        {
          className: "admin-section-header"
        },

        React.createElement(
          "div",
          null,

          React.createElement(
            "h2",
            null,
            "Clothing Listings"
          ),

          React.createElement(
            "p",
            null,
            "Manage all clothing items listed on ClothSwap."
          )
        ),

        React.createElement(
          "span",
          {
            className: "admin-section-count"
          },
          clothes.length + " Listings"
        )
      ),

      clothes.length === 0
        ? React.createElement(
            "div",
            {
              className: "admin-empty-state"
            },
            "No clothing listings available."
          )
        : React.createElement(
            "div",
            {
              className: "admin-table-wrapper"
            },

            React.createElement(
              "table",
              {
                className: "admin-table"
              },

              React.createElement(
                "thead",
                null,

                React.createElement(
                  "tr",
                  null,

                  React.createElement(
                    "th",
                    null,
                    "Item"
                  ),

                  React.createElement(
                    "th",
                    null,
                    "Category"
                  ),

                  React.createElement(
                    "th",
                    null,
                    "Owner"
                  ),

                  React.createElement(
                    "th",
                    null,
                    "Location"
                  ),

                  React.createElement(
                    "th",
                    null,
                    "Value"
                  ),

                  React.createElement(
                    "th",
                    null,
                    "Action"
                  )
                )
              ),

              React.createElement(
                "tbody",
                null,

                clothes
                  .slice(0, 10)
                  .map(function (item) {
                    const image =
                      getClothingImage(item);

                    return React.createElement(
                      "tr",
                      {
                        key: item._id
                      },

                      React.createElement(
                        "td",
                        null,

                        React.createElement(
                          "div",
                          {
                            className:
                              "admin-item-cell"
                          },

                          image
                            ? React.createElement(
                                "img",
                                {
                                  src: image,
                                  alt:
                                    getClothingTitle(
                                      item
                                    ),
                                  className:
                                    "admin-item-image"
                                }
                              )
                            : React.createElement(
                                "div",
                                {
                                  className:
                                    "admin-item-placeholder"
                                },
                                "👕"
                              ),

                          React.createElement(
                            "div",
                            {
                              className:
                                "admin-item-info"
                            },

                            React.createElement(
                              "strong",
                              null,
                              getClothingTitle(
                                item
                              )
                            )
                          )
                        )
                      ),

                      React.createElement(
                        "td",
                        null,
                        getCategory(item)
                      ),

                      React.createElement(
                        "td",
                        null,
                        getOwnerName(item)
                      ),

                      React.createElement(
                        "td",
                        null,
                        getLocation(item)
                      ),

                      React.createElement(
                        "td",
                        null,
                        getValue(item)
                      ),

                      React.createElement(
                        "td",
                        null,

                        React.createElement(
                          "button",
                          {
                            className:
                              "admin-delete-btn",
                            onClick:
                              function () {
                                deleteClothing(
                                  item._id
                                );
                              }
                          },
                          "🗑️ Remove"
                        )
                      )
                    );
                  })
              )
            )
          ),

      clothes.length > 10 &&
        React.createElement(
          "div",
          {
            className: "admin-table-note"
          },
          "Showing latest 10 clothing listings."
        )
    ),

  

    React.createElement(
      "div",
      {
        className:
          "admin-section-card admin-recent-card"
      },

      React.createElement(
        "div",
        {
          className: "admin-section-header"
        },

        React.createElement(
          "div",
          null,

          React.createElement(
            "h2",
            null,
            "Recent Clothing Listings"
          ),

          React.createElement(
            "p",
            null,
            "Latest clothing items added to ClothSwap."
          )
        ),

        React.createElement(
          "span",
          {
            className: "admin-section-count"
          },
          Math.min(clothes.length, 5) +
            " Recent"
        )
      ),

      clothes.length === 0
        ? React.createElement(
            "div",
            {
              className: "admin-empty-state"
            },
            "No recent clothing listings available."
          )
        : React.createElement(
            "div",
            {
              className: "admin-table-wrapper"
            },

            React.createElement(
              "table",
              {
                className:
                  "admin-table admin-recent-table"
              },

              React.createElement(
                "thead",
                null,

                React.createElement(
                  "tr",
                  null,

                  React.createElement(
                    "th",
                    null,
                    "Item"
                  ),

                  React.createElement(
                    "th",
                    null,
                    "Category"
                  ),

                  React.createElement(
                    "th",
                    null,
                    "Owner"
                  ),

                  React.createElement(
                    "th",
                    null,
                    "Location"
                  ),

                  React.createElement(
                    "th",
                    null,
                    "Value"
                  ),

                  React.createElement(
                    "th",
                    null,
                    "Added On"
                  )
                )
              ),

              React.createElement(
                "tbody",
                null,

                clothes
                  .slice(0, 5)
                  .map(function (item) {
                    const image =
                      getClothingImage(item);

                    return React.createElement(
                      "tr",
                      {
                        key:
                          "recent-" +
                          item._id
                      },

                      React.createElement(
                        "td",
                        null,

                        React.createElement(
                          "div",
                          {
                            className:
                              "admin-item-cell"
                          },

                          image
                            ? React.createElement(
                                "img",
                                {
                                  src: image,
                                  alt:
                                    getClothingTitle(
                                      item
                                    ),
                                  className:
                                    "admin-item-image"
                                }
                              )
                            : React.createElement(
                                "div",
                                {
                                  className:
                                    "admin-item-placeholder"
                                },
                                "👕"
                              ),

                          React.createElement(
                            "div",
                            {
                              className:
                                "admin-item-info"
                            },

                            React.createElement(
                              "strong",
                              null,
                              getClothingTitle(
                                item
                              )
                            )
                          )
                        )
                      ),

                      React.createElement(
                        "td",
                        null,
                        getCategory(item)
                      ),

                      React.createElement(
                        "td",
                        null,
                        getOwnerName(item)
                      ),

                      React.createElement(
                        "td",
                        null,
                        getLocation(item)
                      ),

                      React.createElement(
                        "td",
                        null,
                        getValue(item)
                      ),

                      React.createElement(
                        "td",
                        null,

                        React.createElement(
                          "span",
                          {
                            className:
                              "admin-recent-date"
                          },
                          getListingDate(
                            item
                          )
                        )
                      )
                    );
                  })
              )
            )
          ),

      clothes.length > 5 &&
        React.createElement(
          "div",
          {
            className: "admin-table-note"
          },
          "Showing 5 most recently added clothing listings."
        )
    ),

React.createElement(
  "div",
  {
    className: "admin-section-card"
  },

  React.createElement(
    "div",
    {
      className: "admin-section-header"
    },

    React.createElement(
      "div",
      null,

      React.createElement(
        "h2",
        null,
        "Resolve Disputes"
      ),

      React.createElement(
        "p",
        null,
        "Review and resolve disputes reported by users."
      )
    ),

    React.createElement(
      "span",
      {
        className: "admin-section-count"
      },
      disputes.length + " Disputes"
    )
  ),

  disputes.length === 0

    ? React.createElement(
        "div",
        {
          className: "admin-empty-state"
        },
        "No disputes reported."
      )

    : React.createElement(
        "div",
        {
          className: "admin-table-wrapper"
        },

        React.createElement(
          "table",
          {
            className: "admin-table admin-disputes-table"
          },

          React.createElement(
            "thead",
            null,

            React.createElement(
              "tr",
              null,

              React.createElement(
                "th",
                null,
                "Reported By"
              ),

              React.createElement(
                "th",
                null,
                "Reported Against"
              ),

              React.createElement(
                "th",
                null,
                "Reason"
              ),

              React.createElement(
                "th",
                null,
                "Description"
              ),

              React.createElement(
                "th",
                null,
                "Status"
              ),

              React.createElement(
                "th",
                null,
                "Admin Note"
              ),

              React.createElement(
                "th",
                null,
                "Action"
              )
            )
          ),

          React.createElement(
            "tbody",
            null,

            disputes.map(function (dispute) {

              const isResolved =
                dispute.status === "Resolved";

              return React.createElement(
                "tr",
                {
                  key: dispute._id
                },

                React.createElement(
                  "td",
                  null,
                  dispute.reportedBy ||
                    "Unknown"
                ),

                React.createElement(
                  "td",
                  null,
                  dispute.reportedAgainst ||
                    "Not specified"
                ),

                React.createElement(
                  "td",
                  null,
                  dispute.reason ||
                    "Not specified"
                ),

                React.createElement(
                  "td",
                  null,
                  dispute.description ||
                    "No description"
                ),

                React.createElement(
                  "td",
                  null,

                  React.createElement(
                    "span",
                    {
                      className:
                        getStatusClass(
                          dispute.status
                        )
                    },

                    dispute.status ||
                      "Pending"
                  )
                ),

                React.createElement(
                  "td",
                  null,
                  dispute.adminNote ||
                    "—"
                ),

                React.createElement(
                  "td",
                  null,

                  isResolved

                    ? React.createElement(
                        "span",
                        {
                          className:
                            "admin-protected-label"
                        },
                        "✅ Resolved"
                      )

                    : React.createElement(
                        "button",
                        {
                          className:
                            "admin-user-action-btn unblock",
                          onClick:
                            function () {
                              resolveDispute(
                                dispute
                              );
                            }
                        },
                        "✅ Resolve"
                      )
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
        className: "admin-section-card"
      },

      React.createElement(
        "div",
        {
          className: "admin-section-header"
        },

        React.createElement(
          "div",
          null,

          React.createElement(
            "h2",
            null,
            "Swap Requests"
          ),

          React.createElement(
            "p",
            null,
            "Monitor swap requests between users."
          )
        ),

        React.createElement(
          "span",
          {
            className: "admin-section-count"
          },
          swapRequests.length +
            " Requests"
        )
      ),

      swapRequests.length === 0
        ? React.createElement(
            "div",
            {
              className: "admin-empty-state"
            },
            "No swap requests available."
          )
        : React.createElement(
            "div",
            {
              className: "admin-table-wrapper"
            },

            React.createElement(
              "table",
              {
                className: "admin-table"
              },

              React.createElement(
                "thead",
                null,

                React.createElement(
                  "tr",
                  null,

                  React.createElement(
                    "th",
                    null,
                    "Clothing"
                  ),

                  React.createElement(
                    "th",
                    null,
                    "Requester"
                  ),

                  React.createElement(
                    "th",
                    null,
                    "Owner"
                  ),

                  React.createElement(
                    "th",
                    null,
                    "Status"
                  ),

                  React.createElement(
                    "th",
                    null,
                    "Agreement"
                  )
                )
              ),

              React.createElement(
                "tbody",
                null,

                swapRequests
                  .slice(0, 10)
                  .map(function (request) {
                    const agreement =
                      getAgreementStatus(
                        request
                      );

                    return React.createElement(
                      "tr",
                      {
                        key: request._id
                      },

                      React.createElement(
                        "td",
                        null,
                        getRequestClothing(
                          request
                        )
                      ),

                      React.createElement(
                        "td",
                        null,
                        getRequesterName(
                          request
                        )
                      ),

                      React.createElement(
                        "td",
                        null,
                        getRequestOwner(
                          request
                        )
                      ),

                      React.createElement(
                        "td",
                        null,

                        React.createElement(
                          "span",
                          {
                            className:
                              getStatusClass(
                                request.status
                              )
                          },
                          request.status ||
                            "Unknown"
                        )
                      ),

                      React.createElement(
                        "td",
                        null,

                        React.createElement(
                          "span",
                          {
                            className:
                              getStatusClass(
                                agreement
                              )
                          },
                          agreement
                        )
                      )
                    );
                  })
              )
            )
          ),

      swapRequests.length > 10 &&
        React.createElement(
          "div",
          {
            className: "admin-table-note"
          },
          "Showing latest 10 swap requests."
        )
    ),

    

    React.createElement(
      "div",
      {
        className: "admin-info-footer"
      },

      React.createElement(
        "strong",
        null,
        "Admin Monitoring"
      ),

      React.createElement(
        "p",
        null,
        "Use this panel to manage users, monitor clothing listings and swap activity. Admin actions should be performed carefully."
      )
    )
  );
}

export default AdminPanel;