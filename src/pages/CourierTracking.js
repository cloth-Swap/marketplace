
import React, { useEffect, useState } from "react";
import API_URL from "../api.js";
import "./CourierTracking.css";

function CourierTracking({ request, shipment: initialShipment, onShipmentUpdate }) {
  const [shipment, setShipment] = useState(initialShipment || null);
  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [packageWeight, setPackageWeight] = useState("1");
  const [courierName, setCourierName] = useState("ClothSwap Courier");
  const [pickupDate, setPickupDate] = useState("");
  const [arranging, setArranging] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const token =
    localStorage.getItem("clothswapToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("jwtToken") ||
    "";

  function updateLocalShipment(updated) {
    setShipment(updated);

    if (onShipmentUpdate) {
      onShipmentUpdate(updated);
    }
  }

  useEffect(function () {
    setShipment(initialShipment || null);
  }, [initialShipment]);

  async function loadShipment() {
    try {
      const response = await fetch(
        `${API_URL}/api/shipments/${request._id}`
      );

      const data = await response.json();

      if (response.ok && data.shipment) {
        updateLocalShipment(data.shipment);
      }
    } catch (error) {
      console.error("Shipment loading error:", error);
    }
  }

  useEffect(function () {
    loadShipment();

    const timer = setInterval(loadShipment, 5000);

    return function () {
      clearInterval(timer);
    };
  }, [request._id]);

  async function arrangeCourier() {
    if (
      !pickupAddress.trim() ||
      !deliveryAddress.trim() ||
      !pickupDate
    ) {
      alert("Please fill Pickup Address, Delivery Address and Pickup Date.");
      return;
    }

    if (
      request.status !== "Accepted" ||
      request.agreementStatus !== "Confirmed"
    ) {
      alert("Both users must confirm the swap first.");
      return;
    }

    try {
      setArranging(true);

      const response = await fetch(
        `${API_URL}/api/shipments/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            swapRequestId: request._id,
            sender: request.owner,
            receiver: request.requester,
            pickupAddress: pickupAddress.trim(),
            deliveryAddress: deliveryAddress.trim(),
            packageWeight: Number(packageWeight) || 1,
            courierName,
            pickupDate,
            clothingTitle: request.clothingTitle || "Clothing Item",
            shippingCost: 0
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to arrange courier.");
        return;
      }

      updateLocalShipment(data.shipment);

      const email = (
        localStorage.getItem("clothswapUserEmail") ||
        localStorage.getItem("clothswapEmail") ||
        ""
      ).toLowerCase();

      const recipient =
        String(request.ownerEmail || "").toLowerCase() === email
          ? request.requesterEmail
          : request.ownerEmail;

      const senderName =
        localStorage.getItem("clothSwapUserName") ||
        localStorage.getItem("clothswapUserName") ||
        "ClothSwap User";

      if (recipient) {
        await fetch(`${API_URL}/api/notifications`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            recipient,
            sender: email,
            senderName,
            type: "courier_arranged",
            title: "Courier Arranged",
            message:
              senderName +
              " arranged courier delivery. Tracking ID: " +
              data.shipment.trackingId,
            relatedId: request._id,
            isRead: false
          })
        });

        window.dispatchEvent(new Event("notificationsUpdated"));
      }

      alert("Courier arranged successfully!");
    } catch (error) {
      console.error("Arrange courier error:", error);
      alert("Something went wrong while arranging courier.");
    } finally {
      setArranging(false);
    }
  }

  async function getReceiverOtp() {
    if (!shipment || shipment.status !== "Out for Delivery") {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/shipments/${shipment._id}/receiver-otp`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setOtp(String(data.otp || ""));
      }
    } catch (error) {
      console.error("Get OTP error:", error);
    }
  }

  useEffect(function () {
    if (shipment && shipment.status === "Out for Delivery") {
      getReceiverOtp();
    } else {
      setOtp("");
    }
  }, [shipment && shipment.status, shipment && shipment._id]);

  async function verifyOtp() {
    if (!shipment || otp.length !== 6) {
      alert("Please enter the 6-digit OTP.");
      return;
    }

    try {
      setVerifyingOtp(true);

      const response = await fetch(
        `${API_URL}/api/shipments/${shipment._id}/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            otp,
            trackingId: shipment.trackingId
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Invalid OTP. Please try again.");
        return;
      }

      updateLocalShipment(data.shipment);
      setOtp("");

      alert("OTP verified successfully. Please confirm delivery.");
    } catch (error) {
      console.error("OTP verification error:", error);
      alert("Something went wrong while verifying OTP.");
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function confirmDelivery() {
    if (!shipment || !token) {
      alert("Please login first.");
      return;
    }

    try {
      setVerifyingOtp(true);

      const response = await fetch(
        `${API_URL}/api/shipments/${shipment._id}/deliver`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Delivery confirmation failed.");
        return;
      }

      updateLocalShipment(data.shipment);

      alert("Delivery confirmed successfully!");
    } catch (error) {
      console.error("Delivery confirmation error:", error);
      alert("Something went wrong while confirming delivery.");
    } finally {
      setVerifyingOtp(false);
    }
  }

  const statusAliases = {
    "Courier Requested": 0,
    "Pending": 0,
    "Pickup Scheduled": 0,
    "Picked Up": 1,
    "In Transit": 2,
    "Out for Delivery": 3,
    "Arrived": 4,
    "OTP Verified": 4,
    "Delivered": 4
  };

  const currentStep = shipment
    ? (
        statusAliases[shipment.status] === undefined
          ? 0
          : statusAliases[shipment.status]
      )
    : 0;

  const stages = [
    "Pickup",
    "Picked Up",
    "In Transit",
    "Out for Delivery",
    shipment && shipment.status === "Delivered"
      ? "Delivered"
      : "Arrived"
  ];

  return React.createElement(
    "section",
    { className: "cs-tracking-card" },

    !shipment
      ? React.createElement(
          React.Fragment,
          null,

          React.createElement("div", {
            className: "cs-courier-heading"
          },
            React.createElement("span", {
              className: "cs-courier-icon"
            }, "🚚"),

            React.createElement("div", null,
              React.createElement("h3", null, "Arrange Courier"),
              React.createElement("p", null,
                "Enter shipment details to start tracking this swap."
              )
            )
          ),

          React.createElement("div", {
            className: "cs-courier-form-grid"
          },

            React.createElement("label", {
              className: "cs-courier-field cs-courier-field-wide"
            },
              "Pickup Address",

              React.createElement("textarea", {
                value: pickupAddress,
                placeholder: "Enter pickup address",
                onChange: function (event) {
                  setPickupAddress(event.target.value);
                }
              })
            ),

            React.createElement("label", {
              className: "cs-courier-field cs-courier-field-wide"
            },
              "Delivery Address",

              React.createElement("textarea", {
                value: deliveryAddress,
                placeholder: "Enter delivery address",
                onChange: function (event) {
                  setDeliveryAddress(event.target.value);
                }
              })
            ),

            React.createElement("label", {
              className: "cs-courier-field"
            },
              "Package Weight (kg)",

              React.createElement("input", {
                type: "number",
                min: "0.1",
                step: "0.1",
                value: packageWeight,
                onChange: function (event) {
                  setPackageWeight(event.target.value);
                }
              })
            ),

            React.createElement("label", {
              className: "cs-courier-field"
            },
              "Courier Service",

              React.createElement("select", {
                value: courierName,
                onChange: function (event) {
                  setCourierName(event.target.value);
                }
              },
                React.createElement("option", {
                  value: "ClothSwap Courier"
                }, "ClothSwap Courier"),

                React.createElement("option", {
                  value: "Professional Courier"
                }, "Professional Courier"),

                React.createElement("option", {
                  value: "Express Delivery"
                }, "Express Delivery"),

                React.createElement("option", {
                  value: "Pickup Scheduled"
                }, "Pickup Scheduled")
              )
            ),

            React.createElement("label", {
              className: "cs-courier-field"
            },
              "Pickup Date",

              React.createElement("input", {
                type: "date",
                value: pickupDate,
                min: new Date().toISOString().split("T")[0],
                onChange: function (event) {
                  setPickupDate(event.target.value);
                }
              })
            )
          ),

          React.createElement("div", {
            className: "cs-courier-secure-note"
          },
            "🔐 Secure delivery: receiver OTP confirms parcel handover after arrival."
          ),

          React.createElement("button", {
            type: "button",
            className: "cs-courier-primary-btn",
            onClick: arrangeCourier,
            disabled: arranging
          },
            arranging ? "Arranging Courier..." : "🚚 Arrange Courier"
          )
        )

      : React.createElement(
          React.Fragment,
          null,

          React.createElement("div", {
            className: "cs-tracking-topline"
          },
            React.createElement("div", null,
              React.createElement("span", {
                className: "cs-tracking-eyebrow"
              }, "CLOTHSWAP DELIVERY"),

              React.createElement("h3", null, "📦 Shipment Tracking")
            ),

            React.createElement("span", {
              className: "cs-tracking-status-badge"
            }, shipment.status || "Courier Requested")
          ),

          React.createElement("div", {
            className: "cs-tracking-id-row"
          },

            React.createElement("div", null,
              React.createElement("span", null, "TRACKING ID"),
              React.createElement("strong", null,
                shipment.trackingId || "Not available"
              )
            ),

            React.createElement("div", null,
              React.createElement("span", null, "COURIER PARTNER"),
              React.createElement("strong", null,
                shipment.courierName || "ClothSwap Courier"
              )
            ),

            React.createElement("div", null,
              React.createElement("span", null, "PICKUP DATE"),
              React.createElement("strong", null,
                shipment.pickupDate
                  ? new Date(shipment.pickupDate).toLocaleDateString()
                  : "Not specified"
              )
            ),

            React.createElement("button", {
              type: "button",
              onClick: function () {
                if (shipment.trackingId && navigator.clipboard) {
                  navigator.clipboard.writeText(shipment.trackingId)
                    .then(function () {
                      alert("Tracking ID copied.");
                    })
                    .catch(function () {
                      alert("Unable to copy Tracking ID.");
                    });
                }
              }
            }, "Copy ID")
          ),

          React.createElement("div", {
            className: "cs-tracking-progress"
          },

            React.createElement("div", {
              className: "cs-tracking-progress-line"
            },
              React.createElement("div", {
                className: "cs-tracking-progress-fill",
                style: {
                  width:
                    (currentStep / (stages.length - 1) * 100) + "%"
                }
              })
            ),

            stages.map(function (stage, index) {
              const completed = index < currentStep;
              const active = index === currentStep;

              return React.createElement("div", {
                className:
                  "cs-tracking-step " +
                  (completed ? "is-complete " : "") +
                  (active ? "is-current" : ""),
                key: stage
              },

                React.createElement("span", {
                  className: "cs-tracking-step-dot"
                },
                  completed || (
                    active && shipment.status === "Delivered"
                  )
                    ? "✓"
                    : String(index + 1)
                ),

                React.createElement("small", null, stage)
              );
            })
          ),

          React.createElement("div", {
            className: "cs-shipment-details-section"
          },

            React.createElement("h4", null, "Shipment Details"),

            React.createElement("div", {
              className: "cs-shipment-details-grid"
            },

              React.createElement("div", null,
                React.createElement("span", null, "📦 Clothing"),
                React.createElement("strong", null,
                  shipment.clothingTitle ||
                  request.clothingTitle ||
                  "Clothing Item"
                )
              ),

              React.createElement("div", null,
                React.createElement("span", null, "⚖️ Weight"),
                React.createElement("strong", null,
                  (shipment.packageWeight || 1) + " kg"
                )
              ),

              React.createElement("div", null,
                React.createElement("span", null, "📍 Pickup"),
                React.createElement("strong", null,
                  shipment.pickupAddress || "Not provided"
                )
              ),

              React.createElement("div", null,
                React.createElement("span", null, "🏠 Delivery"),
                React.createElement("strong", null,
                  shipment.deliveryAddress || "Not provided"
                )
              )
            )
          ),

          shipment.status === "Out for Delivery"
            ? React.createElement("div", {
                className: "cs-otp-panel"
              },

                React.createElement("div", null,
                  React.createElement("span", null, "SECURE DELIVERY OTP"),
                  React.createElement("strong", null,
                    otp || "Loading OTP..."
                  )
                ),

                React.createElement("p", null,
                  "Use this OTP to confirm that the parcel has been handed over."
                ),

                React.createElement("button", {
                  type: "button",
                  onClick: verifyOtp,
                  disabled: verifyingOtp || otp.length !== 6
                },
                  verifyingOtp ? "Verifying..." : "✓ Verify OTP"
                )
              )
            : null,

          shipment.status === "Arrived"
            ? React.createElement("div", {
                className: "cs-otp-panel"
              },

                React.createElement("div", null,
                  React.createElement("span", null, "OTP VERIFIED"),
                  React.createElement("strong", null, "✓ Parcel arrived")
                ),

                React.createElement("p", null,
                  "OTP verified successfully. Confirm delivery after receiving the parcel."
                ),

                React.createElement("button", {
                  type: "button",
                  onClick: confirmDelivery,
                  disabled: verifyingOtp
                },
                  verifyingOtp ? "Confirming..." : "✓ Confirm Delivery"
                )
              )
            : null,

          shipment.status === "Delivered"
            ? React.createElement("div", {
                className: "cs-delivery-done"
              }, "✓ Parcel delivery confirmed")
            : null
        )
  );
}

export default CourierTracking;
