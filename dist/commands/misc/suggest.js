"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.options = exports.data = void 0;
exports.run = run;
const discord_js_1 = require("discord.js");
const GuildConfiguration_1 = require("../../models/GuildConfiguration");
const Suggestion_1 = require("../../models/Suggestion");
const formatResult_1 = require("../../utils/formatResult");
exports.data = {
    name: 'navrh',
    description: 'Navrhni něco co by mělo být přidáno na server',
    contexts: [0],
};
exports.options = {
    deleted: false,
};
async function run({ interaction, client, handler }) {
    try {
        const guildConfiguration = await GuildConfiguration_1.default.findOne({
            guildId: interaction.guildId,
        });
        if (!guildConfiguration?.suggestionChannelIds.length) {
            return await interaction.reply({
                content: 'Tento server nebyl ještě nastaven pro používání příkazu `/navrh`. Kontaktujte prosím administrátory serveru.',
                ephemeral: true,
            });
        }
        if (!guildConfiguration.suggestionChannelIds.includes(interaction.channelId)) {
            return await interaction.reply({
                content: `Tento kanál není nastaven pro používání příkazu \`/navrh\`. Zkuste jeden z těchto kanálů: ${guildConfiguration.suggestionChannelIds
                    .map((id) => `<#${id}>`)
                    .join(', ')}.`,
                ephemeral: true,
            });
        }
        const modal = new discord_js_1.ModalBuilder()
            .setTitle('Navrhni něco.')
            .setCustomId(`suggestion-${interaction.user.id}`);
        const textInputs = new discord_js_1.TextInputBuilder()
            .setCustomId('suggestion-input')
            .setLabel('Co by jsi chtěl navrhnout?')
            .setStyle(discord_js_1.TextInputStyle.Paragraph)
            .setPlaceholder('Napište návrh.')
            .setRequired(true)
            .setMaxLength(1000);
        const actionRow = new discord_js_1.ActionRowBuilder().addComponents(textInputs);
        modal.addComponents(actionRow);
        await interaction.showModal(modal);
        const filter = (i) => i.customId === `suggestion-${interaction.user.id}`;
        const modalInteraction = await interaction
            .awaitModalSubmit({
            filter,
            time: 1000 * 60 * 5,
        })
            .catch((error) => {
            console.log(error);
        });
        if (!modalInteraction)
            return;
        await modalInteraction.deferReply({
            ephemeral: true,
        });
        let suggestionMessage;
        try {
            suggestionMessage = await interaction.channel.send('Vytvaření návrhu, prosím čekejte...');
        }
        catch (error) {
            return await modalInteraction.editReply('Návrh se nepodařilo vytvořit.');
        }
        const suggestionText = modalInteraction.fields.getTextInputValue('suggestion-input');
        const newSuggestion = new Suggestion_1.default({
            authorId: interaction.user.id,
            guildId: interaction.guildId,
            messageId: suggestionMessage.id,
            content: suggestionText,
        });
        await newSuggestion.save();
        modalInteraction.editReply('Návrh byl úspěšně vytvořen.');
        const suggestionEmbed = new discord_js_1.EmbedBuilder()
            .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.displayAvatarURL({ size: 256 }),
        })
            .addFields([
            {
                name: 'Návrh',
                value: suggestionText,
            },
            {
                name: 'Status',
                value: '⌛ Čeká na schválení',
            },
            {
                name: 'Hlasy',
                value: (0, formatResult_1.formatResults)(),
            },
        ])
            .setColor('Yellow');
        const upVoteButton = new discord_js_1.ButtonBuilder()
            .setEmoji('👍')
            .setLabel('Ano')
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setCustomId(`suggestion.${newSuggestion.suggestionId}.upvote`);
        const downVoteButton = new discord_js_1.ButtonBuilder()
            .setEmoji('👎')
            .setLabel('Ne')
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setCustomId(`suggestion.${newSuggestion.suggestionId}.downvote`);
        const approveButton = new discord_js_1.ButtonBuilder()
            .setEmoji('✅')
            .setLabel('Schválit')
            .setStyle(discord_js_1.ButtonStyle.Success)
            .setCustomId(`suggestion.${newSuggestion.suggestionId}.approve`);
        const rejectButton = new discord_js_1.ButtonBuilder()
            .setEmoji('🗑️')
            .setLabel('Zamítnout')
            .setStyle(discord_js_1.ButtonStyle.Danger)
            .setCustomId(`suggestion.${newSuggestion.suggestionId}.reject`);
        const firstRow = new discord_js_1.ActionRowBuilder().addComponents(upVoteButton, downVoteButton);
        const secondRow = new discord_js_1.ActionRowBuilder().addComponents(approveButton, rejectButton);
        suggestionMessage.edit({
            content: `${interaction.user} vytvořil nový návrh!`,
            embeds: [suggestionEmbed],
            components: [firstRow, secondRow],
        });
    }
    catch (error) {
        console.error('Error in /navrh:', error);
    }
}
