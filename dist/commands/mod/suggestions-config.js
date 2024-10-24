"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.options = exports.data = void 0;
exports.run = run;
const discord_js_1 = require("discord.js");
const Suggestion_1 = require("../../models/Suggestion");
const utils_1 = require("../../utils/utils");
exports.data = {
    name: 'suggestions-config',
    description: 'Nastav konfiguraci serveru pro návrhy.',
    contexts: [0],
    options: [
        {
            name: 'add',
            description: 'Přídání kanálu pro návrhy.',
            type: discord_js_1.ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'channel',
                    description: 'Kanál pro návrhy.',
                    type: discord_js_1.ApplicationCommandOptionType.Channel,
                    channel_types: [discord_js_1.ChannelType.GuildText],
                    required: true,
                },
            ],
        },
        {
            name: 'remove',
            description: 'Odebrání kanálu pro návrhy.',
            type: discord_js_1.ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'channel',
                    description: 'Kanál pro návrhy.',
                    type: discord_js_1.ApplicationCommandOptionType.Channel,
                    channel_types: [discord_js_1.ChannelType.GuildText],
                    required: true,
                },
            ],
        },
        {
            name: 'remove-id',
            description: 'Odebrání kanálu pro návrhy skrze ID.',
            type: discord_js_1.ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'channel-id',
                    description: 'Kanál pro návrhy ID.',
                    type: discord_js_1.ApplicationCommandOptionType.String,
                    required: true,
                },
            ],
        },
        {
            name: 'channels',
            description: 'Zobrazí kanály pro návrhy.',
            type: discord_js_1.ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'check',
            description: 'Vypíše, kdo jak hlasoval pro daný návrh.',
            type: discord_js_1.ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'id',
                    description: 'ID návrhu.',
                    type: discord_js_1.ApplicationCommandOptionType.String,
                    required: true,
                },
            ],
        },
    ],
};
exports.options = {
    userPermissions: ['Administrator'],
    botPermissions: ['Administrator'],
    deleted: true,
};
async function run({ interaction, client, handler }) {
    if (!interaction.guildId) {
        return interaction.reply({
            content: 'Něco se pokokazilo.',
        });
    }
    const guildConfiguration = await (0, utils_1.checkGuildConfiguration)(interaction.guildId);
    const options = interaction.options;
    const subcommand = options.getSubcommand();
    if (subcommand === 'add') {
        const channel = options.getChannel('channel');
        if (!channel) {
            return interaction.reply({
                content: 'Něco se pokazilo.',
            });
        }
        if (guildConfiguration.suggestionChannelIds.includes(channel.id)) {
            return await interaction.reply(`Kanál ${channel} už je nastavený pro návrhy.`);
        }
        guildConfiguration.suggestionChannelIds.push(channel.id);
        await guildConfiguration.save();
        return await interaction.reply(`Kanál ${channel} byl úspěšně přidán pro návrhy.`);
    }
    if (subcommand === 'remove') {
        const channel = options.getChannel('channel');
        if (!channel) {
            return interaction.reply({
                content: 'Něco se pokazilo.',
            });
        }
        if (!guildConfiguration.suggestionChannelIds.includes(channel.id)) {
            return await interaction.reply(`Kanál ${channel} není nastavený pro návrhy.`);
        }
        guildConfiguration.suggestionChannelIds =
            guildConfiguration.suggestionChannelIds.filter((id) => id !== channel.id);
        await guildConfiguration.save();
        return await interaction.reply(`Kanál ${channel} byl úspěšně odebrán z návrhů.`);
    }
    if (subcommand === 'remove-id') {
        const channelId = options.getString('channel-id');
        if (!channelId) {
            return interaction.reply({
                content: 'Něco se pokazilo.',
            });
        }
        if (!guildConfiguration.suggestionChannelIds.includes(channelId)) {
            return await interaction.reply(`Kanál s ID ${channelId} není nastavený pro návrhy.`);
        }
        guildConfiguration.suggestionChannelIds =
            guildConfiguration.suggestionChannelIds.filter((id) => id !== channelId);
        await guildConfiguration.save();
        return await interaction.reply(`Kanál s ID ${channelId} byl úspěšně odebrán z návrhů.`);
    }
    if (subcommand === 'channels') {
        const channels = guildConfiguration.suggestionChannelIds.map((id) => `<#${id}> (ID: ${id})`);
        if (channels.length === 0) {
            return await interaction.reply({
                content: `Není nastavený žádný kanál pro návrhy.`,
            });
        }
        return await interaction.reply({
            content: `Kanály pro návrhy: \n${channels.join('\n')}`,
        });
    }
    if (subcommand === 'check') {
        const id = options.getString('id');
        const suggestion = await Suggestion_1.default.findOne({
            messageId: id,
        });
        if (!suggestion) {
            return await interaction.reply({
                content: 'Návrh nebyl nalezen.',
                ephemeral: true,
            });
        }
        const guild = interaction.guild;
        if (!guild) {
            return await interaction.reply({
                content: 'Tento příkaz lze použít pouze na serveru.',
                ephemeral: true,
            });
        }
        const upvoteUsers = await Promise.all(suggestion.upvotes.map(async (userId) => {
            const member = await guild.members.fetch(userId);
            if (member.nickname) {
                return `${member.nickname} (${member.user.username})`;
            }
            return member.user.username;
        }));
        const downvoteUsers = await Promise.all(suggestion.downvotes.map(async (userId) => {
            const member = await guild.members.fetch(userId);
            if (member.nickname) {
                return `${member.nickname} (${member.user.username})`;
            }
            return member.user.username;
        }));
        return await interaction.reply({
            content: `
  Hlasování pro návrh \`${suggestion.content}\`: 
  \n👍 - ${upvoteUsers.join(', ')}
  \n👎 - ${downvoteUsers.join(', ')}
`,
        });
    }
}
