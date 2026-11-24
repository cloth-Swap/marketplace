const express = require("express");
const multer = require("multer");
const path = require("path");
const Clothing = require("../models/Clothing");

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1000000000) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage
});

router.post("/", upload.single("image"), async function (req, res) {
  try {
    const clothing = new Clothing({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      size: req.body.size,
      condition: req.body.condition,
      brand: req.body.brand,
      location: req.body.location,
      ownerName: req.body.ownerName || "User",
      image: req.file
        ? "/uploads/" + req.file.filename
        : ""
    });

    await clothing.save();

    res.status(201).json({
      success: true,
      message: "Clothing added successfully",
      clothing: clothing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get("/", async function (req, res) {
  try {
    const clothes = await Clothing.find().sort({
      createdAt: -1
    });

    res.json({
      success: true,
      clothes: clothes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;