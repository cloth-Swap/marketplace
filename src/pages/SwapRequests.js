import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function SwapRequests() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agreeLoading, setAgreeLoading] = useState(null);
  const [completeLoading, setCompleteLoading] = useState(null);
  const [localExchangeForm, setLocalExchangeForm] = useState({});
  const [localExchangeLoading, setLocalExchangeLoading] = useState(null);
  const [shipments, setShipments] = useState({});

  const currentUser =
    localStorage.getItem("clothSwapUserName") ||
    localStorage.getItem("clothswapUserName") ||
    "ClothSwap User";
    const currentUserEmail =
  localStorage.getItem("clothswapUserEmail") ||
  localStorage.getItem("clothswapEmail") ||
  "";

  useEffect(function () {
    fetchRequests();
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

  /* =====================================================
     FETCH SWAP REQUESTS
  ===================================================== */

  async function fetchRequests() {
    try {
      setLoading(true);

const response = await fetch(
  "http://localhost:5000/api/swap-requests" +
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
        setRequests([]);
      }
    } catch (error) {
      console.error("Failed to fetch swap requests:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }
  /* =====================================================
     FETCH COURIER SHIPMENTS
  ===================================================== */

  async function fetchShipments() {
    try {
      const response = await fetch(
        "http://localhost:5000/api/shipments"
      );

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
  /* =====================================================
     FIND USER EMAIL
     -----------------------------------------------------
     owner/requester are usernames in SwapRequest.
     Notifications page uses email as recipient.
  ===================================================== */

  async function findUserEmail(username) {
    if (!username) {
      return "";
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/admin/users"
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

  /* =====================================================
     SEND NOTIFICATION
  ===================================================== */

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
        "http://localhost:5000/api/notifications",
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

  /* =====================================================
     GET OTHER PARTICIPANT
  ===================================================== */

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

  /* Fallback for old requests */

  if (request.owner === currentUser) {
    return request.requester || "";
  }

  if (request.requester === currentUser) {
    return request.owner || "";
  }

  return "";
}
  /* =====================================================
     UPDATE STATUS
  ===================================================== */

  async function updateStatus(id, status) {
    try {
      const request = requests.find(function (item) {
        return item._id === id;
      });

      const response = await fetch(
        "http://localhost:5000/api/swap-requests/" + id,
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

  /* =====================================================
     AGREE TO SWAP
  ===================================================== */

  async function agreeToSwap(id) {
    try {
      setAgreeLoading(id);

      const request =
        requests.find(function (item) {
          return item._id === id;
        });

      const response = await fetch(
        "http://localhost:5000/api/swap-requests/" +
          id +
          "/agree",
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

  /* =====================================================
     COMPLETE SWAP
  ===================================================== */

  async function completeSwap(id) {
    try {
      setCompleteLoading(id);

      const request =
        requests.find(function (item) {
          return item._id === id;
        });

      const response = await fetch(
        "http://localhost:5000/api/swap-requests/" +
          id +
          "/complete",
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

  /* =====================================================
     DELETE REQUEST
  ===================================================== */

  async function deleteRequest(id) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this swap request?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/swap-requests/" +
          id,
        {
          method: "DELETE"
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
        return previous.filter(function (item) {
          return item._id !== id;
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

  /* =====================================================
     SAVE LOCAL EXCHANGE
  ===================================================== */

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

      const response = await fetch(
        "http://localhost:5000/api/swap-requests/" +
          id +
          "/local-exchange",
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

  /* =====================================================
     COMPLETE LOCAL EXCHANGE
  ===================================================== */

  async function completeLocalExchange(id) {
    try {
      setCompleteLoading(id);

      const request =
        requests.find(function (item) {
          return item._id === id;
        });

      const response = await fetch(
        "http://localhost:5000/api/swap-requests/" +
          id +
          "/local-exchange/complete",
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

  /* =====================================================
     SELECT EXCHANGE METHOD
  ===================================================== */

  async function selectExchangeMethod(id, method) {
    if (method !== "Local Exchange") {
      return;
    }

    setRequests(function (previous) {
      return previous.map(function (item) {
        if (item._id === id) {
          return {
            ...item,
            exchangeMethod: "Local Exchange"
          };
        }

        return item;
      });
    });

    const request = requests.find(function (item) {
      return item._id === id;
    });

    if (request) {
  const otherParticipant =
    getOtherParticipant(request);

  await sendSwapNotification(
    request,
    otherParticipant,
    "Exchange Method Selected",
    currentUser +
      " selected Local Exchange for \"" +
      (request.clothingTitle ||
        "your clothing swap") +
      "\".",
    "exchange_method_selected"
  );
}

    setLocalExchangeForm(function (previous) {
      return {
        ...previous,
        [id]: {
          meetingLocation:
            request?.meetingLocation || "",
          meetingDate:
            request?.meetingDate || "",
          meetingTime:
            request?.meetingTime || "",
          meetingNotes:
            request?.meetingNotes || ""
        }
      };
    });
  }

  /* =====================================================
     STATUS CLASS
  ===================================================== */

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

  /* =====================================================
     AGREEMENT BOX
  ===================================================== */

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

      /* ================= EXCHANGE METHOD ================= */

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
                    navigate(
                      "/courier-delivery?requestId=" +
                        request._id
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

      /* ================= LOCAL EXCHANGE FORM ================= */

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
              "input",
              {
                type: "time",

                value:
                  localExchangeData.meetingTime,

                onChange: function (event) {
                  setLocalExchangeForm(
                    function (previous) {
                      return {
                        ...previous,
                        [request._id]: {
                          ...previous[
                            request._id
                          ],
                          meetingTime:
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

      /* ================= COMPLETION ================= */

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

  /* =====================================================
     LOADING
  ===================================================== */

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

  /* =====================================================
     EMPTY
  ===================================================== */

  if (requests.length === 0) {
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
            "No Swap Requests Yet"
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

  /* =====================================================
     REQUEST CARDS
  ===================================================== */

  const requestCards = requests.map(
    function (request) {
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

      /* ================= OWNER ACTIONS ================= */

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

      /* ================= AGREE ================= */

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

      /* ================= ALREADY AGREED ================= */

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

      /* ================= CHAT ================= */

      if (isParticipant) {
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

      /* ================= DELETE ================= */

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

      const agreementBox =
        createAgreementBox(
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

        /* ================= CARD TOP ================= */

        React.createElement(
          "div",
          {
            className:
              "swap-request-card-main"
          },

          /* ================= IMAGE ================= */

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

          /* ================= INFORMATION ================= */

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
                    getStatusClass(
                      request.status
                    )
                },

                request.status ||
                  "Pending"
              )
            ),

            /* ================= DETAILS ================= */

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
                        /* ================= COURIER STATUS ================= */

            shipments[request._id]
              ? React.createElement(
                  "div",
                  {
                    className:
                      "swap-request-message",
                    style: {
                      marginTop: "15px"
                    }
                  },

                  React.createElement(
                    "span",
                    {
                      className:
                        "swap-detail-label"
                    },
                    "🚚 Courier Status"
                  ),

                  React.createElement(
                    "p",
                    null,
                    "Current Status: " +
                      (
                        shipments[request._id].status ||
                        "Courier Requested"
                      )
                  ),

                  React.createElement(
                    "p",
                    null,
                    "Tracking ID: " +
                      (
                        shipments[request._id].trackingId ||
                        "Not available"
                      )
                  )
                )
              : null,

            /* ================= MESSAGE ================= */

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

            /* ================= AGREEMENT ================= */

            agreementBox,

            /* ================= ACTIONS ================= */

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

  /* =====================================================
     MAIN PAGE
  ===================================================== */

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
            "swap-requests-list"
        },

        requestCards
      )
    )
  );
}

export default SwapRequests;