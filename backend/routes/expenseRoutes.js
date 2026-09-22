const express = require("express");
const Expense = require("../models/Expense");
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

// GET transactions for selected workspace
router.get("/", protect, async (req, res) => {
  try {
    const { workspaceId } = req.query;

    if (!workspaceId) {
      return res.status(400).json({
        message: "Workspace ID is required",
      });
    }

    const expenses = await Expense.find({
      workspace: workspaceId,
    }).sort({ date: -1 });

    res.json(expenses);
  } catch (error) {
    console.error("Get transactions error:", error);

    res.status(500).json({
      message: "Failed to fetch transactions",
    });
  }
});

// CREATE transaction
router.post("/", protect, async (req, res) => {
  try {
    const { workspaceId } = req.body;

    if (!workspaceId) {
      return res.status(400).json({
        message: "Workspace ID is required",
      });
    }

    const expense = new Expense({
      ...req.body,
      workspace: workspaceId,
    });

    const savedExpense = await expense.save();

    res.status(201).json(savedExpense);
  } catch (error) {
    console.error("Create transaction error:", error);

    res.status(400).json({
      message: "Failed to create transaction",
      error: error.message,
    });
  }
});

// DELETE transaction
router.delete("/:id", protect, async (req, res) => {
  try {
    const deletedExpense = await Expense.findByIdAndDelete(
      req.params.id
    );

    if (!deletedExpense) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    res.json({
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    console.error("Delete transaction error:", error);

    res.status(500).json({
      message: "Failed to delete transaction",
    });
  }
});

module.exports = router;