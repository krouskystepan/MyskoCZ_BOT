"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const guildConfigurationSchema = new mongoose_1.Schema({
    guildId: {
        type: String,
        required: true,
    },
    suggestionChannelIds: {
        type: [String],
        default: [],
    },
    gameChannelIds: {
        type: [String],
        default: [],
    },
    countingChannelId: {
        type: String,
        default: '',
    },
});
exports.default = (0, mongoose_1.model)('GuildConfiguration', guildConfigurationSchema);
