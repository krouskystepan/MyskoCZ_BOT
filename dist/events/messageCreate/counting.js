"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Counting_1 = require("../../models/Counting");
const GuildConfiguration_1 = require("../../models/GuildConfiguration");
const guildConfigCache = {};
const countCache = {};
exports.default = async (message, client, handler) => {
    if (message.author.bot)
        return;
    const guildId = message.guildId;
    const userId = message.author.id;
    const userMessage = message.content.trim();
    let countingChannelId = guildConfigCache[guildId];
    if (!countingChannelId) {
        const guildConfiguration = await GuildConfiguration_1.default.findOne({
            guildId: guildId,
        });
        if (!guildConfiguration?.countingChannelId)
            return;
        countingChannelId = guildConfiguration.countingChannelId;
        guildConfigCache[guildId] = countingChannelId;
    }
    if (countingChannelId !== message.channelId)
        return;
    const count = parseInt(userMessage, 10);
    if (isNaN(count)) {
        await resetCount(guildId, message, 'Zpráva neobsahuje číslo.');
        await message.react('❌');
        return;
    }
    if (!countCache[guildId]) {
        const currentCounting = await Counting_1.default.findOne({ guildId });
        countCache[guildId] = {
            count: currentCounting?.count || 0,
            lastCounter: currentCounting?.lastCounter || '',
            highestCount: currentCounting?.highestCount || 0,
        };
    }
    const { count: currentCount, lastCounter, highestCount } = countCache[guildId];
    if (userId === lastCounter) {
        const success = Math.random() < 0.5;
        if (!success) {
            await resetCount(guildId, message, 'Nemůžeš počítat dvakrát za sebou. (Máš 50% šanci na úspěch.)');
            await message.react('❌');
            return;
        }
    }
    const nextNumber = currentCount + 1;
    if (count !== nextNumber) {
        await resetCount(guildId, message, 'Špatné číslo.');
        await message.react('❌');
        return;
    }
    countCache[guildId].count = nextNumber;
    countCache[guildId].lastCounter = userId;
    if (nextNumber > highestCount) {
        countCache[guildId].highestCount = nextNumber;
        await message.react('☑️');
    }
    else {
        await message.react('✅');
    }
    await Counting_1.default.updateOne({ guildId }, {
        count: nextNumber,
        lastCounter: userId,
        highestCount: countCache[guildId].highestCount,
    }, { upsert: true });
};
const resetCount = async (guildId, message, reason) => {
    countCache[guildId] = {
        count: 0,
        lastCounter: '',
        highestCount: countCache[guildId]?.highestCount || 0,
    };
    await Counting_1.default.updateOne({ guildId }, { count: 0, lastCounter: '' });
    message.reply(`<@${message.author.id}>\n__**Počítání bylo resetováno.**__\n\n**Důvod:** ${reason}\nDosavadní rekord: **${countCache[guildId].highestCount}**\nDalší číslo je: **1**.`);
};
