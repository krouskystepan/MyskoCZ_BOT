"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkGuildConfiguration = exports.connectToDatabase = void 0;
const mongoose_1 = require("mongoose");
const GuildConfiguration_1 = require("../models/GuildConfiguration");
const connectToDatabase = async () => {
    try {
        if (!process.env.MONGO_URI)
            throw new Error('MONGO_URI is not defined');
        mongoose_1.default.set('strictQuery', false);
        await mongoose_1.default.connect(process.env.MONGO_URI);
        console.log('✅ Connected to the database');
    }
    catch (error) {
        console.error('Error connecting to the database:', error);
    }
};
exports.connectToDatabase = connectToDatabase;
const checkGuildConfiguration = async (guildId) => {
    let guildConfiguration = await GuildConfiguration_1.default.findOne({
        guildId,
    });
    if (!guildConfiguration) {
        guildConfiguration = new GuildConfiguration_1.default({
            guildId,
        });
    }
    return guildConfiguration;
};
exports.checkGuildConfiguration = checkGuildConfiguration;
