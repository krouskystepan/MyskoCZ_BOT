"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const crypto_1 = require("crypto");
const suggestionSchema = new mongoose_1.Schema({
    suggestionId: {
        type: String,
        default: crypto_1.randomUUID,
    },
    authorId: {
        type: String,
        required: true,
    },
    guildId: {
        type: String,
        required: true,
    },
    messageId: {
        type: String,
        required: true,
        inique: true,
    },
    content: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        default: 'pending',
    },
    upvotes: {
        type: [String],
        default: [],
    },
    downvotes: {
        type: [String],
        default: [],
    },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)('Suggestion', suggestionSchema);
