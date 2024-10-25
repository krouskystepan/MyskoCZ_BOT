"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const CountingSchema = new mongoose_1.Schema({
    guildId: { type: String, required: true, unique: true },
    count: { type: Number, default: 0 },
    lastCounter: { type: String, default: '' },
    highestCount: { type: Number, default: 0 },
    specialNumbers: [
        {
            number: { type: Number, required: true },
            emoji: { type: String, required: true },
        },
    ],
});
exports.default = (0, mongoose_1.model)('Counting', CountingSchema);
