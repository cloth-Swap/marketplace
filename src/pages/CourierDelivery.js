import React, { useEffect, useState } from "react";
import API_URL from "../api";

function CourierDelivery() {
  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [packageWeight, setPackageWeight] = useState("1");
  const [courierName, setCourierName] =
    useState("ClothSwap Courier");
  const [pickupDate, setPickupDate] = useState("");
  const [shipment, setShipment] = useState(null);
  const [arranging, setArranging] = useState(false);
useEffect(() => {
  async function loadExistingShipment() {
    const params = new URLSearchParams(window.location.search);
    const requestId = params.get("requestId");

    if (!requestId) return;

    try {
      const response = await fetch(
        `${API_URL}/api/shipments/${requestId}`
      );

      const data = await response.json();

      if (response.ok && data.shipment) {
        setShipment(data.shipment);
      }
    } catch (error) {
      console.error("Load Shipment Error:", error);
    }
  }

  loadExistingShipment();
}, []);

  const [otp, setOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] =
  useState(false);

async function getReceiverOtp() {
  if (!shipment) {
    return;
  }

  try {
    const token =
      localStorage.getItem("clothswapToken")

    if (!token) {
      alert("Please login again. Login token not found.");
      return;
    }

    const response = await fetch(
      `${API_URL}/api/shipments/${shipment._id}/receiver-otp`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(
        data.message || "OTP is not available yet."
      );
      return;
    }

    setOtp(String(data.otp));
  } catch (error) {
    console.error("Get Receiver OTP Error:", error);

    alert(
      "Something went wrong while getting OTP."
    );
  }
}
 useEffect(function () {
    if (
      shipment &&
      shipment.status === "Arrived"
    ) {
      getReceiverOtp();
    }
  }, [shipment && shipment.status]);

  async function verifyOtp() {
  if (!shipment) {
    return;
  }

  if (!otp || otp.length !== 6) {
    alert("Please enter the 6-digit OTP.");
    return;
  }

  try {
    setVerifyingOtp(true);

    const response = await fetch(
     `${API_URL}/api/shipments/` +
  shipment._id +
  "/verify-otp",
      {
        method: "POST",
       
headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("jwtToken") ||
    ""
  }`
},

       
        body: JSON.stringify({
          otp: otp,
          trackingId: shipment.trackingId
        })

      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(
        data.message ||
          "Invalid OTP. Please try again."
      );
      return;
    }

    setShipment(data.shipment);
    setOtp("");


    const deliveryUserEmail =
      localStorage.getItem("clothswapUserEmail") ||
      localStorage.getItem("clothswapEmail") ||
      "";

    const deliveryUserName =
      localStorage.getItem("clothSwapUserName") ||
      localStorage.getItem("clothswapUserName") ||
      "ClothSwap User";

    const requestResponse = await fetch(
      `${API_URL}/api/swap-requests/` +
  data.shipment.swapRequestId
    );

    const requestData =
      await requestResponse.json();

    const deliverySwapRequest =
      requestData.request ||
      requestData;

    const deliveryRecipientEmail =
      deliverySwapRequest.requesterEmail &&
      deliverySwapRequest.requesterEmail.toLowerCase() ===
        deliveryUserEmail.toLowerCase()
        ? deliverySwapRequest.ownerEmail
        : deliverySwapRequest.requesterEmail;

    if (deliveryRecipientEmail) {
      await fetch(
`${API_URL}/api/notifications`,        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            recipient:
              deliveryRecipientEmail,

            sender:
              deliveryUserEmail,

            senderName:
              deliveryUserName,

            type:
              "delivery_confirmed",

            title:
              "Delivery Confirmed",

            message:
              deliveryUserName +
              " confirmed the delivery successfully.",

            relatedId:
              data.shipment.swapRequestId,

            isRead:
              false
          })
        }
      );

      window.dispatchEvent(
        new Event(
          "notificationsUpdated"
        )
      );
    }

    alert(
      "✅ Delivery confirmed successfully!"
    );

  } catch (error) {
    console.error(
      "OTP Verification Error:",
      error
    );

    alert(
      "Something went wrong while verifying OTP."
    );

  } finally {
    setVerifyingOtp(false);
  }
}

  async function arrangeCourier() {
    if (
      !pickupAddress.trim() ||
      !deliveryAddress.trim() ||
      !pickupDate
    ) {
      alert(
        "Please fill Pickup Address, Delivery Address and Pickup Date."
      );
      return;
    }

    try {
      setArranging(true);

      const params =
        new URLSearchParams(
          window.location.search
        );

      const requestId =
        params.get("requestId");

      if (!requestId) {
        alert(
          "Swap request information is missing."
        );
        setArranging(false);
        return;
      }
      const requestResponse =
  await fetch(
   `${API_URL}/api/swap-requests/` +
  requestId
  );

const requestData =
  await requestResponse.json();

if (!requestResponse.ok) {
  alert(
    requestData.message ||
      "Unable to load swap request."
  );
  setArranging(false);
  return;
}

const request =
  requestData.request ||
  requestData;

if (!request || !request._id) {
  alert(
    "Swap request not found."
  );
  setArranging(false);
  return;
}      

      if (
        request.status !== "Accepted" ||
        request.agreementStatus !==
          "Confirmed"
      ) {
        alert(
          "Courier can be arranged only after the swap is confirmed."
        );

        setArranging(false);
        return;
      }
      const shipmentResponse =
        await fetch(
          `${API_URL}/api/shipments/`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              swapRequestId:
                request._id,

              sender:
                request.owner,

              receiver:
                request.requester,

              pickupAddress:
                pickupAddress.trim(),

              deliveryAddress:
                deliveryAddress.trim(),

              packageWeight:
                Number(packageWeight) || 1,

              courierName:
                courierName ||
                "ClothSwap Courier",

              pickupDate:
                pickupDate,

              clothingTitle:
                request.clothingTitle ||
                "Clothing Item",

              shippingCost: 0
            })
          }
        );

      const shipmentData =
        await shipmentResponse.json();

      if (!shipmentResponse.ok) {
        alert(
          shipmentData.message ||
            "Failed to arrange courier."
        );

        setArranging(false);
        return;
      }

      /*
      ================= SUCCESS =================
      */

      setShipment(
        shipmentData.shipment
      );
const courierUserEmail =
        localStorage.getItem("clothswapUserEmail") ||
        localStorage.getItem("clothswapEmail") ||
        "";

      const recipientEmail =
        request.ownerEmail &&
        request.ownerEmail.toLowerCase() ===
          courierUserEmail.toLowerCase()
          ? request.requesterEmail
          : request.ownerEmail;

      const senderName =
        localStorage.getItem("clothSwapUserName") ||
        localStorage.getItem("clothswapUserName") ||
        "ClothSwap User";

      if (recipientEmail) {
        await fetch(
          `${API_URL}/api/notifications`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              recipient:
                recipientEmail,

              sender:
                courierUserEmail,

              senderName:
                senderName,

              type:
                "courier_arranged",

              title:
                "Courier Arranged",

              message:
                senderName +
                " arranged courier delivery for \"" +
                (request.clothingTitle ||
                  "your clothing swap") +
                "\". Tracking ID: " +
                shipmentData.shipment.trackingId +
                ".",

              relatedId:
                request._id,

              isRead:
                false
            })
          }
        );

        window.dispatchEvent(
          new Event(
            "notificationsUpdated"
          )
        );
      }

      alert(
        "🚚 Courier arranged successfully!\n\n" +
          "Tracking ID: " +
          shipmentData.shipment
            .trackingId
      );

      console.log(
        "Shipment Created:",
        shipmentData.shipment
      );

    } catch (error) {

      console.error(
        "Arrange Courier Error:",
        error
      );

      alert(
        "Something went wrong while arranging courier."
      );

    } finally {
      setArranging(false);
    }
  }

 

  async function updateShipmentStatus(
    status
  ) {

    if (!shipment) {
      return;
    }

    try {

      const response =
        await fetch(
         `${API_URL}/api/shipments/` +
  shipment._id +
  "/status",
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              status: status
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        alert(
          data.message ||
            "Failed to update shipment status."
        );

        return;
      }

      setShipment(data.shipment);
const statusUserEmail =
        localStorage.getItem("clothswapUserEmail") ||
        localStorage.getItem("clothswapEmail") ||
        "";

      const statusUserName =
        localStorage.getItem("clothSwapUserName") ||
        localStorage.getItem("clothswapUserName") ||
        "ClothSwap User";

      const requestResponse =
        await fetch(
          `${API_URL}/api/swap-requests/` +
  data.shipment.swapRequestId
        );

      const requestData =
        await requestResponse.json();

      const swapRequest =
        requestData.request ||
        requestData;

      const statusRecipientEmail =
        swapRequest.ownerEmail &&
        swapRequest.ownerEmail.toLowerCase() ===
          statusUserEmail.toLowerCase()
          ? swapRequest.requesterEmail
          : swapRequest.ownerEmail;

      if (statusRecipientEmail) {

        await fetch(
          `${API_URL}/api/notifications`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              recipient:
                statusRecipientEmail,

              sender:
                statusUserEmail,

              senderName:
                statusUserName,

              type:
                "shipment_status",

              title:
                "Shipment Status Updated",

              message:
                "Shipment status changed to \"" +
                status +
                "\".",

              relatedId:
                data.shipment.swapRequestId,

              isRead:
                false
            })
          }
        );

        window.dispatchEvent(
          new Event(
            "notificationsUpdated"
          )
        );
      }

    } catch (error) {

      console.error(
        "Shipment Status Error:",
        error
      );

      alert(
        "Something went wrong while updating shipment status."
      );
    }
  }

  /*
  ============================================================
  PAGE
  ============================================================
  */

  return React.createElement(
    "div",
    {
      className:
        "courier-delivery-page"
    },

    React.createElement(
      "div",
      {
        className: "container"
      },

      /*
      ================= HEADER =================
      */

      React.createElement(
        "div",
        {
          className:
            "courier-page-header"
        },

        React.createElement(
          "h1",
          null,
          "🚚 Courier Delivery"
        ),

        React.createElement(
          "p",
          null,
          "Arrange a secure courier delivery for your confirmed clothing swap."
        )
      ),

      /*
      ================= FORM CARD =================
      */

      React.createElement(
        "div",
        {
          className:
            "courier-form-card"
        },

        React.createElement(
          "h2",
          null,
          "📦 Shipment Details"
        ),

        React.createElement(
          "div",
          {
            className:
              "courier-form-grid"
          },

          /*
          -------- PICKUP ADDRESS --------
          */

          React.createElement(
            "div",
            {
              className:
                "courier-form-group"
            },

            React.createElement(
              "label",
              null,
              "Pickup Address"
            ),

            React.createElement(
              "textarea",
              {
                value:
                  pickupAddress,

                onChange:
                  function (event) {
                    setPickupAddress(
                      event.target.value
                    );
                  },

                placeholder:
                  "Enter pickup address"
              }
            )
          ),

          /*
          -------- DELIVERY ADDRESS --------
          */

          React.createElement(
            "div",
            {
              className:
                "courier-form-group"
            },

            React.createElement(
              "label",
              null,
              "Delivery Address"
            ),

            React.createElement(
              "textarea",
              {
                value:
                  deliveryAddress,

                onChange:
                  function (event) {
                    setDeliveryAddress(
                      event.target.value
                    );
                  },

                placeholder:
                  "Enter delivery address"
              }
            )
          ),

          /*
          -------- PACKAGE WEIGHT --------
          */

          React.createElement(
            "div",
            {
              className:
                "courier-form-group"
            },

            React.createElement(
              "label",
              null,
              "Package Weight (kg)"
            ),

            React.createElement(
              "input",
              {
                type: "number",

                min: "0.1",

                step: "0.1",

                value:
                  packageWeight,

                onChange:
                  function (event) {
                    setPackageWeight(
                      event.target.value
                    );
                  }
              }
            )
          ),

          /*
          -------- COURIER SERVICE --------
          */

          React.createElement(
            "div",
            {
              className:
                "courier-form-group"
            },

            React.createElement(
              "label",
              null,
              "Courier Service"
            ),

            React.createElement(
              "select",
              {
                value:
                  courierName,

                onChange:
                  function (event) {
                    setCourierName(
                      event.target.value
                    );
                  }
              },

              React.createElement(
                "option",
                {
                  value:
                    "ClothSwap Courier"
                },
                "ClothSwap Courier"
              ),

              React.createElement(
                "option",
                {
                  value:
                    "Professional Courier"
                },
                "Professional Courier"
              ),

              React.createElement(
                "option",
                {
                  value:
                    "Express Delivery"
                },
                "Express Delivery"
              )
            )
          ),

          /*
          -------- PICKUP DATE --------
          */

          React.createElement(
            "div",
            {
              className:
                "courier-form-group"
            },

            React.createElement(
              "label",
              null,
              "Pickup Date"
            ),

            React.createElement(
              "input",
              {
                type: "date",

                value:
                  pickupDate,

                onChange:
                  function (event) {
                    setPickupDate(
                      event.target.value
                    );
                  }
              }
            )
          )
        ),

        /*
        ================= SECURE DELIVERY INFO =================
        */

        React.createElement(
          "div",
          {
            className:
              "courier-info-box"
          },

          React.createElement(
            "strong",
            null,
            "🔐 Secure Delivery"
          ),

          React.createElement(
            "p",
            null,
            "The receiver will receive a secure OTP after the parcel arrives. The delivery person will enter that OTP to confirm the handover."
          )
        ),

        /*
        ================= ARRANGE BUTTON =================
        */

        React.createElement(
          "button",
          {
            className:
              "courier-arrange-button",

            onClick:
              arrangeCourier,

            disabled:
              arranging
          },

          arranging
            ? "Arranging Courier..."
            : "🚚 Arrange Courier"
        )
      ),

      /*
      ============================================================
      SHIPMENT TRACKING
      ============================================================
      */

      shipment
        ? React.createElement(
            "div",
            {
              className:
                "courier-tracking-card"
            },

            React.createElement(
              "h2",
              null,
              "📦 Shipment Tracking"
            ),

            /*
            -------- TRACKING ID --------
            */

            React.createElement(
              "div",
              {
                className:
                  "courier-tracking-id"
              },

              React.createElement(
                "span",
                null,
                "Tracking ID"
              ),

              React.createElement(
                "strong",
                null,
                shipment.trackingId
              )
            ),

            /*
            -------- CURRENT STATUS --------
            */

            React.createElement(
              "div",
              {
                className:
                  "courier-tracking-status"
              },

              React.createElement(
                "span",
                null,
                "Current Status"
              ),

              React.createElement(
                "strong",
                null,
                shipment.status
              )
            ),

            /*
            ========================================================
            STATUS BUTTONS
            ========================================================
            */

            React.createElement(
              "div",
              {
                className:
                  "courier-status-actions"
              },

              React.createElement(
                "button",
                {
                  onClick:
                    function () {
                      updateShipmentStatus(
                        "Pickup Scheduled"
                      );
                    }
                },
                "📅 Pickup Scheduled"
              ),

              React.createElement(
                "button",
                {
                  onClick:
                    function () {
                      updateShipmentStatus(
                        "Picked Up"
                      );
                    }
                },
                "📦 Picked Up"
              ),

              React.createElement(
                "button",
                {
                  onClick:
                    function () {
                      updateShipmentStatus(
                        "In Transit"
                      );
                    }
                },
                "🚛 In Transit"
              ),

              React.createElement(
                "button",
                {
                  onClick:
                    function () {
                      updateShipmentStatus(
                        "Out for Delivery"
                      );
                    }
                },
                "🏠 Out for Delivery"
              ),

              React.createElement(
                "button",
                {
                  onClick:
                    function () {
                      updateShipmentStatus(
                        "Arrived"
                      );
                    }
                },
                "📦 Arrived"
              )
            ),

            /*
            ========================================================
            RECEIVER OTP
            ========================================================
            */

            shipment &&
            shipment.status ===
              "Arrived" &&
            otp
              ? React.createElement(
                  "div",
                  {
                    className:
                      "courier-otp-display"
                  },

                  React.createElement(
                    "h3",
                    null,
                    "🔐 Delivery OTP"
                  ),

                  React.createElement(
                    "p",
                    null,
                    "Your parcel has arrived. Please give this OTP to the delivery person."
                  ),

                  React.createElement(
                    "div",
                    {
                      className:
                        "courier-otp-number"
                    },
                    otp
                  )
                )
              : null,

            /*
            ========================================================
            TRACKING INFORMATION
            ========================================================
            */

            React.createElement(
              "div",
              {
                className:
                  "courier-tracking-info"
              },

              React.createElement(
                "p",
                null,
                "🚚 Courier: ",
                shipment.courierName
              ),

              React.createElement(
                "p",
                null,
                "📦 Weight: ",
                shipment.packageWeight,
                " kg"
              ),

              React.createElement(
                "p",
                null,
                "📍 Pickup: ",
                shipment.pickupAddress
              ),

              React.createElement(
                "p",
                null,
                "🏠 Delivery: ",
                shipment.deliveryAddress
              )
            )
          )
        : null
    )
  );
}

export default CourierDelivery;