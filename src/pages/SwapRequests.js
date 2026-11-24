import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_URL, { apiFetch } from "../api.js";
import CourierTracking from "./CourierTracking.js";
import socket from "../socket.js";
let swapRequestsCache = null;

const swapRequestsCacheKey =
  "clothswapSwapRequestsCache_" +
  (
    localStorage.getItem("clothswapUserEmail") ||
    localStorage.getItem("clothswapEmail") ||
    ""
  ).trim().toLowerCase();

try {
  const savedCache = localStorage.getItem(
    swapRequestsCacheKey
  );

  swapRequestsCache = savedCache
    ? JSON.parse(savedCache)
    : null;

  if (!Array.isArray(swapRequestsCache)) {
    swapRequestsCache = null;
  }
} catch (error) {
  swapRequestsCache = null;
}
function SwapRequests() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("active");
  const [agreeLoading, setAgreeLoading] = useState(null);
  const [completeLoading, setCompleteLoading] = useState(null);
  const [localExchangeForm, setLocalExchangeForm] = useState({});
  const [localExchangeLoading, setLocalExchangeLoading] = useState(null);
  const [shipments, setShipments] = useState({});
  const [disputeLoading, setDisputeLoading] = useState(null);
const [raisedDisputes, setRaisedDisputes] = useState([]);
const [disputesLoaded, setDisputesLoaded] = useState(false);
const [requests, setRequests] = useState(
  Array.isArray(swapRequestsCache)
    ? swapRequestsCache
    : []
);

const [loading, setLoading] = useState(
  !Array.isArray(swapRequestsCache)
);
  const currentUser =
    localStorage.getItem("clothSwapUserName") ||
    localStorage.getItem("clothswapUserName") ||
    "ClothSwap User";
   const currentUserEmail = (
  localStorage.getItem("clothswapUserEmail") ||
  localStorage.getItem("clothswapEmail") ||
  ""
).trim().toLowerCase();
const isAdmin =
  localStorage.getItem("clothswapIsAdmin") === "true";
useEffect(function () {
  try {
    const cacheForStorage = requests.map(function (request) {
      const cachedRequest = { ...request };

      if (
        cachedRequest.clothingImage &&
        String(cachedRequest.clothingImage).startsWith("data:")
      ) {
        delete cachedRequest.clothingImage;
      }

      return cachedRequest;
    });

    localStorage.setItem(
      swapRequestsCacheKey,
      JSON.stringify(cacheForStorage)
    );

    swapRequestsCache = cacheForStorage;
  } catch (error) {
    console.log("Swap requests cache save error:", error);
  }
}, [requests]);

  useEffect(function () {
    fetchRequests();
  }, []);

useEffect(function () {

  function handleSwapRequestUpdate(data) {
    if (!data || !data.requestId) {
      return;
    }

    console.log(
      "Real-time swap request update received:",
      data
    );

    fetchRequests();
  }

  socket.on(
    "swap-request-updated",
    handleSwapRequestUpdate
  );

  return function () {
    socket.off(
      "swap-request-updated",
      handleSwapRequestUpdate
    );
  };

}, []);
useEffect(function () {
  async function fetchMyDisputes() {
    try {
      const response = await apiFetch(
        `${API_URL}/api/swap-requests/my-disputes`
      );

      const data = await response.json();

      if (
        response.ok &&
        Array.isArray(data.swapRequestIds)
      ) {
        setRaisedDisputes(
          data.swapRequestIds.map(function (id) {
            return String(id);
          })
        );
      }
    } catch (error) {
      console.error(
        "Failed to fetch raised disputes:",
        error
      );
    } finally {
      setDisputesLoaded(true);
    }
  }

  fetchMyDisputes();
}, []);
 useEffect(function () {
    fetchShipments();

    const shipmentTimer =
      setInterval(function () {
        fetchShipments();
      }, 5000);

    return function () {
      clearInterval(shipmentTimer);
    };
  }, []);

 
  async function fetchRequests() {
    try {


const response = await fetch(
  `${API_URL}/api/swap-requests` +
  "?user=" +
  encodeURIComponent(currentUser) +
  "&userEmail=" +
  encodeURIComponent(currentUserEmail)
);

      const data = await response.json();
      console.log("CURRENT USER:", currentUser);
console.log("CURRENT EMAIL:", currentUserEmail);
console.log("SWAP REQUESTS FROM SERVER:", data);

     if (Array.isArray(data)) {
  setRequests(data);
} else if (Array.isArray(data.requests)) {
  setRequests(data.requests);
} else {
  console.error("Invalid swap requests response:", data);
}
    } catch (error) {
  console.error("Failed to fetch swap requests:", error);
} finally {
  setLoading(false);
}
  }
 

  async function fetchShipments() {
    try {
      const response = await fetch
      (`${API_URL}/api/shipments`);
       const data = await response.json();

      if (!response.ok) {
        return;
      }

      const shipmentList =
        Array.isArray(data.shipments)
          ? data.shipments
          : [];

      const shipmentMap = {};

      shipmentList.forEach(function (shipment) {
        if (shipment.swapRequestId) {
          shipmentMap[
            String(shipment.swapRequestId)
          ] = shipment;
        }
      });

      setShipments(shipmentMap);
    } catch (error) {
      console.error(
        "Failed to fetch shipments:",
        error
      );
    }
  }
 

  async function findUserEmail(username) {
    if (!username) {
      return "";
    }

    
try {
  const response = await fetch(
    `${API_URL}/api/admin/users`
  );

  if (!response.ok) {
    return "";
  }


      const data = await response.json();

      let users = [];

      if (Array.isArray(data)) {
        users = data;
      } else if (Array.isArray(data.users)) {
        users = data.users;
      }

      const foundUser = users.find(function (user) {
        const possibleUsername =
          user.username ||
          user.userName ||
          user.name ||
          user.fullName ||
          "";

        return possibleUsername === username;
      });

      if (foundUser) {
        return (
          foundUser.email ||
          foundUser.userEmail ||
          ""
        );
      }

      return "";
    } catch (error) {
      console.error("Find user email error:", error);
      return "";
    }
  }



  async function sendSwapNotification(
    request,
    recipientUsername,
    title,
    message,
    type
  ) {
    try {
      if (!recipientUsername) {
        return;
      }

      let recipientEmail = "";

if (
  request.ownerEmail &&
  request.ownerEmail.toLowerCase() !==
    currentUserEmail.toLowerCase()
) {
  recipientEmail = request.ownerEmail;
} else if (
  request.requesterEmail &&
  request.requesterEmail.toLowerCase() !==
    currentUserEmail.toLowerCase()
) {
  recipientEmail = request.requesterEmail;
} else {
  recipientEmail = await findUserEmail(recipientUsername);
}

      if (!recipientEmail) {
        console.warn(
          "Notification recipient email not found for:",
          recipientUsername
        );
        return;
      }

      const senderEmail =
  localStorage.getItem("clothswapUserEmail") ||
  localStorage.getItem("clothswapEmail") ||
  "";

      const senderName =
        localStorage.getItem("clothSwapUserName") ||
        localStorage.getItem("clothswapUserName") ||
        currentUser;

     
const response = await fetch(
  `${API_URL}/api/notifications`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },

          body: JSON.stringify({
            recipient: recipientEmail,
            sender: senderEmail,
            senderName: senderName,
            type: type || "swap",
            title: title,
            message: message,
            relatedId: request?._id || "",
            isRead: false
          })
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(function () {
          return {};
        });

        console.error(
          "Notification creation failed:",
          data.message || "Unknown error"
        );

        return;
      }

      window.dispatchEvent(
        new Event("notificationsUpdated")
      );
    } catch (error) {
      console.error(
        "Send swap notification error:",
        error
      );
    }
  }



  function getOtherParticipant(request) {
  if (!request) {
    return "";
  }

  if (
    request.ownerEmail &&
    request.ownerEmail.toLowerCase() ===
      currentUserEmail.toLowerCase()
  ) {
    return request.requester || "";
  }

  if (
    request.requesterEmail &&
    request.requesterEmail.toLowerCase() ===
      currentUserEmail.toLowerCase()
  ) {
    return request.owner || "";
  }


  if (request.owner === currentUser) {
    return request.requester || "";
  }

  if (request.requester === currentUser) {
    return request.owner || "";
  }

  return "";
}

  async function updateStatus(id, status) {
    try {
      const request = requests.find(function (item) {
        return item._id === id;
      });

     const response = await apiFetch(
  `${API_URL}/api/swap-requests/${id}`,
  {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      status: status
    })
  }
);

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Failed to update request"
        );
        return;
      }

      if (request) {
        const otherParticipant =
          getOtherParticipant(request);

        if (status === "Accepted") {
          await sendSwapNotification(
            request,
            otherParticipant,
            "Swap Request Accepted",
            currentUser +
              " accepted your swap request for \"" +
              (request.clothingTitle ||
                "a clothing item") +
              "\".",
            "swap_accepted"
          );
        }

        if (status === "Rejected") {
          await sendSwapNotification(
            request,
            otherParticipant,
            "Swap Request Rejected",
            currentUser +
              " rejected your swap request for \"" +
              (request.clothingTitle ||
                "a clothing item") +
              "\".",
            "swap_rejected"
          );
        }
      }

      fetchRequests();
    } catch (error) {
      console.error("Update status error:", error);
      alert("Something went wrong");
    }
  }

 

  async function agreeToSwap(id) {
    try {
      setAgreeLoading(id);

      const request =
        requests.find(function (item) {
          return item._id === id;
        });

     const response = await apiFetch(
  `${API_URL}/api/swap-requests/${id}/agree`,
  {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      user: currentUser,
      userEmail:
        localStorage.getItem("clothswapUserEmail") ||
        localStorage.getItem("clothswapEmail") ||
        ""
    })
  }
);

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Failed to agree to swap"
        );
        return;
      }

      setRequests(function (previous) {
        return previous.map(function (item) {
          if (item._id === id) {
            return data.request || item;
          }

          return item;
        });
      });

      if (request) {
        const otherParticipant =
          getOtherParticipant(request);

        await sendSwapNotification(
          request,
          otherParticipant,
          "Swap Agreement Update",
          currentUser +
            " agreed to the swap for \"" +
            (request.clothingTitle ||
              "a clothing item") +
            "\".",
          "swap_agreed"
        );
      }
    } catch (error) {
      console.error(
        "Agree to swap error:",
        error
      );

      alert(
        "Something went wrong while agreeing"
      );
    } finally {
      setAgreeLoading(null);
    }
  }



  async function completeSwap(id) {
    try {
      setCompleteLoading(id);

      const request =
        requests.find(function (item) {
          return item._id === id;
        });

    
const response = await fetch(
  `${API_URL}/api/swap-requests/${id}/complete`,
  {
    method: "PUT",
    headers: {

            "Content-Type": "application/json"
          },
          body: JSON.stringify({
  user: currentUser,
  userEmail:
    localStorage.getItem("clothswapUserEmail") ||
    localStorage.getItem("clothswapEmail") ||
    ""
})
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Failed to complete swap"
        );
        return;
      }

      setRequests(function (previous) {
        return previous.map(function (item) {
          if (item._id === id) {
            return data.request || item;
          }

          return item;
        });
      });

      if (request) {
        const otherParticipant =
          getOtherParticipant(request);

        await sendSwapNotification(
          request,
          otherParticipant,
          "Swap Completion Update",
          currentUser +
            " marked the swap as completed for \"" +
            (request.clothingTitle ||
              "a clothing item") +
            "\".",
          "swap_completed"
        );
      }
    } catch (error) {
      console.error(
        "Complete swap error:",
        error
      );

      alert(
        "Something went wrong while completing swap"
      );
    } finally {
      setCompleteLoading(null);
    }
  }

  
  async function deleteRequest(id) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this swap request?"
    );

    if (!confirmDelete) {
      return;
    }

   
try {
  const response = await fetch(
  `${API_URL}/api/swap-requests/${id}`,
  {
    method: "DELETE",
    headers: {
      Authorization:
        "Bearer " +
        localStorage.getItem("clothswapToken")
    }
  }
);


      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Failed to delete request"
        );
        return;
      }

     setRequests(function (previous) {
  return previous.map(function (item) {
    if (item._id === id) {
      if (data.request) {
        return data.request;
      }

      var deletedFor = Array.isArray(item.deletedFor)
        ? item.deletedFor.slice()
        : [];

      if (!deletedFor.includes(currentUserEmail)) {
        deletedFor.push(currentUserEmail);
      }

      return {
        ...item,
        deletedFor: deletedFor
      };
    }

    return item;
  });
});
    } catch (error) {
      console.error(
        "Delete request error:",
        error
      );

      alert("Something went wrong");
    }
  }



  async function saveLocalExchange(id) {
    const form = localExchangeForm[id];

    if (!form) {
      alert("Please enter meeting details.");
      return;
    }

    if (
      !form.meetingLocation ||
      !form.meetingDate ||
      !form.meetingTime
    ) {
      alert(
        "Please enter Meeting Location, Date and Time."
      );
      return;
    }

    try {
      setLocalExchangeLoading(id);

      const request =
        requests.find(function (item) {
          return item._id === id;
        });

      
const response = await apiFetch(
    `${API_URL}/api/swap-requests/${id}/local-exchange`,
  {
    method: "PUT",
    headers: {

            "Content-Type": "application/json"
          },
          body: JSON.stringify({
  user: currentUser,
  userEmail:
    localStorage.getItem("clothswapUserEmail") ||
    localStorage.getItem("clothswapEmail") ||
    "",
  meetingLocation:
    form.meetingLocation,
  meetingDate:
    form.meetingDate,
  meetingTime:
    form.meetingTime,
  meetingNotes:
    form.meetingNotes || ""
})
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Failed to save Local Exchange details."
        );
        return;
      }

      setRequests(function (previous) {
        return previous.map(function (item) {
          if (item._id === id) {
            return data.request || item;
          }

          return item;
        });
      });

      if (request) {
        const otherParticipant =
          getOtherParticipant(request);

        await sendSwapNotification(
          request,
          otherParticipant,
          "Local Exchange Details Updated",
          currentUser +
            " updated the meeting details for \"" +
            (request.clothingTitle ||
              "your clothing swap") +
            "\".",
          "local_exchange_updated"
        );
      }

      alert(
        "Local Exchange details saved successfully!"
      );
    } catch (error) {
      console.error(
        "Local Exchange error:",
        error
      );

      alert(
        "Something went wrong while saving Local Exchange."
      );
    } finally {
      setLocalExchangeLoading(null);
    }
  }

 

  async function completeLocalExchange(id) {
    try {
      setCompleteLoading(id);

      const request =
        requests.find(function (item) {
          return item._id === id;
        });

     
const response = await apiFetch(
      `${API_URL}/api/swap-requests/${id}/local-exchange/complete`,
  {
    method: "PUT",
    headers: {

            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            user: currentUser
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Failed to complete Local Exchange."
        );
        return;
      }

      setRequests(function (previous) {
        return previous.map(function (item) {
          if (item._id === id) {
            return data.request || item;
          }

          return item;
        });
      });

      if (request) {
        const otherParticipant =
          getOtherParticipant(request);

        await sendSwapNotification(
          request,
          otherParticipant,
          "Local Exchange Completed",
          currentUser +
            " marked the local clothing exchange as completed.",
          "local_exchange_completed"
        );
      }

      alert(
        "Your Local Exchange completion is recorded!"
      );
    } catch (error) {
      console.error(
        "Local Exchange completion error:",
        error
      );

      alert(
        "Something went wrong while completing Local Exchange."
      );
    } finally {
      setCompleteLoading(null);
    }
  }
async function selectExchangeMethod(id, method) {
  if (
    method !== "Courier" &&
    method !== "Local Exchange"
  ) {
    return;
  }

  try {
    const request = requests.find(function (item) {
      return item._id === id;
    });

    if (!request) {
      alert("Swap request not found.");
      return;
    }

    const currentEmail = (
      localStorage.getItem("clothswapUserEmail") ||
      localStorage.getItem("clothswapEmail") ||
      ""
    ).trim().toLowerCase();

    const isOwner = request.ownerEmail
      ? String(request.ownerEmail).trim().toLowerCase() === currentEmail
      : request.owner === currentUser;

    if (!isOwner) {
      alert("Only the clothing owner can select the exchange method.");
      return;
    }

    if (
      request.status !== "Accepted" ||
      request.agreementStatus !== "Confirmed"
    ) {
      alert("Both users must confirm the swap first.");
      return;
    }

    if (
      request.exchangeMethod &&
      request.exchangeMethod !== "Not Selected"
    ) {
      alert("Exchange method has already been selected.");
      return;
    }

   const response = await apiFetch(
  `${API_URL}/api/swap-requests/${id}/exchange-method`,
  {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      exchangeMethod: method,
      user: currentUser,
      userEmail: currentEmail
    })
  }
);
    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to select exchange method.");
      return;
    }

    const updatedRequest = data.request;

    if (updatedRequest) {
      setRequests(function (previous) {
        return previous.map(function (item) {
          return item._id === id ? updatedRequest : item;
        });
      });
    }

    const otherParticipant =
      getOtherParticipant(updatedRequest || request);

    await sendSwapNotification(
      updatedRequest || request,
      otherParticipant,
      "Exchange Method Selected",
      currentUser + " selected " + method +
        " for \"" +
        (request.clothingTitle || "your clothing swap") +
        "\".",
      "exchange_method_selected"
    );

   if (method === "Courier") {
  return;
}

    setLocalExchangeForm(function (previous) {
      return {
        ...previous,
        [id]: {
          meetingLocation:
            updatedRequest?.meetingLocation || "",
          meetingDate: updatedRequest?.meetingDate || "",
          meetingTime: updatedRequest?.meetingTime || "",
          meetingNotes: updatedRequest?.meetingNotes || ""
        }
      };
    });
  } catch (error) {
    console.error("Exchange method error:", error);
    alert("Something went wrong while selecting the exchange method.");
  }
}

async function raiseDispute(request) {
  const id = String(request._id);

  if (raisedDisputes.includes(id)) {
    alert("You have already raised a dispute for this swap.");
    return;
  }

  if (disputeLoading === id) {
    return;
  }

  setDisputeLoading(id);

  try {
    const reason = window.prompt(
      "Enter dispute reason (e.g. Damaged Clothes, Parcel Not Delivered, Wrong Item):"
    );

    if (!reason || !reason.trim()) {
      return;
    }

    const description = window.prompt(
      "Describe your issue in detail:"
    );

    if (!description || !description.trim()) {
      return;
    }

    const response = await apiFetch(
      `${API_URL}/api/swap-requests/${id}/dispute`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          reason: reason.trim(),
          description: description.trim()
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to raise dispute.");
      return;
    }

    setRaisedDisputes(function (previous) {
      if (previous.includes(id)) {
        return previous;
      }

      return [...previous, id];
    });

    alert(
      "Your dispute has been raised successfully. Admin has been notified."
    );

  } catch (error) {
    console.error("Raise dispute error:", error);
    alert("Something went wrong while raising dispute.");
  } finally {
    setDisputeLoading(null);
  }
}

     function getStatusClass(status) {
    if (status === "Accepted") {
      return "swap-status accepted";
    }

    if (status === "Rejected") {
      return "swap-status rejected";
    }

    if (status === "Completed") {
      return "swap-status completed";
    }

    return "swap-status pending";
  }

  function createAgreementBox(
    request,
    isParticipant
  ) {
    if (
      request.status !== "Accepted" ||
      !isParticipant
    ) {
      return null;
    }

    const ownerAgreed =
      request.ownerAgreed === true;

    const requesterAgreed =
      request.requesterAgreed === true;

    const agreementStatus =
      request.agreementStatus ||
      "Not Started";

    const exchangeMethod =
      request.exchangeMethod ||
      "Not Selected";

    const exchangeMethodSelected =
      exchangeMethod !== "Not Selected";

    const localExchangeData =
      localExchangeForm[request._id] ||
      null;

      const showLocalExchangeForm =
  exchangeMethod === "Local Exchange" &&
  localExchangeData !== null;

    const ownerCompleted =
  request.ownerCompleted === true;

const requesterCompleted =
  request.requesterCompleted === true;
const currentEmail = (
  localStorage.getItem("clothswapUserEmail") ||
  localStorage.getItem("clothswapEmail") ||
  ""
).trim().toLowerCase();


const isOwner = request.ownerEmail
  ? String(request.ownerEmail).trim().toLowerCase() === currentEmail
  : request.owner === currentUser;

const isRequester = request.requesterEmail
  ? String(request.requesterEmail).trim().toLowerCase() === currentEmail
  : request.requester === currentUser;


const completionStatus =
  ownerCompleted && requesterCompleted
    ? "Completed"
    : "Waiting";

const alreadyCompleted =
  (isOwner && ownerCompleted) ||
  (isRequester && requesterCompleted);
     
      

    return React.createElement(
      "div",
      {
        className:
          "swap-agreement-box " +
          (agreementStatus === "Confirmed"
            ? "agreement-confirmed"
            : "")
      },

      React.createElement(
        "div",
        {
          className:
            "swap-agreement-title"
        },
        "🤝 Swap Agreement"
      ),

      React.createElement(
        "div",
        {
          className:
            "swap-agreement-status"
        },

        React.createElement(
          "span",
          null,
          "Status"
        ),

        React.createElement(
          "strong",
          null,
          agreementStatus
        )
      ),

      React.createElement(
        "div",
        {
          className:
            "swap-agreement-people"
        },

        React.createElement(
          "span",
          null,
          "Owner: ",
          ownerAgreed
            ? "✓ Agreed"
            : "Waiting"
        ),

        React.createElement(
          "span",
          null,
          "Requester: ",
          requesterAgreed
            ? "✓ Agreed"
            : "Waiting"
        )
      ),
isOwner &&
agreementStatus === "Confirmed" &&
exchangeMethod === "Not Selected"

        ? React.createElement(
            "div",
            {
              className:
                "swap-exchange-method-box"
            },

            React.createElement(
              "div",
              {
                className:
                  "swap-exchange-method-title"
              },
              "🔄 Choose Exchange Method"
            ),

            React.createElement(
              "p",
              {
                className:
                  "swap-exchange-method-text"
              },
              "Your swap is confirmed. Choose how you want to exchange the clothes."
            ),

            React.createElement(
              "div",
              {
                className:
                  "swap-exchange-method-options"
              },

              React.createElement(
                "button",
                {
                  className:
                    "swap-exchange-option courier-option",

                 onClick: function () {
  selectExchangeMethod(
    request._id,
    "Courier"
  );
}
                },
                "🚚 Courier Delivery"
              ),

              React.createElement(
                "button",
                {
                  className:
                    "swap-exchange-option local-option",

                  onClick: function () {
                    selectExchangeMethod(
                      request._id,
                      "Local Exchange"
                    );
                  }
                },
                "🤝 Local Hand-to-Hand Exchange"
              )
            )
          )
        : null,


      showLocalExchangeForm
        ? React.createElement(
            "div",
            {
              className:
                "swap-exchange-method-box"
            },

            React.createElement(
              "div",
              {
                className:
                  "swap-exchange-method-title"
              },
              "🤝 Local Hand-to-Hand Exchange"
            ),

            React.createElement(
              "p",
              {
                className:
                  "swap-exchange-method-text"
              },
              "Enter the meeting details for your hand-to-hand clothing exchange."
            ),

            React.createElement(
              "input",
              {
                type: "text",
                placeholder:
                  "📍 Meeting Location",

                value:
                  localExchangeData.meetingLocation,

                onChange: function (event) {
                  setLocalExchangeForm(
                    function (previous) {
                      return {
                        ...previous,
                        [request._id]: {
                          ...previous[
                            request._id
                          ],
                          meetingLocation:
                            event.target.value
                        }
                      };
                    }
                  );
                },

                style: {
                  width: "100%",
                  padding: "10px",
                  marginBottom: "10px",
                  borderRadius: "8px",
                  border:
                    "1px solid #ccc"
                }
              }
            ),

            React.createElement(
              "input",
              {
                type: "date",

                value:
                  localExchangeData.meetingDate,

                onChange: function (event) {
                  setLocalExchangeForm(
                    function (previous) {
                      return {
                        ...previous,
                        [request._id]: {
                          ...previous[
                            request._id
                          ],
                          meetingDate:
                            event.target.value
                        }
                      };
                    }
                  );
                },

                style: {
                  width: "100%",
                  padding: "10px",
                  marginBottom: "10px",
                  borderRadius: "8px",
                  border:
                    "1px solid #ccc"
                }
              }
            ),

           
React.createElement(
  "div",
  {
    className: "meeting-time-picker"
  },

  React.createElement(
    "label",
    {
      className: "meeting-time-label"
    },
    "⏰ Meeting Time"
  ),

  React.createElement(
    "div",
    {
      className: "meeting-time-options"
    },

    React.createElement(
      "select",
      {
        value:
          (localExchangeData.meetingTime || "").match(/^(\d{1,2}):/)
            ? String(
                Number(
                  (localExchangeData.meetingTime || "").match(/^(\d{1,2}):/)[1]
                )
              ).padStart(2, "0")
            : "",

        onChange: function (event) {
          const hour = event.target.value;

          setLocalExchangeForm(function (previous) {
            const oldTime =
              previous[request._id]?.meetingTime || "";

            const parts = oldTime.match(
              /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i
            );

            const minute = parts ? parts[2] : "00";
            const period = parts && parts[3]
              ? parts[3].toUpperCase()
              : "AM";

            return {
              ...previous,
              [request._id]: {
                ...previous[request._id],
                meetingTime: hour
                  ? hour + ":" + minute + " " + period
                  : ""
              }
            };
          });
        },

        style: {
          flex: 1,
          minWidth: "0",
          padding: "12px",
          borderRadius: "10px",
          border: "1px solid #dfc4e4",
          background: "#fff",
          color: "#65466d",
          fontSize: "15px",
          fontWeight: "600"
        }
      },

      React.createElement("option", { value: "" }, "Hour"),

      ...Array.from(
        { length: 12 },
        function (_, index) {
          const hour = String(index + 1).padStart(2, "0");

          return React.createElement(
            "option",
            {
              key: hour,
              value: hour
            },
            hour
          );
        }
      )
    ),

    React.createElement(
      "select",
      {
        value:
          (localExchangeData.meetingTime || "").match(/:(\d{2})/)
            ? (localExchangeData.meetingTime || "").match(/:(\d{2})/)[1]
            : "00",

        onChange: function (event) {
          const minute = event.target.value;

          setLocalExchangeForm(function (previous) {
            const oldTime =
              previous[request._id]?.meetingTime || "";

            const parts = oldTime.match(
              /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i
            );

            const hour = parts
              ? String(Number(parts[1])).padStart(2, "0")
              : "08";

            const period = parts && parts[3]
              ? parts[3].toUpperCase()
              : "AM";

            return {
              ...previous,
              [request._id]: {
                ...previous[request._id],
                meetingTime:
                  hour + ":" + minute + " " + period
              }
            };
          });
        },

        style: {
          flex: 1,
          minWidth: "0",
          padding: "12px",
          borderRadius: "10px",
          border: "1px solid #dfc4e4",
          background: "#fff",
          color: "#65466d",
          fontSize: "15px",
          fontWeight: "600"
        }
      },

      React.createElement("option", { value: "00" }, "00"),
      React.createElement("option", { value: "15" }, "15"),
      React.createElement("option", { value: "30" }, "30"),
      React.createElement("option", { value: "45" }, "45")
    ),

    React.createElement(
      "select",
      {
        value:
          (localExchangeData.meetingTime || "").match(/(AM|PM)$/i)
            ? (localExchangeData.meetingTime || "").match(/(AM|PM)$/i)[1].toUpperCase()
            : "AM",

        onChange: function (event) {
          const period = event.target.value;

          setLocalExchangeForm(function (previous) {
            const oldTime =
              previous[request._id]?.meetingTime || "";

            const parts = oldTime.match(/^(\d{1,2}):(\d{2})/);

            const hour = parts
              ? String(Number(parts[1])).padStart(2, "0")
              : "08";

            const minute = parts ? parts[2] : "00";

            return {
              ...previous,
              [request._id]: {
                ...previous[request._id],
                meetingTime:
                  hour + ":" + minute + " " + period
              }
            };
          });
        },

        style: {
          flex: 0.8,
          minWidth: "0",
          padding: "12px",
          borderRadius: "10px",
          border: "1px solid #dfc4e4",
          background: "#fff",
          color: "#65466d",
          fontSize: "15px",
          fontWeight: "700"
        }
      },

      React.createElement("option", { value: "AM" }, "AM"),
      React.createElement("option", { value: "PM" }, "PM")
    )
  ),

  React.createElement(
    "div",
    {
      className: "meeting-time-preview",
      style: {
        marginTop: "9px",
        color: "#88518e",
        fontSize: "14px",
        fontWeight: "600"
      }
    },
    "⏰ Selected Time: ",
    localExchangeData.meetingTime || "Select time"
  )
),

            React.createElement(
              "textarea",
              {
                placeholder:
                  "📝 Notes (optional)",

                value:
                  localExchangeData.meetingNotes,

                onChange: function (event) {
                  setLocalExchangeForm(
                    function (previous) {
                      return {
                        ...previous,
                        [request._id]: {
                          ...previous[
                            request._id
                          ],
                          meetingNotes:
                            event.target.value
                        }
                      };
                    }
                  );
                },

                rows: 3,

                style: {
                  width: "100%",
                  padding: "10px",
                  marginBottom: "10px",
                  borderRadius: "8px",
                  border:
                    "1px solid #ccc",
                  resize: "vertical"
                }
              }
            ),

            React.createElement(
              "button",
              {
                className:
                  "accept-btn swap-action-button",

                disabled:
                  localExchangeLoading ===
                  request._id,

                onClick: function () {
                  saveLocalExchange(
                    request._id
                  );
                }
              },

              localExchangeLoading ===
              request._id
                ? "Saving..."
                : "✓ Confirm Local Exchange"
            )
          )
        : null,
      request.exchangeMethod === "Local Exchange" &&
      request.meetingLocation &&
      request.meetingDate &&
      request.meetingTime
        ? React.createElement(
            "div",
            {
              className: "swap-exchange-method-box"
            },

            React.createElement(
              "div",
              {
                className: "swap-exchange-method-title"
              },
              "🤝 Local Exchange Meeting Details"
            ),

            React.createElement(
              "p",
              {
                className: "swap-exchange-method-text"
              },
              "Meeting details confirmed for your hand-to-hand exchange."
            ),

            React.createElement(
              "div",
              {
                className: "swap-request-details-grid"
              },

              React.createElement(
                "div",
                {
                  className: "swap-detail-item"
                },

                React.createElement(
                  "span",
                  {
                    className: "swap-detail-label"
                  },
                  "📍 Meeting Location"
                ),

                React.createElement(
                  "strong",
                  null,
                  request.meetingLocation
                )
              ),

              React.createElement(
                "div",
                {
                  className: "swap-detail-item"
                },

                React.createElement(
                  "span",
                  {
                    className: "swap-detail-label"
                  },
                  "📅 Meeting Date"
                ),

                React.createElement(
                  "strong",
                  null,
                  request.meetingDate
                )
              ),

              React.createElement(
                "div",
                {
                  className: "swap-detail-item"
                },

                React.createElement(
                  "span",
                  {
                    className: "swap-detail-label"
                  },
                  "⏰ Meeting Time"
                ),

                React.createElement(
                  "strong",
                  null,
                  request.meetingTime
                )
              )
            ),

            request.meetingNotes
              ? React.createElement(
                  "div",
                  {
                    className: "swap-request-message"
                  },

                  React.createElement(
                    "span",
                    {
                      className: "swap-detail-label"
                    },
                    "📝 Meeting Notes"
                  ),

                  React.createElement(
                    "p",
                    null,
                    request.meetingNotes
                  )
                )
              : null
          )
        : null,

      agreementStatus === "Confirmed" ||
      agreementStatus === "Completed"
        ? React.createElement(
            "div",
            {
              className:
                "swap-completion-box"
            },

            React.createElement(
              "div",
              {
                className:
                  "swap-completion-title"
              },
              "📦 Swap Completion"
            ),

            React.createElement(
              "div",
              {
                className:
                  "swap-completion-status"
              },

              React.createElement(
                "span",
                null,
                "Status"
              ),

              React.createElement(
                "strong",
                null,
                completionStatus
              )
            ),

            React.createElement(
              "div",
              {
                className:
                  "swap-completion-people"
              },

              React.createElement(
                "span",
                null,
                "Owner: ",
                ownerCompleted
                  ? "✓ Completed"
                  : "Waiting"
              ),

              React.createElement(
                "span",
                null,
                "Requester: ",
                requesterCompleted
                  ? "✓ Completed"
                  : "Waiting"
              )
            ),

            completionStatus ===
            "Completed"
              ? React.createElement(
                  "div",
                  {
                    className:
                      "swap-completed-message"
                  },
                  "🎉 Swap Completed Successfully!"
                )

              : alreadyCompleted
              ? React.createElement(
                  "div",
                  {
                    className:
                      "swap-waiting-message"
                  },

                  React.createElement(
                    "strong",
                    null,
                    "✓ You Marked Completed"
                  ),

                  React.createElement(
                    "span",
                    null,
                    "Waiting for the other person..."
                  )
                )

              : React.createElement(
                  "button",
                  {
                    className:
                      "accept-btn swap-action-button",

                    onClick: function () {
                      completeLocalExchange(
                        request._id
                      );
                    },

                    disabled:
                      completeLoading ===
                      request._id
                  },

                  completeLoading ===
                  request._id
                    ? "Completing..."
                    : "📦 Mark as Completed"
                )
          )
        : null
    );
  }


  if (loading) {
    return React.createElement(
      "div",
      {
        className:
          "swap-requests-page"
      },

      React.createElement(
        "div",
        {
          className: "container"
        },

        React.createElement(
          "div",
          {
            className:
              "swap-loading"
          },
          "Loading swap requests..."
        )
      )
    );
  }

const activeRequests = requests.filter(function (request) {
  const deletedFor = Array.isArray(request.deletedFor)
    ? request.deletedFor.map(function (email) {
        return String(email).trim().toLowerCase();
      })
    : [];

  const isDeletedByCurrentUser =
    deletedFor.includes(currentUserEmail) ||
    (
      request.isDeleted === true &&
      String(request.deletedByEmail || "").trim().toLowerCase() ===
        currentUserEmail
    );

  const isCompleted =
    request.status === "Completed" ||
    request.completionStatus === "Completed" ||
    (
      request.ownerCompleted === true &&
      request.requesterCompleted === true
    );

  const isRejected =
    request.status === "Rejected" ||
    request.status === "Cancelled";

  return !isDeletedByCurrentUser && !isCompleted && !isRejected;
});

const historyRequests = requests.filter(function (request) {
  return !activeRequests.some(function (activeRequest) {
    return activeRequest._id === request._id;
  });
});

const visibleRequests =
  activeTab === "active" ? activeRequests : historyRequests;

if (visibleRequests.length === 0) {
      return React.createElement(
      "div",
      {
        className:
          "swap-requests-page"
      },

      React.createElement(
        "div",
        {
          className:
            "container"
        },

        React.createElement(
          "div",
          {
            className:
              "swap-requests-header"
          },

          React.createElement(
            "h1",
            null,
            "Swap Requests"
          ),

          React.createElement(
            "p",
            null,
            "Manage your clothing swap requests, negotiate and confirm your swaps."
          )
        ),
        React.createElement(
          "div",
          {
            className:
              "swap-request-card swap-empty-card"
          },

          React.createElement(
            "div",
            {
              className:
                "swap-empty-icon"
            },
            "🔄"
          ),

          React.createElement(
            "h3",
            null,
            activeTab === "active"
  ? "No Active Swap Requests"
  : "No Swap History Yet"
          ),

          React.createElement(
            "p",
            null,
            "Browse clothes and send your first swap request."
          ),

          React.createElement(
            Link,
            {
              to: "/browse",
              className:
                "swap-btn"
            },
            "Browse Clothes"
          )
        )
      )
    );
  }
  const requestCards = visibleRequests.map(function (request) {
     const isOwner =
  request.ownerEmail
    ? request.ownerEmail.toLowerCase() ===
      currentUserEmail.toLowerCase()
    : request.owner === currentUser;

const isRequester =
  request.requesterEmail
    ? request.requesterEmail.toLowerCase() ===
      currentUserEmail.toLowerCase()
    : request.requester === currentUser;

      
const isParticipant =
  isOwner || isRequester;

const shipment = shipments[String(request._id)] || null;

const isCourierCompleted =
  request.exchangeMethod === "Courier" &&
  (
    shipment?.status === "Delivered" ||
    request.completionStatus === "Completed"
  );

const isLocalExchangeCompleted =
  request.exchangeMethod === "Local Exchange" &&
  (
    request.completionStatus === "Completed" ||
    (
      request.ownerCompleted === true &&
      request.requesterCompleted === true
    )
  );

const isSwapCompleted =
  isCourierCompleted ||
  isLocalExchangeCompleted ||
  request.completionStatus === "Completed";

      const ownerAgreed =
        request.ownerAgreed === true;

      const requesterAgreed =
        request.requesterAgreed === true;

      const agreementStatus =
        request.agreementStatus ||
        "Not Started";

      const alreadyAgreed =
        (isOwner && ownerAgreed) ||
        (isRequester &&
          requesterAgreed);

      const actionButtons = [];


      if (
        isOwner &&
        request.status === "Pending"
      ) {
        actionButtons.push(
          React.createElement(
            "button",
            {
              key: "accept",

              className:
                "accept-btn swap-action-button",

              onClick: function () {
                updateStatus(
                  request._id,
                  "Accepted"
                );
              }
            },
            "✓ Accept"
          )
        );

        actionButtons.push(
          React.createElement(
            "button",
            {
              key: "reject",

              className:
                "reject-btn swap-action-button",

              onClick: function () {
                updateStatus(
                  request._id,
                  "Rejected"
                );
              }
            },
            "✕ Reject"
          )
        );
      }


      if (
        isParticipant &&
        request.status === "Accepted" &&
        agreementStatus !== "Confirmed" &&
        !alreadyAgreed
      ) {
        actionButtons.push(
          React.createElement(
            "button",
            {
              key: "agree",

              className:
                "accept-btn swap-action-button",

              onClick: function () {
                agreeToSwap(
                  request._id
                );
              },

              disabled:
                agreeLoading ===
                request._id
            },

            agreeLoading ===
            request._id
              ? "Agreeing..."
              : "✓ Agree to Swap"
          )
        );
      }


      if (
        isParticipant &&
        request.status === "Accepted" &&
        alreadyAgreed &&
        agreementStatus !== "Confirmed"
      ) {
        actionButtons.push(
          React.createElement(
            "button",
            {
              key:
                "already-agreed",

              className:
                "accept-btn swap-action-button",

              disabled: true
            },
            "✓ You Agreed"
          )
        );
      }


if (isParticipant && !isSwapCompleted) {
          actionButtons.push(
          React.createElement(
            Link,
            {
              key: "chat",

              to:
                "/chat?requestId=" +
                request._id,

              className:
                "swap-btn swap-action-button"
            },

            "💬 Chat / Negotiate"
          )
        );
      }
if (
  isParticipant &&
  (
    request.status === "Accepted" ||
    isSwapCompleted
  ) &&
  disputesLoaded &&
  !raisedDisputes.includes(String(request._id))
) {
  actionButtons.push(
    React.createElement(
      "button",
      {
        key: "raise-dispute",

        className:
          "reject-btn swap-action-button",

        disabled:
          disputeLoading === request._id,

        onClick: function () {
          raiseDispute(request);
        }
      },

      disputeLoading === request._id
        ? "Submitting..."
        : "⚠️ Raise Dispute"
    )
  );
}

if (
  isParticipant &&
  (
    request.status === "Accepted" ||
    isSwapCompleted
  ) &&
  disputesLoaded &&
  raisedDisputes.includes(String(request._id))
)
{
  actionButtons.push(
    React.createElement(
      "button",
      {
        key: "dispute-raised",
        className: "swap-action-button",
        disabled: true
      },
      "✓ Dispute Raised"
    )
  );
}

if (isParticipant) {
  actionButtons.push(
    React.createElement(
      "button",
      {
        key: "delete",

        className:
          "reject-btn swap-action-button",

        onClick: function () {
          deleteRequest(
            request._id
          );
        }
      },

      "🗑 Delete"
    )
  );
}

const agreementBox = isSwapCompleted ? null : createAgreementBox(
      request,
      isParticipant
    );

      return React.createElement(
        "div",
        {
          className:
            "swap-request-card",

          key: request._id
        },


        React.createElement(
          "div",
          {
            className:
              "swap-request-card-main"
          },


          React.createElement(
            "div",
            {
              className:
                "swap-request-image-wrapper"
            },

            React.createElement(
              "img",
              {
                src:
                  request.clothingImage ||
                  "https://via.placeholder.com/400x500?text=No+Image",

                alt:
                  request.clothingTitle ||
                  "Clothing",

                className:
                  "swap-request-image"
              }
            )
          ),


          React.createElement(
            "div",
            {
              className:
                "swap-request-information"
            },

            React.createElement(
              "div",
              {
                className:
                  "swap-request-heading-row"
              },

              React.createElement(
                "h2",
                {
                  className:
                    "swap-request-title"
                },

                request.clothingTitle ||
                  "Clothing Item"
              ),

              React.createElement(
                "span",
                {
                  className:
                    getStatusClass(isSwapCompleted ? "Completed" : request.status)
                },

              isSwapCompleted
  ? "Completed"
  : request.status || "Pending"
              )
            ),


            React.createElement(
              "div",
              {
                className:
                  "swap-request-details-grid"
              },

              React.createElement(
                "div",
                {
                  className:
                    "swap-detail-item"
                },

                React.createElement(
                  "span",
                  {
                    className:
                      "swap-detail-label"
                  },

                  "👤 Owner"
                ),

                React.createElement(
                  "strong",
                  null,

                  request.owner ||
                    "Unknown"
                )
              ),

              React.createElement(
                "div",
                {
                  className:
                    "swap-detail-item"
                },

                React.createElement(
                  "span",
                  {
                    className:
                      "swap-detail-label"
                  },

                  "🙋 Requester"
                ),

                React.createElement(
                  "strong",
                  null,

                  request.requester ||
                    "Unknown"
                )
              )
            ),

          request.exchangeMethod === "Courier" && !isSwapCompleted
  ?React.createElement(CourierTracking, {
  request: request,
  shipment: shipments[request._id] || null,
  isAdmin: isAdmin,
  onShipmentUpdate: function (updatedShipment) {
    setShipments(function (previous) {
      return {
        ...previous,
        [request._id]: updatedShipment
      };
    });
  }
})
  : null,

            request.message
              ? React.createElement(
                  "div",
                  {
                    className:
                      "swap-request-message"
                  },

                  React.createElement(
                    "span",
                    {
                      className:
                        "swap-detail-label"
                    },

                    "💬 Message"
                  ),

                  React.createElement(
                    "p",
                    null,

                    request.message
                  )
                )
              : null,


            agreementBox,

            actionButtons.length > 0
              ? React.createElement(
                  "div",
                  {
                    className:
                      "swap-request-actions"
                  },

                  actionButtons
                )
              : null
          )
        )
      );
    }
  );

  return React.createElement(
    "div",
    {
      className:
        "swap-requests-page"
    },

    React.createElement(
      "div",
      {
        className:
          "container"
      },

      React.createElement(
        "div",
        {
          className:
            "swap-requests-header"
        },

        React.createElement(
          "h1",
          null,
          "Swap Requests"
        ),

        React.createElement(
          "p",
          null,
          "Manage your clothing swap requests, negotiate and confirm your swaps."
        )
      ),
React.createElement(
  "div",
  {
    className: "swap-request-tabs"
  },

  React.createElement(
    "button",
    {
      type: "button",
      className:
        activeTab === "active" ? "active" : "",
      onClick: function () {
        setActiveTab("active");
      }
    },
    "Active Requests (" + activeRequests.length + ")"
  ),

  React.createElement(
    "button",
    {
      type: "button",
      className:
        activeTab === "history" ? "active" : "",
      onClick: function () {
        setActiveTab("history");
      }
    },
    "Swap History (" + historyRequests.length + ")"
  
),  
),
      React.createElement(
        "div",
        {
          className:
            "swap-requests-list"
        },

        requestCards
      )
    )
  );
}

export default SwapRequests;