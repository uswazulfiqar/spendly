const express = require("express");
const Workspace = require("../models/Workspace");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Authentication middleware
const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.userId = decoded.userId;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

// GET all workspaces for logged-in user
router.get("/", protect, async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      user: req.userId,
    }).sort({ createdAt: 1 });

    res.json(workspaces);
  } catch (error) {
    console.error("Get workspaces error:", error);

    res.status(500).json({
      message: "Failed to fetch workspaces",
    });
  }
});

// CREATE workspace
router.post("/", protect, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Workspace name is required",
      });
    }

    const workspace = await Workspace.create({
      name: name.trim(),
      user: req.userId,
    });

    res.status(201).json(workspace);
  } catch (error) {
    console.error("Create workspace error:", error);

    res.status(500).json({
      message: "Failed to create workspace",
    });
  }
});

// UPDATE workspace
router.put("/:id", protect, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Workspace name is required",
      });
    }

    const workspace = await Workspace.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.userId,
      },
      {
        name: name.trim(),
      },
      {
        new: true,
      }
    );

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    res.json(workspace);
  } catch (error) {
    console.error("Update workspace error:", error);

    res.status(500).json({
      message: "Failed to update workspace",
    });
  }
});

// DELETE workspace
router.delete("/:id", protect, async (req, res) => {
  try {
    const workspace = await Workspace.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    res.json({
      message: "Workspace deleted successfully",
    });
  } catch (error) {
    console.error("Delete workspace error:", error);

    res.status(500).json({
      message: "Failed to delete workspace",
    });
  }
});

module.exports = router;