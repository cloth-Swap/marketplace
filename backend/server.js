  const express = require("express");
  const mongoose = require("mongoose");
  const http = require("http");
const { Server } = require("socket.io");
  const bcrypt = require("bcryptjs");
  const jwt = require("jsonwebtoken");
  const cors = require("cors");
  require("dotenv").config();
  if (!process.env.JWT_SECRET) {
  console.error(
    "FATAL ERROR: JWT_SECRET is missing in backend .env file."
  );

  process.exit(1);
}
  const { OAuth2Client } = require("google-auth-library");

  const Clothing = require("./models/Clothing");
  const Shipment = require("./models/Shipment");
  const SwapRequest = require("./models/SwapRequest");
  const Message = require("./models/Message");
  const User = require("./models/User");
  const RefreshSession = require("./models/RefreshSession");
  const Dispute = require("./models/Dispute");
    const ReportedListing = require("./models/ReportedListing");
  const shipmentRoutes = require("./routes/ShipmentRoutes.js");
  const Notification = require("./models/Notification");
  const UserActivity = require("./models/UserActivity");
  const cookieParser = require("cookie-parser");
  
function parseMeetingDateTimeIST(meetingDate, meetingTime) {
  if (!meetingDate || !meetingTime) {
    return null;
  }

  const dateMatch = String(meetingDate).match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  const timeMatch = String(meetingTime).match(
    /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
  );

  if (!dateMatch || !timeMatch) {
    return null;
  }

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);

  let hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const period = timeMatch[3].toUpperCase();

  if (
    month < 1 || month > 12 ||
    day < 1 || day > 31 ||
    hour < 1 || hour > 12 ||
    minute < 0 || minute > 59
  ) {
    return null;
  }

  if (period === "AM" && hour === 12) {
    hour = 0;
  } else if (period === "PM" && hour !== 12) {
    hour += 12;
  }

  // Convert Indian Standard Time (UTC +5:30) to UTC
  const meetingTimestamp =
    Date.UTC(year, month - 1, day, hour, minute) -
    (5 * 60 + 30) * 60 * 1000;

  const result = new Date(meetingTimestamp);

  // Reject invalid calendar dates
  if (
    result.getUTCFullYear() !== year ||
    result.getUTCMonth() !== month - 1 ||
    result.getUTCDate() !== day
  ) {
    return null;
  }

  return result;
}


async function sendHandToHandDeadlineNotification(
  recipientEmail,
  request,
  title,
  message,
  type
) {
  if (!recipientEmail) {
    return;
  }

  await Notification.create({
    recipient: recipientEmail,
    sender: "system",
    senderName: "ClothSwap",
    type: type,
    title: title,
    message: message,
    relatedId: String(request._id),
    isRead: false
  });
}


let handToHandDeadlineCheckRunning = false;

async function checkHandToHandDeadlines() {
  if (handToHandDeadlineCheckRunning) {
    return;
  }

  handToHandDeadlineCheckRunning = true;

  try {
    const now = Date.now();

    const requests = await SwapRequest.find({
      status: "Accepted",
      exchangeMethod: "Local Exchange",
      completionStatus: { $ne: "Completed" },
      meetingDate: { $nin: ["", null] },
      meetingTime: { $nin: ["", null] }
    });

    for (const request of requests) {
      try {
        let changed = false;

        // If both participants have completed the swap,
        // mark the request completed without sending reminders.
        if (
          request.ownerCompleted &&
          request.requesterCompleted
        ) {
          request.ownerConfirmationOverdue = false;
          request.requesterConfirmationOverdue = false;
          request.completionStatus = "Completed";
          request.agreementStatus = "Completed";

          await request.save();
          continue;
        }

        const meetingAt = parseMeetingDateTimeIST(
          request.meetingDate,
          request.meetingTime
        );

        if (!meetingAt) {
          continue;
        }

        const meetingTimestamp = meetingAt.getTime();

        // Reset the deadline schedule whenever meeting details change.
        // This must happen BEFORE checking whether the meeting is in future.
        if (
          !request.handToHandExchangeStartedAt ||
          new Date(
            request.handToHandExchangeStartedAt
          ).getTime() !== meetingTimestamp
        ) {
          request.handToHandExchangeStartedAt = meetingAt;

          request.ownerReminder24Sent = false;
          request.requesterReminder24Sent = false;

          request.ownerReminder36Sent = false;
          request.requesterReminder36Sent = false;

          request.ownerConfirmationOverdue = false;
          request.requesterConfirmationOverdue = false;

          changed = true;
        }

        // Save reset values even when the new meeting is in future.
        if (changed) {
          await request.save();
          changed = false;
        }

        // Countdown starts only after the scheduled meeting time.
        if (now < meetingTimestamp) {
          continue;
        }

        const elapsedHours =
          (now - meetingTimestamp) / (60 * 60 * 1000);

        const participants = [
          {
            email: request.ownerEmail,
            completed: request.ownerCompleted,
            reminder24: "ownerReminder24Sent",
            reminder36: "ownerReminder36Sent",
            overdue: "ownerConfirmationOverdue"
          },
          {
            email: request.requesterEmail,
            completed: request.requesterCompleted,
            reminder24: "requesterReminder24Sent",
            reminder36: "requesterReminder36Sent",
            overdue: "requesterConfirmationOverdue"
          }
        ];

        for (const participant of participants) {
          const participantEmail = String(
            participant.email || ""
          ).trim().toLowerCase();

          // Already completed participants must not receive reminders.
          if (participant.completed) {
            if (request[participant.overdue]) {
              request[participant.overdue] = false;
              changed = true;
            }

            continue;
          }

          if (!participantEmail) {
            continue;
          }

          // First reminder after 24 hours.
          if (
            elapsedHours >= 24 &&
            !request[participant.reminder24]
          ) {
            await sendHandToHandDeadlineNotification(
              participantEmail,
              request,
              "Hand-to-Hand Swap Reminder",
              "Your Hand-to-Hand swap meeting time has passed. Please complete your swap confirmation.",
              "hand_to_hand_reminder"
            );

            request[participant.reminder24] = true;
            changed = true;
            await request.save();
            changed = false;
          }

          // Second reminder after 36 hours.
          if (
            elapsedHours >= 36 &&
            !request[participant.reminder36]
          ) {
            await sendHandToHandDeadlineNotification(
              participantEmail,
              request,
              "Final Hand-to-Hand Swap Reminder",
              "Your Hand-to-Hand swap confirmation is still pending. Please complete it within the next 12 hours.",
              "hand_to_hand_final_reminder"
            );

            request[participant.reminder36] = true;
            changed = true;
            await request.save();
            changed = false;
          }

          // At 48 hours, check for a pending genuine dispute.
          if (elapsedHours >= 48) {
            const pendingDispute = await Dispute.findOne({
              swapRequestId: request._id,
              reporterEmail: participantEmail,
              status: "Pending"
            });

            if (
              !pendingDispute &&
              !request[participant.overdue]
            ) {
              request[participant.overdue] = true;
              changed = true;

              await sendHandToHandDeadlineNotification(
                participantEmail,
                request,
                "Swap Confirmation Overdue",
                "Your Hand-to-Hand swap confirmation is overdue. Your ClothSwap activities are temporarily restricted until this pending confirmation is resolved.",
                "hand_to_hand_overdue"
              );

              await request.save();
              changed = false;
            }
          }
        }

        if (changed) {
          await request.save();
        }

      } catch (requestError) {
        console.error(
          "Hand-to-Hand deadline error for:",
          request._id,
          requestError
        );
      }
    }

  } catch (error) {
    console.error(
      "Hand-to-Hand deadline scheduler error:",
      error
    );

  } finally {
    handToHandDeadlineCheckRunning = false;
  }
}

let courierReceiverDeadlineCheckRunning = false;

async function checkCourierReceiverDeadlines() {
  if (courierReceiverDeadlineCheckRunning) {
    return;
  }

  courierReceiverDeadlineCheckRunning = true;

  try {
    const now = Date.now();

    const shipments = await Shipment.find({
      deliveryConfirmed: true,
      deliveredAt: { $ne: null }
    });

    for (const shipment of shipments) {
      try {
        const request = await SwapRequest.findById(
          shipment.swapRequestId
        );

        if (
          !request ||
          request.status !== "Accepted" ||
          !["Courier", "Courier Delivery"].includes(
            request.exchangeMethod
          ) ||
          request.completionStatus === "Completed"
        ) {
          continue;
        }

        // Only the parcel receiver is responsible for confirmation.
        const receiverEmail = String(
          shipment.receiverEmail || request.requesterEmail || ""
        ).trim().toLowerCase();

        if (!receiverEmail) {
          continue;
        }

        // Receiver has already completed their confirmation.
        if (request.requesterCompleted === true) {
          if (shipment.receiverConfirmationOverdue) {
            shipment.receiverConfirmationOverdue = false;
            await shipment.save();
          }
          continue;
        }

        const deliveredAt = new Date(shipment.deliveredAt).getTime();

        if (!Number.isFinite(deliveredAt)) {
          continue;
        }

        const elapsedHours =
          (now - deliveredAt) / (60 * 60 * 1000);

        // 24-hour reminder to receiver only.
        if (
          elapsedHours >= 24 &&
          !shipment.receiverReminder24Sent
        ) {
          await sendHandToHandDeadlineNotification(
            receiverEmail,
            request,
            "Courier Swap Reminder",
            "Your courier parcel has been delivered. Please complete your swap confirmation.",
            "courier_receiver_reminder"
          );

          shipment.receiverReminder24Sent = true;
          await shipment.save();
        }

        // 36-hour final reminder to receiver only.
        if (
          elapsedHours >= 36 &&
          !shipment.receiverReminder36Sent
        ) {
          await sendHandToHandDeadlineNotification(
            receiverEmail,
            request,
            "Final Courier Swap Reminder",
            "Your courier swap confirmation is still pending. Please complete it within the next 12 hours.",
            "courier_receiver_final_reminder"
          );

          shipment.receiverReminder36Sent = true;
          await shipment.save();
        }

        // At 48 hours, check whether receiver has a pending dispute.
        if (
          elapsedHours >= 48 &&
          !shipment.receiverConfirmationOverdue
        ) {
          const pendingDispute = await Dispute.findOne({
            swapRequestId: request._id,
            reporterEmail: receiverEmail,
            status: "Pending"
          });

          if (!pendingDispute) {
            shipment.receiverConfirmationOverdue = true;

            await shipment.save();

            await sendHandToHandDeadlineNotification(
              receiverEmail,
              request,
              "Courier Swap Confirmation Overdue",
              "Your courier swap confirmation is overdue. Your ClothSwap activities are temporarily restricted until you complete the confirmation or raise a genuine dispute.",
              "courier_receiver_overdue"
            );
          }
        }

      } catch (shipmentError) {
        console.error(
          "Courier receiver deadline error for shipment:",
          shipment._id,
          shipmentError
        );
      }
    }

  } catch (error) {
    console.error(
      "Courier receiver deadline scheduler error:",
      error
    );

  } finally {
    courierReceiverDeadlineCheckRunning = false;
  }
}


const CURRENT_TERMS_VERSION = "1.0";
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
  }
});
app.set("io", io);
// SECURE SOCKET.IO AUTHENTICATION
io.use(async function (socket, next) {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(
      decoded.userId
    ).select("-password");

    if (!user || user.status === "Blocked") {
      return next(new Error("Account unavailable"));
    }

    socket.user = user;

    next();

  } catch (error) {
    next(new Error("Invalid or expired authentication token"));
  }
});

// USER-SPECIFIC SOCKET ROOMS
io.on("connection", function (socket) {
  const userId = String(socket.user._id);
  const userEmail = String(socket.user.email || "")
    .trim()
    .toLowerCase();

  socket.join("user:" + userId);

  if (userEmail) {
    socket.join("email:" + userEmail);
  }

  console.log("User connected to ClothSwap real-time service");
});
  const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
  );

  const PORT = process.env.PORT || 5000;
  // =====================================================
  // ACCESS TOKEN + REFRESH TOKEN HELPERS
  // =====================================================

  const crypto = require("crypto");

  function generateAccessToken(user) {
    return jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
  }

  function generateRefreshToken() {
    return crypto.randomBytes(64).toString("hex");
  }

  function hashRefreshToken(token) {
    return crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
  }
  async function createRefreshSession(user, res) {
    const refreshToken = generateRefreshToken();

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    await RefreshSession.create({
      userId: user._id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: expiresAt
    });

    setRefreshCookie(res, refreshToken);

    return generateAccessToken(user);
  }
  function setRefreshCookie(res, refreshToken) {
    res.cookie("clothswapRefreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 365 * 24 * 60 * 60 * 1000,
      path: "/api/auth"
    });
  }


  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true
    })
  );

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(cookieParser());

  app.use("/api/shipments", shipmentRoutes);
  // =====================================================
  // REFRESH ACCESS TOKEN API
  // =====================================================

  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const oldRefreshToken = req.cookies.clothswapRefreshToken;

      if (!oldRefreshToken) {
        return res.status(401).json({
          success: false,
          message: "Refresh token not found. Please login again."
        });
      }

      const oldTokenHash = hashRefreshToken(oldRefreshToken);

      const session = await RefreshSession.findOne({
        tokenHash: oldTokenHash,
        revokedAt: null,
        expiresAt: { $gt: new Date() }
      });

      if (!session) {
        res.clearCookie("clothswapRefreshToken", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          path: "/api/auth"
        });

        return res.status(401).json({
          success: false,
          message: "Session expired. Please login again."
        });
      }

      const user = await User.findById(session.userId);

      if (!user || user.status === "Blocked") {
        session.revokedAt = new Date();
        await session.save();

        res.clearCookie("clothswapRefreshToken", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          path: "/api/auth"
        });

        return res.status(401).json({
          success: false,
          message: "Account unavailable. Please contact support."
        });
      }

      const newRefreshToken = generateRefreshToken();

      const newExpiresAt = new Date();
      newExpiresAt.setFullYear(newExpiresAt.getFullYear() + 1);

      const updatedSession = await RefreshSession.findOneAndUpdate(
        {
          _id: session._id,
          tokenHash: oldTokenHash,
          revokedAt: null,
          expiresAt: { $gt: new Date() }
        },
        {
          $set: {
            tokenHash: hashRefreshToken(newRefreshToken),
            expiresAt: newExpiresAt
          }
        },
        { new: true }
      );

      if (!updatedSession) {
        return res.status(401).json({
          success: false,
          message: "Session expired. Please login again."
        });
      }

      setRefreshCookie(res, newRefreshToken);

      const newAccessToken = generateAccessToken(user);

      return res.json({
        success: true,
        message: "Token refreshed successfully",
        token: newAccessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          location: user.location,
          role: user.role
        }
      });

    } catch (error) {
      console.error("Refresh Token Error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to refresh session"
      });
    }
  });
  // =====================================================
  // LOGOUT API
  // =====================================================

  app.post("/api/auth/logout", async (req, res) => {
    try {
      const refreshToken = req.cookies.clothswapRefreshToken;

      if (refreshToken) {
        const tokenHash = hashRefreshToken(refreshToken);

        await RefreshSession.findOneAndUpdate(
          {
            tokenHash: tokenHash,
            revokedAt: null
          },
          {
            $set: {
              revokedAt: new Date()
            }
          }
        );
      }

      res.clearCookie("clothswapRefreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/api/auth"
      });

      return res.json({
        success: true,
        message: "Logout successful"
      });

    } catch (error) {
      console.error("Logout Error:", error);

      return res.status(500).json({
        success: false,
        message: "Logout failed"
      });
    }
  });

 async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.status === "Blocked") {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked"
      });
    }

    if (user.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      });
    }

    await User.findByIdAndUpdate(user._id, {
      $set: {
        lastActivityAt: new Date()
      }
    });

    req.user = user;
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token"
    });
  }
}

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(
      decoded.userId
    ).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.status === "Blocked") {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked."
      });
    }

    await User.findByIdAndUpdate(user._id, {
      $set: {
        lastActivityAt: new Date()
      }
    });

    req.user = user;
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token"
    });
  }
}

async function requireNoHandToHandOverdue(req, res, next) {
  try {
    const userEmail = String(req.user.email || "")
      .trim()
      .toLowerCase();

    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: "User information not found"
      });
    }

    // Find all pending Hand-to-Hand confirmations overdue for this user.
    const overdueRequests = await SwapRequest.find({
      status: "Accepted",
      exchangeMethod: "Local Exchange",
      completionStatus: { $ne: "Completed" },
      $or: [
        {
          ownerEmail: userEmail,
          ownerConfirmationOverdue: true,
          ownerCompleted: { $ne: true }
        },
        {
          requesterEmail: userEmail,
          requesterConfirmationOverdue: true,
          requesterCompleted: { $ne: true }
        }
      ]
    }).select("_id clothingTitle");

    if (overdueRequests.length === 0) {
      return next();
    }

    // A user who has raised a pending dispute for that swap
    // must not be restricted for that particular swap.
    const pendingDisputes = await Dispute.find({
      swapRequestId: {
        $in: overdueRequests.map(function (request) {
          return request._id;
        })
      },
      reporterEmail: userEmail,
      status: "Pending"
    }).select("swapRequestId");

    const exemptSwapIds = new Set(
      pendingDisputes.map(function (dispute) {
        return String(dispute.swapRequestId);
      })
    );

    const restrictedRequest = overdueRequests.find(
      function (request) {
        return !exemptSwapIds.has(String(request._id));
      }
    );

    // Allow access if every overdue swap has a pending dispute
    // raised by this user.
    if (!restrictedRequest) {
      return next();
    }

    return res.status(403).json({
      success: false,
      code: "HAND_TO_HAND_CONFIRMATION_OVERDUE",
      message:
        "Your Hand-to-Hand swap confirmation is overdue. Complete your pending confirmation or raise a dispute if you have a genuine issue.",
      swapRequestId: String(restrictedRequest._id),
      clothingTitle: restrictedRequest.clothingTitle
    });

  } catch (error) {
    console.error(
      "Hand-to-Hand overdue restriction error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to verify your swap confirmation status."
    });
  }
}
// Restrict only Courier receivers whose confirmation is overdue.
async function requireNoCourierReceiverOverdue(req, res, next) {
  try {
    const userEmail = String(req.user.email || "")
      .trim()
      .toLowerCase();

    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: "User information not found"
      });
    }

    const overdueShipments = await Shipment.find({
      receiverEmail: userEmail,
      receiverConfirmationOverdue: true,
      deliveryConfirmed: true
    });

    for (const shipment of overdueShipments) {
      const request = await SwapRequest.findById(
        shipment.swapRequestId
      );

      if (
        !request ||
        request.requesterCompleted === true ||
        request.completionStatus === "Completed"
      ) {
        continue;
      }

      const pendingDispute = await Dispute.findOne({
        swapRequestId: request._id,
        reporterEmail: userEmail,
        status: "Pending"
      });

      // A pending dispute exempts this receiver from restriction.
      if (pendingDispute) {
        continue;
      }

      return res.status(403).json({
        success: false,
        code: "COURIER_RECEIVER_CONFIRMATION_OVERDUE",
        message:
          "Your Courier swap confirmation is overdue. Complete your confirmation or raise a dispute if you have a genuine issue.",
        swapRequestId: String(request._id),
        clothingTitle: request.clothingTitle
      });
    }

    return next();

  } catch (error) {
    console.error(
      "Courier receiver overdue restriction error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to verify your Courier confirmation status."
    });
  }
}
// CHECK LOGGED-IN USER ACCOUNT STATUS
app.get("/api/auth/status", requireAuth, function (req, res) {
  return res.status(200).json({
    success: true,
    message: "Account is active."
  });
});

  async function recordUserActivity({
    userId = null,
    userName = "",
    userEmail = "",
    activityType,
    description = "",
    relatedId = ""
  }) {
    try {
      await UserActivity.create({
        userId,
        userName,
        userEmail: String(userEmail).trim().toLowerCase(),
        activityType,
        description,
        relatedId
      });
    } catch (error) {
      console.error("User activity tracking error:", error);
    }
  }

  app.get("/", function (req, res) {
    res.json({
      success: true,
      message: "ClothSwap Backend is running!"
    });
  });


app.get("/api/clothes", async function (req, res) {
  try {
const clothes = await Clothing.find({
  status: "Available",
  $and: [
    {
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    },
    {
      $or: [
        { listingStatus: "Available" },
        { listingStatus: { $exists: false } }
      ]
    }
  ]
})
.select("title name image category brand size condition location owner ownerEmail price")
.sort({
  createdAt: -1
});

    const sellerEmails = [
      ...new Set(
        clothes
          .map(function (item) {
            return String(item.ownerEmail || "")
              .trim()
              .toLowerCase();
          })
          .filter(Boolean)
      )
    ];

    const sellers = await User.find({
      email: { $in: sellerEmails }
    }).select("name email profilePhoto");

    const sellerMap = {};

    sellers.forEach(function (seller) {
      sellerMap[String(seller.email).toLowerCase()] = {
        name: seller.name || "ClothSwap User",
        profilePhoto: seller.profilePhoto || ""
      };
    });

    const clothesWithSeller = clothes.map(function (item) {
      const clothing = item.toObject();

      const email = String(item.ownerEmail || "")
        .trim()
        .toLowerCase();

      const seller = sellerMap[email];

      clothing.sellerName =
        seller ? seller.name : (item.owner || "ClothSwap User");

      clothing.sellerProfilePhoto =
        seller ? seller.profilePhoto : "";

      return clothing;
    });

    res.json(clothesWithSeller);

  } catch (error) {
    console.error("Failed to fetch clothes:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch clothes",
      error: error.message
    });
  }
});

app.get("/api/clothes/:id", async function (req, res) {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid clothing ID"
      });
    }

    const clothing = await Clothing.findOne({
      _id: id,
      status: "Available",
      $and: [
        {
          $or: [
            { isDeleted: false },
            { isDeleted: { $exists: false } }
          ]
        },
        {
          $or: [
            { listingStatus: "Available" },
            { listingStatus: { $exists: false } }
          ]
        }
      ]
    });

    if (!clothing) {
      return res.status(404).json({
        success: false,
        message: "Clothing not found"
      });
    }

    return res.json(clothing);

  } catch (error) {
    console.error("Fetch single clothing error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch clothing",
      error: error.message
    });
  }
});

  app.post("/api/auth/accept-terms", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    user.acceptedTermsVersion = CURRENT_TERMS_VERSION;
    user.acceptedTermsAt = new Date();

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Terms & Conditions accepted successfully.",
      acceptedTermsVersion: user.acceptedTermsVersion,
      acceptedTermsAt: user.acceptedTermsAt
    });

  } catch (error) {
    console.error("Accept Terms Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to accept Terms & Conditions."
    });
  }
});
/* CHECK USER TERMS & CONDITIONS STATUS */
app.get(
  "/api/auth/terms-status",
  requireAuth,
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found."
        });
      }

      const accepted =
        user.acceptedTermsVersion === CURRENT_TERMS_VERSION;

      return res.status(200).json({
        success: true,
        accepted: accepted,
        acceptedTermsVersion:
          user.acceptedTermsVersion || "",
        currentTermsVersion:
          CURRENT_TERMS_VERSION,
        acceptedTermsAt:
          user.acceptedTermsAt || null
      });

    } catch (error) {
      console.error(
        "Terms Status Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Unable to check Terms & Conditions status."
      });
    }
  }
);

/* CHECK WHETHER USER ALREADY REPORTED THIS LISTING */
// CREATE NEW CLOTHING LISTING
app.post(
  "/api/clothes",
 requireAuth,
requireNoHandToHandOverdue,
requireNoCourierReceiverOverdue,
  async (req, res) => {
  try {
    const {
      title,
      brand,
      category,
      size,
      condition,
      location,
      price,
      owner,
      description,
      image,
      ownerEmail
    } = req.body;

    if (
      !title ||
      !category ||
      !size ||
      !condition ||
      !image
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required clothing details."
      });
    }

    const newClothing = new Clothing({
      title: title.trim(),
      brand: brand || "",
      category,
      size,
      condition,
      location: location || "",
      price: Number(price) || 0,
      owner: req.user.name,
      description: description || "",
      image,
ownerEmail: req.user.email,
      status: "Available",
      isDeleted: false,
      listingStatus: "Available"
    });

    await newClothing.save();

    return res.status(201).json({
      success: true,
      message: "Clothing listed successfully!",
      clothing: newClothing
    });

  } catch (error) {
    console.error("Create clothing error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to list clothing.",
      error: error.message
    });
  }
});
app.get(
  "/api/clothes/:id/report/check",
  requireAuth,
  async function (req, res) {
    try {
      const clothingId = req.params.id;

      if (!mongoose.Types.ObjectId.isValid(clothingId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid clothing ID"
        });
      }

      const reporterEmail = String(req.user.email || "")
        .trim()
        .toLowerCase();

      const existingReport = await ReportedListing.findOne({
        clothingId: clothingId,
        reporterEmail: reporterEmail
      });

      return res.json({
        success: true,
        alreadyReported: !!existingReport,
        message: existingReport
          ? "You have already reported this listing."
          : "You can report this listing."
      });

    } catch (error) {
      console.error("Check report error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to check report status"
      });
    }
  }
);
/* =========================================
   REPORT CLOTHING LISTING
========================================= */

app.post("/api/clothes/:id/report", requireAuth, async function (req, res) {
  try {
    const { reason, description } = req.body;
    const clothingId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(clothingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid clothing ID"
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Please select a report reason"
      });
    }

    const clothing = await Clothing.findById(clothingId);

    if (
      !clothing ||
      clothing.isDeleted === true ||
      clothing.listingStatus === "Removed"
    ) {
      return res.status(404).json({
        success: false,
        message: "Clothing listing not found"
      });
    }

const reporterEmail = String(req.user.email || "")
  .trim()
  .toLowerCase();

    if (!reporterEmail) {
      return res.status(401).json({
        success: false,
        message: "User information not found"
      });
    }

    if (reporterEmail === String(clothing.ownerEmail || "").toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: "You cannot report your own listing"
      });
    }

    const existingReport = await ReportedListing.findOne({
  clothingId: clothing._id,
  reporterEmail: reporterEmail
});

if (existingReport) {
  return res.status(400).json({
    success: false,
    message: "You have already reported this listing."
  });
}

    const report = new ReportedListing({
      clothingId: clothing._id,
      listingTitle: clothing.title,
      reporter: req.user.name,
      reporterEmail: reporterEmail,
      owner: clothing.owner,
      ownerEmail: clothing.ownerEmail,
      reason: reason,
      description: description || ""
    });

    await report.save();
return res.status(201).json({
      success: true,
      message: "Listing reported successfully",
      report
    });

  } catch (error) {
    console.error("Report listing error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to report listing",
      error: error.message
    });
  }
});
app.get("/api/admin/reported-listings", requireAdmin, async function (req, res) {
  try {
    const reports = await ReportedListing.find()
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      reports
    });

  } catch (error) {
    console.error("Fetch reported listings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch reported listings",
      error: error.message
    });
  }
});
/* =========================================
   ADMIN - REVIEW REPORTED LISTING
========================================= */

app.patch(
  "/api/admin/reported-listings/:id/review",
  requireAdmin,
  async function (req, res) {
    try {
      const { status, adminNote } = req.body;

      if (!["Reviewed", "Removed", "Rejected"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid report status"
        });
      }

      const report = await ReportedListing.findById(req.params.id);

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Reported listing not found"
        });
      }

      if (status === "Removed") {
        const clothing = await Clothing.findById(report.clothingId);

        if (clothing) {
          clothing.isDeleted = true;
          clothing.listingStatus = "Removed";
          clothing.deletedAt = new Date();
          clothing.deletedBy =
            req.user.email || req.user.name || "Admin";
          clothing.removalReason = adminNote || report.reason;

          await clothing.save();
        }
      }

      report.status = status;
      report.adminNote = adminNote || "";
      report.reviewedBy =
        req.user.email || req.user.name || "Admin";
      report.reviewedAt = new Date();

// SAVE ADMIN ACTION HISTORY
report.actionHistory.push({
  action: status,
  adminName: req.user.name || "Admin",
  adminEmail: req.user.email || "",
  adminNote: adminNote || "",
  actionDate: new Date()
});

await report.save();

      // NOTIFY THE USER WHO REPORTED THE LISTING
      try {
        const reporterEmail = String(
          report.reporterEmail || ""
        ).trim().toLowerCase();

        if (reporterEmail) {
          let notificationTitle = "";
          let notificationMessage = "";

          if (status === "Reviewed") {
            notificationTitle = "Report Reviewed";
            notificationMessage =
              "Your report for \"" +
              report.listingTitle +
              "\" has been reviewed by the ClothSwap admin.";
          } else if (status === "Removed") {
            notificationTitle = "Listing Removed";
            notificationMessage =
              "Your reported listing \"" +
              report.listingTitle +
              "\" has been reviewed and removed by the ClothSwap admin.";
          } else if (status === "Rejected") {
            notificationTitle = "Report Rejected";
            notificationMessage =
              "Your report for \"" +
              report.listingTitle +
              "\" has been reviewed and rejected by the ClothSwap admin.";
          }

          if (notificationTitle) {
            await Notification.create({
              recipient: reporterEmail,
              sender: String(req.user.email || ""),
              senderName: "ClothSwap Admin",
              type: "Report Update",
              title: notificationTitle,
              message: notificationMessage,
              relatedId: String(report._id),
              isRead: false
            });

            console.log(
              "REPORT NOTIFICATION CREATED FOR:",
              reporterEmail
            );
          }
        }
      } catch (notificationError) {
        console.error(
          "Report notification error:",
          notificationError
        );
      }

      return res.json({
        success: true,
        message: "Report updated successfully",
        report
      });

    } catch (error) {
      console.error("Review reported listing error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to update report",
        error: error.message
      });
    }
  }
);
/* =========================================
   ADMIN - DELETE SELECTED REPORTED LISTINGS
========================================= */

app.delete(
  "/api/admin/reported-listings",
  requireAdmin,
  async function (req, res) {
    try {
      const ids = req.body.ids;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please select reports to delete."
        });
      }

      const validIds = ids.filter(function (id) {
        return mongoose.Types.ObjectId.isValid(id);
      });

      if (
        validIds.length !== ids.length ||
        validIds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid report IDs."
        });
      }

      const result = await ReportedListing.deleteMany({
        _id: { $in: validIds }
      });

      return res.json({
        success: true,
        message: "Selected reports deleted successfully.",
        deletedCount: result.deletedCount
      });

    } catch (error) {
      console.error("Delete reported listings error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to delete selected reports."
      });
    }
  }
);


/* =========================================
   RAISE DISPUTE FOR SWAP REQUEST
========================================= */

app.post(
  "/api/swap-requests/:id/dispute",
  requireAuth,
  async function (req, res) {
    try {
      const swapRequestId = req.params.id;
      const reason = String(req.body.reason || "").trim();
      const description = String(req.body.description || "").trim();

      if (!mongoose.Types.ObjectId.isValid(swapRequestId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid swap request ID"
        });
      }

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: "Please select a dispute reason"
        });
      }

      const request = await SwapRequest.findById(swapRequestId);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Swap request not found"
        });
      }

      if (request.status !== "Accepted") {
        return res.status(400).json({
          success: false,
          message: "You can raise a dispute only for accepted swaps"
        });
      }

      const userEmail = String(req.user.email || "")
        .trim()
        .toLowerCase();

      const ownerEmail = String(request.ownerEmail || "")
        .trim()
        .toLowerCase();

      const requesterEmail = String(request.requesterEmail || "")
        .trim()
        .toLowerCase();

      let reportedAgainst = "";
      let reportedUser = "";

      if (userEmail && userEmail === ownerEmail) {
        reportedAgainst = request.requester;
        reportedUser = requesterEmail;
      } else if (userEmail && userEmail === requesterEmail) {
        reportedAgainst = request.owner;
        reportedUser = ownerEmail;
      } else {
        return res.status(403).json({
          success: false,
          message: "You are not part of this swap"
        });
      }

      const existingDispute = await Dispute.findOne({
        swapRequestId: request._id,
        reporterEmail: userEmail
      });

      if (existingDispute) {
        return res.status(400).json({
          success: false,
          message: "You have already raised a dispute for this swap"
        });
      }

      const dispute = new Dispute({
        swapRequestId: request._id,
        reportedBy: req.user.name,
        reportedAgainst: reportedAgainst,
        reason: reason,
        description: description,
        subject: "Swap Dispute",
        reportedUser: reportedUser,
        reporterEmail: userEmail,
        relatedSwap: request.clothingTitle,
        status: "Pending"
      });

      await dispute.save();

      // NOTIFY ALL ACTIVE ADMIN USERS
      try {
        const adminUsers = await User.find({
          role: "Admin",
          status: { $ne: "Blocked" }
        }).select("name email");

        await Promise.all(
          adminUsers.map(function (admin) {
            return Notification.create({
              recipient: admin.email,
              sender: userEmail,
              senderName: req.user.name,
              type: "Dispute Raised",
              title: "New Swap Dispute",
              message:
                req.user.name +
                " has raised a dispute for swap: " +
                request.clothingTitle,
              relatedId: String(dispute._id),
              isRead: false
            });
          })
        );

        console.log("ADMIN DISPUTE NOTIFICATION CREATED");

      } catch (notificationError) {
        console.error(
          "Admin dispute notification error:",
          notificationError
        );
      }

      await recordUserActivity({
        userId: req.user._id,
        userName: req.user.name,
        userEmail: userEmail,
        activityType: "Dispute Raised",
        description: "Dispute raised for " + request.clothingTitle,
        relatedId: String(dispute._id)
      });

      return res.status(201).json({
        success: true,
        message: "Dispute raised successfully",
        dispute: dispute
      });

    } catch (error) {
      console.error("Raise dispute error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to raise dispute",
        error: error.message
      });
    }
  }
);
/* =========================================
   GET CURRENT USER'S RAISED DISPUTES
========================================= */

app.get(
  "/api/swap-requests/my-disputes",
  requireAuth,
  async function (req, res) {
    try {
      const userEmail = String(req.user.email || "")
        .trim()
        .toLowerCase();

      const disputes = await Dispute.find({
        reporterEmail: userEmail
      }).select("swapRequestId");

      const swapRequestIds = disputes
        .filter(function (dispute) {
          return dispute.swapRequestId;
        })
        .map(function (dispute) {
          return String(dispute.swapRequestId);
        });

      return res.json({
        success: true,
        swapRequestIds: swapRequestIds
      });

    } catch (error) {
      console.error("Fetch my disputes error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch your disputes"
      });
    }
  }
);

/* =========================================
   ADMIN - GET ALL DISPUTES
========================================= */

app.get(
  "/api/admin/disputes",
  requireAdmin,
  async function (req, res) {
    try {
      const disputes = await Dispute.find()
        .populate("swapRequestId")
        .sort({ createdAt: -1 });

      return res.json({
        success: true,
        disputes: disputes
      });

    } catch (error) {
      console.error("Fetch admin disputes error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch disputes",
        error: error.message
      });
    }
  }
);


/* =========================================
   ADMIN - REJECT DISPUTE
========================================= */

app.put(
  "/api/admin/disputes/:id/reject",
  requireAdmin,
  async function (req, res) {
    try {
      const id = req.params.id;
      const adminNote = String(req.body.adminNote || "").trim();

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid dispute ID"
        });
      }

      if (!adminNote) {
        return res.status(400).json({
          success: false,
          message: "Please provide a rejection reason"
        });
      }

      const dispute = await Dispute.findById(id);

      if (!dispute || dispute.isDeleted) {
        return res.status(404).json({
          success: false,
          message: "Dispute not found"
        });
      }

      if (
        dispute.status === "Resolved" ||
        dispute.status === "Rejected"
      ) {
        return res.status(400).json({
          success: false,
          message: "This dispute has already been processed"
        });
      }

      dispute.status = "Rejected";
      dispute.adminNote = adminNote;
      dispute.resolvedAt = new Date();

      dispute.resolutionHistory.push({
        action: "Rejected",
        adminNote: adminNote,
        adminName: req.user.name,
        adminEmail: req.user.email,
        actionDate: new Date()
      });

      await dispute.save();

      await recordUserActivity({
        userId: req.user._id,
        userName: req.user.name,
        userEmail: req.user.email,
        activityType: "Dispute Rejected",
        description: "Dispute rejected by admin",
        relatedId: String(dispute._id)
      });

      // NOTIFY BOTH DISPUTE PARTICIPANTS
      try {
        const reporterEmail = String(
          dispute.reporterEmail || ""
        ).trim().toLowerCase();

        const reportedUserEmail = String(
          dispute.reportedUser || ""
        ).trim().toLowerCase();

        const notifications = [];

        if (reporterEmail) {
          notifications.push(
            Notification.create({
              recipient: reporterEmail,
              sender: req.user.email,
              senderName: "ClothSwap Admin",
              type: "Dispute Rejected",
              title: "Your Dispute Has Been Rejected",
              message:
                "Your dispute has been rejected by the Admin. Reason: " +
                adminNote,
              relatedId: String(dispute._id),
              isRead: false
            })
          );
        }

        if (
          reportedUserEmail &&
          reportedUserEmail !== reporterEmail
        ) {
          notifications.push(
            Notification.create({
              recipient: reportedUserEmail,
              sender: req.user.email,
              senderName: "ClothSwap Admin",
              type: "Dispute Rejected",
              title: "Dispute Rejection Notice",
              message:
                "The Admin has rejected a dispute related to you. Admin Note: " +
                adminNote,
              relatedId: String(dispute._id),
              isRead: false
            })
          );
        }

        await Promise.all(notifications);

      } catch (notificationError) {
        console.error(
          "Dispute rejection notification error:",
          notificationError
        );
      }

      return res.json({
        success: true,
        message: "Dispute rejected successfully",
        dispute: dispute
      });

    } catch (error) {
      console.error("Dispute reject error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to reject dispute",
        error: error.message
      });
    }
  }
);
/* =========================================
   ADMIN - RESOLVE DISPUTE
========================================= */

app.put(
  "/api/admin/disputes/:id/resolve",
  requireAdmin,
  async function (req, res) {
    try {
      const id = req.params.id;
      const adminNote = String(req.body.adminNote || "").trim();

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid dispute ID"
        });
      }

      const dispute = await Dispute.findById(id);

      if (!dispute || dispute.isDeleted) {
        return res.status(404).json({
          success: false,
          message: "Dispute not found"
        });
      }

      if (
        dispute.status === "Resolved" ||
        dispute.status === "Rejected"
      ) {
        return res.status(400).json({
          success: false,
          message: "This dispute has already been processed"
        });
      }

      dispute.status = "Resolved";
      dispute.adminNote = adminNote;
      dispute.resolvedAt = new Date();

      dispute.resolutionHistory.push({
        action: "Resolved",
        adminNote: adminNote,
        adminName: req.user.name,
        adminEmail: req.user.email,
        actionDate: new Date()
      });

      await dispute.save();

      await recordUserActivity({
        userId: req.user._id,
        userName: req.user.name,
        userEmail: req.user.email,
        activityType: "Dispute Resolved",
        description: "Dispute resolved by admin",
        relatedId: String(dispute._id)
      });

      // NOTIFY DISPUTE PARTICIPANTS
      try {
        const reporterEmail = String(
          dispute.reporterEmail || ""
        ).trim().toLowerCase();

        const reportedUserEmail = String(
          dispute.reportedUser || ""
        ).trim().toLowerCase();

        const notifications = [];

        if (reporterEmail) {
          notifications.push(
            Notification.create({
              recipient: reporterEmail,
              sender: req.user.email,
              senderName: "ClothSwap Admin",
              type: "Dispute Resolved",
              title: "Your Dispute Has Been Resolved",
              message:
                "Your dispute has been resolved by the Admin. " +
                (adminNote ? "Admin Note: " + adminNote : ""),
              relatedId: String(dispute._id),
              isRead: false
            })
          );
        }

        if (
          reportedUserEmail &&
          reportedUserEmail !== reporterEmail
        ) {
          notifications.push(
            Notification.create({
              recipient: reportedUserEmail,
              sender: req.user.email,
              senderName: "ClothSwap Admin",
              type: "Dispute Resolved",
              title: "Dispute Resolution Notice",
              message:
                "The Admin has resolved a dispute related to you.",
              relatedId: String(dispute._id),
              isRead: false
            })
          );
        }

        await Promise.all(notifications);

      } catch (notificationError) {
        console.error(
          "Dispute resolution notification error:",
          notificationError
        );
      }

      return res.json({
        success: true,
        message: "Dispute resolved successfully",
        dispute: dispute
      });

    } catch (error) {
      console.error("Dispute resolve error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to resolve dispute",
        error: error.message
      });
    }
  }
);
/* =========================================
   ADMIN - SOFT DELETE SELECTED DISPUTES
========================================= */

app.delete(
  "/api/admin/disputes",
  requireAdmin,
  async function (req, res) {
    try {
      const ids = req.body.ids;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please select at least one dispute"
        });
      }

      const validIds = ids.filter(function (id) {
        return mongoose.Types.ObjectId.isValid(id);
      });

      if (validIds.length !== ids.length) {
        return res.status(400).json({
          success: false,
          message: "One or more dispute IDs are invalid"
        });
      }

      const disputes = await Dispute.find({
        _id: { $in: validIds },
        isDeleted: { $ne: true }
      });

      if (disputes.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No active disputes found"
        });
      }

      const deletedAt = new Date();

      for (const dispute of disputes) {
        dispute.isDeleted = true;
        dispute.deletedAt = deletedAt;
        dispute.deletedBy = req.user.email || req.user.name;

        dispute.resolutionHistory.push({
          action: "Deleted",
          adminNote: "Dispute archived by admin",
          adminName: req.user.name,
          adminEmail: req.user.email,
          actionDate: deletedAt
        });

        await dispute.save();
      }

      await recordUserActivity({
        userId: req.user._id,
        userName: req.user.name,
        userEmail: req.user.email,
        activityType: "Disputes Deleted",
        description:
          disputes.length + " dispute(s) archived by admin",
        relatedId: validIds.join(",")
      });

      return res.json({
        success: true,
        message: disputes.length + " dispute(s) archived successfully",
        deletedCount: disputes.length
      });

    } catch (error) {
      console.error("Dispute bulk delete error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to archive disputes",
        error: error.message
      });
    }
  }
);

 app.get(
  "/api/admin/dashboard/analytics",
  requireAdmin,
  async function (req, res) {
    try {
      const { startDate, endDate } = req.query;

      const dateFilter = {};

      if (startDate || endDate) {
        dateFilter.createdAt = {};

        if (startDate) {
          dateFilter.createdAt.$gte = new Date(startDate);
        }

        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          dateFilter.createdAt.$lte = end;
        }
      }

 const [
  totalUsers,
  activeUserEmails,
  totalListings,
  totalSwaps,
  completedSwaps,
  recentActivities,
  monthlySwaps,
  monthlyListings,
  monthlyUsers
] = await Promise.all([

       // Total Users - All Registered Users
User.countDocuments({}),

// Active Users - Unique Emails from Activity
UserActivity.distinct("userEmail", {
  ...dateFilter,
  userEmail: { $nin: ["", null] }
}),

        // Total Listings
        Clothing.countDocuments({
          ...dateFilter,
          isDeleted: { $ne: true },
          listingStatus: { $ne: "Removed" }
        }),

        // Total Swap Requests
        SwapRequest.countDocuments(dateFilter),

        // Total Completed Swaps
        SwapRequest.countDocuments({
          ...dateFilter,
          completionStatus: "Completed"
        }),

        // Recent Activities
        UserActivity.find(dateFilter)
          .sort({ createdAt: -1 })
          .limit(10),

        // Monthly Swaps
        SwapRequest.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" }
              },
              total: { $sum: 1 },
              completed: {
                $sum: {
                  $cond: [
                    { $eq: ["$completionStatus", "Completed"] },
                    1,
                    0
                  ]
                }
              }
            }
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]),

        // Monthly Listings
        Clothing.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" }
              },
              total: { $sum: 1 }
            }
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]),

        // Monthly Users
        User.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" }
              },
              total: { $sum: 1 }
            }
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } }
        ])

      ]);

      const activeUserCount = activeUserEmails.length > 0
  ? await User.countDocuments({
      email: { $in: activeUserEmails }
    })
  : 0;

    const swapCompletionRate = totalSwaps > 0
  ? Number(
      ((completedSwaps / totalSwaps) * 100).toFixed(2)
    )
  : 0;
      return res.json({
        success: true,
        analytics: {
          totalUsers,
          activeUsers: activeUserCount,
          totalListings,
          totalSwaps,
          completedSwaps,
          swapCompletionRate,
          monthlySwaps,
          monthlyListings,
          monthlyUsers,
          recentActivities
        }
      });

    } catch (error) {
      console.error("Dashboard analytics error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to load dashboard analytics",
        error: error.message
      });
    }
  }
);

app.get(
  "/api/admin/dashboard/trends",
  requireAdmin,
  async function (req, res) {
    try {
      const {
  period = "month",
  year
} = req.query;

      const validPeriods = ["7days", "month", "year"];

      if (!validPeriods.includes(period)) {
        return res.status(400).json({
          success: false,
          message: "Invalid trend period"
        });
      }

      const now = new Date();

      // Project starting month: September 2026
      const projectStart = new Date("2026-09-01T00:00:00+05:30");

      let startDate;
      let format;

      if (period === "7days") {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);

        format = "%Y-%m-%d";
      } else if (period === "month") {
        startDate = projectStart;
        format = "%Y-%m";
      } else {
  const selectedYear = Number(year) || now.getFullYear();

  if (
    !Number.isInteger(selectedYear) ||
    selectedYear < 2026 ||
    selectedYear > now.getFullYear() + 5
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid selected year"
    });
  }

  startDate = new Date(
    `${selectedYear}-01-01T00:00:00+05:30`
  );

  format = "%Y-%m";
}

     const match = {
  createdAt: {
    $gte: startDate,
    $lte: period === "year"
      ? new Date(
          Math.min(
            new Date(
              `${Number(year) || now.getFullYear() + 1}-12-31T23:59:59+05:30`
            ).getTime(),
            now.getTime()
          )
        )
      : now
  }
};

      async function getTrend(Model) {
        return await Model.aggregate([
          { $match: match },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: format,
                  date: "$createdAt",
                  timezone: "Asia/Kolkata"
                }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]);
      }
    
      async function getSwapStatusDistribution() {
  return await SwapRequest.aggregate([
    { $match: match },
    {
      $addFields: {
        chartStatus: {
          $switch: {
            branches: [
              {
                case: {
                  $or: [
                    { $eq: ["$completionStatus", "Completed"] },
                    { $eq: ["$agreementStatus", "Completed"] }
                  ]
                },
                then: "Completed"
              },
              {
                case: { $eq: ["$status", "Pending"] },
                then: "Pending"
              },
              {
                case: { $eq: ["$status", "Accepted"] },
                then: "Accepted"
              },
              {
                case: { $eq: ["$status", "Rejected"] },
                then: "Rejected"
              }
            ],
            default: "Other"
          }
        }
      }
    },
    {
      $match: {
        chartStatus: {
          $in: ["Pending", "Accepted", "Rejected", "Completed"]
        }
      }
    },
    {
      $group: {
        _id: "$chartStatus",
        count: { $sum: 1 }
      }
    }
  ]);
}
async function getClothingCategoryDistribution() {
  return await Clothing.aggregate([
   {
  $match: {
    isDeleted: { $ne: true },
    listingStatus: { $ne: "Removed" },
    category: { $nin: [null, ""] }
  }
},
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
}
async function getCompletedSwapTrend() {
  return await SwapRequest.aggregate([
    {
      $match: {
        ...match,
        $or: [
          { completionStatus: "Completed" },
          { agreementStatus: "Completed" }
        ]
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: format,
            date: "$createdAt",
            timezone: "Asia/Kolkata"
          }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
}
async function getTopPerformingCategories() {
  const allSwapRecords = await SwapRequest.find({})
  .select("status agreementStatus completionStatus clothingId")
  .limit(20);

console.log(
  "ALL SWAP RECORDS:",
  JSON.stringify(allSwapRecords, null, 2)
);
  return await SwapRequest.aggregate([
    {
      $match: {
        ...match,
        $or: [
          { completionStatus: "Completed" },
          { agreementStatus: "Completed" }
        ]
      }
    },
    {
      $lookup: {
        from: "clothings",
        localField: "clothingId",
        foreignField: "_id",
        as: "clothing"
      }
    },
    {
      $unwind: "$clothing"
    },
    {
      $match: {
        "clothing.category": { $nin: [null, ""] }
      }
    },
    {
      $group: {
        _id: "$clothing.category",
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 5
    }
  ]);
}
const [
  users,
  listings,
  swaps,
  completedSwaps,
  swapStatusDistribution,
  clothingCategoryDistribution,
  userActivityTrend,
  topPerformingCategories
] = await Promise.all([
  getTrend(User),
  getTrend(Clothing),
  getTrend(SwapRequest),
  getCompletedSwapTrend(),
  getSwapStatusDistribution(),
  getClothingCategoryDistribution(),
  getTrend(UserActivity),
  getTopPerformingCategories()
]);

     // Generate all date labels, including months with zero records.
const labels = [];

if (period === "7days") {
  const date = new Date(startDate);

  while (date <= now) {
    labels.push(date.toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata"
    }));

    date.setDate(date.getDate() + 1);
  }

} else if (period === "month") {
  const date = new Date(startDate);

  while (date <= now) {
    labels.push(
      date.getFullYear() + "-" +
      String(date.getMonth() + 1).padStart(2, "0")
    );

    date.setMonth(date.getMonth() + 1);
  }

} else {
  const selectedYear = Number(year) || now.getFullYear();

  for (let month = 1; month <= 12; month++) {
    labels.push(
      `${selectedYear}-${String(month).padStart(2, "0")}`
    );
  }
}
      function fillTrend(data) {
        const dataMap = {};

        data.forEach(function (item) {
          dataMap[item._id] = item.count;
        });

        return labels.map(function (label) {
          return {
            label: label,
            count: dataMap[label] || 0
          };
        });
      }

     return res.json({
  success: true,
  period,
  trends: {
    users: fillTrend(users),
    listings: fillTrend(listings),
    swaps: fillTrend(swaps),
    completedSwaps: fillTrend(completedSwaps),
    userActivityTrend: fillTrend(userActivityTrend),

    topPerformingCategories: topPerformingCategories.map(function (item) {
  return {
    label: item._id,
    count: item.count
  };
}),

    swapStatusDistribution: swapStatusDistribution.map(function (item) {
      return {
        label: item._id,
        count: item.count
      };
    }),
    clothingCategoryDistribution: clothingCategoryDistribution.map(function (item) {
  return {
    label: item._id,
    count: item.count
  };
})
  }
});
    } catch (error) {
      console.error("Dashboard trends error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to load dashboard trends",
        error: error.message
      });
    }
  }
);

app.get("/api/admin/users", requireAdmin, async function (req, res) {
  try {
    const users = await User.find()
      .select("-password -__v")
      .sort({ createdAt: -1 })
      .lean();

    const userStats = await Promise.all(
      users.map(async function (user) {
        const email = user.email.toLowerCase();

        const [
          totalListings,
          swapRequestsSent,
          swapRequestsReceived,
          completedSwaps
        ] = await Promise.all([
          Clothing.countDocuments({
            ownerEmail: email
          }),

          SwapRequest.countDocuments({
            requesterEmail: email
          }),

          SwapRequest.countDocuments({
            ownerEmail: email
          }),

          SwapRequest.countDocuments({
            $or: [
              { requesterEmail: email },
              { ownerEmail: email }
            ],
            completionStatus: "Completed"
          })
        ]);

        const lastActive = user.lastActivityAt || null;

        const inactiveDays = lastActive
          ? Math.floor(
              (Date.now() - new Date(lastActive).getTime()) /
              (1000 * 60 * 60 * 24)
            )
          : null;

        return {
          ...user,
          totalListings,
          swapRequestsSent,
          swapRequestsReceived,
          completedSwaps,
          lastActive,
          inactiveDays
        };
      })
    );

    res.json({
      success: true,
      users: userStats
    });

  } catch (error) {
    console.error("Admin users loading error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load users",
      error: error.message
    });
  }
}),
app.put("/api/admin/users/:id/status", requireAdmin, async function (req, res) {
    try {
      const id = req.params.id;
      const status = req.body.status;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID"
        });
      }

      if (status !== "Active" && status !== "Blocked") {
        return res.status(400).json({
          success: false,
          message: "Invalid user status"
        });
      }

      const user = await User.findByIdAndUpdate(
        id,
        {
          status: status
        },
        {
          new: true
        }
      ).select("-__v");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
  // REVOKE ALL REFRESH SESSIONS WHEN USER IS BLOCKED

  if (status === "Blocked") {
    // DISCONNECT ALL ACTIVE SOCKET CONNECTIONS
if (status === "Blocked") {
  io.in("user:" + String(user._id))
    .disconnectSockets(true);
}
    await RefreshSession.updateMany(
      {
        userId: user._id,
        revokedAt: null
      },
      {
        $set: {
          revokedAt: new Date()
        }
      }
    );
  }
      res.json({
        success: true,
        message: "User status updated successfully",
        user: user
      });
    } catch (error) {
      console.error("Admin user status error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to update user status",
        error: error.message
      });
    }
  }),

  app.delete("/api/admin/users/:id", requireAdmin, async function (req, res) {
    try {
      const id = req.params.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID"
        });
      }

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      if (user.role === "Admin") {
        return res.status(403).json({
          success: false,
          message: "Admin user cannot be deleted"
        });
      }

      await User.findByIdAndDelete(id);

      res.json({
        success: true,
        message: "User deleted successfully"
      });
    } catch (error) {
      console.error("Admin user delete error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to delete user",
        error: error.message
      });
    }
  }),


app.put(
  "/api/clothes/:id",
  requireAuth,
requireNoHandToHandOverdue,
requireNoCourierReceiverOverdue,
  async function (req, res) {
    try {
      const id = req.params.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid listing ID"
        });
      }

      const clothing = await Clothing.findById(id);

      if (!clothing) {
        return res.status(404).json({
          success: false,
          message: "Listing not found"
        });
      }

      // Only the listing owner can edit it
      if (
        String(clothing.ownerEmail).toLowerCase() !==
        String(req.user.email).toLowerCase()
      ) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to edit this listing"
        });
      }

      // Do not edit removed or swapped listings
      if (
        clothing.isDeleted ||
        clothing.listingStatus === "Removed" ||
        clothing.listingStatus === "Swapped" ||
        clothing.status === "Swapped"
      ) {
        return res.status(400).json({
          success: false,
          message: "This listing cannot be edited"
        });
      }

      // Prevent editing while a swap request is active
      const activeRequest = await SwapRequest.findOne({
        clothingId: clothing._id,
        status: { $in: ["Pending", "Accepted"] }
      });

      if (activeRequest) {
        return res.status(400).json({
          success: false,
          message: "This listing cannot be edited while a swap request is pending or accepted"
        });
      }

      const {
        title,
        brand,
        category,
        size,
        condition,
        location,
        price,
        description,
        image
      } = req.body;

      // Validate required fields
      if (
        !title ||
        !title.trim() ||
        !category ||
        !category.trim() ||
        !size ||
        !size.trim() ||
        !condition ||
        !condition.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Please fill all required fields"
        });
      }

      const updatedPrice = Number(price);

      if (!Number.isFinite(updatedPrice) || updatedPrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid price"
        });
      }

      // Update only editable fields
      clothing.title = title.trim();
      clothing.brand = brand || "";
      clothing.category = category.trim();
      clothing.size = size.trim();
      clothing.condition = condition.trim();
      clothing.location = location || "";
      clothing.price = updatedPrice;
      clothing.description = description || "";

      // Keep existing image if no new image is provided
      if (image !== undefined && image !== "") {
        clothing.image = image;
      }

      await clothing.save();

      return res.status(200).json({
        success: true,
        message: "Listing updated successfully",
        listing: clothing
      });

    } catch (error) {
      console.error("Update listing error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to update listing"
      });
    }
  }
);

app.delete(
  "/api/clothes/:id",
 requireAuth,
requireNoHandToHandOverdue,
requireNoCourierReceiverOverdue,
  async (req, res) => {
        try {
      const id = req.params.id;
const user = req.body?.user || req.user;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid clothing ID"
        });
      }
      const clothing = await Clothing.findById(id);

      if (!clothing) {
        return res.status(404).json({
          success: false,
          message: "Clothing not found"
        });
      }

    if (req.user.role !== "Admin") {
  if (
    String(clothing.ownerEmail || "").trim().toLowerCase() !==
    String(req.user.email || "").trim().toLowerCase()
  ) {
    return res.status(403).json({
      success: false,
      message: "You can delete only your own clothing"
    });
  }
}

      clothing.isDeleted = true;
  clothing.listingStatus = "Removed";
  clothing.status = "Removed";
  clothing.deletedAt = new Date();
  clothing.deletedBy = clothing.owner;

  await clothing.save();

      res.json({
        success: true,
        message: "Clothing deleted successfully"
      });

    } catch (error) {
      console.error("Delete clothing error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to delete clothing",
        error: error.message
      });
    }
  }),

  /* =========================================
   GET MY CLOTHING LISTINGS
========================================= */

app.get("/api/my-listings", requireAuth, async (req, res) => {
  try {
    const userEmail = String(req.user.email || "")
      .trim()
      .toLowerCase();

    const clothes = await Clothing.find({
      ownerEmail: userEmail
    }).sort({ createdAt: -1 });

    const listings = await Promise.all(
      clothes.map(async (clothing) => {
        const requests = await SwapRequest.find({
          clothingId: clothing._id
        }).sort({ createdAt: -1 });

        let availabilityStatus = "Available";

        if (clothing.isDeleted || clothing.listingStatus === "Removed") {
          availabilityStatus = "Removed";
        } else if (
          clothing.listingStatus === "Swapped" ||
          clothing.status === "Swapped"
        ) {
          availabilityStatus = "Swapped";
        }  else if (
  requests.some((r) =>
    r.status === "Pending" ||
    r.status === "Accepted"
  )
) {
  availabilityStatus = "Pending Request";
}

        return {
          ...clothing.toObject(),
          availabilityStatus,
          requests
        };
      })
    );

    res.json({
      success: true,
      listings
    });

  } catch (error) {
    console.error("MY LISTINGS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load your listings"
    });
  }
});
app.post(
  "/api/swap-requests",
 requireAuth,
requireNoHandToHandOverdue,
requireNoCourierReceiverOverdue,
  async (req, res) => {
      try {

      const {
  clothingId,
  message
} = req.body;

const requester = req.user.name;
const requesterEmailFromUser =
  String(req.user.email || "")
    .trim()
    .toLowerCase();


        if (
          !clothingId ||
          !requester
        ) {

          return res.status(400).json({
            success: false,
            message:
              "Clothing ID and requester are required"
          });
        }


        if (
          !mongoose.Types.ObjectId.isValid(
            clothingId
          )
        ) {

          return res.status(400).json({
            success: false,
            message:
              "Invalid clothing ID"
          });
        }


        const clothing =
          await Clothing.findById(
            clothingId
          );


        if (!clothing) {

          return res.status(404).json({
            success: false,
            message:
              "Clothing not found"
          });
        }



        if (
          clothing.owner === requester
        ) {

          return res.status(400).json({
            success: false,
            message:
              "You cannot request your own clothing"
          });
        }
     const existingRequest = await SwapRequest.findOne({
  clothingId: clothing._id,
  requesterEmail: requesterEmailFromUser
});

if (existingRequest) {
  return res.status(400).json({
    success: false,
    message: "You have already sent a swap request for this clothing item."
  });
}

        const swapRequest =
          new SwapRequest({

            clothingId:
              clothing._id,

            clothingTitle:
              clothing.title,

            clothingImage:
              clothing.image || "",

            owner:
              clothing.owner,

            ownerEmail:
              String(
                clothing.ownerEmail || ""
              )
                .trim()
                .toLowerCase(),

            requester:
              requester,

            requesterEmail:
              requesterEmailFromUser,

            message:
              message || "",

            status:
              "Pending",

            ownerAgreed:
              false,

            requesterAgreed:
              false,

            agreementStatus:
              "Not Started"
          });


        await swapRequest.save();
  await recordUserActivity({
    userName: requester,
    userEmail: requesterEmailFromUser,
    activityType: "Swap Requested",
    description:
      "Swap request sent for " + clothing.title,
    relatedId: String(swapRequest._id)
  });     


      

        try {

          const ownerEmail =
            String(
              clothing.ownerEmail || ""
            )
              .trim()
              .toLowerCase();


          const senderEmail =
            requesterEmailFromUser;


          if (
            ownerEmail &&
            senderEmail &&
            ownerEmail !== senderEmail
          ) {

            await Notification.create({

              recipient:
                ownerEmail,

              sender:
                senderEmail,

              senderName:
                requester,

              type:
                "Swap Request",

              title:
                "New Swap Request",

              message:
                requester +
                " sent you a swap request for " +
                clothing.title,

              relatedId:
                String(
                  swapRequest._id
                ),

              isRead:
                false
            });

          }

        } catch (
          notificationError
        ) {

          console.error(
            "Swap request notification error:",
            notificationError
          );
        }


        res.status(201).json({

          success: true,

          message:
            "Swap request sent successfully",

          request:
            swapRequest
        });


      } catch (error) {

        console.error(
          "Failed to create swap request:",
          error
        );

        res.status(500).json({

          success: false,

          message:
            "Failed to create swap request",

          error:
            error.message
        });
      }
    }
  ),


  app.get(
    "/api/swap-requests",
    async function (req, res) {

      try {

        console.log(
          "QUERY RECEIVED:",
          req.query
        );

        const userEmail =
          String(
            req.query.userEmail || ""
          )
            .trim()
            .toLowerCase();

        console.log(
          "FILTER EMAIL:",
          userEmail
        );


        if (!userEmail) {

          console.log(
            "NO USER EMAIL - RETURNING EMPTY"
          );

          return res.json([]);
        }


        

        const escapedEmail =
          userEmail.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          );


        const emailRegex =
          new RegExp(
            "^" +
            escapedEmail +
            "$",
            "i"
          );

const requests =
  await SwapRequest.find({
    $or: [
      {
        ownerEmail: emailRegex
      },
      {
        requesterEmail: emailRegex
      }
    ]
  }).sort({
    createdAt: -1
  });


        console.log(
          "FILTERED REQUESTS COUNT:",
          requests.length
        );

        console.log(
          "FILTERED REQUESTS:",
          requests
        );


        return res.json(requests);


      } catch (error) {

        console.error(
          "Failed to fetch swap requests:",
          error
        );

        return res.status(500).json({

          success: false,

          message:
            "Failed to fetch swap requests",

          error:
            error.message
        });
      }
    }
  ),


  app.get(
    "/api/admin/swap-requests",
    requireAdmin,
    async function (req, res) {

      try {

        const requests =
          await SwapRequest.find({})
            .sort({
              createdAt: -1
            });
          

        return res.json(requests);

      } catch (error) {

        console.error(
          "Failed to fetch admin swap requests:",
          error
        );

        return res.status(500).json({

          success: false,

          message:
            "Failed to fetch admin swap requests",

          error:
            error.message
        });
      }
    }
  ),


  app.put(
  "/api/swap-requests/:id",
  requireAuth,
requireNoHandToHandOverdue,
requireNoCourierReceiverOverdue,
  async function (req, res) {
      try {

        const id =
          req.params.id;

        const status =
          req.body.status;


        if (
          !mongoose.Types.ObjectId.isValid(id)
        ) {

          return res.status(400).json({

            success: false,

            message:
              "Invalid swap request ID"
          });
        }



        if (
          status !== "Accepted" &&
          status !== "Rejected"
        ) {

          return res.status(400).json({

            success: false,

            message:
              "Status must be Accepted or Rejected"
          });
        }


        const request =
          await SwapRequest.findById(id);


        if (!request) {

          return res.status(404).json({

            success: false,

            message:
              "Swap request not found"
          });
        }

  const wasAlreadyAccepted =
    request.status === "Accepted";
        request.status =
          status;



        if (
          status === "Rejected"
        ) {

          request.ownerAgreed =
            false;

          request.requesterAgreed =
            false;

          request.agreementStatus =
            "Not Started";
        }



        if (
          status === "Accepted"
        ) {

          request.ownerAgreed =
            false;

          request.requesterAgreed =
            false;

          request.agreementStatus =
            "Not Started";
        }


        await request.save();
        // REAL-TIME SWAP REQUEST UPDATE
const io = req.app.get("io");

if (io) {
  const requesterEmail = String(
    request.requesterEmail || ""
  ).trim().toLowerCase();

  const ownerEmail = String(
    request.ownerEmail || ""
  ).trim().toLowerCase();

  io.to("email:" + requesterEmail).emit(
    "swap-request-updated",
    {
      requestId: String(request._id),
      status: request.status
    }
  );

  io.to("email:" + ownerEmail).emit(
    "swap-request-updated",
    {
      requestId: String(request._id),
      status: request.status
    }
  );
}
  if (
    status === "Accepted" &&
    !wasAlreadyAccepted
  ) {
    await recordUserActivity({
      userName: request.owner,
      userEmail: request.ownerEmail,
      activityType: "Swap Accepted",
      description:
        "Accepted swap request for " +
        request.clothingTitle,
      relatedId: String(request._id)
    });
  }
  try {
    const requesterUser = await User.findOne({
      name: {
        $regex:
          "^" +
          String(request.requester)
            .trim()
            .replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
          "$",
        $options: "i"
      }
    });

    const ownerUser = await User.findOne({
      name: {
        $regex:
          "^" +
          String(request.owner)
            .trim()
            .replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
          "$",
        $options: "i"
      }
    });

    if (requesterUser && ownerUser) {
      await Notification.create({
        recipient: requesterUser.email,
        sender: ownerUser.email,
        senderName: ownerUser.name,
        type:
          request.status === "Accepted"
            ? "swap_accepted"
            : "swap_rejected",
        title:
          request.status === "Accepted"
            ? "Swap Request Accepted"
            : "Swap Request Rejected",
        message:
          ownerUser.name +
          " " +
          (
            request.status === "Accepted"
              ? "accepted"
              : "rejected"
          ) +
          " your swap request for " +
          request.clothingTitle +
          ".",
        relatedId: String(request._id),
        isRead: false
      });
    }

  } catch (notificationError) {
    console.error(
      "Accept/Reject notification error:",
      notificationError
    );
  }

        res.json({

          success: true,

          message:
            `Swap request ${status.toLowerCase()} successfully`,

          request:
            request
        });

      } catch (error) {

        console.error(
          "Update swap request error:",
          error
        );

        res.status(500).json({

          success: false,

          message:
            "Failed to update swap request",

          error:
            error.message
        });
      }
    }
  ),
 app.put(
  "/api/swap-requests/:id/agree",
  requireAuth,
requireNoHandToHandOverdue,
requireNoCourierReceiverOverdue,
  async function (req, res) {

      try {

        const id =
          req.params.id;

        const user =
          req.body.user;

        const userEmail =
            req.body.userEmail || "";



        if (
          !mongoose.Types.ObjectId.isValid(id)
        ) {

          return res.status(400).json({

            success: false,

            message:
              "Invalid swap request ID"
          });
        }



        if (!user) {

          return res.status(400).json({

            success: false,

            message:
              "User is required"
          });
        }



        const request =
          await SwapRequest.findById(id);


        if (!request) {

          return res.status(404).json({

            success: false,

            message:
              "Swap request not found"
          });
        }



        if (
          request.status !== "Accepted"
        ) {

          return res.status(400).json({

            success: false,

            message:
              "Agreement is available only after the request is accepted"
          });
        }



  const normalizedUserEmail =
    String(userEmail || "")
      .trim()
      .toLowerCase();

  const normalizedUser =
    String(user || "")
      .trim()
      .toLowerCase();

  const normalizedOwner =
    String(request.owner || "")
      .trim()
      .toLowerCase();

  const normalizedRequester =
    String(request.requester || "")
      .trim()
      .toLowerCase();

  const normalizedOwnerEmail =
    String(request.ownerEmail || "")
      .trim()
      .toLowerCase();

  const normalizedRequesterEmail =
    String(request.requesterEmail || "")
      .trim()
      .toLowerCase();

  const isOwnerByEmail =
    normalizedUserEmail &&
    normalizedOwnerEmail &&
    normalizedOwnerEmail === normalizedUserEmail;

  const isRequesterByEmail =
    normalizedUserEmail &&
    normalizedRequesterEmail &&
    normalizedRequesterEmail === normalizedUserEmail;

  const isOwnerByName =
    normalizedOwner === normalizedUser;

  const isRequesterByName =
    normalizedRequester === normalizedUser;

  if (
    !isOwnerByEmail &&
    !isRequesterByEmail &&
    !isOwnerByName &&
    !isRequesterByName
  ) {
    return res.status(403).json({
      success: false,
      message: "You are not part of this swap"
    });
  }



  if (
    isOwnerByEmail ||
    isOwnerByName
  ) {
    request.ownerAgreed = true;
  }



  if (
    isRequesterByEmail ||
    isRequesterByName
  ) {
    request.requesterAgreed = true;
  }


        if (
          request.ownerAgreed &&
          request.requesterAgreed
        ) {

          request.agreementStatus =
            "Confirmed";

        } else if (
          request.ownerAgreed ||
          request.requesterAgreed
        ) {

          request.agreementStatus =
            "Waiting for Both";

        } else {

          request.agreementStatus =
            "Not Started";
        }


        await request.save();
      res.json({

          success: true,

          message:
            "Agreement updated successfully",

          request:
            request
        });

      } catch (error) {

        console.error(
          "Agree to swap error:",
          error
        );

        res.status(500).json({

          success: false,

          message:
            "Failed to update agreement",

          error:
            error.message
        });
      }
    }
  ),

app.put(
  "/api/swap-requests/:id/exchange-method",
  requireAuth,
requireNoHandToHandOverdue,
requireNoCourierReceiverOverdue,
  async function (req, res) {
      try {
        const { exchangeMethod, user } = req.body;

        const allowedMethods = [
          "Courier",
          "Local Exchange"
        ];

        if (!allowedMethods.includes(exchangeMethod)) {
          return res.status(400).json({
            success: false,
            message: "Invalid exchange method"
          });
        }

        const request =
          await SwapRequest.findById(req.params.id);

        if (!request) {
          return res.status(404).json({
            success: false,
            message: "Swap request not found"
          });
        }


        if (
          request.status !== "Accepted" ||
          request.agreementStatus !== "Confirmed"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Exchange method can be selected only after swap confirmation"
          });
        }
  if (request.owner !== user) {
    return res.status(403).json({
      success: false,
      message: "Only the clothing owner can select the exchange method"
    });
  }
  if (
          request.exchangeMethod &&
          request.exchangeMethod !== "Not Selected"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Exchange method has already been selected"
          });
        }

        request.exchangeMethod = exchangeMethod;

        await request.save();

        res.json({
          success: true,
          message:
            "Exchange method selected successfully",
          request: request
        });
      } catch (error) {
        console.error(
          "Exchange Method Error:",
          error
        );

        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    }
  ),
  app.put("/api/swap-requests/:id/complete", async function (req, res) {
    try {
      const id = req.params.id;
      const user = req.body.user;
      const userEmail =
          req.body.userEmail || "";

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid swap request ID"
        });
      }

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User is required"
        });
      }

  const request = await SwapRequest.findById(id);

  if (!request) {
    return res.status(404).json({
      success: false,
      message: "Swap request not found"
    });
  }

  const wasAlreadyCompleted =
    request.completionStatus === "Completed";

      if (request.agreementStatus !== "Confirmed") {
        return res.status(400).json({
          success: false,
          message: "Swap must be confirmed before marking as completed"
        });
      }
      
  /* COURIER DELIVERY MUST BE VERIFIED BEFORE COMPLETION */

  if (
    request.exchangeMethod === "Courier" ||
    request.exchangeMethod === "Courier Delivery"
  ) {
    const shipment = await Shipment.findOne({
      swapRequestId: String(request._id)
    });

    if (
      !shipment ||
      shipment.otpVerified !== true ||
      shipment.deliveryConfirmed !== true
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The parcel must be delivered and its OTP verified before completing the swap."
      });
    }
  }


      const normalizedUserEmail =
    String(userEmail || "").trim().toLowerCase();

  const isOwnerByEmail =
    request.ownerEmail &&
    request.ownerEmail.toLowerCase() ===
      normalizedUserEmail;

  const isRequesterByEmail =
    request.requesterEmail &&
    request.requesterEmail.toLowerCase() ===
      normalizedUserEmail;

  const isOwnerByName =
    request.owner === user;

  const isRequesterByName =
    request.requester === user;

  if (
    !isOwnerByEmail &&
    !isRequesterByEmail &&
    !isOwnerByName &&
    !isRequesterByName
  ) {
    return res.status(403).json({
      success: false,
      message: "You are not part of this swap"
    });
  }

    if (
    isOwnerByEmail ||
    (!request.ownerEmail && isOwnerByName)
  ) {
    request.ownerCompleted = true;
  }

  if (
    isRequesterByEmail ||
    (!request.requesterEmail && isRequesterByName)
  ) {
    request.requesterCompleted = true;
  }

 if (request.ownerCompleted && request.requesterCompleted) {
  request.completionStatus = "Completed";
  request.agreementStatus = "Completed";

  // Keep clothing record for My Listings and Admin history
  const clothing = await Clothing.findById(request.clothingId);

  if (clothing) {
    clothing.status = "Swapped";
    clothing.listingStatus = "Swapped";
    clothing.swappedAt = new Date();

    await clothing.save();
  }

} else {
  request.completionStatus = "Waiting for Both";
}

  await request.save();

  if (
    !wasAlreadyCompleted &&
    request.completionStatus === "Completed" &&
    request.ownerCompleted &&
    request.requesterCompleted
  ) {
    await recordUserActivity({
      userName: request.requester,
      userEmail: request.requesterEmail,
      activityType: "Swap Completed",
      description:
        "Swap completed for " + request.clothingTitle,
      relatedId: String(request._id)
    });
  }

      res.json({
        success: true,
        message: "Completion status updated successfully",
        request: request
      });

    } catch (error) {
      console.error("Complete swap error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to update completion status",
        error: error.message
      });
    }
  }),


  app.get(
    "/api/swap-requests/:id",
    async function (req, res) {

      try {

        const id =
          req.params.id;

        if (
          !mongoose.Types.ObjectId.isValid(id)
        ) {

          return res.status(400).json({
            success: false,
            message: "Invalid swap request ID"
          });
        }

        const request =
          await SwapRequest.findById(id);

        if (!request) {

          return res.status(404).json({
            success: false,
            message: "Swap request not found"
          });
        }

        res.json(request);

      } catch (error) {

        console.error(
          "Get single swap request error:",
          error
        );

        res.status(500).json({
          success: false,
          message: "Failed to load swap request",
          error: error.message
        });
      }
    }
  ),

// DELETE SWAP REQUEST - SOFT DELETE
app.delete(
  "/api/swap-requests/:id",
 requireAuth,
requireNoHandToHandOverdue,
requireNoCourierReceiverOverdue,
  async function (req, res) {
    try {
      const id = req.params.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid swap request ID"
        });
      }

      const request = await SwapRequest.findById(id);

      if (!request || request.isDeleted === true) {
        return res.status(404).json({
          success: false,
          message: "Swap request not found"
        });
      }

      const currentUserEmail = String(req.user.email || "")
        .trim()
        .toLowerCase();

      const ownerEmail = String(request.ownerEmail || "")
        .trim()
        .toLowerCase();

      const requesterEmail = String(request.requesterEmail || "")
        .trim()
        .toLowerCase();

      if (
        currentUserEmail !== ownerEmail &&
        currentUserEmail !== requesterEmail
      ) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to delete this swap request"
        });
      }

      // Preserve request and save deletion history
      if (!Array.isArray(request.deletedFor)) {
  request.deletedFor = [];
}

if (!request.deletedFor.includes(currentUserEmail)) {
  request.deletedFor.push(currentUserEmail);
}

request.deletedBy = req.user.name || "";
request.deletedByEmail = currentUserEmail;
request.deletedAt = new Date();

await request.save();

     return res.json({
  success: true,
  message: "Swap request deleted successfully",
  request: request
});

    } catch (error) {
      console.error("Delete swap request error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to delete swap request",
        error: error.message
      });
    }
  }
);


// =========================================
// ADMIN - GET REMOVED CLOTHING HISTORY
// =========================================

app.get(
  "/api/admin/clothes",
  requireAdmin,
  async function (req, res) {
    try {
      const clothes = await Clothing.find({
        $or: [
          { isDeleted: true },
          { listingStatus: "Removed" }
        ]
      }).sort({
        deletedAt: -1,
        createdAt: -1
      });

      res.set("Cache-Control", "no-store");

      return res.json({
        success: true,
        clothes: clothes
      });

    } catch (error) {
      console.error(
        "Fetch removed clothing history error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch removed listings",
        error: error.message
      });
    }
  }
);
  app.delete(
    "/api/admin/clothes/:id",
    requireAdmin,
    async function (req, res) {
      try {
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid clothing ID"
          });
        }
const removalReason = String(
  req.body?.removalReason || ""
).trim();

if (!removalReason) {
  return res.status(400).json({
    success: false,
    message: "Removal reason is required"
  });
}
        const clothing = await Clothing.findById(id);

        if (!clothing) {
          return res.status(404).json({
            success: false,
            message: "Clothing not found"
          });
        }

        if (
          clothing.isDeleted === true ||
          clothing.listingStatus === "Removed"
        ) {
          return res.status(400).json({
            success: false,
            message: "Clothing is already removed"
          });
        }

        clothing.isDeleted = true;
        clothing.listingStatus = "Removed";
        clothing.status = "Removed";
        clothing.deletedAt = new Date();
        clothing.deletedBy = req.user.email;
        clothing.removalReason = removalReason;

        await clothing.save();

        res.set("Cache-Control", "no-store");

        return res.json({
          success: true,
          message: "Clothing listing removed by admin",
          clothing
        });

      } catch (error) {
        console.error("Admin delete clothing error:", error);

        return res.status(500).json({
          success: false,
          message: "Failed to remove clothing listing",
          error: error.message
        });
      }
    }
  );

  app.get(
    "/api/messages/:swapRequestId",
    async function (req, res) {

      try {

        const swapRequestId =
          req.params.swapRequestId;


        if (
          !mongoose.Types.ObjectId.isValid(
            swapRequestId
          )
        ) {

          return res.status(400).json({

            success: false,

            message:
              "Invalid swap request ID"
          });
        }


        const messages =
          await Message
            .find({
              swapRequestId:
                swapRequestId
            })
            .sort({
              createdAt: 1
            });


        res.json(messages);

      } catch (error) {

        console.error(
          "Failed to fetch messages:",
          error
        );

        res.status(500).json({

          success: false,

          message:
            "Failed to fetch messages",

          error:
            error.message
        });
      }
    }
  );
const CHAT_WARNING =
  "This chat is only for ClothSwap-related communication.";

function isClothSwapRelatedMessage(message) {
  const text = String(message || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  // Clearly inappropriate personal or romantic messages.
  const blockedPatterns = [
    /\bi\s+love\s+you\b/,
    /\blove\s+u\b/,
    /\bi\s+like\s+you\b/,
    /\b(date|dating)\s+you\b/,
    /\bdate\s+me\b/,
    /\bgo\s+on\s+a\s+date\b/,
    /\bgirlfriend\b/,
    /\bboyfriend\b/,
    /\bkiss\b/,
    /\bflirt(?:ing)?\b/,
    /\bromance\b/,
    /\bsweetheart\b/,
    /\bdarling\b/,
    /\bcrush\s+on\s+you\b/,
    /\bare\s+you\s+single\b/,
    /\bselfie\b/,
    /\byour\s+phone\s+number\b/,
    /\byour\s+instagram\b/,
    /\byour\s+whatsapp\b/,
    /\byour\s+snapchat\b/
  ];

  if (blockedPatterns.some(function (pattern) {
    return pattern.test(text);
  })) {
    return false;
  }

  // ClothSwap-related topics.
  const allowedTopics =
    /\b(cloth|clothes|clothing|kapda|kapde|dress|shirt|t-shirt|jeans|kurti|top|jacket|trouser|shoes|item|listing|photo|picture|pic|size|colour|color|condition|quality|brand|swap|swapping|exchange|offer|request|value|price|courier|delivery|deliver|parcel|shipment|shipping|tracking|dispatch|pickup|pick up|hand to hand|local exchange|meeting|meet|location|address|place|date|time|tomorrow|today|otp|received|send|share|available|available|packing|pack)\b/i;

  // Normal short replies needed during a swap conversation.
  const shortReplies =
  /^(ok|okay|okey|ohk|okk|yes|no|yep|nope|sure|fine|alright|all right|right|hmm|hm|hmmm|acha|accha|achha|saru|saras|barabar|thik|thik che|theek hai|ha|haa|han|haan|na|naa|kem cho|majama|maja ma|good|nice|great|hello|hi|hey|bye|good morning|good afternoon|good evening|good night|thanks|thank you|thankyou|thank u|thnx|welcome|you're welcome|ur welcome|please|pls|noted|got it|understood|done|perfect|no problem|its okay|it's okay|koi baat nahi|koi problem nahi|sorry|my bad|haha|hehe|lol|😂|👍|🙏)[.!?, ]*$/i;  return allowedTopics.test(text) || shortReplies.test(text);
}

  app.post(
  "/api/messages",
 requireAuth,
requireNoHandToHandOverdue,
requireNoCourierReceiverOverdue,
  async function (req, res) {
    try {
      const { swapRequestId, sender, text } = req.body;

      if (!swapRequestId || !sender || !text || !text.trim()) {
        return res.status(400).json({
          success: false,
          message: "Swap request ID, sender and text are required"
        });
      }
if (!isClothSwapRelatedMessage(text)) {
  return res.status(400).json({
    success: false,
    message: CHAT_WARNING
  });
}
      if (!mongoose.Types.ObjectId.isValid(swapRequestId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid swap request ID"
        });
      }

      const request = await SwapRequest.findById(swapRequestId);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Swap request not found"
        });
      }

      if (request.owner !== sender && request.requester !== sender) {
        return res.status(403).json({
          success: false,
          message: "You are not part of this swap"
        });
      }

      const receiver =
        request.owner === sender ? request.requester : request.owner;

      const newMessage = new Message({
        swapRequestId,
        sender,
        receiver,
        text: text.trim()
      });

      await newMessage.save();

      // Notification is optional; message saving is not dependent on it.
      if (req.body.chatNotificationsEnabled === true) {
        try {
          const receiverEmail = String(
            request.owner === sender
              ? request.requesterEmail || ""
              : request.ownerEmail || ""
          ).trim().toLowerCase();

          const senderEmail = String(
            request.owner === sender
              ? request.ownerEmail || ""
              : request.requesterEmail || ""
          ).trim().toLowerCase();

          if (
            receiverEmail &&
            senderEmail &&
            receiverEmail !== senderEmail
          ) {
            await Notification.create({
              recipient: receiverEmail,
              sender: senderEmail,
              senderName: sender,
              type: "chat",
              title: "New Chat Message",
              message: sender + " sent you a new message about your swap.",
              relatedId: String(swapRequestId),
              isRead: false
            });
          }
        } catch (chatNotificationError) {
          console.error("Chat notification error:", chatNotificationError);
        }
      }

      // Always respond after saving, whether notifications are enabled or not.
      return res.status(201).json({
        success: true,
        message: "Message sent successfully",
        savedMessage: newMessage
      });

    } catch (error) {
      console.error("Send message error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to send message",
        error: error.message
      });
    }
  });


  app.put(
  "/api/swap-requests/:id/local-exchange",
  requireAuth,
  requireNoHandToHandOverdue,
  async function (req, res) {
      try {
        const {
          user,
          meetingLocation,
          meetingDate,
          meetingTime,
          meetingNotes
        } = req.body;

        if (!user) {
          return res.status(400).json({
            success: false,
            message: "User information is required"
          });
        }

        if (!meetingLocation || !meetingDate || !meetingTime) {
          return res.status(400).json({
            success: false,
            message:
              "Meeting location, date and time are required"
          });
        }

        const request =
          await SwapRequest.findById(req.params.id);

        if (!request) {
          return res.status(404).json({
            success: false,
            message: "Swap request not found"
          });
        }


        if (
          request.owner !== user &&
          request.requester !== user
        ) {
          return res.status(403).json({
            success: false,
            message:
              "Only swap participants can set meeting details"
          });
        }


        if (
          request.status !== "Accepted" ||
          request.agreementStatus !== "Confirmed"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Meeting details can be added only after the swap is confirmed"
          });
        }


        request.exchangeMethod =
          "Local Exchange";

        request.meetingLocation =
          meetingLocation.trim();

        request.meetingDate =
          meetingDate;

        request.meetingTime =
          meetingTime;

        request.meetingNotes =
          meetingNotes
            ? meetingNotes.trim()
            : "";

        await request.save();

        res.json({
          success: true,
          message:
            "Hand-to-hand exchange details saved successfully",
          request: request
        });

      } catch (error) {

        console.error(
          "Local Exchange Setup Error:",
          error
        );

        res.status(500).json({
          success: false,
          message:
            "Failed to save hand-to-hand exchange details",
          error:
            error.message
        });
      }
    }
  );


 app.put(
  "/api/swap-requests/:id/local-exchange/complete",
  requireAuth,
  async function (req, res) {
      try {
        const {
          user
        } = req.body;

        if (!user) {
          return res.status(400).json({
            success: false,
            message:
              "User information is required"
          });
        }

        const request =
          await SwapRequest.findById(req.params.id);

        if (!request) {
          return res.status(404).json({
            success: false,
            message:
              "Swap request not found"
          });
        }


        if (
          request.owner !== user &&
          request.requester !== user
        ) {
          return res.status(403).json({
            success: false,
            message:
              "Only swap participants can confirm the exchange"
          });
        }


        if (
          request.exchangeMethod !==
          "Local Exchange"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "This swap is not using hand-to-hand exchange"
          });
        }


  if (request.owner === user) {
    request.ownerCompleted = true;
  }

  if (request.requester === user) {
    request.requesterCompleted = true;
  }
        if (
          request.ownerCompleted === true &&
          request.requesterCompleted === true
        ) {

          request.completionStatus =
            "Completed";

          request.agreementStatus =
            "Completed";

        } else {

          request.completionStatus =
            "Waiting for Both";
        }

        await request.save();

        res.json({
          success: true,

          message:
            request.completionStatus ===
            "Completed"
              ? "Hand-to-hand exchange completed successfully"
              : "Your exchange confirmation has been recorded. Waiting for the other person.",

          request:
            request
        });

      } catch (error) {

        console.error(
          "Local Exchange Completion Error:",
          error
        );

        res.status(500).json({
          success: false,
          message:
            "Failed to confirm hand-to-hand exchange",
          error:
            error.message
        });
      }
    }
  );

  app.post(
    "/api/auth/google",
    async function (req, res) {

      try {

        const credential = req.body.credential;

        if (!credential) {
          return res.status(400).json({
            success: false,
            message: "Google credential is required"
          });
        }

        const ticket =
          await googleClient.verifyIdToken({
            idToken: credential,
            audience:
              process.env.GOOGLE_CLIENT_ID
          });

        const payload =
          ticket.getPayload();

        const googleId = payload.sub;
        const email =
          String(payload.email || "")
            .trim()
            .toLowerCase();

        const name =
          payload.name ||
          payload.given_name ||
          "Google User";

        if (!googleId || !email) {
          return res.status(400).json({
            success: false,
            message:
              "Google account information is incomplete"
          });
        }

        let user =
          await User.findOne({
            email: email
          });

        
  if (!user) {

    user = new User({
      name: name,
      email: email,
      password: await bcrypt.hash(
        require("crypto").randomBytes(32).toString("hex"),
        10
      ),
      location: "Not specified"
    });
  await user.save();
  }
  // BLOCKED USER CHECK — AHI ADD KARVU
  if (user.status === "Blocked") {
    return res.status(403).json({
      success: false,
      message: "Your account has been blocked."
    });
  }
  const token = await createRefreshSession(user, res);


  await recordUserActivity({
    userId: user._id,
    userName: user.name,
    userEmail: user.email,
    activityType: "Login",
    description: "User logged in with Google"
  });
  res.json({
    success: true,
    message: "Google login successful",
    token: token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      location: user.location,
      role: user.role
    }
  });
      } catch (error) {

        console.error(
          "Google login error:",
          error
        );

        res.status(401).json({
          success: false,
          message:
            "Google authentication failed"
        });
      }
    }
  );

// GET: Logged-in user's personal profile

app.get("/api/user/profile", requireAuth, async function (req, res) {
  try {
    const user = await User.findById(req.user._id).select(
      "name email location profilePhoto bio profileCompleted createdAt"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const completedSwaps = await SwapRequest.countDocuments({
      $or: [
        { requesterEmail: user.email },
        { ownerEmail: user.email }
      ],
      completionStatus: "Completed"
    });

    return res.json({
      success: true,
      profile: {
        ...user.toObject(),
        completedSwaps: completedSwaps
      }
    });

  } catch (error) {
    console.error("Get Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load profile"
    });
  }
});



// PUT: Update logged-in user's personal profile
app.put("/api/user/profile", requireAuth, async function (req, res) {
  try {
    const { name, location, bio, profilePhoto } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Full name is required"
      });
    }

    if (!location || !location.trim()) {
      return res.status(400).json({
        success: false,
        message: "Location is required"
      });
    }

    if (bio && bio.length > 250) {
      return res.status(400).json({
        success: false,
        message: "Bio cannot exceed 250 characters"
      });
    }

    if (
      profilePhoto !== undefined &&
      typeof profilePhoto !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid profile photo"
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    user.name = name.trim();
    user.location = location.trim();
    user.bio = bio ? bio.trim() : "";

    if (profilePhoto !== undefined) {
      user.profilePhoto = profilePhoto;
    }

    user.profileCompleted = true;

    await user.save();

    return res.json({
      success: true,
      message: "Profile updated successfully",
      profile: {
        name: user.name,
        email: user.email,
        location: user.location,
        profilePhoto: user.profilePhoto,
        bio: user.bio,
        profileCompleted: user.profileCompleted,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error("Update Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update profile"
    });
  }
});

app.get("/api/clothes/:id/seller-profile", async function (req, res) {
  try {
    const clothing = await Clothing.findById(req.params.id);

    if (!clothing || !clothing.ownerEmail) {
      return res.status(404).json({
        success: false,
        message: "Seller not found."
      });
    }

    const seller = await User.findOne({
      email: clothing.ownerEmail.toLowerCase()
    }).select("name email location profilePhoto bio createdAt");

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found."
      });
    }

    const completedSwaps = await SwapRequest.countDocuments({
      $or: [
        { requesterEmail: seller.email },
        { ownerEmail: seller.email }
      ],
      completionStatus: "Completed"
    });

   const listings = await Clothing.find({
  ownerEmail: seller.email,
  _id: { $ne: clothing._id },
  status: "Available",
  $and: [
    {
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    },
    {
      $or: [
        { listingStatus: "Available" },
        { listingStatus: { $exists: false } }
      ]
    }
  ]
}).select("title brand category size condition location price description image status createdAt");
    return res.json({
      success: true,
      seller: {
        name: seller.name,
        location: seller.location,
        profilePhoto: seller.profilePhoto,
        bio: seller.bio,
        memberSince: seller.createdAt,
        completedSwaps: completedSwaps
      },
      listings: listings
    });

  } catch (error) {
    console.error("Seller profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load seller profile."
    });
  }
});


  app.post("/api/users", async function (req, res) {
    try {
      const {
        name,
        email,
        location,
        password
      } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "Name, email and password are required"
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      const existingUser = await User.findOne({
        email: normalizedEmail
      });

      if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "You are already registered. Please login with your existing account."
    });
  }

      const user = new User({
        name: name.trim(),
        email: normalizedEmail,
        password: await bcrypt.hash(password, 10),
        location: location
          ? location.trim()
          : "Not specified"
      });

      await user.save();

      await recordUserActivity({
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        activityType: "Registration",
        description: "New user registered"
      });

      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        user: user
      });

    } catch (error) {
      console.error("User registration error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to register user",
        error: error.message
      });
    }
  });

 
app.post("/api/auth/login", async function (req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Account not found. Please register first."
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password."
      });
    }

    if (user.status === "Blocked") {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked."
      });
    }

    const token = await createRefreshSession(user, res);

    await recordUserActivity({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      activityType: "Login",
      description: "User logged in"
    });

    return res.json({
      success: true,
      message: "Login successful",
      token: token,
      user: {
        name: user.name,
        email: user.email,
        location: user.location,
        role: user.role
      }
    });

  } catch (error) {
    console.error("User login error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to login",
      error: error.message
    });
  }
});

  mongoose
    .connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000
    })
    .then(function () {
      
// Run Hand-to-Hand deadline checks every minute.
setInterval(function () {
  checkHandToHandDeadlines();
}, 60 * 1000);

// Also check once immediately after database connection.
checkHandToHandDeadlines();

// Run Courier receiver deadline checks every minute.
setInterval(function () {
  checkCourierReceiverDeadlines();
}, 60 * 1000);

// Also check once immediately after database connection.
checkCourierReceiverDeadlines();


      console.log(
        "MongoDB connected successfully!"
      );

  app.post("/api/notifications", async function (req, res) {
    try {
      const notification = new Notification({
        recipient: req.body.recipient,
        sender: req.body.sender || "",
        senderName: req.body.senderName || "",
        type: req.body.type,
        title: req.body.title,
        message: req.body.message,
        relatedId: req.body.relatedId || "",
        isRead: false
      });

      const savedNotification = await notification.save();

      res.status(201).json({
        message: "Notification created successfully.",
        notification: savedNotification
      });

    } catch (error) {
      console.log("Notification creation error:", error);

      res.status(500).json({
        message: "Failed to create notification."
      });
    }
  });

  app.get("/api/notifications/:recipient", async function (req, res) {
    try {
      const notifications = await Notification.find({
        recipient: req.params.recipient
      }).sort({
        createdAt: -1
      });

      res.json({
        notifications: notifications
      });

    } catch (error) {
      console.log("Notification loading error:", error);

      res.status(500).json({
        message: "Failed to load notifications."
      });
    }
  });

  app.put("/api/notifications/:id/read", async function (req, res) {
    
    try {
      const notification = await Notification.findByIdAndUpdate(
        req.params.id,
        {
          isRead: true
        },
        {
          new: true
        }
      );

      if (!notification) {
        return res.status(404).json({
          message: "Notification not found."
        });
      }

      res.json({
        message: "Notification marked as read.",
        notification: notification
      });

    } catch (error) {
      console.log("Notification read error:", error);

      res.status(500).json({
        message: "Failed to update notification."
      });
    }
  }); 


  app.delete(
    "/api/notifications/:id",
    async function (req, res) {
      try {
        const id = req.params.id;

        if (
          !mongoose.Types.ObjectId.isValid(id)
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid notification ID"
          });
        }

        const notification =
          await Notification.findById(id);

        if (!notification) {
          return res.status(404).json({
            success: false,
            message:
              "Notification not found"
          });
        }

        await Notification.findByIdAndDelete(
          id
        );

        res.json({
          success: true,
          message:
            "Notification deleted successfully"
        });

      } catch (error) {
        console.error(
          "Notification delete error:",
          error
        );

        res.status(500).json({
          success: false,
          message:
            "Failed to delete notification"
        });
      }
    }
  );
  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "online" });
  });
     server.listen(
  PORT,
  function () {
    console.log(
      `ClothSwap Backend running on http://localhost:${PORT}`
    );
  }
);

    })
   .catch(function (error) {
  console.error("MongoDB connection failed:", error);
  process.exit(1);
});