"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const discord_js_1 = require("discord.js");
const client = new discord_js_1.Client({
    intents: ['Guilds', 'GuildMembers', 'GuildMessages', 'MessageContent'],
});
client.on('ready', (c) => {
    console.log(`${c.user.tag} is online!`);
});
client.login(process.env.DISCORD_TOKEN);
// let count = 0
// let countChannelId = '1297661219007758356'
// client.on('messageCreate', async (message) => {
//   if (message.channel.id !== countChannelId || message.author.bot) return
//   const number = parseInt(message.content, 10)
//   if (isNaN(number)) return
//   if (number === count + 1) {
//     count++
//     await message.react('✅')
//   } else {
//     count = 0
//     await message.react('❌')
//     message.channel.send('Count reset to 0!')
//   }
// })
