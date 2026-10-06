const express = require("express");
const Shipment = require("../models/Shipment");
const SwapRequest = require("../models/SwapRequest");
const Notification = require("../models/Notification");

const router = express.Router();

//  ARRANGE COURIER

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

// GENERATE TRACKING ID
    const trackingId =
      "CS" +
      Date.now().toString().slice(-8) +
      Math.floor(100 + Math.random() * 900);

    // GENERATE 6 DIGIT OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

// CREATE SHIPMENT
    const shipment = new Shipment({
      swapRequestId,
      sender,
      receiver,

      pickupAddress:
        pickupAddress || "",

      deliveryAddress:
        deliveryAddress || "",

      clothingTitle:
        clothingTitle || "Clothing Item",

      packageWeight:
        Number(packageWeight) || 1,

      courierName:
        courierName || "ClothSwap Courier",

      shippingCost:
        Number(shippingCost) || 0,

      pickupDate:
        pickupDate || null,

      trackingId,

      otp,

      status:
        "Courier Requested",

      senderNotification:
        "",

      senderNotified:
        false
    });

    await shipment.save();

    res.status(201).json({
      success: true,
      message:
        "Courier arranged successfully",
      shipment:
        shipment
    });

  } catch (error) {
    console.error(
      "Arrange Courier Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message
    });
  }
});


// GET ALL SHIPMENTS
router.get("/", async function (req, res) {
  try {
    const shipments =
      await Shipment
        .find({})
        .select("-otp")
        .sort({
          createdAt: -1
        });

    res.json({
      success: true,
      shipments:
        shipments
    });

  } catch (error) {
    console.error(
      "Get All Shipments Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message
    });
  }
});


// GET SENDER NOTIFICATIONS

router.get(
  "/notifications/:user",
  async function (req, res) {
    try {
      const user =
        decodeURIComponent(
          req.params.user
        );

      const notifications =
        await Shipment
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
        notifications:
          notifications
      });

    } catch (error) {
      console.error(
        "Sender Notification Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          error.message
      });
    }
  }
);


//  RECEIVER OTP
router.get(
  "/:id/receiver-otp",
  async function (req, res) {
    try {
      const {
        user
      } = req.query;

      if (!user) {
        return res.status(400).json({
          success: false,
          message:
            "Logged-in user information is required"
        });
      }

      const shipment =
        await Shipment.findById(
          req.params.id
        );

      if (!shipment) {
        return res.status(404).json({
          success: false,
          message:
            "Shipment not found"
        });
      }

// CHECK RECEIVER
      if (
        shipment.receiver !== user
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only the receiver can access the delivery OTP"
        });
      }

      // OTP ONLY AFTER ARRIVAL

      if (
        shipment.status !==
        "Arrived"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "OTP will be available only after the parcel arrives"
        });
      }

      res.json({
        success: true,
        otp:
          shipment.otp
      });

    } catch (error) {
      console.error(
        "Receiver OTP Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          error.message
      });
    }
  }
);


// GET SHIPMENT BY SWAP REQUEST

router.get(
  "/:swapRequestId",
  async function (req, res) {
    try {
      const shipment =
        await Shipment.findOne({
          swapRequestId:
            req.params.swapRequestId
        });

      if (!shipment) {
        return res.status(404).json({
          success: false,
          message:
            "Shipment not found"
        });
      }

      res.json({
        success: true,
        shipment:
          shipment
      });

    } catch (error) {
      console.error(
        "Get Shipment Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          error.message
      });
    }
  }
);


// UPDATE SHIPMENT STATUS Automatic notification to BOTH users

router.put(
  "/:id/status",
  async function (req, res) {
    try {
      const {
        status
      } = req.body;

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

      if (
        !allowedStatuses.includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid shipment status"
        });
      }

// FIND SHIPMENT
      const shipment =
        await Shipment.findById(
          req.params.id
        );

      if (!shipment) {
        return res.status(404).json({
          success: false,
          message:
            "Shipment not found"
        });
      }

      // OLD STATUS

      const previousStatus =
        shipment.status;

      // UPDATE STATUS

      shipment.status =
        status;

      // PARCEL ARRIVED

      if (
        status === "Arrived"
      ) {
        shipment.parcelArrived =
          true;
      }

      // SAVE


      await shipment.save();

      // AUTOMATIC NOTIFICATION TO BOTH USERS

      if (
        previousStatus !== status
      ) {
        try {
          const swapRequest =
            await SwapRequest.findById(
              shipment.swapRequestId
            );

          if (swapRequest) {
            const ownerEmail =
              String(
                swapRequest.ownerEmail || ""
              )
                .trim()
                .toLowerCase();

            const requesterEmail =
              String(
                swapRequest.requesterEmail || ""
              )
                .trim()
                .toLowerCase();

            const usersToNotify = [
              ownerEmail,
              requesterEmail
            ].filter(function (
              email,
              index,
              array
            ) {
              return (
                email &&
                array.indexOf(email) === index
              );
            });

            for (
              const userEmail of usersToNotify
            ) {
              await Notification.create({
                recipient:
                  userEmail,

                sender:
                  "ClothSwap",

                senderName:
                  "ClothSwap Courier",

                type:
                  "shipment_status",

                title:
                  "Courier Status Updated",

                message:
                  "Your clothing swap shipment is now: " +
                  status,

                relatedId:
                  String(
                    shipment.swapRequestId
                  ),

                isRead:
                  false
              });
            }
          }
        } catch (
          notificationError
        ) {
          console.error(
            "Shipment status notification error:",
            notificationError
          );
        }
      }

// RESPONSE
      res.json({
        success: true,
        message:
          "Shipment status updated",
        shipment:
          shipment
      });

    } catch (error) {
      console.error(
        "Shipment Status Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          error.message
      });
    }
  }
);


// VERIFY OTP

router.post(
  "/:id/verify-otp",
  async function (req, res) {
    try {
      const {
        otp,
        trackingId
      } = req.body;

      if (
        !otp ||
        !trackingId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Tracking ID and OTP are required"
        });
      }

      // FIND SHIPMENT

      const shipment =
        await Shipment.findById(
          req.params.id
        );

      if (!shipment) {
        return res.status(404).json({
          success: false,
          message:
            "Shipment not found"
        });
      }

// CHECK TRACKING ID
      if (
        shipment.trackingId !==
        trackingId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid Tracking ID"
        });
      }

      // CHECK ARRIVAL

      if (
        shipment.status !==
        "Arrived"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "OTP verification is available only after the parcel arrives"
        });
      }

      // CHECK OTP

      if (
        shipment.otp !== otp
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid OTP"
        });
      }

      // VERIFY OTP

      shipment.otpVerified =
        true;

      shipment.status =
        "OTP Verified";

      await shipment.save();

      res.json({
        success: true,
        message:
          "OTP verified successfully. Parcel can now be handed over to the receiver.",
        shipment:
          shipment
      });

    } catch (error) {
      console.error(
        "Delivery Boy OTP Verification Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          error.message
      });
    }
  }
);


// CONFIRM DELIVERY

router.put(
  "/:id/deliver",
  async function (req, res) {
    try {
      const shipment =
        await Shipment.findById(
          req.params.id
        );

      if (!shipment) {
        return res.status(404).json({
          success: false,
          message:
            "Shipment not found"
        });
      }

      // OTP MUST BE VERIFIED

      if (
        !shipment.otpVerified
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please verify OTP first"
        });
      }

      // DELIVERY CONFIRMED

      shipment.deliveryConfirmed =
        true;

      shipment.status =
        "Delivered";

      shipment.deliveredAt =
        new Date();

      // SENDER NOTIFICATION

      shipment.senderNotification =
        "✅ Your parcel has been received by " +
        shipment.receiver +
        ".";

      shipment.senderNotified =
        true;

      await shipment.save();

      res.json({
        success: true,
        message:
          "Delivery confirmed successfully",
        shipment:
          shipment
      });

    } catch (error) {
      console.error(
        "Delivery Confirmation Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          error.message
      });
    }
  }
);


    // DELIVERY CONFIRM  Alternate endpoint used by frontend

router.put(
  "/:id/delivery-confirm",
  async function (req, res) {
    try {
      const shipment =
        await Shipment.findById(
          req.params.id
        );

      if (!shipment) {
        return res.status(404).json({
          success: false,
          message:
            "Shipment not found"
        });
      }

      // OTP MUST BE VERIFIED

      if (
        !shipment.otpVerified
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please verify OTP first"
        });
      }

      // DELIVERY CONFIRMED

      shipment.deliveryConfirmed =
        true;

      shipment.status =
        "Delivered";

      shipment.deliveredAt =
        new Date();

      // SENDER NOTIFICATION

      shipment.senderNotification =
        "✅ Your parcel has been received by " +
        shipment.receiver +
        ".";

      shipment.senderNotified =
        true;

      await shipment.save();

      res.json({
        success: true,
        message:
          "Delivery confirmed successfully",
        shipment:
          shipment
      });

    } catch (error) {
      console.error(
        "Delivery Confirm Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          error.message
      });
    }
  }
);


// EXPORT ROUTER

module.exports = router;