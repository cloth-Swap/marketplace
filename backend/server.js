const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();
const { OAuth2Client } = require("google-auth-library");

const Clothing = require("./models/Clothing");
const SwapRequest = require("./models/SwapRequest");
const Message = require("./models/Message");
const User = require("./models/User");
const Dispute = require("./models/Dispute");
const shipmentRoutes = require("./routes/ShipmentRoutes.js");
const Notification = require("./models/Notification");

const app = express();
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

const PORT = process.env.PORT || 5000;

/* =====================================================
   MIDDLEWARE
===================================================== */

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/api/shipments", shipmentRoutes);
/* =====================================================
   ADMIN AUTHENTICATION
===================================================== */

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
        message: "Your account has been blocked"
      });
    }

    if (user.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      });
    }

    req.user = user;

    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token"
    });
  }
}

/* =====================================================
   HOME
===================================================== */

app.get("/", function (req, res) {
  res.json({
    success: true,
    message: "ClothSwap Backend is running!"
  });
});

/* =====================================================
   CLOTHING
===================================================== */

/* GET ALL CLOTHES */

app.get("/api/clothes", async function (req, res) {
  try {
    const clothes = await Clothing.find().sort({
      createdAt: -1
    });

    res.json(clothes);

  } catch (error) {
    console.error("Failed to fetch clothes:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch clothes",
      error: error.message
    });
  }
});
/* =====================================================
   DISPUTE - REPORT A DISPUTE
===================================================== */
app.post("/api/disputes", async function (req, res) {
  try {
    const {
      swapRequestId,
      reportedBy,
      reportedAgainst,
      reason,
      description
    } = req.body;

    if (!swapRequestId || !reportedBy || !reason) {
      return res.status(400).json({
        success: false,
        message: "Swap request, reporter and reason are required"
      });
    }

    const dispute = await Dispute.create({
      swapRequestId: swapRequestId,
      reportedBy: reportedBy,
      reportedAgainst: reportedAgainst || "Not specified",
      reason: reason,
      description: description || ""
    });

    res.status(201).json({
      success: true,
      message: "Dispute reported successfully",
      dispute: dispute
    });

  } catch (error) {
    console.error("Dispute report error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to report dispute",
      error: error.message
    });
  }
});
//  ADMIN - GET ALL DISPUTES
app.get("/api/admin/disputes", requireAdmin, async function (req, res) {
  try {
    const disputes = await Dispute.find()
      .populate("swapRequestId")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      disputes: disputes
    });

  } catch (error) {
    console.error("Admin disputes loading error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load disputes",
      error: error.message
    });
  }
});
/* =====================================================
   ADMIN - RESOLVE DISPUTE
===================================================== */
app.put("/api/admin/disputes/:id/resolve", requireAdmin, async function (req, res) {
  try {
    const id = req.params.id;
    const adminNote = req.body.adminNote || "";

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid dispute ID"
      });
    }

    const dispute = await Dispute.findByIdAndUpdate(
      id,
      {
        status: "Resolved",
        adminNote: adminNote,
        resolvedAt: new Date()
      },
      {
        new: true
      }
    );

    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: "Dispute not found"
      });
    }

    res.json({
      success: true,
      message: "Dispute resolved successfully",
      dispute: dispute
    });

  } catch (error) {
    console.error("Dispute resolve error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to resolve dispute",
      error: error.message
    });
  }
});



/* GET SINGLE CLOTHING */

app.get("/api/clothes/:id", async function (req, res) {
  try {

    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid clothing ID"
      });
    }

    const clothing =
      await Clothing.findById(id);

    if (!clothing) {
      return res.status(404).json({
        success: false,
        message: "Clothing not found"
      });
    }

    res.json(clothing);

  } catch (error) {

    console.error(
      "Failed to fetch clothing:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch clothing",
      error: error.message
    });
  }
});


/* CREATE CLOTHING */

app.post("/api/clothes", async function (req, res) {
  try {
    const {
      title,
      category,
      size,
      condition,
      location,
      price,
      description,
      image,
      owner,
      ownerEmail
    } = req.body;

    const clothing =
      new Clothing({
        title,
        category,
        size,
        condition,
        location,
        price,
        description,
        image,
        owner,
        ownerEmail
      });

    await clothing.save();

    res.status(201).json({
      success: true,
      message: "Clothing listed successfully",
      clothing
    });

  } catch (error) {

    console.error(
      "Failed to create clothing:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to create clothing",
      error: error.message
    });
  }
});
/* =====================================================
   ADMIN - GET ALL USERS
===================================================== */

app.get("/api/admin/users", requireAdmin, async function (req, res) {
  try {
    const users = await User.find()
      .select("-__v")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error("Admin users loading error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load users",
      error: error.message
    });
  }
});
/* =====================================================
   ADMIN - BLOCK / UNBLOCK USER
===================================================== */

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
});
/* =====================================================
   ADMIN - DELETE USER
===================================================== */
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
});
/* =====================================================
   DELETE CLOTHING
===================================================== */

app.delete("/api/clothes/:id", async function (req, res) {
  try {
    const id = req.params.id;
    const user = req.body.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid clothing ID"
      });
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User is required"
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
      String(clothing.owner || "").toLowerCase() !==
      String(user || "").toLowerCase()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can delete only your own clothing"
      });
    }

    await Clothing.findByIdAndDelete(id);

    await SwapRequest.deleteMany({
      clothingId: id
    });

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
});
/* =====================================================
   ADMIN DELETE CLOTHING
===================================================== */

app.delete(
  "/api/admin/clothes/:id",
  requireAdmin,
  async function (req, res) {
    try {
      const id = req.params.id;
      const adminEmail = req.body.adminEmail;

i

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid clothing ID"
        });
      }


      if (
        !adminEmail ||
        String(adminEmail).trim().toLowerCase() !==
          "kuhu2109@gmail.com"
      ) {
        return res.status(403).json({
          success: false,
          message: "Admin access required"
        });
      }

      /* FIND CLOTHING */

      const clothing =
        await Clothing.findById(id);

      if (!clothing) {
        return res.status(404).json({
          success: false,
          message: "Clothing not found"
        });
      }

      /* DELETE CLOTHING */

      await Clothing.findByIdAndDelete(id);

      /* DELETE RELATED SWAP REQUESTS */

      await SwapRequest.deleteMany({
        clothingId: id
      });

      res.json({
        success: true,
        message: "Clothing listing removed by admin"
      });

    } catch (error) {
      console.error(
        "Admin delete clothing error:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Failed to remove clothing listing",
        error: error.message
      });
    }
  }
);
//  SWAP REQUEST


/* CREATE SWAP REQUEST */

app.post(
  "/api/swap-requests",
  async function (req, res) {

    try {

      const {
        clothingId,
        requester,
        message
      } = req.body;

      const requesterEmailFromUser =
        String(
          req.body.requesterEmail || ""
        )
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


      /* USER CANNOT REQUEST OWN ITEM */

      if (
        clothing.owner === requester
      ) {

        return res.status(400).json({
          success: false,
          message:
            "You cannot request your own clothing"
        });
      }


      /* CHECK DUPLICATE PENDING REQUEST */

      const existingRequest =
        await SwapRequest.findOne({
          clothingId: clothingId,
          requester: requester,
          status: "Pending"
        });


      if (existingRequest) {

        return res.status(400).json({
          success: false,
          message:
            "You already sent a request for this clothing"
        });
      }


      /* CREATE SWAP REQUEST */

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


      /* =====================================================
         CREATE NOTIFICATION FOR EXACT OWNER EMAIL
      ===================================================== */

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
);
/* =====================================================
   GET ALL SWAP REQUESTS
===================================================== */

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


      /*
        Email comparison is case-insensitive.
        This keeps exact email identity while handling
        uppercase/lowercase differences.
      */

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
              ownerEmail:
                emailRegex
            },
            {
              requesterEmail:
                emailRegex
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
);
/* =====================================================
   ADMIN - GET ALL SWAP REQUESTS
===================================================== */

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
);
/* =====================================================
   ACCEPT / REJECT SWAP REQUEST
===================================================== */

app.put(
  "/api/swap-requests/:id",
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


      /* VALID STATUS */

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


      request.status =
        status;


      /* IF REJECTED, RESET AGREEMENT */

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


      /* IF ACCEPTED */

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
/* NOTIFY REQUESTER */

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
);


/* =====================================================
   AGREE TO SWAP
===================================================== */

app.put(
  "/api/swap-requests/:id/agree",
  async function (req, res) {

    try {

      const id =
        req.params.id;

      const user =
        req.body.user;

      const userEmail =
          req.body.userEmail || "";


      /* CHECK ID */

      if (
        !mongoose.Types.ObjectId.isValid(id)
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid swap request ID"
        });
      }


      /* CHECK USER */

      if (!user) {

        return res.status(400).json({

          success: false,

          message:
            "User is required"
        });
      }


      /* FIND REQUEST */

      const request =
        await SwapRequest.findById(id);


      if (!request) {

        return res.status(404).json({

          success: false,

          message:
            "Swap request not found"
        });
      }


      /* ONLY ACCEPTED REQUEST */

      if (
        request.status !== "Accepted"
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Agreement is available only after the request is accepted"
        });
      }


      /* USER MUST BE OWNER OR REQUESTER */

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


     /* OWNER AGREES */

if (
  isOwnerByEmail ||
  isOwnerByName
) {
  request.ownerAgreed = true;
}


/* REQUESTER AGREES */

if (
  isRequesterByEmail ||
  isRequesterByName
) {
  request.requesterAgreed = true;
}

      /* UPDATE AGREEMENT STATUS */

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
);
/* ================= SELECT EXCHANGE METHOD ================= */

app.put(
  "/api/swap-requests/:id/exchange-method",
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

      /* Only accepted + confirmed swaps */

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

      /* Only swap participants */

      if (
        request.owner !== user &&
        request.requester !== user
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not a participant of this swap"
        });
      }

      /* Do not allow changing the selected method */

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
);
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

    if (request.agreementStatus !== "Confirmed") {
      return res.status(400).json({
        success: false,
        message: "Swap must be confirmed before marking as completed"
      });
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
    } else {
      request.completionStatus = "Waiting for Both";
    }

    await request.save();

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
});
/* =====================================================
   GET SINGLE SWAP REQUEST
===================================================== */

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
);
/* =====================================================
   DELETE SWAP REQUEST
===================================================== */

app.delete(
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

          message:
            "Invalid swap request ID"
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


      /* DELETE RELATED MESSAGES */

      await Message.deleteMany({
        swapRequestId:
          request._id
      });


      await SwapRequest.findByIdAndDelete(
        id
      );


      res.json({

        success: true,

        message:
          "Swap request deleted successfully"
      });

    } catch (error) {

      console.error(
        "Delete swap request error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "Failed to delete swap request",

        error:
          error.message
      });
    }
  }
);


/* =====================================================
   CHAT MESSAGES
===================================================== */


/* GET MESSAGES */

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


/* SEND MESSAGE */

app.post(
  "/api/messages",
  async function (req, res) {

    try {

      const {
        swapRequestId,
        sender,
        text
      } = req.body;


      if (
        !swapRequestId ||
        !sender ||
        !text
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Swap request ID, sender and text are required"
        });
      }


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


      const request =
        await SwapRequest.findById(
          swapRequestId
        );


      if (!request) {

        return res.status(404).json({

          success: false,

          message:
            "Swap request not found"
        });
      }


      /* ONLY OWNER OR REQUESTER CAN CHAT */

      if (
        request.owner !== sender &&
        request.requester !== sender
      ) {

        return res.status(403).json({

          success: false,

          message:
            "You are not part of this swap"
        });
      }


      /* DETERMINE RECEIVER */

      let receiver;


      if (
        request.owner === sender
      ) {

        receiver =
          request.requester;

      } else {

        receiver =
          request.owner;
      }


      const newMessage =
        new Message({

          swapRequestId:
            swapRequestId,

          sender:
            sender,

          receiver:
            receiver,

          text:
            text.trim()
        });


      await newMessage.save();
      if (req.body.chatNotificationsEnabled === true) {
            /* =====================================================
         CREATE CHAT NOTIFICATION
      ===================================================== */

      try {

        let receiverEmail = "";

        if (
          request.owner === sender
        ) {

          receiverEmail =
            String(
              request.requesterEmail || ""
            )
              .trim()
              .toLowerCase();

        } else {

          receiverEmail =
            String(
              request.ownerEmail || ""
            )
              .trim()
              .toLowerCase();
        }


        const senderEmail =
          request.owner === sender
            ? String(
                request.ownerEmail || ""
              )
                .trim()
                .toLowerCase()
            : String(
                request.requesterEmail || ""
              )
                .trim()
                .toLowerCase();


        if (
          receiverEmail &&
          senderEmail &&
          receiverEmail !== senderEmail
        ) {

          await Notification.create({

            recipient:
              receiverEmail,

            sender:
              senderEmail,

            senderName:
              sender,

            type:
              "chat",

            title:
              "New Chat Message",

            message:
              sender +
              " sent you a new message about your swap.",

            relatedId:
              String(
                swapRequestId
              ),

            isRead:
              false
          });

        }

      } catch (
        chatNotificationError
      ) {

        console.error(
          "Chat notification error:",
          chatNotificationError
        );

      }


      res.status(201).json({

        success: true,

        message:
          "Message sent successfully",

        savedMessage:
          newMessage
      });

    }}
     catch (error) {

      console.error(
        "Send message error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "Failed to send message",

        error:
          error.message
      });
    }
  }
);
/* =====================================================
   HAND-TO-HAND EXCHANGE
   SAVE MEETING DETAILS
===================================================== */

app.put(
  "/api/swap-requests/:id/local-exchange",
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

      /* ================= PARTICIPANT CHECK ================= */

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

      /* ================= CONFIRMED SWAP CHECK ================= */

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

      /* ================= EXCHANGE METHOD ================= */

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


/* =====================================================
   HAND-TO-HAND EXCHANGE
   OWNER / REQUESTER CONFIRMATION
===================================================== */

app.put(
  "/api/swap-requests/:id/local-exchange/complete",
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

      /* ================= PARTICIPANT CHECK ================= */

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

      /* ================= LOCAL EXCHANGE CHECK ================= */

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

      /* ================= CONFIRM USER ================= */

if (
  isOwnerByEmail ||
  (!request.ownerEmail && isOwnerByName)
) {
  request.ownerAgreed =
    true;
}

if (
  isRequesterByEmail ||
  (!request.requesterEmail && isRequesterByName)
) {
  request.requesterAgreed =
    true;
}

/* ================= CHECK BOTH ================= */
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
// GOOGLE SIGN IN

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
          location: "Not specified"
        });

        await user.save();

      }

     const token = jwt.sign(
  {
    userId: user._id
  },
  process.env.JWT_SECRET,
  {
    expiresIn: "7d"
  }
);

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
  // USER REGISTRATION

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
  existingUser.name = name.trim();
 existingUser.password = await bcrypt.hash(password, 10);
  existingUser.location = location
    ? location.trim()
    : "Not specified";

  await existingUser.save();

  return res.status(200).json({
    success: true,
    message: "User registered successfully",
    user: existingUser
  });
}

    const user = new User({
  name: name.trim(),
  email: email.trim().toLowerCase(),
  password: await bcrypt.hash(password, 10),
  location: location
    ? location.trim()
    : "Not specified"
});

    await user.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: user
    });

  } catch (error) {
    console.error("User registration error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to register user",
      error: error.message
    });
  }
});
//  USER LOGIN

app.post("/api/auth/login", async function (req, res) {
  try {
    const {
      name,
      email,
      password
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email and password are required"
      });
    }

    const user = await User.findOne({
      name: name.trim(),
      email: email.trim().toLowerCase()
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Please register first or check your username and email."
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

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

    const token = jwt.sign(
  {
    userId: user._id
  },
  process.env.JWT_SECRET,
  {
    expiresIn: "7d"
  }
);

res.json({
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

    res.status(500).json({
      success: false,
      message: "Failed to login",
      error: error.message
    });
  }
});
/* =====================================================
   DATABASE CONNECTION
===================================================== */

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 15000
  })
  .then(function () {

    console.log(
      "MongoDB connected successfully!"
    );
// =====================================================
// NOTIFICATION ROUTES
// =====================================================

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
/* =====================================================
   DELETE NOTIFICATION
===================================================== */

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

    app.listen(
      PORT,
      function () {

        console.log(
          `ClothSwap Backend running on http://localhost:${PORT}`
        );
      }
    );

  })
  .catch(function (error) {

    console.error(
      "MongoDB connection failed:",
      error
    );
  });