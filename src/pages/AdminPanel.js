import React, { useEffect, useState } from "react";
import API_URL from "../api";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "../style.css";

function AdminPanel() {
  const [clothes, setClothes] = useState([]);
  const [listingSearch, setListingSearch] = useState("");
const [listingCategoryFilter, setListingCategoryFilter] = useState("All");
const [listingLocationFilter, setListingLocationFilter] = useState("All");
const [listingSortBy, setListingSortBy] = useState("Newest First");
const [listingPage, setListingPage] = useState(1);
const [listingPageSize, setListingPageSize] = useState(10);
  const [swapRequests, setSwapRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [swapRequestsLoading, setSwapRequestsLoading] = useState(true);
  
  const [disputes, setDisputes] = useState([]);
  const [disputesLoading, setDisputesLoading] = useState(true);
  const [reportedListings, setReportedListings] = useState([]);
  const [reportedListingsLoading, setReportedListingsLoading] = useState(true);
  const [removedClothes, setRemovedClothes] = useState([]);
const [removedClothesLoading, setRemovedClothesLoading] = useState(true);
  const [selectedReports, setSelectedReports] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [dashboardCounts, setDashboardCounts] = useState(function () {
  try {
    return JSON.parse(
      localStorage.getItem("clothswapAdminDashboardCounts") || "{}"
    );
  } catch (error) {
    return {};
  }
});

useEffect(() => {
  localStorage.setItem(
    "clothswapAdminDashboardCounts",
    JSON.stringify(dashboardCounts)
  );
}, [dashboardCounts]);
  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("All");
  const [userSortBy, setUserSortBy] = useState("Newest Users");
  const [swapStatusFilter, setSwapStatusFilter] = useState("All");
  const [disputeStatusFilter, setDisputeStatusFilter] = useState("All");
const [disputeSearch, setDisputeSearch] = useState("");
const [selectedDisputes, setSelectedDisputes] = useState([]);
const [showDisputeCheckboxes, setShowDisputeCheckboxes] = useState(false);
const [selectedDisputeHistory, setSelectedDisputeHistory] = useState(null);
const [selectedOverviewHistory, setSelectedOverviewHistory] = useState(null);
const [selectedDisputeImages, setSelectedDisputeImages] = useState([]);
const [showReportCheckboxes, setShowReportCheckboxes] = useState(false);

 useEffect(() => {
  loadAdminData();
  loadUsers();
  loadDisputes();
  loadReportedListings();
  loadRemovedClothes();

  const interval = setInterval(() => {
    loadAdminData();
  }, 30000);

  return () => clearInterval(interval);
}, []);
function updateDashboardCounts(newCounts) {
  setDashboardCounts(function (previous) {
    return {
      ...previous,
      ...newCounts
    };
  });
}
 
async function loadClothesData() {
  try {
    const clothesResponse = await fetch(`${API_URL}/api/clothes`);
    const clothesData = await clothesResponse.json();

    if (clothesResponse.ok) {
      let clothesList = [];

      if (Array.isArray(clothesData)) {
        clothesList = clothesData;
      } else if (clothesData && Array.isArray(clothesData.clothes)) {
        clothesList = clothesData.clothes;
      }

      setClothes(clothesList);
      updateDashboardCounts({
        totalListings: clothesList.length
      });
    }
  } catch (error) {
    console.log("Clothes loading error:", error);
  } finally {
    setListingsLoading(false);
  }
}

async function loadSwapRequestsData() {
  try {
    const requestsResponse = await fetch(
      `${API_URL}/api/admin/swap-requests`,
      {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("clothswapToken")
        }
      }
    );

    const requestsData = await requestsResponse.json();

    if (requestsResponse.ok) {
      let requestsList = [];

      if (Array.isArray(requestsData)) {
        requestsList = requestsData;
      } else if (requestsData && Array.isArray(requestsData.requests)) {
        requestsList = requestsData.requests;
      }

      setSwapRequests(requestsList);

      updateDashboardCounts({
        totalSwapRequests: requestsList.length,
        pendingRequests: requestsList.filter(item => item.status === "Pending").length,
        acceptedRequests: requestsList.filter(item => item.status === "Accepted").length,
        rejectedRequests: requestsList.filter(item => item.status === "Rejected").length,
        completedSwaps: requestsList.filter(item => item.completionStatus === "Completed").length
      });
    }
  } catch (error) {
    console.log("Swap requests loading error:", error);
  } finally {
    setSwapRequestsLoading(false);
  }
}

function loadAdminData() {
  loadClothesData();
  loadSwapRequestsData();
}

  async function loadUsers() {
    try {
      setUsersLoading(true);

     const response = await fetch(
`${API_URL}/api/admin/users`,
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
        updateDashboardCounts({
  totalUsers: data.users.length,

  activeUsers: data.users.filter(function (user) {
    return user.status === "Active";
  }).length,

  blockedUsers: data.users.filter(function (user) {
    return user.status === "Blocked";
  }).length
});
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
  `${API_URL}/api/admin/disputes`,
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
      const activeDisputesList = data.disputes.filter(
  function (dispute) {
    return !dispute.isDeleted;
  }
);

updateDashboardCounts({
  totalDisputes: data.disputes.length,

  pendingDisputes: activeDisputesList.filter(
    function (dispute) {
      return dispute.status === "Pending";
    }
  ).length,

  resolvedDisputes: activeDisputesList.filter(
    function (dispute) {
      return dispute.status === "Resolved";
    }
  ).length
});
    } else {
      setDisputes([]);
    }
    } catch (error) {
    console.log("Disputes loading error:", error);
    setDisputes([]);
  } finally {
    setDisputesLoading(false);
  }
}
async function loadReportedListings() {
  try {
    const response = await fetch(
      `${API_URL}/api/admin/reported-listings`,
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
      Array.isArray(data.reports)
    ) {
      setReportedListings(data.reports);
    } else {
      setReportedListings([]);
    }
   } catch (error) {
    console.log("Reported listings loading error:", error);
    setReportedListings([]);
  } finally {
    setReportedListingsLoading(false);
  }
}
  
async function loadRemovedClothes() {
  try {
    setRemovedClothesLoading(true);

    const response = await fetch(
      `${API_URL}/api/admin/clothes`,
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
      Array.isArray(data.clothes)
    ) {
      setRemovedClothes(data.clothes);
    } else {
      setRemovedClothes([]);
    }

  } catch (error) {
    console.log("Removed clothing history error:", error);
    setRemovedClothes([]);
  } finally {
    setRemovedClothesLoading(false);
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

   function isSwapCompleted(request) {
    return request.completionStatus === "Completed";
  }

  const completedSwaps = swapRequests.filter(isSwapCompleted);
  // DISPUTE SUMMARY COUNTS

const activeDisputes = disputes.filter(function (dispute) {
  return !dispute.isDeleted;
});

const pendingDisputes = activeDisputes.filter(function (dispute) {
  return dispute.status === "Pending";
});

const resolvedDisputes = activeDisputes.filter(function (dispute) {
  return dispute.status === "Resolved";
});

const rejectedDisputes = activeDisputes.filter(function (dispute) {
  return dispute.status === "Rejected";
});

const filteredDisputes = disputes.filter(function (dispute) {
  const search = disputeSearch.trim().toLowerCase();

  const matchesSearch =
    (dispute.reportedBy || "").toLowerCase().includes(search) ||
    (dispute.reportedAgainst || "").toLowerCase().includes(search) ||
    (dispute.reason || "").toLowerCase().includes(search) ||
    (dispute.description || "").toLowerCase().includes(search);

  let matchesStatus = false;

  if (disputeStatusFilter === "History") {
    matchesStatus =
      dispute.isDeleted === true ||
      dispute.status === "Resolved" ||
      dispute.status === "Rejected" ||
      (
        Array.isArray(dispute.resolutionHistory) &&
        dispute.resolutionHistory.length > 0
      );
  } else {
    matchesStatus =
      !dispute.isDeleted &&
      (
        disputeStatusFilter === "All" ||
        dispute.status === disputeStatusFilter
      );
  }

  return matchesSearch && matchesStatus;
});

const filteredSwapRequests = swapRequests.filter(function (request) {
  const status = getAdminSwapStatus(request);
  const method = request.exchangeMethod || "Not Selected";

  // Deleted requests should appear only in Deleted History
  if (request.isDeleted === true) {
    return swapStatusFilter === "Deleted History";
  }

  if (swapStatusFilter === "Deleted History") {
    return false;
  }

  if (swapStatusFilter === "All") {
    return true;
  }

  if (
    swapStatusFilter === "Accepted" ||
    swapStatusFilter === "Pending" ||
    swapStatusFilter === "Completed" ||
    swapStatusFilter === "Rejected"
  ) {
    return status === swapStatusFilter;
  }

  if (swapStatusFilter === "Courier") {
    return method === "Courier";
  }

  if (swapStatusFilter === "Local Exchange") {
    return method === "Local Exchange";
  }

  if (swapStatusFilter === "Not Selected") {
    return method === "Not Selected";
  }

  return false;
});

function getSwapFilterCount(filter) {
  if (filter === "All") {
    return swapRequests.filter(function (request) {
      return request.isDeleted !== true;
    }).length;
  }

  if (filter === "Deleted History") {
    return swapRequests.filter(function (request) {
      return request.isDeleted === true;
    }).length;
  }

  return swapRequests.filter(function (request) {
    if (request.isDeleted === true) {
      return false;
    }

    const status = getAdminSwapStatus(request);
    const method = request.exchangeMethod || "Not Selected";

    if (
      filter === "Accepted" ||
      filter === "Pending" ||
      filter === "Completed" ||
      filter === "Rejected"
    ) {
      return status === filter;
    }

    if (filter === "Courier") {
      return method === "Courier";
    }

    if (filter === "Local Exchange") {
      return method === "Local Exchange";
    }

    if (filter === "Not Selected") {
      return method === "Not Selected";
    }

    return false;
  }).length;
}
  const activeUsers = users.filter(function (user) {
    return user.status === "Active";
  });

  const blockedUsers = users.filter(function (user) {
  return user.status === "Blocked";
});
// FILTER USERS
const filteredUsers = users.filter(function (user) {
  const search = userSearch.trim().toLowerCase();

  const matchesSearch =
    (user.name || "").toLowerCase().includes(search) ||
    (user.email || "").toLowerCase().includes(search) ||
    (user.location || "").toLowerCase().includes(search) ||
    (user.role || "").toLowerCase().includes(search) ||
    (user.status || "").toLowerCase().includes(search);

  const matchesStatus =
    userStatusFilter === "All" ||
    user.status === userStatusFilter;

  return matchesSearch && matchesStatus;
});
const sortedUsers = [...filteredUsers].sort(function (a, b) {
  if (userSortBy === "Newest Users") {
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  }

  if (userSortBy === "Oldest Users") {
    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  }

  if (userSortBy === "Most Active Users") {
    const activityA =
      (a.totalListings || 0) +
      (a.swapRequestsSent || 0) +
      (a.swapRequestsReceived || 0) +
      (a.completedSwaps || 0);

    const activityB =
      (b.totalListings || 0) +
      (b.swapRequestsSent || 0) +
      (b.swapRequestsReceived || 0) +
      (b.completedSwaps || 0);

    return activityB - activityA;
  }

  return 0;
});


async function deleteClothing(id) {
  const confirmDelete = window.confirm(
    "Are you sure you want to remove this clothing listing?"
  );

  if (!confirmDelete) return;

  const removalReason = window.prompt(
    "Please enter the reason for removing this listing:"
  );

  if (removalReason === null || !removalReason.trim()) {
    alert("Removal reason is required.");
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/api/admin/clothes/${id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer " + localStorage.getItem("clothswapToken")
        },
        body: JSON.stringify({
          adminEmail:
            localStorage.getItem("clothswapEmail") ||
            localStorage.getItem("clothswapUserEmail") ||
            "",
          removalReason: removalReason.trim()
        })
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

    await loadRemovedClothes();

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
        `${API_URL}/api/admin/users/` +
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
           return {
  ...item,
  ...(data.user || {}),
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
  `${API_URL}/api/admin/users/` +
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
 async function exportUsersExcel() {
  if (users.length === 0) {
    alert("No users available to export.");
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("ClothSwap Users");

  worksheet.columns = [
    { width: 25 },
    { width: 32 },
    { width: 20 },
    { width: 15 },
    { width: 15 },
    { width: 16 },
    { width: 16 },
    { width: 18 },
    { width: 18 },
    { width: 22 },
    { width: 16 }
  ];

  // TITLE
  worksheet.mergeCells("A1:K1");
  worksheet.getCell("A1").value = "ClothSwap - User Management";
  worksheet.getCell("A1").font = {
    name: "Arial",
    size: 20,
    bold: true,
    color: { argb: "FFFFFFFF" }
  };
  worksheet.getCell("A1").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF8846A5" }
  };
  worksheet.getCell("A1").alignment = {
    horizontal: "center",
    vertical: "middle"
  };
  worksheet.getRow(1).height = 40;

  // SUBTITLE
  worksheet.mergeCells("A2:K2");
  worksheet.getCell("A2").value =
    "Registered Users Report | Swap • Share • Rewear";
  worksheet.getCell("A2").font = {
    italic: true,
    size: 12,
    color: { argb: "FF75438D" }
  };
  worksheet.getCell("A2").alignment = {
    horizontal: "center"
  };

  // TOTAL USERS
  worksheet.mergeCells("A4:K4");
  worksheet.getCell("A4").value =
    "Total Registered Users: " + users.length;
  worksheet.getCell("A4").font = {
    bold: true,
    size: 13,
    color: { argb: "FF75438D" }
  };
  worksheet.getCell("A4").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF1DDF8" }
  };

  const headers = [
    "Name",
    "Email",
    "Location",
    "Role",
    "Status",
    "Total Listings",
    "Requests Sent",
    "Requests Received",
    "Completed Swaps",
    "Last Active",
    "Inactive Days"
  ];

  const headerRow = worksheet.addRow(headers);

  headerRow.height = 32;
  headerRow.eachCell(function (cell) {
    cell.font = {
      bold: true,
      color: { argb: "FFFFFFFF" },
      size: 11
    };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF9B59B6" }
    };

    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true
    };
  });

  // USER DATA
  users.forEach(function (user) {
    const row = worksheet.addRow([
      user.name || "",
      user.email || "",
      user.location || "",
      user.role || "User",
      user.status || "Active",
      user.totalListings || 0,
      user.swapRequestsSent || 0,
      user.swapRequestsReceived || 0,
      user.completedSwaps || 0,
      user.lastActive || "",
      user.inactiveDays ?? ""
    ]);

    row.height = 25;

    row.eachCell(function (cell) {
      cell.font = {
        name: "Arial",
        size: 10,
        color: { argb: "FF493052" }
      };

      cell.alignment = {
        vertical: "middle",
        horizontal: "center"
      };

      cell.border = {
        top: { style: "thin", color: { argb: "FFE5C9EF" } },
        bottom: { style: "thin", color: { argb: "FFE5C9EF" } },
        left: { style: "thin", color: { argb: "FFE5C9EF" } },
        right: { style: "thin", color: { argb: "FFE5C9EF" } }
      };
    });

    if (row.number % 2 === 0) {
      row.eachCell(function (cell) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFAF3FC" }
        };
      });
    }
  });

  worksheet.views = [
    { state: "frozen", ySplit: 5 }
  ];

  worksheet.autoFilter = {
    from: "A5",
    to: "K5"
  };

  // DOWNLOAD EXCEL
  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob(
    [buffer],
    {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "ClothSwap_Users.xlsx";
  link.click();

  setTimeout(function () {
    URL.revokeObjectURL(url);
  }, 1000);

  alert("Excel report downloaded successfully!");
}
function exportUsersPDF() {
  if (users.length === 0) {
    alert("No users available to export.");
    return;
  }

  const doc = new jsPDF("landscape", "mm", "a4");

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const activeUsers = users.filter(function (u) {
    return (u.status || "Active") === "Active";
  }).length;

  const blockedUsers = users.filter(function (u) {
    return u.status === "Blocked";
  }).length;

  const adminUsers = users.filter(function (u) {
    return u.role === "Admin";
  }).length;

  const totalListings = users.reduce(function (sum, u) {
    return sum + (Number(u.totalListings) || 0);
  }, 0);

  const totalCompleted = users.reduce(function (sum, u) {
    return sum + (Number(u.completedSwaps) || 0);
  }, 0);

  function formatDate(value) {
    if (!value) return "N/A";

    const date = new Date(value);

    if (isNaN(date.getTime())) return value;

    return date.toLocaleString("en-IN");
  }

  autoTable(doc, {
    startY: 88,

    head: [[
      "Name",
      "Email",
      "Location",
      "Role",
      "Status",
      "Registered On",
      "Listings",
      "Sent",
      "Received",
      "Completed",
      "Last Active",
      "Inactive Days",
      "Admin Action"
    ]],

    body: users.map(function (user) {
      return [
        user.name || "N/A",
        user.email || "N/A",
        user.location || "Not specified",
        user.role || "User",
        user.status || "Active",
        formatDate(user.createdAt),
        user.totalListings || 0,
        user.swapRequestsSent || 0,
        user.swapRequestsReceived || 0,
        user.completedSwaps || 0,
       formatDate(user.lastActive),
user.inactiveDays ?? "N/A",
user.status === "Blocked"
  ? "Unblock User"
  : "Block User"
      ];
    }),

    theme: "grid",

    margin: {
      top: 88,
      left: 10,
      right: 10,
      bottom: 17
    },

    styles: {
      fontSize: 6.5,
      cellPadding: 3,
      textColor: [73, 48, 82],
      lineColor: [229, 201, 239],
      lineWidth: 0.2,
      overflow: "linebreak",
      valign: "middle"
    },

    headStyles: {
      fillColor: [155, 89, 182],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center"
    },

    alternateRowStyles: {
      fillColor: [250, 243, 252]
    },

    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 38 },
      2: { cellWidth: 23 },
      3: { cellWidth: 13 },
      4: { cellWidth: 15 },
      5: { cellWidth: 24 },
      6: { cellWidth: 13 },
      7: { cellWidth: 11 },
      8: { cellWidth: 14 },
      9: { cellWidth: 15 },
      10: { cellWidth: 29 },
      11: { cellWidth: 16 },
      12: { cellWidth: 20 }
    },

    willDrawPage: function () {
      // FULL PAGE BACKGROUND
      doc.setFillColor(250, 243, 252);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      // HEADER
      doc.setFillColor(136, 70, 165);
      doc.rect(0, 0, pageWidth, 32, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(21);
      doc.text("ClothSwap", 12, 14);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text("Complete User Management Report", 12, 23);
    },

    didDrawPage: function () {
      doc.setDrawColor(215, 181, 229);
      doc.line(10, pageHeight - 13, pageWidth - 10, pageHeight - 13);

      doc.setFontSize(8);
      doc.setTextColor(117, 67, 141);

      doc.text(
        "ClothSwap | Swap • Share • Rewear",
        10,
        pageHeight - 7
      );

      doc.text(
        "Page " + doc.internal.getNumberOfPages(),
        pageWidth - 25,
        pageHeight - 7
      );
    }
  });
doc.setPage(1);
  // SUMMARY SECTION ON FIRST PAGE
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(10, 38, pageWidth - 20, 42, 3, 3, "F");

  doc.setTextColor(117, 67, 141);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("REPORT OVERVIEW", 16, 46);

  const summary = [
    ["Total Users", users.length],
    ["Active Users", activeUsers],
    ["Blocked Users", blockedUsers],
    ["Admins", adminUsers],
    ["Total Listings", totalListings],
    ["Completed Swaps", totalCompleted]
  ];

  const cardWidth = 42;
  const cardGap = 3;
  const startX = 16;

  summary.forEach(function (item, index) {
    const x = startX + index * (cardWidth + cardGap);

    doc.setFillColor(244, 229, 250);
    doc.roundedRect(x, 51, cardWidth, 22, 2, 2, "F");

    doc.setFontSize(13);
    doc.setTextColor(136, 70, 165);
    doc.text(String(item[1]), x + cardWidth / 2, 61, {
      align: "center"
    });

    doc.setFontSize(7);
    doc.setTextColor(90, 60, 105);
    doc.text(item[0], x + cardWidth / 2, 68, {
      align: "center"
    });
  });
    // SUMMARY FIRST PAGE PAR SHOW KARO
  doc.setPage(1);

  // DOWNLOAD PDF
  doc.save("ClothSwap_Users.pdf");
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
      `${API_URL}/api/admin/disputes/` +
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

async function rejectDispute(dispute) {
  const adminNote = window.prompt(
    "Enter the reason for rejecting this dispute:"
  );

  if (adminNote === null) return;

  if (!adminNote.trim()) {
    alert("Please enter a rejection reason.");
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/api/admin/disputes/${dispute._id}/reject`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("clothswapToken")
        },
        body: JSON.stringify({
          adminNote: adminNote.trim()
        })
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      alert(data.message || "Failed to reject dispute.");
      return;
    }

    setDisputes(function (previous) {
      return previous.map(function (item) {
        return item._id === dispute._id ? data.dispute : item;
      });
    });

    alert("Dispute rejected successfully.");

  } catch (error) {
    console.error("Reject dispute error:", error);
    alert("Failed to reject dispute.");
  }
}
function toggleDisputeSelection(disputeId, isChecked) {
  const id = String(disputeId);

  setSelectedDisputes(function (previous) {
    if (isChecked) {
      return previous.includes(id)
        ? previous
        : [...previous, id];
    }

    return previous.filter(function (item) {
      return item !== id;
    });
  });
}

function toggleSelectAllDisputes() {
  const activeIds = filteredDisputes
    .filter(function (dispute) {
      return !dispute.isDeleted;
    })
    .map(function (dispute) {
      return String(dispute._id);
    });

  const allSelected =
    activeIds.length > 0 &&
    activeIds.every(function (id) {
      return selectedDisputes.includes(id);
    });

  if (allSelected) {
    setSelectedDisputes(function (previous) {
      return previous.filter(function (id) {
        return !activeIds.includes(id);
      });
    });

    setShowDisputeCheckboxes(false);
  } else {
    setSelectedDisputes(function (previous) {
      return Array.from(new Set([...previous, ...activeIds]));
    });

    setShowDisputeCheckboxes(true);
  }
}
async function deleteSelectedDisputes(ids) {
  const confirmed = window.confirm(
    "Are you sure you want to archive " +
    ids.length +
    " dispute(s)? Their history will be preserved."
  );

  if (!confirmed) return;

  try {
    const response = await fetch(
      `${API_URL}/api/admin/disputes`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("clothswapToken")
        },
        body: JSON.stringify({ ids: ids })
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      alert(data.message || "Failed to archive disputes.");
      return;
    }

    setSelectedDisputes([]);

    await loadDisputes();

    alert(data.message || "Disputes archived successfully.");

  } catch (error) {
    console.error("Dispute delete error:", error);
    alert("Failed to archive disputes.");
  }
}

function deleteAllResolvedDisputes() {
  const resolvedIds = disputes
    .filter(function (dispute) {
      return dispute.status === "Resolved" && !dispute.isDeleted;
    })
    .map(function (dispute) {
      return String(dispute._id);
    });

  if (resolvedIds.length === 0) {
    alert("No resolved disputes available.");
    return;
  }

  deleteSelectedDisputes(resolvedIds);
}


async function updateReportedListing(reportId, status) {
  let adminNote = "";

  if (status === "Removed") {
    if (!window.confirm("Are you sure you want to remove this listing?")) {
      return;
    }

    adminNote = window.prompt(
      "Please enter the reason for removing this listing:"
    );

    if (adminNote === null || !adminNote.trim()) {
      alert("Removal reason is required.");
      return;
    }
  }

  try {
    const response = await fetch(
      `${API_URL}/api/admin/reported-listings/${reportId}/review`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer " + localStorage.getItem("clothswapToken")
        },
        body: JSON.stringify({
          status: status,
          adminNote: adminNote.trim()
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to update report.");
    }

    setReportedListings(function (prev) {
      return prev.map(function (report) {
        return report._id === reportId
          ? { ...report, status: status }
          : report;
      });
    });

    if (status === "Removed") {
      await loadRemovedClothes();
    }

    alert("Reported listing updated successfully.");

  } catch (error) {
    alert(error.message);
  }
}

 function toggleReportSelection(reportId) {
  setSelectedReports(function (prev) {
    if (prev.includes(reportId)) {
      return prev.filter(function (id) {
        return id !== reportId;
      });
    }

    return [...prev, reportId];
  });
}

function toggleSelectAllReports() {
  const allSelected =
    reportedListings.length > 0 &&
    reportedListings.every(function (report) {
      return selectedReports.includes(String(report._id));
    });

  if (allSelected) {
    setSelectedReports([]);
  } else {
    setSelectedReports(
      reportedListings.map(function (report) {
        return String(report._id);
      })
    );
  }
}

async function deleteSelectedReports() {
  if (selectedReports.length === 0) {
    return;
  }

  const isAllSelected =
    selectedReports.length === reportedListings.length;

  const confirmDelete = window.confirm(
    isAllSelected
      ? "Are you sure you want to permanently delete all reported listings?"
      : "Are you sure you want to permanently delete selected reports?"
  );

  if (!confirmDelete) {
    return;
  }

  try {
    console.log(
  "DELETE API URL:",
  `${API_URL}/api/admin/reported-listings`
);
    const response = await fetch(
      `${API_URL}/api/admin/reported-listings`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer " +
            localStorage.getItem("clothswapToken")
        },
        body: JSON.stringify({
          ids: selectedReports
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to delete reports."
      );
    }

    setReportedListings(function (prev) {
      return prev.filter(function (report) {
        return !selectedReports.includes(report._id);
      });
    });

    setSelectedReports([]);

    alert(data.message || "Reports deleted successfully.");

  } catch (error) {
    alert(error.message);
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
  if (!item) return "Unknown";

  if (item.ownerName) return item.ownerName;
  if (item.userName) return item.userName;
  if (item.username) return item.username;

  if (typeof item.owner === "string" && item.owner.trim()) {
    return item.owner;
  }

  if (item.owner && typeof item.owner === "object") {
    return item.owner.name || item.owner.email || "Unknown";
  }

  if (item.user) return item.user;

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
  function openOverviewHistory(title, items, type) {
  setSelectedOverviewHistory({
    title: title,
    items: items,
    type: type
  });
}
function getAdminSwapStatus(request) {
  if (isSwapCompleted(request)) {
    return "Completed";
  }

  return request.status || "Unknown";
}
// MANAGE LISTINGS FILTERS

const listingCategories = [
  "Dresses",
  "Shirts",
  "T-Shirts",
  "Tops",
  "Jeans",
  "Trousers",
  "Shorts",
  "Skirts",
  "Jackets",
  "Hoodies",
  "Sweaters",
  "Coats",
  "Blazers",
  "Kurtis",
  "Sarees",
  "Lehengas",
  "Leggings",
  "Jumpsuits",
  "Other"
];
const listingLocations = Array.from(
  new Set(
    clothes.map(function (item) {
      return getLocation(item);
    }).filter(function (location) {
      return location !== "Not specified";
    })
  )
);

// SEARCH + FILTER
const filteredClothes = clothes.filter(function (item) {
  const search = listingSearch.trim().toLowerCase();

  const matchesSearch =
    String(getClothingTitle(item) || "")
      .toLowerCase().includes(search) ||
    String(getOwnerName(item) || "")
      .toLowerCase().includes(search);

  const matchesCategory =
    listingCategoryFilter === "All" ||
    getCategory(item) === listingCategoryFilter;

  const matchesLocation =
    listingLocationFilter === "All" ||
    getLocation(item) === listingLocationFilter;

  return matchesSearch && matchesCategory && matchesLocation;
});

// SORT LISTINGS
const sortedClothes = [...filteredClothes].sort(function (a, b) {
  if (listingSortBy === "Newest First") {
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  }

  if (listingSortBy === "Oldest First") {
    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  }

  if (listingSortBy === "Name A-Z") {
    return getClothingTitle(a).localeCompare(getClothingTitle(b));
  }

  if (listingSortBy === "Name Z-A") {
    return getClothingTitle(b).localeCompare(getClothingTitle(a));
  }

  const valueA = Number(
    a.estimatedValue || a.swapValue || a.value || a.price || 0
  );

  const valueB = Number(
    b.estimatedValue || b.swapValue || b.value || b.price || 0
  );

  if (listingSortBy === "Value Low to High") {
    return valueA - valueB;
  }

  if (listingSortBy === "Value High to Low") {
    return valueB - valueA;
  }

  return 0;
});


// PAGINATION

const effectiveListingPageSize =
  listingPageSize === "All"
    ? Math.max(sortedClothes.length, 1)
    : listingPageSize;

const totalListingPages =
  listingPageSize === "All"
    ? 1
    : Math.ceil(
        sortedClothes.length / effectiveListingPageSize
      );

const currentListingPage = Math.min(
  listingPage,
  Math.max(totalListingPages, 1)
);

const paginatedClothes = sortedClothes.slice(
  (currentListingPage - 1) * effectiveListingPageSize,
  currentListingPage * effectiveListingPageSize
);

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

  /* ADMIN PANEL NAVIGATION */

React.createElement(
  "div",
  {
    className: "admin-navigation"
  },

  React.createElement(
    "a",
    { href: "#admin-overview" },
    "Overview"
  ),

  React.createElement(
    "a",
    { href: "#manage-users" },
    "Manage Users"
  ),

  React.createElement(
    "a",
    { href: "#manage-listings" },
    "Manage Listings"
  ),

  React.createElement(
    "a",
    { href: "#swap-activities" },
    "Swap Activities"
  ),
  React.createElement(
    "a",
    { href: "#dispute-center" },
    "Dispute Center"
  ),
  React.createElement(
  "a",
  { href: "#reported-listings" },
  "Reported Listings"
),
React.createElement(
  "a",
  { href: "#removed-listings" },
  "Removal History"
)
),

    React.createElement(
      "div",
      {
        className: "admin-stats-grid",
        id: "admin-overview"
        
      },

     React.createElement(
  "div",
  {
    className: "admin-stat-card",
    role: "button",
    onClick: function () {
  openOverviewHistory("Total Listings", clothes, "listings");
}
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
          className: "admin-stat-card",
          role: "button",
         onClick: function () {
  openOverviewHistory("Total Swap Requests", swapRequests, "swaps");
}
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
          className: "admin-stat-card",
          onClick: function () {
  openOverviewHistory("Pending Requests", pendingRequests, "swaps");
}
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
          className: "admin-stat-card",
          onClick: function () {
  openOverviewHistory("Accepted Swaps", acceptedRequests, "swaps");
}
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
          className: "admin-stat-card",
          onClick: function () {
  openOverviewHistory("Rejected Requests", rejectedRequests, "swaps");
}
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
          className: "admin-stat-card",
          onClick: function () {
  openOverviewHistory("Completed Swaps", completedSwaps, "swaps");
}
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
        className: "admin-section-card",
        id: "manage-users"

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
// USER SEARCH BOX

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
      // USER SEARCH BOX
React.createElement(
  "div",
  {
    className: "admin-user-filters"
  },

  React.createElement("input", {
    type: "text",
    className: "admin-search-input",
    placeholder: "Search users...",
    value: userSearch,
    onChange: function (event) {
      setUserSearch(event.target.value);
    }
  }),

  React.createElement(
    "select",
    {
      className: "admin-user-sort-filter",
      value: userSortBy,
      onChange: function (event) {
        setUserSortBy(event.target.value);
      }
    },
    React.createElement("option", { value: "Newest Users" }, "Newest Users"),
    React.createElement("option", { value: "Oldest Users" }, "Oldest Users"),
    React.createElement("option", { value: "Most Active Users" }, "Most Active Users")
  ),

  React.createElement(
  "button",
  {
    type: "button",
    className: "admin-export-users-btn",
    onClick: exportUsersExcel
  },
  "📊 Export Excel"
),
React.createElement(
  "button",
  {
    type: "button",
    className: "admin-export-pdf-btn",
    onClick: exportUsersPDF
  },
  "📄 Export PDF"
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
  : filteredUsers.length === 0
  ? React.createElement(
      "div",
      {
        className: "admin-empty-state"
      },
      "No users match your search."
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

            React.createElement("th", null, "Name"),
            React.createElement("th", null, "Email"),
            React.createElement("th", null, "Location"),
            React.createElement("th", null, "Role"),
            React.createElement("th", null, "Status"),
            React.createElement("th", null, "Listings"),
            React.createElement("th", null, "Requests Sent"),
            React.createElement("th", null, "Requests Received"),
            React.createElement("th", null, "Completed Swaps"),
            React.createElement("th", null, "Last Active"),
            React.createElement("th", null, "Inactive Days"),
            React.createElement("th", null, "Action")
          )
        ),

        React.createElement(
          "tbody",
          null,

          sortedUsers.map(function (user) {
            const isAdmin = user.role === "Admin";

            const lastActiveText = user.lastActive
              ? new Date(user.lastActive).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })
              : "Never";

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
                    className: "admin-user-role"
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
                    className: getStatusClass(user.status)
                  },
                  user.status || "Active"
                )
              ),

              React.createElement(
                "td",
                null,
                user.totalListings || 0
              ),

              React.createElement(
                "td",
                null,
                user.swapRequestsSent || 0
              ),

              React.createElement(
                "td",
                null,
                user.swapRequestsReceived || 0
              ),

              React.createElement(
                "td",
                null,
                user.completedSwaps || 0
              ),

              React.createElement(
                "td",
                null,
                lastActiveText
              ),

              React.createElement(
                "td",
                null,
                user.inactiveDays !== null &&
                user.inactiveDays !== undefined
                  ? user.inactiveDays + " days"
                  : "Not available"
              ),

              React.createElement(
                "td",
                null,

            React.createElement(
  "div",
  {
    className: "admin-user-actions",
    style: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: "10px",
      flexWrap: "nowrap",
      whiteSpace: "nowrap",
      minWidth: "max-content"
    }
  },
                  isAdmin
                    ? React.createElement(
                        "span",
                        {
                          className: "admin-protected-label"
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
                              user.status === "Blocked"
                                ? "admin-user-action-btn unblock"
                                : "admin-user-action-btn block",
                            onClick: function () {
                              changeUserStatus(user);
                            }
                          },
                          user.status === "Blocked"
                            ? "🔓 Unblock"
                            : "🚫 Block"
                        ),

                        React.createElement(
                          "button",
                          {
                            className: "admin-user-action-btn delete",
                            onClick: function () {
                              deleteUser(user);
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
        className: "admin-section-card",
        id: "manage-listings"
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
          sortedClothes.length + " Listings"
        )
      ),
React.createElement(
  "div",
  {
    className: "admin-listing-toolbar",
    style: {
      display: "flex",
      gap: "12px",
      flexWrap: "wrap",
      marginBottom: "20px"
    }
  },

  React.createElement("input", {
    type: "text",
    placeholder: "Search by clothing name or owner...",
    value: listingSearch,
    onChange: function (e) {
      setListingSearch(e.target.value);
      setListingPage(1);
    },
    style: {
      flex: "1",
      minWidth: "220px",
      padding: "10px",
      borderRadius: "8px",
      border: "1px solid #ddd"
    }
  }),

  React.createElement(
    "select",
    {
      value: listingCategoryFilter,
      onChange: function (e) {
        setListingCategoryFilter(e.target.value);
        setListingPage(1);
      },
      style: {
        padding: "10px",
        borderRadius: "8px",
        border: "1px solid #ddd"
      }
    },
    React.createElement("option", { value: "All" }, "All Categories"),
    listingCategories.map(function (category) {
      return React.createElement(
        "option",
        { key: category, value: category },
        category
      );
    })
  ),

  React.createElement(
    "select",
    {
      value: listingLocationFilter,
      onChange: function (e) {
        setListingLocationFilter(e.target.value);
        setListingPage(1);
      },
      style: {
        padding: "10px",
        borderRadius: "8px",
        border: "1px solid #ddd"
      }
    },
    React.createElement("option", { value: "All" }, "All Locations"),
    listingLocations.map(function (location) {
      return React.createElement(
        "option",
        { key: location, value: location },
        location
      );
    })
  ),

  React.createElement(
    "select",
    {
      value: listingSortBy,
      onChange: function (e) {
        setListingSortBy(e.target.value);
        setListingPage(1);
      },
      style: {
        padding: "10px",
        borderRadius: "8px",
        border: "1px solid #ddd"
      }
    },
    [
      "Newest First",
      "Oldest First",
      "Name A-Z",
      "Name Z-A",
      "Value Low to High",
      "Value High to Low"
    ].map(function (sort) {
      return React.createElement(
        "option",
        { key: sort, value: sort },
        sort
      );
    })
  )
),
sortedClothes.length === 0  
? React.createElement(
      "div",
      {
        className: "admin-empty-state"
      },
     listingsLoading
  ? "Loading clothing listings..."
  : "No listings match your filters."
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

                paginatedClothes
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

     sortedClothes.length > 0 &&
  React.createElement(
    "div",
    {
      className: "admin-table-note",
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        marginTop: "18px"
      }
    },

    React.createElement(
      "span",
      null,
      "Showing ",
      (currentListingPage - 1) * listingPageSize + 1,
      " - ",
      Math.min(currentListingPage * listingPageSize, sortedClothes.length),
      " of ",
      sortedClothes.length,
      " listings"
    ),

    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap"
        }
      },

     
React.createElement("span", null, "Per page:"),

React.createElement(
  "select",
  {
    value: listingPageSize,
    onChange: function (e) {
      const selectedValue = e.target.value;

      setListingPageSize(
        selectedValue === "All"
          ? "All"
          : Number(selectedValue)
      );

      setListingPage(1);
    }
  },
  React.createElement("option", { value: 10 }, "10"),
  React.createElement("option", { value: 15 }, "15"),
  React.createElement("option", { value: 25 }, "25"),
  React.createElement("option", { value: 50 }, "50"),
  React.createElement("option", { value: 100 }, "100"),
  React.createElement("option", { value: 500 }, "500"),
  React.createElement("option", { value: 1000 }, "1000"),
  React.createElement("option", { value: "All" }, "All")
),


      React.createElement(
        "button",
        {
          type: "button",
          disabled: currentListingPage <= 1,
          onClick: function () {
            setListingPage(function (prev) {
              return Math.max(prev - 1, 1);
            });
          }
        },
        "Previous"
      ),

      React.createElement(
        "span",
        null,
        "Page ",
        currentListingPage,
        " of ",
        Math.max(totalListingPages, 1)
      ),

      React.createElement(
        "button",
        {
          type: "button",
          disabled: currentListingPage >= totalListingPages,
          onClick: function () {
            setListingPage(function (prev) {
              return Math.min(prev + 1, totalListingPages);
            });
          }
        },
        "Next"
      )
    )
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
      listingsLoading
        ? "Loading recent clothing listings..."
        : "No recent clothing listings available."
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
    className: "admin-section-card",
    id: "dispute-center"
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
  
React.createElement(
  "div",
  {
    className: "admin-dispute-summary"
  },

  React.createElement(
    "div",
    {
      className: "admin-dispute-summary-card"
    },

    React.createElement(
      "strong",
      null,
      disputes.length
    ),

    React.createElement(
      "span",
      null,
      "Total Disputes"
    )
  ),

  React.createElement(
    "div",
    {
      className: "admin-dispute-summary-card"
    },

    React.createElement(
      "strong",
      null,
      pendingDisputes.length
    ),

    React.createElement(
      "span",
      null,
      "Pending Disputes"
    )
  ),

  React.createElement(
    "div",
    {
      className: "admin-dispute-summary-card"
    },

    React.createElement(
      "strong",
      null,
      resolvedDisputes.length
    ),

    React.createElement(
      "span",
      null,
      "Resolved Disputes"
    )
  )
),
React.createElement(
  "div",
  {
    className: "admin-dispute-toolbar"
  },

  React.createElement(
    "div",
    {
      className: "admin-dispute-search"
    },
    React.createElement("input", {
      type: "text",
      placeholder: "Search by user name or complaint reason...",
      value: disputeSearch,
      onChange: function (e) {
        setDisputeSearch(e.target.value);
      }
    })
  ),

  React.createElement(
    "div",
    {
      className: "admin-dispute-controls"
    },

    ["All", "Pending", "Resolved", "Rejected", "History"].map(
      function (status) {
        return React.createElement(
          "button",
          {
            key: status,
            type: "button",
            className:
              disputeStatusFilter === status
                ? "admin-filter-btn active"
                : "admin-filter-btn",
            onClick: function () {
              setDisputeStatusFilter(status);
              setSelectedDisputes([]);
              setShowDisputeCheckboxes(false);
            }
          },
          status
        );
      }
    ),

    React.createElement(
      "label",
      {
        className: "admin-select-all-label"
      },

      React.createElement("input", {
        type: "checkbox",
        checked: showDisputeCheckboxes,
        onChange: toggleSelectAllDisputes
      }),

      " Select All"
    )
  ),
  showDisputeCheckboxes &&
React.createElement("button", {
  type: "button",
  className: "admin-delete-resolved-btn",
  disabled: resolvedDisputes.length === 0,
  onClick: deleteAllResolvedDisputes
},
 "Delete All (",
selectedDisputes.length,
")"
),
),
filteredDisputes.length === 0
    ? React.createElement(
        "div",
        {
          className: "admin-empty-state"
        },
        disputesLoading
          ? "Loading disputes..."
          : "No matching disputes found."
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
    "Select"
  ),

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
    "Attachments"
  ),

  React.createElement(
    "th",
    null,
    "Account Status"
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

filteredDisputes.map(function (dispute) {
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

  showDisputeCheckboxes && !dispute.isDeleted
  ? React.createElement("input", {
      type: "checkbox",
      checked: selectedDisputes.includes(String(dispute._id)),
      onChange: function (event) {
        toggleDisputeSelection(
          String(dispute._id),
          event.target.checked
        );
      }
    })
  : "—"
),
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

  Array.isArray(dispute.attachments) &&
  dispute.attachments.length > 0

    ? React.createElement(
        "button",
        {
          type: "button",
          className: "admin-user-action-btn unblock",
          onClick: function () {
            setSelectedDisputeImages(
              dispute.attachments.filter(function (file) {
                return file.preview;
              })
            );
          }
        },
        "📎 View Photos (" +
          dispute.attachments.length +
          ")"
      )

    : "No Attachments"
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

  React.createElement(
  "div",
  {
    className: "admin-dispute-actions",
    style: {
      display: "flex",
      flexDirection: "row",
      flexWrap: "nowrap",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: "10px",
      whiteSpace: "nowrap",
      minWidth: "max-content",
      width: "max-content"
    }
  },
    dispute.isDeleted

      ? React.createElement(
          "span",
          { className: "admin-protected-label" },
          "🗄️ Archived"
        )

      : isResolved

        ? React.createElement(
            "span",
            { className: "admin-protected-label" },
            "✅ Resolved"
          )

        : dispute.status === "Rejected"

          ? React.createElement(
              "span",
              { className: "admin-protected-label" },
              "❌ Rejected"
            )

          : React.createElement(
              React.Fragment,
              null,

              React.createElement(
                "button",
                {
                  type: "button",
                  className: "admin-user-action-btn unblock",
                  onClick: function () {
                    resolveDispute(dispute);
                  }
                },
                "✅ Resolve"
              ),

              React.createElement(
                "button",
                {
                  type: "button",
                  className: "admin-user-action-btn delete",
                  onClick: function () {
                    rejectDispute(dispute);
                  }
                },
                "❌ Reject"
              )
            ),

    Array.isArray(dispute.resolutionHistory) &&
    dispute.resolutionHistory.length > 0 &&
      React.createElement(
        "button",
        {
          type: "button",
          className: "admin-user-action-btn unblock",
          onClick: function () {
            setSelectedDisputeHistory(dispute);
          }
        },
        "📜 View History"
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
  "section",
  {
    id: "reported-listings",
    className: "admin-section"
  },

  React.createElement(
    "h2",
    null,
    "Reported Listings"
  ),

  React.createElement(
    "p",
    null,
    "Review listings reported by users for inappropriate content."
  ),
  React.createElement(
  "div",
  {
    className: "admin-report-bulk-actions"
  },

  React.createElement(
    "label",
    null,

    React.createElement("input", {
      type: "checkbox",
      checked:
        reportedListings.length > 0 &&
        selectedReports.length === reportedListings.length,
      onChange: toggleSelectAllReports
    }),

    " Select All"
  ),

  selectedReports.length > 0 &&
    React.createElement(
      "button",
      {
        type: "button",
        className: "admin-user-action-btn delete",
        onClick: deleteSelectedReports
      },
      selectedReports.length === reportedListings.length
        ? "🗑️ Delete All"
        : "🗑️ Delete Selected"
    )
),

  React.createElement(
    "div",
    {
      className: "admin-reported-listings"
    },

   reportedListings.length === 0
  ? React.createElement(
      "p",
      null,
      reportedListingsLoading
        ? "Loading reported listings..."
        : "No reported listings found."
    )
      : reportedListings.map(function (report) {
          return React.createElement(
            "div",
            {
              key: report._id,
              className: "admin-reported-card"
            },
React.createElement("input", {
  type: "checkbox",
  checked: selectedReports.includes(String(report._id)),
  onChange: function () {
    toggleReportSelection(String(report._id));
  }
}),
            React.createElement(
              "h3",
              null,
              report.listingTitle || "Untitled Listing"
            ),

            React.createElement(
              "p",
              null,
              "Reason: " + report.reason
            ),

            React.createElement(
              "p",
              null,
              "Reported By: " + report.reporter
            ),

            React.createElement(
              "p",
              null,
              "Listing Owner: " + report.owner
            ),

            React.createElement(
              "p",
              null,
              "Status: " + report.status
            ),

            React.createElement(
              "p",
              null,
              "Description: " + (report.description || "No description")
            ),
            React.createElement(
  "div",
  { className: "reported-listing-actions" },

  report.status === "Pending"
    ? React.createElement(
        React.Fragment,
        null,

        React.createElement(
          "button",
          {
            type: "button",
            onClick: function () {
              updateReportedListing(report._id, "Reviewed");
            }
          },
          "Mark as Reviewed"
        ),

        React.createElement(
          "button",
          {
            type: "button",
            onClick: function () {
              updateReportedListing(report._id, "Removed");
            }
          },
          "Remove Listing"
        ),

        React.createElement(
          "button",
          {
            type: "button",
            onClick: function () {
              updateReportedListing(report._id, "Rejected");
            }
          },
          "Reject Report"
        )
      )
    : React.createElement(
        "p",
        null,
        "This report has already been reviewed."
      )
)
          );
        })
  )
),
/* =====================================
   REMOVED CLOTHING HISTORY
===================================== */

React.createElement(
  "section",
  {
    id: "removed-listings",
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
        "🗑️ Removal History"
      ),

      React.createElement(
        "p",
        null,
        "View clothing listings removed by administrators."
      )
    ),

    React.createElement(
      "span",
      {
        className: "admin-section-count"
      },
      removedClothes.length + " Removed"
    )
  ),

  removedClothesLoading

    ? React.createElement(
        "div",
        {
          className: "admin-empty-state"
        },
        "Loading removal history..."
      )

    : removedClothes.length === 0

      ? React.createElement(
          "div",
          {
            className: "admin-empty-state"
          },
          "No removed clothing listings found."
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

                ["Image", "Clothing", "Owner", "Location", "Price", "Removed On", "Removed By", "Removal Reason"].map(
                  function (heading) {
                    return React.createElement(
                      "th",
                      {
                        key: heading
                      },
                      heading
                    );
                  }
                )
              )
            ),

            React.createElement(
              "tbody",
              null,

              removedClothes.map(function (item) {
                return React.createElement(
                  "tr",
                  {
                    key: item._id
                  },

                  React.createElement(
                    "td",
                    null,

                    React.createElement("img", {
                      src:
                        getClothingImage(item) ||
                        "https://via.placeholder.com/60?text=No+Image",
                      alt: getClothingTitle(item),
                      style: {
                        width: "55px",
                        height: "55px",
                        objectFit: "cover",
                        borderRadius: "8px"
                      }
                    })
                  ),

                  React.createElement(
                    "td",
                    null,
                    getClothingTitle(item)
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
                    item.deletedAt
                      ? new Date(item.deletedAt).toLocaleString("en-IN")
                      : "Not available"
                  ),

                  React.createElement(
                    "td",
                    null,
                    item.deletedBy || "Not available"
                  ),

                  React.createElement(
                    "td",
                    null,
                    item.removalReason || "Not recorded"
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
    className: "admin-section-card",
    id: "swap-activities"
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
        "Swap History & Status Tracking"
      ),

      React.createElement(
        "p",
        null,
        "Monitor swap requests, agreements and exchange progress."
      )
    ),

    React.createElement(
      "span",
      {
        className: "admin-section-count"
      },
      swapRequests.length + " Requests"
    )
  ),
    React.createElement(
  "div",
  {
    className: "admin-swap-summary-grid"
  },

  ["All", "Accepted", "Pending", "Completed"].map(
    function (filter) {
      return React.createElement(
        "div",
        {
          key: filter,
          className:
            swapStatusFilter === filter
              ? "admin-swap-summary-card active"
              : "admin-swap-summary-card",
          onClick: function () {
            setSwapStatusFilter(filter);
          },
          role: "button",
          tabIndex: 0,
          onKeyDown: function (event) {
            if (event.key === "Enter" || event.key === " ") {
              setSwapStatusFilter(filter);
            }
          }
        },

        React.createElement(
          "strong",
          null,
          getSwapFilterCount(filter)
        ),

        React.createElement(
          "span",
          null,
          filter
        )
      );
    }
  )
),
  React.createElement(
    "div",
    {
      className: "admin-swap-status-filters"
    },

    ["Rejected", "Courier", "Local Exchange", "Not Selected","Deleted History"].map(
      function (filter) {
        return React.createElement(
          "button",
          {
            key: filter,
            type: "button",
            className:
              swapStatusFilter === filter
                ? "admin-swap-filter-btn active"
                : "admin-swap-filter-btn",
            onClick: function () {
              setSwapStatusFilter(filter);
            }
          },

          filter + " (" + getSwapFilterCount(filter) + ")"
        );
      }
    )
  ),
   filteredSwapRequests.length === 0
? React.createElement(
    "div",
    {
      className: "admin-empty-state"
    },
    swapRequestsLoading
      ? "Loading swap requests..."
      : "No matching swap requests available."
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

           swapStatusFilter === "Deleted History"
  ? React.createElement(
      "tr",
      null,
      React.createElement("th", null, "Clothing"),
      React.createElement("th", null, "Requester"),
      React.createElement("th", null, "Owner"),
      React.createElement("th", null, "Deleted By"),
      React.createElement("th", null, "Deleted Date"),
      React.createElement("th", null, "Original Request Status")
    )
  : React.createElement(
      "tr",
      null,
      React.createElement("th", null, "Clothing"),
      React.createElement("th", null, "Requester"),
      React.createElement("th", null, "Owner"),
      React.createElement("th", null, "Request Date"),
      React.createElement("th", null, "Status"),
      React.createElement("th", null, "Agreement"),
      React.createElement("th", null, "Exchange Method"),
      React.createElement("th", null, "Completion Status"),
      React.createElement("th", null, "Pending Confirmation By")
    )
          ),

          React.createElement(
            "tbody",
            null,

            filteredSwapRequests
              .slice(0, 10)
              .map(function (request) {
                const displayStatus = getAdminSwapStatus(request);
                const agreement = getAgreementStatus(request);

                const completion =
                  request.completionStatus ||
                  (displayStatus === "Completed"
                    ? "Completed"
                    : "Not Started");
                    const pendingConfirmationBy =
  request.completionStatus === "Completed" ||
  (request.ownerCompleted === true &&
    request.requesterCompleted === true)
    ? "—"
    : request.ownerCompleted === true
      ? getRequesterName(request)
      : request.requesterCompleted === true
        ? getRequestOwner(request)
        : request.status === "Accepted"
          ? getRequestOwner(request) + ", " + getRequesterName(request)
          : "—";

                const requestDate = request.createdAt
                  ? new Date(request.createdAt).toLocaleString(
                      "en-IN",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      }
                    )
                  : "Not available";
                  if (swapStatusFilter === "Deleted History") {
  const deletedDate = request.deletedAt
    ? new Date(request.deletedAt).toLocaleString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }
      )
    : "Not available";

  return React.createElement(
    "tr",
    {
      key: request._id
    },

    React.createElement("td", null, getRequestClothing(request)),
    React.createElement("td", null, getRequesterName(request)),
    React.createElement("td", null, getRequestOwner(request)),
    React.createElement(
      "td",
      null,
      request.deletedBy || request.deletedByEmail || "Not available"
    ),
    React.createElement("td", null, deletedDate),

    React.createElement(
      "td",
      null,
      React.createElement(
        "span",
        {
          className: getStatusClass(displayStatus)
        },
        displayStatus
      )
    )
  );
}

                return React.createElement(
                  "tr",
                  {
                    key: request._id
                  },

                  React.createElement("td", null, getRequestClothing(request)),
                  React.createElement("td", null, getRequesterName(request)),
                  React.createElement("td", null, getRequestOwner(request)),
                  React.createElement("td", null, requestDate),

                  React.createElement(
                    "td",
                    null,
                    React.createElement(
                      "span",
                      {
                        className: getStatusClass(displayStatus)
                      },
                      displayStatus
                    )
                  ),

                  React.createElement("td", null, agreement),
                  React.createElement("td", null, request.exchangeMethod || "Not Selected"),

                  React.createElement(
                    "td",
                    null,
                    React.createElement(
                      "span",
                      {
                        className: getStatusClass(completion)
                      },
                      completion
                    )
                  ),
                  React.createElement(
  "td",
  null,
  pendingConfirmationBy
)
                );
              })
          )
        )
      ),

  filteredSwapRequests.length > 10 &&
    React.createElement(
      "div",
      {
        className: "admin-table-note"
      },
      "Showing latest 10 filtered swap requests."
    )
),
selectedDisputeImages.length > 0 &&
React.createElement(
  "div",
  {
    className: "admin-image-modal-overlay",
    onClick: function () {
      setSelectedDisputeImages([]);
    }
  },

  React.createElement(
    "div",
    {
      className: "admin-image-modal",
      onClick: function (event) {
        event.stopPropagation();
      }
    },

    React.createElement(
      "div",
      {
        className: "admin-image-modal-header"
      },

      React.createElement(
        "h3",
        null,
        "Complaint Attachments (" +
          selectedDisputeImages.length +
          ")"
      ),

      React.createElement(
        "button",
        {
          type: "button",
          onClick: function () {
            setSelectedDisputeImages([]);
          }
        },
        "✕"
      )
    ),

    React.createElement(
      "div",
      {
        className: "admin-image-gallery"
      },

      selectedDisputeImages.map(function (file, index) {
        return React.createElement(
          "div",
          {
            className: "admin-image-gallery-item",
            key: index
          },

          React.createElement("img", {
            src: file.preview,
            alt: file.name || "Complaint attachment"
          }),

          React.createElement(
            "span",
            null,
            file.name || "Attachment " + (index + 1)
          )
        );
      })
    )
  )
),


selectedOverviewHistory &&
React.createElement(
  "div",
  {
    className: "admin-modal-overlay",
    onClick: function () {
      setSelectedOverviewHistory(null);
    }
  },
  React.createElement(
    "div",
    {
      className: "admin-modal-content overview-history-modal",
      onClick: function (event) {
        event.stopPropagation();
      }
    },
    React.createElement("h3", null, selectedOverviewHistory.title),

    React.createElement(
      "p",
      null,
      "Total Records: " + selectedOverviewHistory.items.length
    ),

    selectedOverviewHistory.items.length === 0
      ? React.createElement("p", null, "No records found.")
      : React.createElement(
          "div",
          {
            style: {
  width: "100%",
  overflowX: "hidden",
  boxSizing: "border-box"
}
          },
          React.createElement(
            "div",
            {
              style: {
               
                display: "grid",
                gridTemplateColumns: selectedOverviewHistory.type === "listings"
  ? "65px minmax(0, 1.2fr) minmax(0, 0.9fr) minmax(0, 1.5fr) minmax(0, 0.8fr) minmax(0, 0.6fr) minmax(0, 0.9fr) minmax(0, 0.8fr)"
  : "65px minmax(0, 1fr) minmax(0, 0.8fr) minmax(0, 1.2fr) minmax(0, 0.9fr) minmax(0, 1.3fr) minmax(0, 0.7fr) minmax(0, 0.9fr) minmax(0, 1.4fr)",
                gap: "10px",
                padding: "12px",
                background: "#fcecf6",
                borderRadius: "10px",
                fontWeight: "bold",
                marginBottom: "10px"
              }
            },
            (selectedOverviewHistory.type === "listings"
              ? [
                  "Image",
                  "Clothing",
                  "Owner",
                  "Owner Email",
                  "Category",
                  "Size",
                  "Location",
                  "Status"
                ]
              : [
                  "Image",
                  "Clothing",
                  "Owner",
                  "Owner Email",
                  "Requester",
                  "Requester Email",
                  "Status",
                  "Exchange Method",
                  "Meeting Details"
                ]
            ).map(function (heading, i) {
return React.createElement(
  "div",
  {
    key: i,
    style: {
      minWidth: 0,
      textAlign: "left",
      overflowWrap: "anywhere"
    }
  },
  heading
);
            })
          ),

          selectedOverviewHistory.items.map(function (item, index) {
            var isListing = selectedOverviewHistory.type === "listings";
            var image = isListing ? item.image : item.clothingImage;

            var meetingDetails =
              item.exchangeMethod === "Local Exchange"
                ? [
                    "Location: " + (item.meetingLocation || "Not available"),
                    "Date: " + (item.meetingDate || "Not available"),
                    "Time: " + (item.meetingTime || "Not available")
                  ].join(" | ")
                : item.exchangeMethod === "Courier"
                ? "Courier"
                : "Not Selected";

            var values = isListing
              ? [
                  item.title || "Untitled",
                  item.owner || "Not available",
                  item.ownerEmail || "Not available",
                  item.category || "Not available",
                  item.size || "Not available",
                  item.location || "Not available",
                  item.listingStatus || item.status || "Not available"
                ]
              : [
                  item.clothingTitle || "Untitled",
                  item.owner || "Not available",
                  item.ownerEmail || "Not available",
                  item.requester || "Not available",
                  item.requesterEmail || "Not available",
                  item.status || "Not available",
                  item.exchangeMethod || "Not Selected",
                  meetingDetails
                ];

            return React.createElement(
              "div",
              {
                key: item._id || index,
                style: {
                  display: "grid",
                 gridTemplateColumns: selectedOverviewHistory.type === "listings"
  ? "65px minmax(0, 1.2fr) minmax(0, 0.9fr) minmax(0, 1.5fr) minmax(0, 0.8fr) minmax(0, 0.6fr) minmax(0, 0.9fr) minmax(0, 0.8fr)"
  : "65px minmax(0, 1fr) minmax(0, 0.8fr) minmax(0, 1.2fr) minmax(0, 0.9fr) minmax(0, 1.3fr) minmax(0, 0.7fr) minmax(0, 0.9fr) minmax(0, 1.4fr)",
                  gap: "10px",
                  alignItems: "center",
                  padding: "12px",
                  marginBottom: "8px",
                  background: "#ffffff",
                  border: "1px solid #ead8eb",
                  borderRadius: "10px"
                }
              },
              React.createElement(
                "div",
                null,
                image
                  ? React.createElement("img", {
                      src: image,
                      alt: "Clothing",
                      style: {
                        width: "65px",
                        height: "65px",
                        objectFit: "cover",
                        borderRadius: "8px"
                      }
                    })
                  : "No Image"
              ),
              values.map(function (value, i) {
                return React.createElement(
                  "div",
                  {
                    key: i,
                    style: {
                      fontSize: "13px",
                      overflowWrap: "anywhere",
                      minWidth: 0
                    }
                  },
                  String(value)
                );
              })
            );
          })
        ),

    React.createElement(
      "button",
      {
        type: "button",
        className: "admin-btn close-btn",
        onClick: function () {
          setSelectedOverviewHistory(null);
        }
      },
      "Close"
    )
  )
),


selectedDisputeHistory &&
  React.createElement(
    "div",
    {
      className: "admin-modal-overlay",
      onClick: function () {
        setSelectedDisputeHistory(null);
      }
    },

    React.createElement(
      "div",
      {
        className: "admin-modal-content",
        onClick: function (event) {
          event.stopPropagation();
        }
      },

      React.createElement(
        "h3",
        null,
        "📜 Dispute History"
      ),

      React.createElement(
        "p",
        null,
        "Reported By: ",
        selectedDisputeHistory.reportedBy || "Unknown"
      ),

      React.createElement(
        "p",
        null,
        "Reported Against: ",
        selectedDisputeHistory.reportedAgainst || "Not specified"
      ),

      React.createElement(
        "p",
        null,
        "Current Status: ",
        selectedDisputeHistory.isDeleted
          ? "Archived"
          : selectedDisputeHistory.status
      ),

      React.createElement(
        "p",
        null,
        "Admin Note: ",
        selectedDisputeHistory.adminNote || "No admin note"
      ),

      React.createElement(
        "h4",
        null,
        "Action Timeline"
      ),

      Array.isArray(selectedDisputeHistory.resolutionHistory) &&
      selectedDisputeHistory.resolutionHistory.length > 0
        ? selectedDisputeHistory.resolutionHistory.map(function (history, index) {
            return React.createElement(
              "div",
              {
                key: index,
                className: "admin-history-item"
              },

              React.createElement(
                "strong",
                null,
                history.action
              ),

              React.createElement(
                "p",
                null,
                "Admin: ",
                history.adminName || history.adminEmail || "Unknown"
              ),

              React.createElement(
                "p",
                null,
                "Date: ",
                history.actionDate
                  ? new Date(history.actionDate).toLocaleString()
                  : "Not available"
              ),

              React.createElement(
                "p",
                null,
                "Note: ",
                history.adminNote || "No note"
              )
            );
          })
        : React.createElement(
            "p",
            null,
            "No history available."
          ),

      React.createElement(
        "button",
        {
          type: "button",
          onClick: function () {
            setSelectedDisputeHistory(null);
          }
        },
        "Close"
      )
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