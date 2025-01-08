import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Message,
  MessageFlags,
  ModalBuilder,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js'
import GuildConfiguration from '../../../models/GuildConfiguration'
import Suggestion from '../../../models/Suggestion'
import { formatResults } from '../../../utils/formatResult'
import { CommandData, CommandOptions, SlashCommandProps } from 'commandkit'

export const data: CommandData = {
  name: 'suggest',
  description: 'Navrhni něco co by mělo být přidáno na server',
  contexts: [0],
}

export const options: CommandOptions = {
  deleted: false,
}

export async function run({ interaction, client, handler }: SlashCommandProps) {
  try {
    const guildConfiguration = await GuildConfiguration.findOne({
      guildId: interaction.guildId,
    })

    if (!guildConfiguration?.suggestionChannelIds.length) {
      return await interaction.reply({
        content:
          'Tento server nebyl ještě nastaven pro používání příkazu `/suggest`. Kontaktujte prosím administrátory serveru.',
        ephemeral: true,
      })
    }

    if (
      !guildConfiguration.suggestionChannelIds.includes(interaction.channelId)
    ) {
      return await interaction.reply({
        content: `Tento kanál není nastaven pro používání příkazu \`/suggest\`. Zkuste jeden z těchto kanálů: ${guildConfiguration.suggestionChannelIds
          .map((id) => `<#${id}>`)
          .join(', ')}.`,
        ephemeral: true,
      })
    }

    const modal = new ModalBuilder()
      .setTitle('Navrhni něco.')
      .setCustomId(`suggestion-${interaction.user.id}`)

    const textInputs = new TextInputBuilder()
      .setCustomId('suggestion-input')
      .setLabel('Co by jsi chtěl navrhnout?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Napište návrh.')
      .setRequired(true)
      .setMaxLength(1000)

    const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
      textInputs
    )

    modal.addComponents(actionRow)

    await interaction.showModal(modal)

    const filter = (i: any) =>
      i.customId === `suggestion-${interaction.user.id}`

    const modalInteraction = await interaction
      .awaitModalSubmit({
        filter,
        time: 1000 * 60 * 5,
      })
      .catch((error) => {
        console.log(error)
      })

    if (!modalInteraction) return

    await modalInteraction.deferReply({
      flags: MessageFlags.Ephemeral,
    })

    let suggestionMessage: Message<true>

    try {
      suggestionMessage = await (interaction.channel as TextChannel).send(
        'Vytvaření návrhu, prosím čekejte...'
      )
    } catch (error) {
      return await modalInteraction.editReply('Návrh se nepodařilo vytvořit.')
    }

    const suggestionText =
      modalInteraction.fields.getTextInputValue('suggestion-input')

    const newSuggestion = new Suggestion({
      authorId: interaction.user.id,
      guildId: interaction.guildId,
      messageId: suggestionMessage.id,
      content: suggestionText,
    })

    await newSuggestion.save()

    modalInteraction.editReply('Návrh byl úspěšně vytvořen.')

    const suggestionEmbed = new EmbedBuilder()
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
          value: formatResults(),
        },
      ])
      .setColor('Yellow')

    const upVoteButton = new ButtonBuilder()
      .setEmoji('👍')
      .setLabel('Ano')
      .setStyle(ButtonStyle.Primary)
      .setCustomId(`suggestion.${newSuggestion.suggestionId}.upvote`)

    const downVoteButton = new ButtonBuilder()
      .setEmoji('👎')
      .setLabel('Ne')
      .setStyle(ButtonStyle.Primary)
      .setCustomId(`suggestion.${newSuggestion.suggestionId}.downvote`)

    const approveButton = new ButtonBuilder()
      .setEmoji('✅')
      .setLabel('Schválit')
      .setStyle(ButtonStyle.Success)
      .setCustomId(`suggestion.${newSuggestion.suggestionId}.approve`)

    const rejectButton = new ButtonBuilder()
      .setEmoji('🗑️')
      .setLabel('Zamítnout')
      .setStyle(ButtonStyle.Danger)
      .setCustomId(`suggestion.${newSuggestion.suggestionId}.reject`)

    const firstRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      upVoteButton,
      downVoteButton
    )

    const secondRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      approveButton,
      rejectButton
    )

    suggestionMessage.edit({
      content: `${interaction.user} vytvořil nový návrh!`,
      embeds: [suggestionEmbed],
      components: [firstRow, secondRow],
    })
  } catch (error) {
    console.error('Error in /suggest:', error)
  }
}
