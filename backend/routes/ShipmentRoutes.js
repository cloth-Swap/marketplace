
const express = require("express");
const Shipment = require("../models/Shipment");
const SwapRequest = require("../models/SwapRequest");
const Notification = require("../models/Notification");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../models/User");

async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Please login first"
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(
        authHeader.split(" ")[1],
        process.env.JWT_SECRET
      );
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired login session"
      });
    }

    const user = await User.findById(decoded.userId);

    if (!user || user.status === "Blocked") {
      return res.status(401).json({
        success: false,
        message: "User account is unavailable"
      });
    }

    if (user.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      });
    }

    req.admin = user;
    next();

  } catch (error) {
    console.error("Admin Authentication Error:", error);

    return res.status(500).json({
      success: false,
      message: "Admin authentication failed"
    });
  }
}

router.post("/", async function (req, res) {
  try {
    const {
      swapRequestId,
      sender,
      receiver,
      pickupAddress,
      deliveryAddress,
      packageWeight,
      shippingCost,
      pickupDate,
      clothingTitle,
      courierName
    } = req.body;

    if (!swapRequestId || !sender || !receiver) {
      return res.status(400).json({
        success: false,
        message: "Required courier information is missing"
      });
    }

    const trackingId =
      "CS" +
      Date.now().toString().slice(-8) +
      Math.floor(100 + Math.random() * 900);

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const swapRequest = await SwapRequest.findById(
      swapRequestId
    );

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: "Swap request not found"
      });
    }

    const receiverEmail = String(
      swapRequest.requesterEmail || ""
    ).trim().toLowerCase();

    if (!receiverEmail) {
      return res.status(400).json({
        success: false,
        message: "Receiver email not found in swap request"
      });
    }

    const shipment = new Shipment({
      swapRequestId,
      sender,
      receiver,
      receiverEmail,
      pickupAddress: pickupAddress || "",
      deliveryAddress: deliveryAddress || "",
      clothingTitle: clothingTitle || "Clothing Item",
      packageWeight: Number(packageWeight) || 1,
      courierName: courierName || "ClothSwap Courier",
      shippingCost: Number(shippingCost) || 0,
      pickupDate: pickupDate || null,
      trackingId,
      otp,
      status: "Courier Requested",
      senderNotification: "",
      senderNotified: false
    });

    await shipment.save();

    res.status(201).json({
      success: true,
      message: "Courier arranged successfully",
      shipment: shipment
    });

  } catch (error) {
    console.error("Arrange Courier Error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
router.put("/admin/:id/courier-mode", requireAdmin, async function (req, res) {
  try {
    const mode = req.body.courierMode;

    if (!["Automatic", "Manual"].includes(mode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid courier mode."
      });
    }

    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found."
      });
    }

    shipment.courierMode = mode;
    await shipment.save();

    return res.json({
      success: true,
      message: "Courier mode updated successfully.",
      shipment
    });
  } catch (error) {
    console.error("Courier mode update error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update courier mode."
    });
  }
});
router.put(
  "/admin/:id/manual-status",
  requireAdmin,
  async function (req, res) {
    try {
      const { status, otp, trackingId } = req.body;

      const allowedStatuses = [
        "Courier Requested",
        "Pickup Scheduled",
        "Picked Up",
        "In Transit",
        "Out for Delivery",
        "OTP Verified",
        "Delivered",
        "Cancelled"
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid shipment status"
        });
      }

      const shipment = await Shipment.findById(req.params.id);

      if (!shipment) {
        return res.status(404).json({
          success: false,
          message: "Shipment not found"
        });
      }

      if (
        shipment.status === "Delivered" ||
        shipment.status === "Cancelled"
      ) {
        return res.status(400).json({
          success: false,
          message: "Shipment is already finalized"
        });
      }

      const previousStatus = shipment.status;

      if (status === "OTP Verified") {
        if (!otp || !trackingId) {
          return res.status(400).json({
            success: false,
            message: "Tracking ID and OTP are required"
          });
        }

        if (String(shipment.trackingId) !== String(trackingId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid Tracking ID"
          });
        }

        if (String(shipment.otp) !== String(otp)) {
          return res.status(400).json({
            success: false,
            message: "Invalid OTP"
          });
        }

        if (shipment.status !== "Out for Delivery") {
          return res.status(400).json({
            success: false,
            message: "Shipment must be Out for Delivery before OTP verification"
          });
        }

        shipment.otpVerified = true;
shipment.parcelArrived = true;
shipment.status = "Arrived";
shipment.arrivedAt = new Date();
      }

      else if (status === "Delivered") {
        if (
          !shipment.otpVerified ||
          shipment.status !== "Arrived"
        ) {
          return res.status(400).json({
            success: false,
            message: "Verify OTP before confirming delivery"
          });
        }

        shipment.deliveryConfirmed = true;
        shipment.deliveredAt = new Date();
        shipment.parcelArrived = true;
        shipment.status = "Delivered";
      }

      else if (status === "Cancelled") {
        shipment.status = "Cancelled";
      }

      else {
        shipment.status = status;
      }

      await shipment.save();

      if (shipment.status === "Delivered") {
        const completedSwap = await SwapRequest.findById(
          shipment.swapRequestId
        );

        if (completedSwap) {
          completedSwap.ownerCompleted = true;
          completedSwap.requesterCompleted = true;
          completedSwap.completionStatus = "Completed";
          await completedSwap.save();
        }
      }

      const swapRequest = await SwapRequest.findById(
        shipment.swapRequestId
      );

      if (swapRequest && previousStatus !== shipment.status) {
        const emails = [
          swapRequest.ownerEmail,
          swapRequest.requesterEmail
        ]
          .filter(Boolean)
          .map(function (email) {
            return String(email).trim().toLowerCase();
          });

        const uniqueEmails = [...new Set(emails)];

        for (const email of uniqueEmails) {
          await Notification.create({
            recipient: email,
            sender: "ClothSwap",
            senderName: "ClothSwap Courier",
            type: "shipment_status",
            title:
              shipment.status === "Delivered"
                ? "Swap Completed"
                : "Courier Status Updated",
            message:
              shipment.status === "Delivered"
                ? "Your clothing swap has been completed successfully."
                : "Your clothing swap shipment status is now: " +
                  shipment.status,
            relatedId: String(shipment.swapRequestId),
            isRead: false
          });
        }
      }

      return res.json({
        success: true,
        message: "Manual shipment status updated successfully",
        shipment
      });

    } catch (error) {
      console.error("Admin Manual Status Error:", error);

      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

router.get("/", async function (req, res) {
  try {
    const shipments = await Shipment
      .find({})
      .select("-otp")
      .sort({
        createdAt: -1
      });

    res.json({
      success: true,
      shipments: shipments
    });

  } catch (error) {
    console.error("Get All Shipments Error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get(
  "/notifications/:user",
  async function (req, res) {
    try {
      const user = decodeURIComponent(req.params.user);

      const notifications = await Shipment
        .find({
          sender: user,
          senderNotified: true
        })
        .select("-otp")
        .sort({
          updatedAt: -1
        });

      res.json({
        success: true,
        notifications: notifications
      });

    } catch (error) {
      console.error("Sender Notification Error:", error);

      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

router.get("/:id/receiver-otp", async function (req, res) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Please login first"
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(
        authHeader.split(" ")[1],
        process.env.JWT_SECRET
      );
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired login session"
      });
    }

    const user = await User.findById(decoded.userId);

    if (!user || !user.email) {
      return res.status(401).json({
        success: false,
        message: "User account not found"
      });
    }

    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found"
      });
    }

    if (
      !shipment.receiverEmail ||
      shipment.receiverEmail.trim().toLowerCase() !==
        user.email.trim().toLowerCase()
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the assigned receiver can access this OTP"
      });
    }

    if (shipment.status !== "Out for Delivery") {
      return res.status(400).json({
        success: false,
        message: "OTP is available only when the parcel is out for delivery"
      });
    }

    return res.json({
      success: true,
      otp: shipment.otp
    });

  } catch (error) {
    console.error("Receiver OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve delivery OTP"
    });
  }
});

// GET SHIPMENT BY SWAP REQUEST
router.get(
  "/:swapRequestId",
  async function (req, res) {
    try {
      const shipment = await Shipment.findOne({
        swapRequestId: req.params.swapRequestId
      }).select("-otp");

      if (!shipment) {
        return res.status(404).json({
          success: false,
          message: "Shipment not found"
        });
      }

      res.json({
        success: true,
        shipment: shipment
      });

    } catch (error) {
      console.error("Get Shipment Error:", error);

      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// AUTOMATIC COURIER STATUS UPDATE
router.put(
  "/:id/status",
  async function (req, res) {
    try {
      const { status } = req.body;

      // Parcel cannot be marked Arrived before OTP verification
      if (status === "Arrived") {
        return res.status(403).json({
          success: false,
          message: "OTP must be verified before delivery can be marked Arrived."
        });
      }

      const allowedStatuses = [
        "Courier Requested",
        "Pickup Scheduled",
        "Picked Up",
        "In Transit",
        "Out for Delivery",
        "Arrived",
        "OTP Verified",
        "Delivered",
        "Cancelled"
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid shipment status"
        });
      }

      if (
        status === "OTP Verified" ||
        status === "Delivered"
      ) {
        return res.status(403).json({
          success: false,
          message: "OTP verification and delivery confirmation must use their dedicated routes."
        });
      }

      // FIND SHIPMENT
      const shipment = await Shipment.findById(req.params.id);

      if (!shipment) {
        return res.status(404).json({
          success: false,
          message: "Shipment not found"
        });
      }

      // PREVENT CHANGES AFTER DELIVERY OR CANCELLATION
      if (
        shipment.status === "Delivered" ||
        shipment.status === "Cancelled"
      ) {
        return res.status(400).json({
          success: false,
          message: "Shipment is already finalized and cannot be updated."
        });
      }

      // VALIDATE SHIPMENT STATUS TRANSITIONS
      const allowedTransitions = {
        "Courier Requested": [
          "Pickup Scheduled",
          "Cancelled"
        ],
        "Pickup Scheduled": [
          "Picked Up",
          "Cancelled"
        ],
        "Picked Up": [
          "In Transit",
          "Cancelled"
        ],
        "In Transit": [
          "Out for Delivery",
          "Cancelled"
        ],
        "Out for Delivery": [
          "Arrived",
          "Cancelled"
        ],
        "Arrived": [
          "Cancelled"
        ]
      };

      const nextStatuses =
        allowedTransitions[shipment.status] || [];

      if (!nextStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid shipment status transition."
        });
      }

      // OLD STATUS
      const previousStatus = shipment.status;

      // UPDATE STATUS
      shipment.status = status;

      // PARCEL ARRIVED
      if (status === "Arrived") {
        shipment.parcelArrived = true;
      }

      // SAVE
      await shipment.save();

      // AUTOMATIC NOTIFICATION TO BOTH USERS
      if (previousStatus !== status) {
        try {
          const swapRequest = await SwapRequest.findById(
            shipment.swapRequestId
          );

          if (swapRequest) {
            const ownerEmail = String(
              swapRequest.ownerEmail || ""
            ).trim().toLowerCase();

            const requesterEmail = String(
              swapRequest.requesterEmail || ""
            ).trim().toLowerCase();

            const usersToNotify = [
              ownerEmail,
              requesterEmail
            ].filter(function (email, index, array) {
              return (
                email &&
                array.indexOf(email) === index
              );
            });

            for (const userEmail of usersToNotify) {
              await Notification.create({
                recipient: userEmail,
                sender: "ClothSwap",
                senderName: "ClothSwap Courier",
                type: "shipment_status",
                title: "Courier Status Updated",
                message:
                  "Your clothing swap shipment is now: " +
                  status,
                relatedId: String(shipment.swapRequestId),
                isRead: false
              });
            }
          }
        } catch (notificationError) {
          console.error(
            "Shipment status notification error:",
            notificationError
          );
        }
      }

      // RESPONSE
      res.json({
        success: true,
        message: "Shipment status updated",
        shipment: shipment
      });

    } catch (error) {
      console.error("Shipment Status Error:", error);

      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// VERIFY OTP
router.post(
  "/:id/verify-otp",
  async function (req, res) {
    try {
      // VERIFY LOGGED-IN USER
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "Please login first"
        });
      }

      let decoded;

      try {
        decoded = jwt.verify(
          authHeader.split(" ")[1],
          process.env.JWT_SECRET
        );
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: "Invalid or expired login session"
        });
      }

      const { otp, trackingId } = req.body;

      if (!otp || !trackingId) {
        return res.status(400).json({
          success: false,
          message: "Tracking ID and OTP are required"
        });
      }

      const shipment = await Shipment.findById(req.params.id);

      if (!shipment) {
        return res.status(404).json({
          success: false,
          message: "Shipment not found"
        });
      }

      const user = await User.findById(decoded.userId);

      if (!user || !user.email) {
        return res.status(401).json({
          success: false,
          message: "User account not found"
        });
      }

      if (
        !shipment.receiverEmail ||
        shipment.receiverEmail.trim().toLowerCase() !==
          user.email.trim().toLowerCase()
      ) {
        return res.status(403).json({
          success: false,
          message: "Only the assigned receiver can verify this OTP"
        });
      }

      if (shipment.trackingId !== trackingId) {
        return res.status(400).json({
          success: false,
          message: "Invalid Tracking ID"
        });
      }

      if (shipment.status !== "Out for Delivery") {
        return res.status(400).json({
          success: false,
          message: "OTP verification is available only when the parcel is out for delivery"
        });
      }

      if (String(shipment.otp) !== String(otp)) {
        return res.status(400).json({
          success: false,
          message: "Invalid OTP"
        });
      }

      shipment.otpVerified = true;
shipment.status = "Arrived";
shipment.parcelArrived = true;
shipment.arrivedAt = new Date();

await shipment.save();

      return res.json({
        success: true,
        message: "OTP verified successfully. Parcel can now be handed over to the receiver.",
        shipment: shipment
      });

    } catch (error) {
      console.error("Delivery Boy OTP Verification Error:", error);

      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// SECURE DELIVERY CONFIRMATION
router.put("/:id/deliver", async function (req, res) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Please login first"
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(
        authHeader.split(" ")[1],
        process.env.JWT_SECRET
      );
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired login session"
      });
    }

    const user = await User.findById(decoded.userId);

    if (!user || !user.email) {
      return res.status(401).json({
        success: false,
        message: "User account not found"
      });
    }

    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found"
      });
    }

    // ONLY ASSIGNED RECEIVER CAN CONFIRM
    if (
      !shipment.receiverEmail ||
      shipment.receiverEmail.trim().toLowerCase() !==
        user.email.trim().toLowerCase()
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the assigned receiver can confirm delivery"
      });
    }

    // OTP MUST BE VERIFIED FIRST
    if (
      !shipment.otpVerified ||
      shipment.status !== "Arrived"
    ) {
      return res.status(400).json({
        success: false,
        message: "Please verify OTP before confirming delivery"
      });
    }

    if (
      shipment.deliveryConfirmed ||
      shipment.status === "Delivered"
    ) {
      return res.status(400).json({
        success: false,
        message: "Delivery is already confirmed"
      });
    }

    shipment.deliveryConfirmed = true;
    shipment.status = "Delivered";
    shipment.deliveredAt = new Date();

    shipment.senderNotification =
      "✅ Your parcel has been received by " +
      shipment.receiver +
      ".";

    shipment.senderNotified = true;

    await shipment.save();

    // AUTOMATICALLY COMPLETE COURIER SWAP
    const swapRequest = await SwapRequest.findById(
      shipment.swapRequestId
    );

    if (swapRequest) {
      swapRequest.ownerCompleted = true;
      swapRequest.requesterCompleted = true;
      swapRequest.completionStatus = "Completed";

      await swapRequest.save();

      // NOTIFY BOTH USERS
      const emails = [
        swapRequest.ownerEmail,
        swapRequest.requesterEmail
      ].filter(Boolean);

      const uniqueEmails = [
        ...new Set(
          emails.map(email =>
            String(email).trim().toLowerCase()
          )
        )
      ];

      for (const email of uniqueEmails) {
        await Notification.create({
          recipient: email,
          sender: "ClothSwap",
          senderName: "ClothSwap Courier",
          type: "shipment_status",
          title: "Swap Completed",
          message:
            "Your clothing swap has been completed successfully. Your parcel has been delivered.",
          relatedId: String(shipment.swapRequestId),
          isRead: false
        });
      }
    }

    return res.json({
      success: true,
      message: "Delivery confirmed and swap completed successfully",
      shipment
    });

  } catch (error) {
    console.error("Secure Delivery Confirmation Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
