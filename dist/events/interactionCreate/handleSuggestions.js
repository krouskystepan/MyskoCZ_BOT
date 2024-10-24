"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Suggestion_1 = require("../../models/Suggestion");
const formatResult_1 = require("../../utils/formatResult");
exports.default = async (interaction) => {
    if (!interaction.isButton() || !interaction.customId)
        return;
    try {
        const [type, suggestionId, action] = interaction.customId.split('.');
        if (!type || !suggestionId || !action)
            return;
        if (type !== 'suggestion')
            return;
        await interaction.deferReply({
            ephemeral: true,
        });
        const targetSuggestion = await Suggestion_1.default.findOne({
            suggestionId,
        });
        if (!targetSuggestion ||
            !interaction.channel ||
            !interaction.memberPermissions) {
            return;
        }
        const targetMessage = await interaction.channel.messages.fetch(targetSuggestion.messageId);
        const targetMessageEmbed = targetMessage.embeds[0];
        if (action === 'approve') {
            if (!interaction.memberPermissions.has('Administrator')) {
                return await interaction.editReply('Nemáte oprávnění na schvalování návrhů.');
            }
            targetSuggestion.status = 'approved';
            targetMessageEmbed.data.color = 0x84e660;
            targetMessageEmbed.fields[1].value = '✅ Schváleno';
            await targetSuggestion.save();
            interaction.editReply('Návrh byl schválen.');
            return await targetMessage.edit({
                embeds: [targetMessageEmbed],
                components: [targetMessage.components[0]],
            });
        }
        if (action === 'reject') {
            if (!interaction.memberPermissions.has('Administrator')) {
                return await interaction.editReply('Nemáte oprávnění na zamítnutí návrhů.');
            }
            targetSuggestion.status = 'rejected';
            targetMessageEmbed.data.color = 0xff6161;
            targetMessageEmbed.fields[1].value = '❌ Zamítnuto';
            await targetSuggestion.save();
            interaction.editReply('Návrh byl zamítnut.');
            return await targetMessage.edit({
                embeds: [targetMessageEmbed],
                components: [targetMessage.components[0]],
            });
        }
        if (action === 'upvote') {
            const hasVoted = targetSuggestion.upvotes.includes(interaction.user.id) ||
                targetSuggestion.downvotes.includes(interaction.user.id);
            if (hasVoted) {
                return await interaction.editReply('Už jste hlasovali.');
            }
            targetSuggestion.upvotes.push(interaction.user.id);
            await targetSuggestion.save();
            interaction.editReply('Hlasoval jsi pro 👍🏼 Ano.');
            targetMessageEmbed.fields[2].value = (0, formatResult_1.formatResults)(targetSuggestion.upvotes, targetSuggestion.downvotes);
            targetMessage.edit({
                embeds: [targetMessageEmbed],
            });
            return;
        }
        if (action === 'downvote') {
            const hasVoted = targetSuggestion.upvotes.includes(interaction.user.id) ||
                targetSuggestion.downvotes.includes(interaction.user.id);
            if (hasVoted) {
                return await interaction.editReply('Už jste hlasovali.');
            }
            targetSuggestion.downvotes.push(interaction.user.id);
            await targetSuggestion.save();
            interaction.editReply('Hlasoval jsi pro 👎🏼 Ne.');
            targetMessageEmbed.fields[2].value = (0, formatResult_1.formatResults)(targetSuggestion.upvotes, targetSuggestion.downvotes);
            targetMessage.edit({
                embeds: [targetMessageEmbed],
            });
            return;
        }
    }
    catch (error) {
        console.error('Error in handleSuggestions.ts', error);
    }
};
