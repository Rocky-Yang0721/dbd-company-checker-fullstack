const mongoose = require("mongoose");

const searchHistorySchema = new mongoose.Schema(
  {
    actionType: {
      type: String,
      enum: ["IMPORT", "BULK_SEARCH", "PASTE_SEARCH"],
      required: true,
    },

    fileName: {
      type: String,
      default: "",
      trim: true,
    },

    totalItems: {
      type: Number,
      default: 0,
      min: 0,
    },

    foundItems: {
      type: Number,
      default: 0,
      min: 0,
    },

    notFoundItems: {
      type: Number,
      default: 0,
      min: 0,
    },

    importedItems: {
      type: Number,
      default: 0,
      min: 0,
    },

    updatedItems: {
      type: Number,
      default: 0,
      min: 0,
    },

    skippedItems: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["COMPLETED", "FAILED"],
      default: "COMPLETED",
    },

    message: {
      type: String,
      default: "",
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

searchHistorySchema.index({
  createdBy: 1,
  createdAt: -1,
});

const SearchHistory = mongoose.model(
  "SearchHistory",
  searchHistorySchema
);

module.exports = SearchHistory;