"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.options = exports.data = void 0;
exports.run = run;
const discord_js_1 = require("discord.js");
const utils_1 = require("../../utils/utils");
exports.data = {
    name: 'games-config',
    description: 'Nastav konfiguraci serveru pro herní příkazy.',
    contexts: [0],
    options: [
        {
            name: 'add',
            description: 'Přídání kanálu pro hry.',
            type: discord_js_1.ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'channel',
                    description: 'Kanál pro hry.',
                    type: discord_js_1.ApplicationCommandOptionType.Channel,
                    channel_types: [discord_js_1.ChannelType.GuildText],
                    required: true,
                },
            ],
        },
        {
            name: 'remove',
            description: 'Odebrání kanálu pro hry.',
            type: discord_js_1.ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'channel',
                    description: 'Kanál pro hry.',
                    type: discord_js_1.ApplicationCommandOptionType.Channel,
                    channel_types: [discord_js_1.ChannelType.GuildText],
                    required: true,
                },
            ],
        },
        {
            name: 'remove-id',
            description: 'Odebrání kanálu pro hry skrze ID.',
            type: discord_js_1.ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'channel-id',
                    description: 'Kanál pro hry ID.',
                    type: discord_js_1.ApplicationCommandOptionType.String,
                    required: true,
                },
            ],
        },
        {
            name: 'channels',
            description: 'Zobrazí kanály pro hry.',
            type: discord_js_1.ApplicationCommandOptionType.Subcommand,
        },
    ],
};
exports.options = {
    userPermissions: ['Administrator'],
    botPermissions: ['Administrator'],
    deleted: false,
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
        if (guildConfiguration.gameChannelIds.includes(channel.id)) {
            return await interaction.reply(`Kanál ${channel} už je nastavený pro hry.`);
        }
        guildConfiguration.gameChannelIds.push(channel.id);
        await guildConfiguration.save();
        return await interaction.reply(`Kanál ${channel} byl úspěšně přidán pro hry.`);
    }
    if (subcommand === 'remove') {
        const channel = options.getChannel('channel');
        if (!channel) {
            return interaction.reply({
                content: 'Něco se pokazilo.',
            });
        }
        if (!guildConfiguration.gameChannelIds.includes(channel.id)) {
            return await interaction.reply(`Kanál ${channel} není nastavený pro hry.`);
        }
        guildConfiguration.gameChannelIds =
            guildConfiguration.gameChannelIds.filter((id) => id !== channel.id);
        await guildConfiguration.save();
        return await interaction.reply(`Kanál ${channel} byl úspěšně odebrán z her.`);
    }
    if (subcommand === 'remove-id') {
        const channelId = options.getString('channel-id');
        if (!channelId) {
            return interaction.reply({
                content: 'Něco se pokazilo.',
            });
        }
        if (!guildConfiguration.gameChannelIds.includes(channelId)) {
            return await interaction.reply(`Kanál s ID ${channelId} není nastavený pro hry.`);
        }
        guildConfiguration.gameChannelIds =
            guildConfiguration.gameChannelIds.filter((id) => id !== channelId);
        await guildConfiguration.save();
        return await interaction.reply(`Kanál s ID ${channelId} byl úspěšně odebrán z her.`);
    }
    if (subcommand === 'channels') {
        const channels = guildConfiguration.gameChannelIds.map((id) => `<#${id}> (ID: ${id})`);
        if (channels.length === 0) {
            return await interaction.reply({
                content: `Není nastavený žádný kanál pro hry.`,
            });
        }
        return await interaction.reply({
            content: `Kanály pro hry: \n${channels.join('\n')}`,
        });
    }
}
