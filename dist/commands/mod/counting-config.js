"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.options = exports.data = void 0;
exports.run = run;
const discord_js_1 = require("discord.js");
const utils_1 = require("../../utils/utils");
const Counting_1 = require("../../models/Counting");
exports.data = {
    name: 'counting-config',
    description: 'Nastav konfiguraci serveru pro počítání.',
    contexts: [0],
    options: [
        {
            name: 'add',
            description: 'Přídání kanálu pro počítaní.',
            type: discord_js_1.ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'channel',
                    description: 'Kanál pro počítání.',
                    type: discord_js_1.ApplicationCommandOptionType.Channel,
                    channel_types: [discord_js_1.ChannelType.GuildText],
                    required: true,
                },
            ],
        },
        {
            name: 'remove',
            description: 'Odebrání kanálu pro počítání.',
            type: discord_js_1.ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'channel',
                    description: 'Kanál pro počítaní.',
                    type: discord_js_1.ApplicationCommandOptionType.Channel,
                    channel_types: [discord_js_1.ChannelType.GuildText],
                    required: true,
                },
            ],
        },
        {
            name: 'remove-id',
            description: 'Odebrání kanálu pro počítání skrze ID.',
            type: discord_js_1.ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'channel-id',
                    description: 'Kanál pro počítání ID.',
                    type: discord_js_1.ApplicationCommandOptionType.String,
                    required: true,
                },
            ],
        },
        {
            name: 'channel',
            description: 'Zobrazí kanál pro počítání.',
            type: discord_js_1.ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'set-count',
            description: 'Nastaví počítání na zadané číslo.',
            type: discord_js_1.ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'number',
                    description: 'Číslo',
                    type: discord_js_1.ApplicationCommandOptionType.Number,
                    required: true,
                },
            ],
        },
        {
            name: 'add-special-number',
            description: 'Nastaví speciální emoji pro zadané číslo.',
            type: discord_js_1.ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'number',
                    description: 'Číslo',
                    type: discord_js_1.ApplicationCommandOptionType.Number,
                    required: true,
                },
                {
                    name: 'emoji',
                    description: 'Emoji',
                    type: discord_js_1.ApplicationCommandOptionType.String,
                    required: true,
                },
            ],
        },
        {
            name: 'remove-special-number',
            description: 'Smaže speciální emoji pro zadané číslo.',
            type: discord_js_1.ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'number',
                    description: 'Číslo',
                    type: discord_js_1.ApplicationCommandOptionType.Number,
                    required: true,
                },
            ],
        },
        {
            name: 'special-numbers',
            description: 'Zobrazí speciální čísla s emoji.',
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
    if (subcommand === 'channel') {
        const channel = options.getChannel('channel');
        if (!channel) {
            return interaction.reply({
                content: 'Něco se pokazilo.',
            });
        }
        if (guildConfiguration.countingChannelId === channel.id) {
            return await interaction.reply(`Kanál ${channel} už je nastavený pro počítání.`);
        }
        if (guildConfiguration.countingChannelId) {
            return await interaction.reply(`Pro počítání nemůže být nastaven více než jeden kanál.`);
        }
        guildConfiguration.countingChannelId = channel.id;
        await guildConfiguration.save();
        return await interaction.reply(`Kanál ${channel} byl úspěšně přidán pro počítaní.`);
    }
    if (subcommand === 'remove') {
        const channel = options.getChannel('channel');
        if (!channel) {
            return interaction.reply({
                content: 'Něco se pokazilo.',
            });
        }
        if (guildConfiguration.countingChannelId !== channel.id) {
            return await interaction.reply(`Kanál ${channel} není nastavený pro počítaní.`);
        }
        guildConfiguration.countingChannelId = '';
        await guildConfiguration.save();
        return await interaction.reply(`Kanál ${channel} byl úspěšně odebrán z počítaní.`);
    }
    if (subcommand === 'remove-id') {
        const channelId = options.getString('channel-id');
        if (!channelId) {
            return interaction.reply({
                content: 'Něco se pokazilo.',
            });
        }
        if (guildConfiguration.countingChannelId !== channelId) {
            return await interaction.reply(`Kanál s ID ${channelId} není nastavený pro počítání.`);
        }
        guildConfiguration.countingChannelId = '';
        await guildConfiguration.save();
        return await interaction.reply(`Kanál s ID ${channelId} byl úspěšně odebrán z počítání.`);
    }
    if (subcommand === 'channel') {
        const channelId = guildConfiguration.countingChannelId;
        const channel = `<#${channelId}> (ID: ${channelId})`;
        if (!channelId) {
            return await interaction.reply({
                content: `Není nastavený žádný kanál pro hry.`,
            });
        }
        return await interaction.reply({
            content: `Kanál pro počítaní: \n${channel}`,
        });
    }
    if (subcommand === 'set-count') {
        const number = options.getNumber('number');
        if (!number) {
            return interaction.reply({
                content: 'Něco se pokazilo.',
                ephemeral: true,
            });
        }
        await Counting_1.default.updateOne({ guildId: interaction.guildId }, { count: number });
        return await interaction.reply({
            content: `Počítání bylo nastaveno na číslo ${number}.`,
            ephemeral: true,
        });
    }
    if (subcommand === 'add-special-number') {
        const number = options.getNumber('number');
        const emoji = options.getString('emoji');
        if (typeof number !== 'number' || !emoji) {
            return interaction.reply({
                content: 'Něco se pokazilo. Zkontrolujte číslo a emoji.',
            });
        }
        const counting = await Counting_1.default.findOne({ guildId: interaction.guildId });
        if (!counting) {
            return interaction.reply({
                content: 'Něco se pokazilo. Konfigurace pro počítání nebyla nalezena.',
            });
        }
        const existingEntry = counting.specialNumbers.find((entry) => entry.number === number);
        if (existingEntry) {
            return interaction.reply({
                content: `Pro číslo ${number} už je nastavené emoji.`,
            });
        }
        else {
            counting.specialNumbers.push({ number, emoji });
        }
        await counting.save();
        return interaction.reply({
            content: `Emoji ${emoji} bylo nastaveno pro číslo ${number}.`,
            ephemeral: true,
        });
    }
    if (subcommand === 'remove-special-number') {
        const number = options.getNumber('number');
        if (!number) {
            return interaction.reply({
                content: 'Něco se pokazilo.',
            });
        }
        const counting = await Counting_1.default.findOne({ guildId: interaction.guildId });
        if (!counting) {
            return interaction.reply({
                content: 'Něco se pokazilo.',
            });
        }
        const existingEntry = counting.specialNumbers.find((entry) => entry.number === number);
        if (!existingEntry) {
            return interaction.reply({
                content: `Pro číslo ${number} není nastavené žádné emoji.`,
            });
        }
        else {
            counting.specialNumbers.pull({ number });
        }
        await counting.save();
        return interaction.reply({
            content: `Emoji pro číslo ${number} bylo úspěšně odebráno.`,
            ephemeral: true,
        });
    }
    if (subcommand === 'special-numbers') {
        const counting = await Counting_1.default.findOne({ guildId: interaction.guildId });
        if (!counting) {
            return interaction.reply({
                content: 'Něco se pokazilo.',
            });
        }
        const specialNumbers = counting.specialNumbers.map((specialNumber) => `${specialNumber.number}: ${specialNumber.emoji}`);
        return await interaction.reply({
            content: `Speciální čísla s emoji: \n${specialNumbers.join('\n')}`,
        });
    }
}
