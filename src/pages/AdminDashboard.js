
  import React, { useEffect, useMemo, useState } from "react";
  import { useNavigate } from "react-router-dom";
  import ExcelJS from "exceljs";
  import html2pdf from "html2pdf.js";
  import "./AdminDashboard.css";

  const h = React.createElement;
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const MENU = [
    ["overview", "Dashboard Overview", "▦"],
    ["users", "User Management", "♙"],
    ["listings", "Clothing Listings", "♧"],
    ["swaps", "Swap Requests", "⇄"],
    ["negotiations", "Negotiations", "☏"],
    ["value", "Swap Value Analytics", "₹"],
    ["location", "Location Suggestions", "⌖"],
    ["shipments", "Shipments", "♧"],
    ["reports", "Reports & Analytics", "▥"]
  ];

  const ENDPOINTS = {
    users: "/api/admin/users",
    listings: "/api/clothes",
    swaps: "/api/admin/swap-requests",
    shipments: "/api/shipments"
  };

  function getArray(data, keys = []) {
    if (Array.isArray(data)) {
      return data;
    }

    if (!data || typeof data !== "object") {
      return [];
    }

    for (const key of keys) {
      if (Array.isArray(data[key])) {
        return data[key];
      }
    }

    if (data.data && typeof data.data === "object") {
      return getArray(data.data, keys);
    }

    return [];
  }

  function dateText(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleDateString("en-IN");
  }

  function numberText(value) {
    return Number(value || 0).toLocaleString("en-IN");
  }

  function AdminDashboard() {
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [chartTooltip, setChartTooltip] = useState(null);
    const navigate = useNavigate();

    const [activeMenu, setActiveMenu] = useState("overview");
    const [analytics, setAnalytics] = useState({});
    const [trends, setTrends] = useState({
    users: [],
    listings: [],
    swaps: [],
    completedSwaps: [],
    swapStatusDistribution: [],
    userActivityTrend: [],
    topPerformingCategories: []
  });

  const [trendPeriod, setTrendPeriod] = useState("month");

  const [selectedTrendYear, setSelectedTrendYear] = useState(
    new Date().getFullYear()
  );
    const [users, setUsers] = useState([]);
    const [listings, setListings] = useState([]);
    const [swaps, setSwaps] = useState([]);
    const [shipments, setShipments] = useState([]);
    const [messages, setMessages] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("All");
    const [selected, setSelected] = useState(null);
    const [showReport, setShowReport] = useState(false);
    const [period, setPeriod] = useState("month");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
  const [excelExporting, setExcelExporting] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [systemStatus, setSystemStatus] = useState("Checking...");
    const token = localStorage.getItem("clothswapToken");

    const savedName =
      localStorage.getItem("clothswapUserName") ||
      localStorage.getItem("clothSwapUserName") ||
      localStorage.getItem("clothswapUserEmail") ||
      "Admin";

  const displayName = String(
    savedName && typeof savedName === "string"
      ? savedName.includes("@")
        ? savedName.split("@")[0]
        : savedName
      : "Admin"
  );

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };

    async function request(url, options = {}) {
      const response = await fetch(API + url, {
        ...options,
        headers: {
          ...headers,
          ...(options.headers || {})
        }
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || `Request failed (${response.status})`);
      }

      return data;
    }
  async function loadTrends(
    selectedPeriod = trendPeriod,
    selectedYear = selectedTrendYear
  ) {
    try {
      const params = new URLSearchParams();

      params.set("period", selectedPeriod);

      if (selectedPeriod === "year") {
        params.set("year", String(selectedYear));
      }

      const data = await request(
        `/api/admin/dashboard/trends?${params.toString()}`
      );
      console.log(
    "Swap Status Distribution:",
    data.trends?.swapStatusDistribution
  );
    setTrends(data.trends || {
    users: [],
    listings: [],
    swaps: [],
    completedSwaps: [],
    swapStatusDistribution: []
  });
    } catch (error) {
      console.error("Failed to load dashboard trends:", error);
    }
  }
    function isSwapCompleted(swap) {
    return swap.completionStatus === "Completed";
  }
    async function loadAnalytics() {
      const params = new URLSearchParams();

      if (period === "custom") {
        if (!startDate || !endDate) return;

        if (startDate > endDate) {
          setError("Start date cannot be after end date.");
          return;
        }

        params.set("startDate", startDate);
        params.set("endDate", endDate);
      } else {
        const end = new Date();
        const start = new Date();

        if (period === "today") start.setHours(0, 0, 0, 0);
        if (period === "week") start.setDate(start.getDate() - 6);
        if (period === "month") start.setDate(1);
        if (period === "year") start.setMonth(0, 1);

        const local = date => {
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, "0");
          const d = String(date.getDate()).padStart(2, "0");
          return `${y}-${m}-${d}`;
        };

        params.set("startDate", local(start));
        params.set("endDate", local(end));
      }

      const data = await request(
        `/api/admin/dashboard/analytics?${params.toString()}`
      );

      setAnalytics(data.analytics || data);
    }

    async function loadUsers() {
      const data = await request(ENDPOINTS.users);
      setUsers(getArray(data, ["users"]));
    }

    async function loadListings() {
      const data = await request(ENDPOINTS.listings);
      setListings(getArray(data, ["clothes", "listings", "items"]));
    }

    async function loadSwaps() {
      const data = await request(ENDPOINTS.swaps);
      setSwaps(getArray(data, ["swapRequests", "requests", "swaps"]));
    }

    async function loadShipments() {
      const data = await request(ENDPOINTS.shipments);
      setShipments(getArray(data, ["shipments", "data", "items"]));
    }
  useEffect(() => {
    const interval = setInterval(() => {
      loadSwaps();
    }, 10000);

    return () => clearInterval(interval);
  }, []);
    async function loadSection(section = activeMenu) {
      setLoading(true);
      setError("");

      try {
      if (section === "overview") {
    await Promise.all([
      loadAnalytics(),
      loadSwaps()
    ]);
  } else if (section === "reports") {
    await Promise.all([
      loadAnalytics(),
      loadSwaps(),
      loadListings(),
      loadUsers()
    ]);
  }
  else if (section === "users") {
          await loadUsers();
        } else if (section === "listings") {
          await loadListings();
        } else if (section === "swaps" || section === "negotiations") {
          await loadSwaps();
        } else if (section === "value") {
          await loadListings();
          await loadSwaps();
        } else if (section === "location") {
          await loadUsers();
          await loadListings();
        } else if (section === "shipments") {
          await loadShipments();
        }
      } catch (err) {
        setError(err.message || "Unable to load this section.");
      } finally {
        setLoading(false);
      }
    }

    useEffect(() => {
      if (
        localStorage.getItem("clothswapLoggedIn") !== "true" ||
        localStorage.getItem("clothswapIsAdmin") !== "true" ||
        !token
      ) {
        navigate("/login");
        return;
      }

      loadSection("overview");
    }, []);
    useEffect(() => {
    async function checkSystem() {
      try {
        const response = await fetch(`${API}/api/health`);

        if (!response.ok) {
          throw new Error("Server unavailable");
        }

        setSystemStatus("Online");
      } catch (error) {
        setSystemStatus("Offline");
      }
    }

    checkSystem();

    const interval = setInterval(checkSystem, 5000);

    return () => clearInterval(interval);
  }, []);

    useEffect(() => {
      if (activeMenu !== "overview") {
        loadSection(activeMenu);
      }
    }, [activeMenu]);
  useEffect(() => {
    if (activeMenu === "overview") {
      loadTrends();
    }
  }, [activeMenu, trendPeriod, selectedTrendYear]);
    useEffect(() => {
      if (activeMenu === "overview" || activeMenu === "reports") {
        loadSection(activeMenu);
      }
    }, [period, startDate, endDate]);

    function logout() {
      localStorage.removeItem("clothswapLoggedIn");
      localStorage.removeItem("clothswapIsAdmin");
      localStorage.removeItem("clothswapToken");
      navigate("/login");
    }

    async function changeUserStatus(user) {
      const status = user.status === "Blocked" ? "Active" : "Blocked";

      if (!window.confirm(`${status} ${user.name}?`)) return;

      try {
        await request(`/api/admin/users/${user._id}/status`, {
          method: "PUT",
          body: JSON.stringify({ status })
        });

        await loadUsers();
        setSelected(null);
      } catch (err) {
        setError(err.message);
      }
    }

    async function removeUser(user) {
      if (user.role === "Admin") return;

      if (!window.confirm(`Permanently delete ${user.name}?`)) return;

      try {
        await request(`/api/admin/users/${user._id}`, {
          method: "DELETE"
        });

        await loadUsers();
        setSelected(null);
      } catch (err) {
        setError(err.message);
      }
    }

    async function removeListing(item) {
      if (!window.confirm("Delete this clothing listing?")) return;

      try {
        await request(`/api/clothes/${item._id}`, {
          method: "DELETE"
        });

        await loadListings();
        setSelected(null);
      } catch (err) {
        setError(err.message);
      }
    }

    const filtered = useMemo(() => {
      let source = [];

      if (activeMenu === "users") source = users;
      if (activeMenu === "listings") source = listings;
      if (activeMenu === "swaps" || activeMenu === "negotiations") source = swaps;
      if (activeMenu === "shipments") source = shipments;

      const q = search.toLowerCase().trim();

      return source.filter(item => {
        const searchable = Object.values(item)
          .filter(value => typeof value === "string" || typeof value === "number")
          .join(" ")
          .toLowerCase();

        const status = String(item.status || item.completionStatus || "Unknown");

        return searchable.includes(q) &&
          (filter === "All" || status === filter);
      });
    }, [activeMenu, users, listings, swaps, shipments, search, filter]);

    function heading(title, subtitle) {
      return h("div", { className: "cs-ceo-welcome-row" },
        h("div", null,
          h("span", { className: "cs-ceo-eyebrow" }, "CLOTHSWAP MANAGEMENT"),
          h("h2", null, title),
          h("p", null, subtitle)
        ),
        h("button", {
          className: "cs-ceo-primary-btn",
          onClick: () => loadSection(activeMenu),
          disabled: loading
        }, loading ? "Loading..." : "↻ Refresh")
      );
    }

    function statCard(label, value, icon, color) {
      return h("article", { className: "cs-ceo-stat-card", key: label },
        h("div", { className: `cs-ceo-stat-icon ${color}` }, icon),
        h("p", null, label),
        h("strong", null,
          label === "Estimated Listing Value"
            ? `₹${numberText(value)}`
            : numberText(value)
        ),
        h("small", null, "ClothSwap platform")
      );
    }
  function percentageStatCard(label, value, icon, color) {
    return h("article", {
      className: "cs-ceo-stat-card",
      key: label
    },
      h("div", {
        className: `cs-ceo-stat-icon ${color}`
      }, icon),
      h("p", null, label),
      h("strong", null, `${Number(value || 0).toFixed(1)}%`),
      h("small", null, "ClothSwap platform")
    );
  }
    function table(headersList, rows) {
      return h("div", { className: "cs-ceo-table-wrap" },
        h("table", { className: "cs-ceo-table" },
          h("thead", null,
            h("tr", null, headersList.map((label, index) =>
              h("th", { key: index }, label)
            ))
          ),
          h("tbody", null,
            rows.length
              ? rows
              : [h("tr", { key: "empty" },
                  h("td", { colSpan: headersList.length },
                    "No records found."
                  )
                )]
          )
        )
      );
    }

    function listToolbar() {
      return h("div", { className: "cs-ceo-card-heading cs-ceo-activity-heading" },
        h("input", {
          className: "cs-ceo-search-input",
          placeholder: "Search records...",
          value: search,
          onChange: e => setSearch(e.target.value)
        }),
        h("select", {
          value: filter,
          onChange: e => setFilter(e.target.value)
        },
          h("option", { value: "All" }, "All statuses"),
          ...["Active", "Blocked", "Pending", "Accepted", "Rejected",
            "Completed", "In Transit", "Delivered"].map(value =>
            h("option", { key: value, value }, value)
          )
        )
      );
    }
function chartTooltipView(title) {
  if (!chartTooltip || chartTooltip.chart !== title) {
    return null;
  }

  return h("div", {
    role: "status",
    style: {
      marginTop: "10px",
      padding: "10px 12px",
      borderRadius: "10px",
      background: "#f7f0fa",
      color: "#55445e",
      fontSize: "13px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  },
    h("span", null,
      h("strong", null, chartTooltip.label),
      " — " + chartTooltip.series + ": " + chartTooltip.value
    ),
    h("button", {
      type: "button",
      onClick: function () {
        setChartTooltip(null);
      }
    }, "×")
  );
}
    function renderOverview() {
        const totalUsers = Number(analytics.totalUsers || 0);
    const activeUsers = Number(analytics.activeUsers || 0);

    const engagementRate = totalUsers > 0
      ? (activeUsers / totalUsers) * 100
      : 0;

    const totalSwapRequests = Number(analytics.totalSwaps || 0);

  const completedSwapRequests = swaps.filter(function (swap) {
    return (
      swap.completionStatus === "Completed" ||
      swap.agreementStatus === "Completed"
    );
  }).length;

    const conversionRate = totalSwapRequests > 0
      ? (completedSwapRequests / totalSwapRequests) * 100
      : 0;
      return h(React.Fragment, null,
        heading("Dashboard Overview", "Monitor your ClothSwap platform at a glance."),
        h("div", { className: "cs-ceo-stats-grid" },
          statCard("Total Users", analytics.totalUsers, "♙", "purple"),
          statCard("Active Users", analytics.activeUsers, "◉", "blue"),
          percentageStatCard(
    "User Engagement Rate",
    engagementRate,
    "📈",
    "green"
  ),
  percentageStatCard(
    "Swap Request Conversion Rate",
    conversionRate,
    "⇄",
    "pink"
  ),
          statCard("Clothing Listings", analytics.totalListings, "♧", "green"),
          statCard("Swap Requests", analytics.totalSwaps, "⇄", "orange"),
          statCard(
    "Completed Swaps",
    swaps.filter(isSwapCompleted).length,
    "✓",
    "pink"
  )
        ),
        h("div", { className: "cs-ceo-charts-grid" },
          chart("Monthly Swaps", analytics.monthlySwaps),
          chart("Monthly Listings", analytics.monthlyListings),
          chart("Monthly Users", analytics.monthlyUsers)
        ),
    
  h("div", { className: "cs-ceo-overview-analytics-grid" },

    // Chart 1 - Full width
    h("section", { className: "cs-ceo-card cs-overview-main-chart" },
      h("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "18px"
        }
      },
        h("div", null,
          h("h3", null, "Monthly Platform Growth")
        ),

        h("div", {
          style: {
            display: "flex",
            gap: "10px",
            flexWrap: "wrap"
          }
        },
          h("select", {
            value: trendPeriod,
            onChange: e => setTrendPeriod(e.target.value)
          },
            h("option", { value: "7days" }, "7 Days"),
            h("option", { value: "month" }, "Month"),
            h("option", { value: "year" }, "Year")
          ),

          trendPeriod === "year"
            ? h("select", {
                value: selectedTrendYear,
                onChange: e => setSelectedTrendYear(Number(e.target.value))
              },
                ...Array.from(
                  {
                    length: new Date().getFullYear() + 5 - 2026 + 1
                  },
                  (_, index) => 2026 + index
                ).map(year =>
                  h("option", {
                    key: year,
                    value: year
                  }, year)
                )
              )
            : null
        )
      ),
 
      lineChart("Platform Growth", [
        { name: "Users", data: trends.users },
        { name: "Listings", data: trends.listings },
        { name: "Swaps", data: trends.swaps }
      ])
    ),

    barChart("Swap Requests vs Completed Swaps", [
      {
        name: "Total Requests",
        data: trends.swaps || []
      },
      {
        name: "Completed Swaps",
        data: trends.completedSwaps || []
      }
    ]),

    doughnutChart(
      "Swap Status Distribution",
      trends.swapStatusDistribution || []
    ),

    pieChart(
      "Clothing Category Distribution",
      trends.clothingCategoryDistribution || []
    ),

    areaChart(
      "User Activity Trend",
      trends.userActivityTrend || []
    ),

  horizontalBarChart(
    "Top Performing Clothing Categories",
    trends.topPerformingCategories || []
  )
  ),

  // Platform Performance - Outside chart grid
  h("section", { className: "cs-ceo-card" },
    h("h3", null, "Platform Performance"),
    h("p", null, `Swap Completion Rate: ${analytics.swapCompletionRate || 0}%`)
  )

      );
    }

  function lineChart(title, datasets) {
    const chartWidth = 900;
    const chartHeight = 320;
    const left = 65;
    const right = 65;
    const top = 30;
    const bottom = 75;

    const firstData = datasets[0] ? datasets[0].data || [] : [];

    const allValues = datasets.reduce(function (values, series) {
      return values.concat(
        (series.data || []).map(function (item) {
          return Number(item.count ?? item.total ?? item.value ?? 0);
        })
      );
    }, []);

    const rawMax = Math.max(0, ...allValues);
    const maxValue = Math.max(4, Math.ceil(rawMax / 4) * 4);

    const getX = function (index) {
      const count = Math.max(firstData.length - 1, 1);
      return left + index * (
        (chartWidth - left - right) / count
      );
    };

    const getY = function (value) {
      return chartHeight - bottom -
        (value / maxValue) * (chartHeight - top - bottom);
    };

    const colors = ["#8b5cf6", "#16a34a", "#ec4899"];

  
  function getLabel(item) {
    const raw = item.label || item.date || item.month || item._id || "";

    if (trendPeriod === "year") {
      const value = String(raw);

      const monthMatch = value.match(
        /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i
      );

      if (monthMatch) {
        return monthMatch[1];
      }

      const dateMatch = value.match(/^(\d{4})-(\d{1,2})/);

      if (dateMatch) {
        return new Date(
          Number(dateMatch[1]),
          Number(dateMatch[2]) - 1,
          1
        ).toLocaleDateString("en-IN", {
          month: "short"
        });
      }
    }

    if (typeof raw === "object") {
      if (raw.month && raw.year) {
        return new Date(
          Number(raw.year),
          Number(raw.month) - 1,
          1
        ).toLocaleDateString("en-IN", {
          month: "short",
          year: "numeric"
        });
      }
      return String(raw.year || "");
    }

    const value = String(raw);

    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      const parts = value.split("-");
      return Number(parts[2]) + " " +
        new Date(Number(parts[0]), Number(parts[1]) - 1)
          .toLocaleDateString("en-IN", { month: "short" });
    }

    if (/^\d{4}-\d{2}$/.test(value)) {
      const parts = value.split("-");
      return new Date(Number(parts[0]), Number(parts[1]) - 1)
        .toLocaleDateString("en-IN", {
          month: "short",
          year: "numeric"
        });
    }

    return value;
  }


    const labelStep = trendPeriod === "year"
    ? 1
    : Math.max(1, Math.ceil(firstData.length / 8));

    return h("section", {
      className: "cs-ceo-card",
      style: {
        padding: "22px",
        overflow: "hidden"
      }
    },
      h("h3", null, title),

      h("div", {
        style: {
          width: "100%",
          overflowX: "auto"
        }
      },
        h("svg", {
          viewBox: `0 0 ${chartWidth} ${chartHeight}`,
          style: {
            width: "100%",
            minWidth: "550px",
            height: "auto",
            display: "block"
          }
        },

          // Y-axis grid and value labels
          [0, 1, 2, 3, 4].map(function (step) {
            const value = maxValue - (step * maxValue / 4);
            const y = top + step * (
              (chartHeight - top - bottom) / 4
            );

            return h("g", { key: "grid-" + step },
              h("line", {
                x1: left,
                y1: y,
                x2: chartWidth - right,
                y2: y,
                stroke: "#e9e3ef",
                strokeDasharray: "5 5"
              }),
              h("text", {
                x: left - 12,
                y: y + 4,
                textAnchor: "end",
                fontSize: 12,
                fill: "#777"
              }, String(value))
            );
          }),

          // Data lines and points
          datasets.map(function (series, seriesIndex) {
            const points = (series.data || []).map(function (item, index) {
              const value = Number(
                item.count ?? item.total ?? item.value ?? 0
              );

              return `${getX(index)},${getY(value)}`;
            }).join(" ");

            return h("g", { key: series.name },
              h("polyline", {
                points: points,
                fill: "none",
                stroke: colors[seriesIndex % colors.length],
                strokeWidth: 3,
                strokeLinecap: "round",
                strokeLinejoin: "round"
              }),

              (series.data || []).map(function (item, index) {
                const value = Number(
                  item.count ?? item.total ?? item.value ?? 0
                );

           return h("g", {
  key: series.name + "-" + index
},
  // Mobile and desktop tap area
  h("circle", {
    cx: getX(index),
    cy: getY(value),
    r: 22,
    fill: "rgba(0,0,0,0.001)",
    style: {
      cursor: "pointer",
      pointerEvents: "all",
      touchAction: "pan-y"
    },
    onPointerDown: function (e) {
      e.preventDefault();

      setChartTooltip({
        chart: title,
        label: getLabel(item),
        series: series.name,
        value: value
      });
    },
    onClick: function () {
      setChartTooltip({
        chart: title,
        label: getLabel(item),
        series: series.name,
        value: value
      });
    }
  }),

  // Original visible point
  h("circle", {
    cx: getX(index),
    cy: getY(value),
    r: 5,
    fill: colors[seriesIndex % colors.length],
    pointerEvents: "none",
    children: h("title", null,
      `${getLabel(item)} | ${series.name}: ${value}`
    )
  })
);
  })
            );
          }),

          // X-axis date labels
          firstData.map(function (item, index) {
            if (
              index % labelStep !== 0 &&
              index !== firstData.length - 1
            ) {
              return null;
            }

            return h("text", {
              key: "date-" + index,
              x: getX(index),
              y: chartHeight - 25,
              textAnchor:
                index === 0 ? "start" :
                index === firstData.length - 1 ? "end" : "middle",
              fontSize: 12,
              fill: "#777"
            }, getLabel(item));
          })
        )
      ),
chartTooltipView(title),
      // Legend
      h("div", {
        style: {
          display: "flex",
          flexWrap: "wrap",
          gap: "18px",
          marginTop: "12px"
        }
      },
        datasets.map(function (series, index) {
          return h("span", {
            key: series.name,
            style: {
              fontSize: "13px",
              color: "#666"
            }
          },
            h("span", {
              style: {
                display: "inline-block",
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                background: colors[index % colors.length],
                marginRight: "6px"
              }
            }),
            series.name
          );
        })
      )
    );
  }

  function barChart(title, datasets) {
    const chartWidth = 600;
    const chartHeight = 260;
    const left = 48;
    const right = 20;
    const top = 25;
    const bottom = 55;

    const firstData = datasets[0] ? datasets[0].data || [] : [];

    const allValues = datasets.reduce(function (values, series) {
      return values.concat(
        (series.data || []).map(function (item) {
          return Number(item.count ?? item.total ?? item.value ?? 0);
        })
      );
    }, []);

    const maxValue = Math.max(1, ...allValues);
    const tickStep = Math.max(1, Math.ceil(maxValue / 4));
    const yMax = tickStep * 4;

    const colors = ["#8b5cf6", "#16a34a", "#ec4899"];

    const getX = function (index) {
      const count = Math.max(firstData.length, 1);
      const slotWidth = (chartWidth - left - right) / count;

      return left + index * slotWidth + slotWidth / 2;
    };

    const getY = function (value) {
      return chartHeight - bottom -
        (value / yMax) * (chartHeight - top - bottom);
    };

    function getLabel(item) {
      const raw = item.label || item.month || item._id || "";

      if (!raw) return "";

      const date = new Date(raw);

      if (/^\d{4}-\d{2}$/.test(String(raw))) {
        const parts = String(raw).split("-");
        return new Date(Number(parts[0]), Number(parts[1]) - 1, 1)
    .toLocaleDateString("en-IN", {
      month: "short"
    });
      }

      if (/^\d{4}-\d{2}-\d{2}/.test(String(raw))) {
        return date.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short"
        });
      }

      return String(raw);
    }

    const slotWidth =
      (chartWidth - left - right) / Math.max(firstData.length, 1);

    const groupWidth = Math.min(44, slotWidth * 0.65);
    const barWidth = Math.min(
      22,
      groupWidth / Math.max(datasets.length, 1)
    );

    return h("section", {
      className: "cs-ceo-card",
      style: {
        padding: "22px",
        overflow: "hidden"
      }
    },
      h("h3", null, title),

      h("svg", {
        viewBox: `0 0 ${chartWidth} ${chartHeight}`,
        style: {
          width: "100%",
          height: "auto"
        }
      },

        [0, 1, 2, 3, 4].map(function (step) {
          const value = yMax - step * tickStep;
          const y = getY(value);

          return h("g", { key: "axis-" + step },
            h("line", {
              x1: left,
              y1: y,
              x2: chartWidth - right,
              y2: y,
              stroke: "#e9e3ef",
              strokeDasharray: "4 4"
            }),

            h("text", {
              x: left - 10,
              y: y + 4,
              textAnchor: "end",
              fontSize: 11,
              fill: "#777"
            }, String(value))
          );
        }),

        datasets.map(function (series, seriesIndex) {
          return h("g", { key: series.name },
            (series.data || []).map(function (item, index) {
              const value = Number(
                item.count ?? item.total ?? item.value ?? 0
              );

              const x =
                getX(index) -
                (datasets.length * barWidth) / 2 +
                seriesIndex * barWidth;

              const y = getY(value);

            return h("rect", {
  key: series.name + "-" + index,
  x: x,
  y: y,
  width: barWidth - 3,
  height: Math.max(0, chartHeight - bottom - y),
  rx: 4,
  fill: colors[seriesIndex % colors.length],
  style: {
    cursor: "pointer",
    touchAction: "manipulation"
  },
  onClick: function () {
    setChartTooltip({
      chart: title,
      label: getLabel(item),
      series: series.name,
      value: value
    });
  }
},
  h("title", null, series.name + ": " + value)
);
            })
          );
        }),

        firstData.map(function (item, index) {
          return h("text", {
            key: "label-" + index,
            x: getX(index),
            y: chartHeight - 20,
            textAnchor: "middle",
            fontSize: 11,
            fill: "#777"
          }, getLabel(item));
        })
      ),

      h("div", {
        style: {
          display: "flex",
          flexWrap: "wrap",
          gap: "18px",
          marginTop: "12px"
        }
      },
        datasets.map(function (series, index) {
          return h("span", {
            key: series.name,
            style: {
              fontSize: "13px",
              color: "#666"
            }
          },
            h("span", {
              style: {
                display: "inline-block",
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                background: colors[index % colors.length],
                marginRight: "6px"
              }
            }),
            series.name
          );
        })
      )
    );
  }

  function doughnutChart(title, data) {
    const colors = {
      Pending: "#f59e0b",
      Accepted: "#8b5cf6",
      Rejected: "#ef4444",
      Completed: "#16a34a"
    };

    const total = data.reduce(function (sum, item) {
      return sum + Number(item.count || 0);
    }, 0);

    let currentAngle = 0;

    const radius = 75;
    const circumference = 2 * Math.PI * radius;

    return h("section", {
      className: "cs-ceo-card",
      style: {
        padding: "22px",
        overflow: "hidden"
      }
    },
      h("h3", null, title),

      total === 0
        ? h("p", {
            style: {
              textAlign: "center",
              color: "#888",
              padding: "35px 0"
            }
          }, "No swap data available")
        : h("div", {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "25px",
              padding: "15px 0"
            }
          },

          h("svg", {
            viewBox: "0 0 200 200",
            style: {
              width: "190px",
              maxWidth: "100%",
              height: "auto"
            }
          },

            h("circle", {
              cx: 100,
              cy: 100,
              r: radius,
              fill: "none",
              stroke: "#eee8f3",
              strokeWidth: 25
            }),

            data.map(function (item, index) {
              const value = Number(item.count || 0);
              const dash = (value / total) * circumference;
              const offset = circumference - currentAngle;

              const circle = h("circle", {
                key: item.label,
                cx: 100,
                cy: 100,
                r: radius,
                fill: "none",
                stroke: colors[item.label] || "#999",
                strokeWidth: 25,
  strokeDasharray: `${dash} ${circumference - dash}`,
  strokeDashoffset: offset,
  transform: "rotate(-90 100 100)",
  children: h("title", null,
    `${item.label}: ${value} (${Math.round(value / total * 100)}%)`
  ),
  style: {
    cursor: "pointer",
    transition: "stroke-width 0.2s ease, opacity 0.2s ease"
  },
  onMouseEnter: function (e) {
    e.currentTarget.style.strokeWidth = "31";
    e.currentTarget.style.opacity = "0.85";
  },
  onMouseLeave: function (e) {
    e.currentTarget.style.strokeWidth = "25";
    e.currentTarget.style.opacity = "1";
  }
              });

              currentAngle += dash;
              return circle;
            }),

            h("text", {
              x: 100,
              y: 96,
              textAnchor: "middle",
              fontSize: 25,
              fontWeight: "bold",
              fill: "#333"
            }, String(total)),

            h("text", {
              x: 100,
              y: 116,
              textAnchor: "middle",
              fontSize: 11,
              fill: "#888"
            }, "Total Swaps")
          ),

          h("div", {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }
          },
            data.map(function (item) {
              return h("div", {
                key: item.label,
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                  fontSize: "13px",
                  color: "#555"
                }
              },
                h("span", {
                  style: {
                    width: "11px",
                    height: "11px",
                    borderRadius: "50%",
                    background: colors[item.label] || "#999"
                  }
                }),
                `${item.label}: ${item.count} (${Math.round(
                  Number(item.count || 0) / total * 100
                )}%)`
              );
            })
          )
        )
    );
  }
  function pieChart(title, data) {
    const total = data.reduce(function (sum, item) {
      return sum + Number(item.count || 0);
    }, 0);

    if (!total) {
      return h("section", { className: "cs-ceo-card" },
        h("h3", null, title),
        h("p", null, "No category data available")
      );
    }

    const colors = [
      "#e85d9e",
      "#a85bc7",
      "#6366f1",
      "#14b8a6",
      "#f59e0b",
      "#ef4444",
      "#0ea5e9",
      "#84cc16"
    ];

    let currentAngle = 0;

    const slices = data.map(function (item, index) {
      const percentage = Number(item.count || 0) / total;
      const startAngle = currentAngle;
      const endAngle = currentAngle + percentage * 360;

      currentAngle = endAngle;

      const start = {
        x: 150 + 110 * Math.cos((startAngle - 90) * Math.PI / 180),
        y: 150 + 110 * Math.sin((startAngle - 90) * Math.PI / 180)
      };

      const end = {
        x: 150 + 110 * Math.cos((endAngle - 90) * Math.PI / 180),
        y: 150 + 110 * Math.sin((endAngle - 90) * Math.PI / 180)
      };

      const largeArc = percentage > 0.5 ? 1 : 0;

      const path = percentage >= 0.9999
        ? "M 150 40 A 110 110 0 1 1 149.99 40 Z"
        : `M 150 150 L ${start.x} ${start.y} A 110 110 0 ${largeArc} 1 ${end.x} ${end.y} Z`;

      return {
        path: path,
        color: colors[index % colors.length],
        label: item.label,
        count: item.count,
        percentage: Math.round(percentage * 100)
      };
    });

    return h("section", { className: "cs-ceo-card" },
      h("h3", null, title),

      h("div", {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "30px",
          flexWrap: "wrap",
          padding: "15px"
        }
      },
        h("svg", {
          viewBox: "0 0 300 300",
          style: {
            width: "260px",
            maxWidth: "100%",
            height: "auto"
          }
        },
          slices.map(function (slice, index) {
          return h("path", {
    key: index,
    d: slice.path,
  fill: slice.color,
  stroke: "#ffffff",
  strokeWidth: 2,
  style: {
    cursor: "pointer",
    transition: "transform 0.2s ease, opacity 0.2s ease",
    transformBox: "fill-box",
    transformOrigin: "center"
  },
  onMouseEnter: function (e) {
    e.currentTarget.style.transform = "scale(1.06)";
    e.currentTarget.style.opacity = "0.85";
  },
  onMouseLeave: function (e) {
    e.currentTarget.style.transform = "scale(1)";
    e.currentTarget.style.opacity = "1";
  }
  },
    h("title", null,
      `${slice.label}: ${slice.count} (${slice.percentage}%)`
    )
  );
          })
        ),

        h("div", {
          style: {
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }
        },
          slices.map(function (slice, index) {
            return h("div", {
              key: index,
              style: {
                display: "flex",
                alignItems: "center",
                gap: "9px",
                fontSize: "13px"
              }
            },
              h("span", {
                style: {
                  width: "11px",
                  height: "11px",
                  borderRadius: "3px",
                  background: slice.color
                }
              }),
              `${slice.label}: ${slice.count} (${slice.percentage}%)`
            );
          })
        )
      )
    );
  }
  function areaChart(title, data) {
    const values = data || [];
    const maxValue = Math.max(
      1,
      ...values.map(function (item) {
        return Number(item.count) || 0;
      })
    );

    const width = 900;
    const height = 320;
    const left = 55;
    const right = 25;
    const top = 25;
    const bottom = 55;

    const chartWidth = width - left - right;
    const chartHeight = height - top - bottom;

    const points = values.map(function (item, index) {
      return {
        x: left + (values.length <= 1
          ? chartWidth / 2
          : (index / (values.length - 1)) * chartWidth),
        y: top + chartHeight -
          ((Number(item.count) || 0) / maxValue) * chartHeight,
        label: item.label,
        count: Number(item.count) || 0
      };
    });

    const linePath = points.map(function (point, index) {
      return (index === 0 ? "M" : "L") +
        point.x + " " + point.y;
    }).join(" ");

    const areaPath = points.length
      ? linePath +
        " L " + points[points.length - 1].x + " " +
        (top + chartHeight) +
        " L " + points[0].x + " " +
        (top + chartHeight) + " Z"
      : "";

    return h("section", { className: "cs-chart-card" },
      h("h3", null, title),

      h("div", { className: "cs-chart-scroll" },
        h("svg", {
          viewBox: "0 0 900 320",
          role: "img",
          "aria-label": title
        },
          [0, 1, 2, 3, 4].map(function (step) {
            const y = top + (chartHeight / 4) * step;

            return h("g", { key: "grid-" + step },
              h("line", {
                x1: left,
                y1: y,
                x2: width - right,
                y2: y,
                stroke: "#e8e1ed",
                strokeDasharray: "4 4"
              }),
              h("text", {
                x: left - 12,
                y: y + 4,
                textAnchor: "end",
                fontSize: "12",
                fill: "#766b80"
              }, String(Math.round(maxValue * (4 - step) / 4)))
            );
          }),

          h("path", {
            d: areaPath,
            fill: "rgba(168, 91, 199, 0.20)",
            stroke: "none"
          }),

          h("path", {
            d: linePath,
            fill: "none",
            stroke: "#a85bc7",
            strokeWidth: "3",
            strokeLinejoin: "round",
            strokeLinecap: "round"
          }),

          points.map(function (point, index) {
            return h("g", { key: "point-" + index },
              h("circle", {
                cx: point.x,
                cy: point.y,
                r: 5,
                fill: "#a85bc7",
                stroke: "#ffffff",
                strokeWidth: 2
              },
                h("title", null,
                  point.label + ": " + point.count + " active users"
                )
              ),
              h("text", {
                x: point.x,
                y: height - 22,
                textAnchor: "middle",
                fontSize: "11",
                fill: "#766b80"
              }, point.label)
            );
          })
        )
      )
    );
  }
  function horizontalBarChart(title, data) {
    const items = (data || []).filter(function (item) {
      return item && item.label;
    });

    const maxValue = Math.max(
      1,
      ...items.map(function (item) {
        return Number(item.count) || 0;
      })
    );

    return h(
      "div",
      { className: "cs-chart-card" },
      h("h3", null, title),
      items.length === 0
        ? h("p", null, "No category data available")
        : h(
            "div",
            { className: "cs-chart-scroll" },
            h(
              "div",
              {
                style: {
                  minWidth: "420px",
                  padding: "15px 10px"
                }
              },
              ...items.map(function (item, index) {
                const count = Number(item.count) || 0;
                const width = (count / maxValue) * 100;

                return h(
                  "div",
                  {
                    key: item.label,
                    style: {
                      display: "grid",
                      gridTemplateColumns: "110px 1fr 35px",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "18px"
                    }
                  },
                  h(
                    "span",
                    {
                      style: {
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#55445e"
                      }
                    },
                    item.label
                  ),
                  h(
                    "div",
                    {
                      style: {
                        height: "22px",
                        background: "#f1e8f5",
                        borderRadius: "7px",
                        overflow: "hidden"
                      }
                    },
                    h("div", {
                      title: item.label + ": " + count + " completed swaps",
                      style: {
                        width: width + "%",
                        height: "100%",
                        borderRadius: "7px",
                        background:
                          "linear-gradient(90deg, #a85bc7, #e85d9e)",
                        transition: "width 0.4s ease"
                      }
                    })
                  ),
                  h(
                    "strong",
                    {
                      style: {
                        fontSize: "13px",
                        color: "#75458d",
                        textAlign: "right"
                      }
                    },
                    String(count)
                  )
                );
              })
            )
          )
    );
  }

    function chart(title, data) {
      const values = data || [];

      const maximum = Math.max(
        1,
        ...values.map(item => Number(item.count || item.total || 0))
      );

      function getMonthLabel(item, index) {
        const month = item.month || item._id || item.label;

        if (month && typeof month === "object") {
          const year = month.year || "";
          const monthNumber = month.month;

          if (monthNumber) {
            const date = new Date(
              Number(year) || new Date().getFullYear(),
              Number(monthNumber) - 1,
              1
            );

            return date.toLocaleDateString("en-IN", {
              month: "short",
              year: "2-digit"
            });
          }

          return year ? String(year) : `Month ${index + 1}`;
        }

        return String(month || `Month ${index + 1}`);
      }

      return h("section", {
        className: "cs-ceo-card cs-ceo-chart-card",
        key: title
      },
        h("h3", null, title),
        values.length
          ? h("div", { className: "cs-ceo-bars" },
              values.map((item, index) => {
                const value = Number(item.count || item.total || 0);

                return h("div", {
                  className: "cs-ceo-bar-column",
                  key: index
                },
                  h("span", null, value),
                  h("div", { className: "cs-ceo-bar-track" },
                    h("div", {
                      className: "cs-ceo-bar-fill",
                      style: { height: `${(value / maximum) * 100}%` }
                    })
                  ),
                  h("small", null, getMonthLabel(item, index))
                );
              })
            )
          : h("p", null, "No monthly data available.")
      );
    }

    function renderUsers() {
      return h(React.Fragment, null,
        heading("User Management", "Manage registered members and account status."),
        h("div", { className: "cs-ceo-stats-grid" },
          statCard("Total Members", users.length, "♙", "purple"),
          statCard("Active Members", users.filter(u => u.status === "Active").length, "✓", "green"),
          statCard("Blocked Members", users.filter(u => u.status === "Blocked").length, "⊘", "orange")
        ),
        h("section", { className: "cs-ceo-card" },
          h("h3", null, "Registered Members"),
          listToolbar(),
          table(
            ["Name", "Email", "Location", "Joined", "Role", "Status", "Actions"],
            filtered.map(user => h("tr", { key: user._id },
              h("td", null, user.name),
              h("td", null, user.email),
              h("td", null, user.location || "Not specified"),
              h("td", null, dateText(user.createdAt)),
              h("td", null, user.role || "User"),
              h("td", null, user.status || "Active"),
              h("td", null,
                h("button", {
                  className: "cs-ceo-outline-btn",
                  onClick: () => setSelected(user)
                }, "View"),
                user.role !== "Admin" && h("button", {
                  className: "cs-ceo-outline-btn",
                  onClick: () => changeUserStatus(user)
                }, user.status === "Blocked" ? "Unblock" : "Block"),
                user.role !== "Admin" && h("button", {
                  className: "cs-ceo-delete-btn",
                  onClick: () => removeUser(user)
                }, "Delete")
              )
            ))
          )
        )
      );
    }

    function renderListings() {
      return h(React.Fragment, null,
        heading("Clothing Listings", "Review and manage clothing listed by members."),
        h("div", { className: "cs-ceo-stats-grid" },
          statCard("Total Listings", listings.length, "♧", "purple"),
          statCard("Filtered Listings", filtered.length, "⌕", "blue")
        ),
        h("section", { className: "cs-ceo-card" },
          h("h3", null, "All Clothing Listings"),
          listToolbar(),
          table(
            ["Clothing", "Category", "Size", "Condition", "Owner", "Date", "Actions"],
            filtered.map(item => h("tr", { key: item._id },
              h("td", null, item.title || item.name || "Clothing item"),
              h("td", null, item.category || "—"),
              h("td", null, item.size || "—"),
              h("td", null, item.condition || "—"),
              h("td", null, item.ownerEmail || item.userEmail || item.email || "—"),
              h("td", null, dateText(item.createdAt)),
              h("td", null,
                h("button", {
                  className: "cs-ceo-outline-btn",
                  onClick: () => setSelected(item)
                }, "View"),
                h("button", {
                  className: "cs-ceo-delete-btn",
                  onClick: () => removeListing(item)
                }, "Delete")
              )
            ))
          )
        )
      );
    }

    function renderSwaps() {
      return h(React.Fragment, null,
        heading("Swap Requests", "Monitor requests between clothing owners and requesters."),
        h("div", { className: "cs-ceo-stats-grid" },
          statCard("Total Requests", swaps.length, "⇄", "purple"),
          statCard("Pending", swaps.filter(s => s.status === "Pending").length, "◷", "orange"),
          statCard("Accepted", swaps.filter(s => s.status === "Accepted").length, "✓", "green"),
          statCard("Completed", swaps.filter(s => s.completionStatus === "Completed" || s.status === "Completed").length, "★", "pink")
        ),
        h("section", { className: "cs-ceo-card" },
          h("h3", null, "Swap Request Records"),
          listToolbar(),
          table(
            ["Owner", "Requester", "Status", "Exchange Method", "Completion", "Date", "Details"],
            filtered.map(item => h("tr", { key: item._id },
              h("td", null, item.ownerEmail || "—"),
              h("td", null, item.requesterEmail || "—"),
              h("td", null, item.status || "Pending"),
              h("td", null, item.exchangeMethod || "—"),
              h("td", null, item.completionStatus || "—"),
              h("td", null, dateText(item.createdAt)),
              h("td", null, h("button", {
                className: "cs-ceo-outline-btn",
                onClick: () => setSelected(item)
              }, "View"))
            ))
          )
        )
      );
    }

    function renderNegotiations() {
      return h(React.Fragment, null,
        heading("Negotiations", "Review swap conversations and negotiation records."),
        h("div", { className: "cs-ceo-stats-grid" },
          statCard("Swap Conversations", swaps.length, "☏", "purple"),
          statCard("Accepted Requests", swaps.filter(s => s.status === "Accepted").length, "✓", "green"),
          statCard("Pending Requests", swaps.filter(s => s.status === "Pending").length, "◷", "orange")
        ),
        h("section", { className: "cs-ceo-card" },
          h("h3", null, "Negotiation Conversations"),
          h("p", null, "Select a swap request to view its conversation."),
          table(
            ["Owner", "Requester", "Swap Status", "Created", "Conversation"],
            filtered.map(item => h("tr", { key: item._id },
              h("td", null, item.ownerEmail || "—"),
              h("td", null, item.requesterEmail || "—"),
              h("td", null, item.status || "Pending"),
              h("td", null, dateText(item.createdAt)),
              h("td", null, h("button", {
                className: "cs-ceo-outline-btn",
                onClick: async () => {
                  try {
                    const data = await request(`/api/messages/${item._id}`);
                    setMessages(getArray(data, ["messages"]));
                    setSelected(item);
                  } catch (err) {
                    setError(err.message);
                  }
                }
              }, "View Chat"))
            ))
          ),
          selected && h("div", { className: "cs-ceo-user-details" },
            h("h3", null, "Conversation Details"),
            h("p", null, `${selected.ownerEmail || "Owner"} ↔ ${selected.requesterEmail || "Requester"}`),
            messages.length
              ? messages.map((message, index) =>
                  h("div", {
                    key: message._id || index,
                    className: "cs-ceo-message"
                  },
                    h("strong", null, message.senderEmail || message.sender || "Member"),
                    h("p", null, message.message || message.text || message.content || ""),
                    h("small", null, dateText(message.createdAt))
                  )
                )
              : h("p", null, "No messages found for this request."),
            h("button", {
              className: "cs-ceo-outline-btn",
              onClick: () => {
                setSelected(null);
                setMessages([]);
              }
            }, "Close Conversation")
          )
        )
      );
    }

    function renderValueAnalytics() {
      const totalValues = listings.reduce((total, listing) => {
        const value = Number(
          listing.price ?? 0
        );

        return total + (Number.isFinite(value) ? value : 0);
      }, 0);

      return h(React.Fragment, null,
        heading("Swap Value Analytics", "Understand listed clothing values and swap activity."),
        h("div", { className: "cs-ceo-stats-grid" },
          statCard("Total Listings", listings.length, "♧", "purple"),
          statCard("Estimated Listing Value", totalValues, "₹", "green"),
          statCard("Total Swap Requests", swaps.length, "⇄", "orange"),
          statCard("Completed Swaps", swaps.filter(s =>
            s.completionStatus === "Completed" || s.status === "Completed"
          ).length, "✓", "pink")
        ),
        h("section", { className: "cs-ceo-card" },
          h("h3", null, "Listing Value Records"),
          table(
            ["Clothing", "Category", "Estimated Value"],
            listings.map(item => h("tr", { key: item._id },
              h("td", null, item.title || item.name || "Clothing"),
              h("td", null, item.category || "—"),
              h("td", null, `₹${numberText(item.price)}`)
            ))
          ),
          h("p", null, "Values are based on the value fields available in clothing listings.")
        )
      );
    }

    function renderLocation() {
      const locations = users.reduce((result, user) => {
        const name = user.location || "Not specified";
        const existing = result.find(item => item.name === name);

        if (existing) existing.count += 1;
        else result.push({ name, count: 1 });

        return result;
      }, []);

      return h(React.Fragment, null,
        heading("Location Suggestions", "Review member locations and local community distribution."),
        h("div", { className: "cs-ceo-stats-grid" },
          statCard("Registered Members", users.length, "♙", "purple"),
          statCard("Location Groups", locations.length, "⌖", "blue"),
          statCard("Listings", listings.length, "♧", "green")
        ),
        h("section", { className: "cs-ceo-card" },
          h("h3", null, "Member Location Distribution"),
          table(
            ["Location", "Registered Members"],
            locations.map(item => h("tr", { key: item.name },
              h("td", null, item.name),
              h("td", null, item.count)
            ))
          ),
          h("p", null, "This view groups registered members by their saved location. Actual distance-based suggestions require coordinates and a location recommendation API.")
        )
      );
    }

    function renderShipments() {
      return h(React.Fragment, null,
        heading("Shipments", "Monitor courier and delivery records for swaps."),
        h("div", { className: "cs-ceo-stats-grid" },
          statCard("Total Shipments", shipments.length, "♧", "purple"),
          statCard("In Transit", shipments.filter(s => s.status === "In Transit").length, "⇢", "blue"),
          statCard("Delivered", shipments.filter(s => s.status === "Delivered").length, "✓", "green")
        ),
        h("section", { className: "cs-ceo-card" },
          h("h3", null, "Shipment Records"),
          listToolbar(),
          table(
            ["Tracking ID", "Swap Request", "Courier", "Status", "Created", "Details"],
            filtered.map(item => h("tr", { key: item._id },
              h("td", null, item.trackingId || item.trackingNumber || "—"),
              h("td", null, item.swapRequestId || item.swapRequest || "—"),
              h("td", null, item.courierName || item.courier || "—"),
              h("td", null, item.status || "Pending"),
              h("td", null, dateText(item.createdAt)),
              h("td", null, h("button", {
                className: "cs-ceo-outline-btn",
                onClick: () => setSelected(item)
              }, "View"))
            ))
          )
        )
      );
    }

    // ================= REPORT CALCULATIONS =================

    function getReportData() {
      const totalValue = listings.reduce((total, item) => {
      const value = Number(item.price ?? 0);

        return total + (Number.isFinite(value) ? value : 0);
      }, 0);

    const completed = swaps.filter(isSwapCompleted).length;

      return { totalValue, completed };
    }

    // ================= EXCEL EXPORT =================

    async function exportExcel() {
  setExcelExporting(true);
      setError("");

      try {
        const workbook = new ExcelJS.Workbook();

        workbook.creator = "ClothSwap";
        workbook.subject = "ClothSwap Platform Performance Report";
        workbook.title = "ClothSwap Report";
        workbook.created = new Date();

        const purple = "FF8054A0";
        const lightPurple = "FFEADCF5";
        const borderColor = "FFD8C5E8";
        const alternate = "FFF8F4FB";
        const white = "FFFFFFFF";
        const dark = "FF56376D";

        function addSheet(name, title, columns, rows) {
          const sheet = workbook.addWorksheet(name);

          const count = columns.length;

          sheet.mergeCells(1, 1, 1, count);
          const titleCell = sheet.getCell(1, 1);

          titleCell.value = title;
          titleCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: lightPurple }
          };
          titleCell.font = {
            bold: true,
            size: 17,
            color: { argb: dark }
          };
          titleCell.alignment = {
            horizontal: "center",
            vertical: "middle"
          };

          sheet.getRow(1).height = 34;

          sheet.mergeCells(2, 1, 2, count);
          const dateCell = sheet.getCell(2, 1);

          dateCell.value = `Generated on: ${new Date().toLocaleString("en-IN")}`;
          dateCell.font = {
            italic: true,
            size: 10,
            color: { argb: "FF666666" }
          };
          dateCell.alignment = {
            horizontal: "center",
            vertical: "middle"
          };

          sheet.getRow(2).height = 23;
          sheet.addRow([]);

          const header = sheet.addRow(columns);
          header.height = 28;

          header.eachCell(cell => {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: purple }
            };

            cell.font = {
              bold: true,
              color: { argb: white },
              size: 11
            };

            cell.alignment = {
              horizontal: "center",
              vertical: "middle",
              wrapText: true
            };

            cell.border = {
              top: { style: "thin", color: { argb: borderColor } },
              bottom: { style: "thin", color: { argb: borderColor } },
              left: { style: "thin", color: { argb: borderColor } },
              right: { style: "thin", color: { argb: borderColor } }
            };
          });

          rows.forEach((values, index) => {
            const row = sheet.addRow(values);
            row.height = 23;

            row.eachCell(cell => {
              cell.alignment = {
                vertical: "middle",
                wrapText: true
              };

              cell.border = {
                top: { style: "thin", color: { argb: borderColor } },
                bottom: { style: "thin", color: { argb: borderColor } },
                left: { style: "thin", color: { argb: borderColor } },
                right: { style: "thin", color: { argb: borderColor } }
              };

              if (index % 2 === 1) {
                cell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: alternate }
                };
              }
            });
          });

          sheet.columns = columns.map((column, index) => {
            const longest = Math.max(
              String(column).length,
              ...rows.map(row => String(row[index] ?? "").length)
            );

            return {
              width: Math.min(38, Math.max(16, longest + 4))
            };
          });

          sheet.views = [{ state: "frozen", ySplit: 4 }];

          sheet.autoFilter = {
            from: { row: 4, column: 1 },
            to: { row: 4, column: count }
          };

          sheet.pageSetup = {
            orientation: "landscape",
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0
          };

          return sheet;
        }

        const { totalValue, completed } = getReportData();

        // 1. Summary
        addSheet(
          "Summary",
          "CLOTHSWAP - PLATFORM PERFORMANCE REPORT",
          ["Metric", "Value"],
          [
            ["Total Users", analytics.totalUsers || 0],
            ["Active Users", analytics.activeUsers || 0],
            ["Total Listings", listings.length],
            ["Total Swap Requests", swaps.length],
            ["Completed Swaps", completed],
            ["Swap Completion Rate", `${analytics.swapCompletionRate || 0}%`],
            ["Estimated Listing Value", totalValue]
          ]
        );

        // 2. Users
        addSheet(
          "Users",
          "REGISTERED MEMBERS",
          ["Name", "Email", "Location", "Role", "Status", "Joined Date"],
          users.map(user => [
            user.name || "",
            user.email || "",
            user.location || "Not specified",
            user.role || "User",
            user.status || "Active",
            dateText(user.createdAt)
          ])
        );

        // 3. Listings
        addSheet(
          "Listings",
          "CLOTHING LISTINGS",
          ["Clothing", "Category", "Size", "Condition", "Owner", "Estimated Value"],
          listings.map(item => {
          const value = Number(item.price ?? 0);

            return [
              item.title || item.name || "Clothing",
              item.category || "",
              item.size || "",
              item.condition || "",
              item.ownerEmail || item.userEmail || item.email || "",
              Number.isFinite(value) ? value : 0
            ];
          })
        );

        // 4. Swap Requests
        addSheet(
          "Swap Requests",
          "SWAP REQUEST RECORDS",
          ["Owner", "Requester", "Status", "Exchange Method", "Completion", "Date"],
          swaps.map(item => [
            item.ownerEmail || "",
            item.requesterEmail || "",
            item.status || "Pending",
            item.exchangeMethod || "",
            item.completionStatus || "",
            dateText(item.createdAt)
          ])
        );

        // 5. Monthly Analytics
        const monthlyRows = [];

        [
          ["Monthly Swaps", analytics.monthlySwaps],
          ["Monthly Listings", analytics.monthlyListings],
          ["Monthly Registrations", analytics.monthlyUsers]
        ].forEach(([type, records]) => {
          (Array.isArray(records) ? records : []).forEach(item => {
            const month = item.month || item._id || item.label || "";

            const monthLabel = month && typeof month === "object"
              ? `${month.month || ""}/${month.year || ""}`
              : String(month);

            monthlyRows.push([
              type,
              monthLabel,
              Number(item.count || item.total || 0)
            ]);
          });
        });

        addSheet(
          "Monthly Analytics",
          "MONTHLY PLATFORM ACTIVITY",
          ["Activity", "Month", "Count"],
          monthlyRows
        );

        const buffer = await workbook.xlsx.writeBuffer();

        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `ClothSwap-Report-${new Date().toISOString().slice(0, 10)}.xlsx`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Excel export error:", err);
        setError("Excel report could not be downloaded: " + err.message);
      } finally {
  setExcelExporting(false);    }
    }

    // ================= PDF EXPORT =================

    async function exportPDF() {
      const report = document.getElementById("clothswap-report");

      if (!report) {
        setError("Report preview not found. Please open the report again.");
        return;
      }

  setPdfExporting(true);
      setError("");

      try {
        await html2pdf()
          .set({
            margin: [10, 10, 10, 10],
            filename: `ClothSwap-Report-${new Date().toISOString().slice(0, 10)}.pdf`,
            image: {
              type: "jpeg",
              quality: 0.98
            },
            html2canvas: {
              scale: 2,
              useCORS: true,
              backgroundColor: "#ffffff",
              scrollY: 0
            },
            jsPDF: {
              unit: "mm",
              format: "a4",
              orientation: "landscape"
            },
            pagebreak: {
              mode: ["css", "legacy"]
            }
          })
          .from(report)
          .save();
      } catch (err) {
        console.error("PDF export error:", err);
        setError("PDF report could not be downloaded: " + err.message);
      } finally {
  setPdfExporting(false);    }
    }

    // ================= PRINT REPORT =================

    function printReport() {
      if (!document.getElementById("clothswap-report")) {
        setError("Please open the report preview before printing.");
        return;
      }

      window.print();
    }

    // ================= REPORT PREVIEW =================

    function renderReportPreview() {
      const { totalValue, completed } = getReportData();

      return h("div", {
        className: "cs-report-page",
        id: "clothswap-report"
      },
        h("div", { className: "cs-report-header" },
          h("div", null,
            h("span", null, "CLOTHSWAP"),
            h("h1", null, "Platform Performance Report"),
            h("p", null,
              `Generated on ${new Date().toLocaleString("en-IN")}`
            )
          ),
          h("div", { className: "cs-report-actions" },
            h("button", {
              className: "cs-ceo-outline-btn",
              onClick: () => setShowReport(false)
            }, "← Back"),

            h("button", {
    className: "cs-ceo-primary-btn",
    onClick: exportExcel,
    disabled: excelExporting
  }, excelExporting ? "Preparing..." : "↓ Download Excel"),

          h("button", {
    className: "cs-ceo-primary-btn",
    onClick: exportPDF,
    disabled: pdfExporting
  }, pdfExporting ? "Preparing..." : "↓ Download PDF"),

            h("button", {
              className: "cs-ceo-outline-btn",
              onClick: printReport
            }, "▤ Print Report")
          )
        ),

        h("div", { className: "cs-report-summary" },
          h("h2", null, "Platform Summary"),
          h("div", { className: "cs-report-grid" },
            ...[
              ["Total Users", analytics.totalUsers || 0, "♙"],
              ["Active Users", analytics.activeUsers || 0, "✓"],
              ["Total Listings", listings.length, "♧"],
              ["Swap Requests", swaps.length, "⇄"],
              ["Completed Swaps", completed, "★"],
              ["Estimated Listing Value", `₹${numberText(totalValue)}`, "₹"]
            ].map((item, index) =>
              h("article", {
                className: `cs-report-stat cs-report-stat-${index + 1}`,
                key: item[0]
              },
                h("span", null, item[2]),
                h("p", null, item[0]),
                h("strong", null, item[1])
              )
            )
          )
        ),

        h("div", { className: "cs-report-section" },
          h("h2", null, "Platform Performance"),
            h("div", { className: "cs-report-metrics" },

          
            h("div", null,
              h("span", null, "Swap Completion Rate"),
              h("strong", null, `${analytics.swapCompletionRate || 0}%`)
            )
          )
        ),

        h("div", { className: "cs-report-section" },
          h("h2", null, "Clothing Listing Details"),
          table(
            ["Clothing", "Category", "Size", "Condition", "Estimated Value"],
            listings.map(item => {
            const value = Number(item.price ?? 0);
              return h("tr", { key: item._id },
                h("td", null, item.title || item.name || "Clothing"),
                h("td", null, item.category || "—"),
                h("td", null, item.size || "—"),
                h("td", null, item.condition || "—"),
                h("td", null,
                  `₹${numberText(Number.isFinite(value) ? value : 0)}`
                )
              );
            })
          )
        ),

        h("div", { className: "cs-report-section" },
          h("h2", null, "Swap Activity Details"),
          table(
            ["Owner", "Requester", "Status", "Exchange Method", "Completion"],
            swaps.map(item => h("tr", { key: item._id },
              h("td", null, item.ownerEmail || "—"),
              h("td", null, item.requesterEmail || "—"),
              h("td", null, item.status || "Pending"),
              h("td", null, item.exchangeMethod || "—"),
              h("td", null, item.completionStatus || "—")
            ))
          )
        ),

        h("div", { className: "cs-report-footer" },
          "© ClothSwap · Sustainable Fashion, Smarter Swapping"
        )
      );
    }

    // ================= REPORTS PAGE =================

    function renderReports() {
      return h(React.Fragment, null,
        heading("Reports & Analytics", "Review platform metrics and export reports."),

        h("div", { className: "cs-ceo-stats-grid" },
          statCard("Total Users", analytics.totalUsers, "♙", "purple"),
          statCard("Active Users", analytics.activeUsers, "◉", "blue"),
          statCard("Total Listings", analytics.totalListings, "♧", "green"),
          statCard("Swap Requests", analytics.totalSwaps, "⇄", "orange"),
  statCard(
    "Completed Swaps",
    swaps.filter(isSwapCompleted).length,
    "✓",
    "pink"
  )   ),

        h("div", { className: "cs-ceo-charts-grid" },
          chart("Monthly Swaps", analytics.monthlySwaps),
          chart("Monthly Listings", analytics.monthlyListings),
          chart("Monthly Registrations", analytics.monthlyUsers)
        ),

        h("section", { className: "cs-ceo-card" },
          h("h3", null, "Report Summary"),
          h("p", null, `Swap Completion Rate: ${analytics.swapCompletionRate || 0}%`),

          h("div", { className: "cs-report-export-options" },
            h("button", {
              className: "cs-ceo-primary-btn",
              onClick: () => setShowReport(true)
            }, "View Report & Export"),

            h("button", {
              className: "cs-ceo-outline-btn",
              onClick: () => {
                setShowReport(true);
                setError("");
              }
            }, "Open Report Preview")
          )
        )
      );
    }

    // ================= CONTENT ROUTER =================

    function renderContent() {
      if (showReport) {
        return renderReportPreview();
      }

      switch (activeMenu) {
        case "overview": return renderOverview();
        case "users": return renderUsers();
        case "listings": return renderListings();
        case "swaps": return renderSwaps();
        case "negotiations": return renderNegotiations();
        case "value": return renderValueAnalytics();
        case "location": return renderLocation();
        case "shipments": return renderShipments();
        case "reports": return renderReports();
        default: return renderOverview();
      }
    }

    // ================= MAIN DASHBOARD UI =================

    return h("div", { className: "cs-ceo-layout cs-ceo-fullscreen" },

      h("aside", { className: "cs-ceo-sidebar" },
        h("div", { className: "cs-ceo-brand" },
          h("div", { className: "cs-ceo-brand-mark" }, "✿"),
          h("span", null, "ClothSwap")
        ),

        h("div", { className: "cs-ceo-menu-caption" }, "MENU"),

        h("nav", { className: "cs-ceo-menu" },
          MENU.map(([id, label, icon]) =>
            h("button", {
              key: id,
              className: `cs-ceo-menu-item ${activeMenu === id ? "active" : ""}`,
              onClick: () => {
                setActiveMenu(id);
                setShowReport(false);
                setSearch("");
                setFilter("All");
                setSelected(null);
                setMessages([]);
              }
            },
              h("span", { className: "cs-ceo-menu-icon" }, icon),
              h("span", null, label)
            )
          )
        ),

        h("div", { className: "cs-ceo-sidebar-bottom" },
          h("button", {
            className: "cs-ceo-menu-item cs-ceo-logout",
            onClick: logout
          },
            h("span", { className: "cs-ceo-menu-icon" }, "⇥"),
            "Logout"
          )
        )
      ),

      h("main", { className: "cs-ceo-main" },

        h("header", { className: "cs-ceo-topbar" },
          h("div", { className: "cs-ceo-topbar-title" },
            h("h1", null, `Welcome Back, ${displayName}!`)
          ),

          h("div", { className: "cs-ceo-topbar-actions" },
        h("div", {
    className: "cs-ceo-online",
    style: {
      color: systemStatus === "Online" ? "#16a34a" : "#dc2626"
    }
  },
    h("span", {
      style: {
        backgroundColor: systemStatus === "Online" ? "#16a34a" : "#dc2626"
      }
    }),
    `System ${systemStatus}`
  ),

            h("button", {
              className: "cs-ceo-outline-btn",
              onClick: () => navigate("/")
            }, "← Back to Website"),

            h("div", { className: "cs-ceo-admin-profile" },
              h("div", { className: "cs-ceo-avatar" },
                displayName.slice(0, 1).toUpperCase()
              ),
              h("div", null,
                h("strong", null, displayName),
                h("small", null, "Account")
              )
            )
          )
        ),

        !showReport && h("div", { className: "cs-ceo-toolbar" },
          h("div", { className: "cs-ceo-period-controls" },
            h("select", {
              value: period,
              onChange: e => setPeriod(e.target.value)
            },
              h("option", { value: "today" }, "Today"),
              h("option", { value: "week" }, "Last 7 Days"),
              h("option", { value: "month" }, "This Month"),
              h("option", { value: "year" }, "This Year"),
              h("option", { value: "custom" }, "Custom Range")
            ),

            period === "custom" && h(React.Fragment, null,
              h("input", {
                type: "date",
                value: startDate,
                onChange: e => setStartDate(e.target.value)
              }),

              h("input", {
                type: "date",
                value: endDate,
                min: startDate || undefined,
                onChange: e => setEndDate(e.target.value)
              })
            )
          )
        ),

        h("div", { className: "cs-ceo-content" },
          error && h("div", { className: "cs-ceo-error" }, error),

          loading && h("div", { className: "cs-ceo-loading" }, "Loading data..."),

          renderContent(),

          selected && activeMenu !== "negotiations" && !showReport &&
            h("section", {
              className: "cs-ceo-card cs-ceo-user-details"
            },
              h("div", { className: "cs-ceo-card-heading" },
                h("h3", null, "Record Details"),
                h("button", {
                  className: "cs-ceo-outline-btn",
                  onClick: () => setSelected(null)
                }, "Close ✕")
              ),

              ...Object.entries(selected)
                .filter(([key]) =>
                  !["_id", "__v", "password"].includes(key)
                )
                .map(([key, value]) =>
                  h("p", { key },
                    h("strong", null, `${key}: `),
                    typeof value === "object"
                      ? JSON.stringify(value)
                      : String(value ?? "—")
                  )
                )
            )
        ),

        
        !showReport && h("footer", { className: "cs-ceo-footer" },
          `© ${new Date().getFullYear()} ClothSwap · Sustainable Fashion, Smarter Swapping`
        )
      ),

      showMoreMenu && h("div", { className: "cs-ceo-mobile-more-menu" },
        MENU.filter(([id]) =>
          !["overview", "users", "listings", "swaps"].includes(id)
        ).map(([id, label, icon]) =>
          h("button", {
            key: id,
            className: activeMenu === id ? "active" : "",
            onClick: () => {
              setActiveMenu(id);
              setShowMoreMenu(false);
              setShowReport(false);
              setSearch("");
              setFilter("All");
              setSelected(null);
              setMessages([]);
            }
          },
            h("span", { className: "cs-ceo-mobile-nav-icon" }, icon),
            h("span", { className: "cs-ceo-mobile-nav-label" }, label)
          )
        )
      ),

      h("nav", { className: "cs-ceo-mobile-nav" },
        MENU.filter(([id]) =>
          ["overview", "users", "listings", "swaps"].includes(id)
        ).map(([id, label, icon]) =>
          h("button", {
            key: id,
            className: activeMenu === id ? "active" : "",
            onClick: () => {
              setActiveMenu(id);
              setShowMoreMenu(false);
              setShowReport(false);
              setSearch("");
              setFilter("All");
              setSelected(null);
              setMessages([]);
            }
          },
            h("span", { className: "cs-ceo-mobile-nav-icon" }, icon),
            h("span", { className: "cs-ceo-mobile-nav-label" }, label)
          )
        ),

        h("button", {
          className: !["overview", "users", "listings", "swaps"].includes(activeMenu) ? "active" : "",
          onClick: () => setShowMoreMenu(!showMoreMenu)
        },
          h("span", { className: "cs-ceo-mobile-nav-icon" }, "⋯"),
          h("span", { className: "cs-ceo-mobile-nav-label" }, "More")
        )
      )
    );
  }
  export default AdminDashboard;
