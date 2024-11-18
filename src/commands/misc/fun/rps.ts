import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  CommandInteractionOptionResolver,
  EmbedBuilder,
} from 'discord.js'
import { CommandData, CommandOptions, SlashCommandProps } from 'commandkit'
import GuildConfiguration from '../../../models/GuildConfiguration'

const choices = [
  {
    name: 'kámen',
    emoji: '🪨',
    beats: 'nůžky',
  },
  {
    name: 'nůžky',
    emoji: '✂️',
    beats: 'papír',
  },
  {
    name: 'papír',
    emoji: '📄',
    beats: 'kámen',
  },
]

export const data: CommandData = {
  name: 'rps',
  description: 'Zahraj si kámen, nůžky, papír!',
  options: [
    {
      name: 'hráč',
      description: 'Vyber hráče, kterého chceš vyzvat.',
      type: ApplicationCommandOptionType.User,
      required: true,
    },
  ],
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

    if (!guildConfiguration?.gameChannelIds.length) {
      return await interaction.reply({
        content:
          'Tento server nebyl ještě nastaven pro používání příkazu `/rps`. Kontaktujte prosím administrátory serveru.',
        ephemeral: true,
      })
    }

    if (!guildConfiguration.gameChannelIds.includes(interaction.channelId)) {
      return await interaction.reply({
        content: `Tento kanál není nastaven pro používání příkazu \`/rps\`. Zkuste jeden z těchto kanálů: ${guildConfiguration.gameChannelIds
          .map((id) => `<#${id}>`)
          .join(', ')}.`,
        ephemeral: true,
      })
    }

    const targetUser = (
      interaction.options as CommandInteractionOptionResolver
    ).getUser('hráč', true)

    if (interaction.user.id === targetUser.id) {
      return interaction.reply({
        content: 'Nemůžeš hrát sám se sebou.',
        ephemeral: true,
      })
    }

    if (targetUser.bot) {
      return interaction.reply({
        content: 'Nemůžeš hrát s botem.',
        ephemeral: true,
      })
    }

    const embed = new EmbedBuilder()
      .setTitle('Kámen, nůžky, papír!')
      .setDescription(`Nyní je na řadě ${targetUser}!`)
      .setColor('Yellow')

    const buttons = choices.map((choice) => {
      return new ButtonBuilder()
        .setCustomId(choice.name)
        .setLabel(choice.name)
        .setStyle(ButtonStyle.Primary)
        .setEmoji(choice.emoji)
    })

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons)

    const reply = await interaction.reply({
      content: `${targetUser}, byl jsi vyzván hráčem ${interaction.user} na hru Kámen Nůžky Papír! Pro začátek hry si vyber jednu z možností.`,
      embeds: [embed],
      components: [row],
    })

    const targetUserInteraction = await reply
      .awaitMessageComponent({
        filter: (i) => i.user.id === targetUser.id,
        time: 30_000,
      })
      .catch(async (error) => {
        embed.setDescription(
          `Hra byla zrušena, protože ${targetUser} neodpověděl/a včas.`
        )
        await reply.edit({
          content: '',
          embeds: [embed],
          components: [],
        })
      })

    if (!targetUserInteraction) return

    const targetUserChoice = choices.find(
      (choice) => choice.name === targetUserInteraction.customId
    )

    await targetUserInteraction.reply({
      content: `Vybral/a sis ${targetUserChoice?.name} ${targetUserChoice?.emoji}.`,
      ephemeral: true,
    })

    embed.setDescription(
      `Nyní je na řadě ${interaction.user}! Vyber jednu z možností.`
    )
    await reply.edit({
      content: `Nyní je řada na tobě, ${interaction.user}!`,
      embeds: [embed],
    })

    const initialUserInteraction = await reply
      .awaitMessageComponent({
        filter: (i) => i.user.id === interaction.user.id,
        time: 30_000,
      })
      .catch(async (error) => {
        embed.setDescription(
          `Hra byla zrušena, protože ${interaction.user} neodpověděl/a včas.`
        )
        await reply.edit({
          content: '',
          embeds: [embed],
          components: [],
        })
      })

    if (!initialUserInteraction) return

    const initialUserChoice = choices.find(
      (choice) => choice.name === initialUserInteraction.customId
    )

    let result = ''

    if (targetUserChoice?.beats === initialUserChoice?.name) {
      result = `${targetUser} vyhrál/a!`
    }

    if (initialUserChoice?.beats === targetUserChoice?.name) {
      result = `${interaction.user} vyhrál/a!`
    }

    if (targetUserChoice?.name === initialUserChoice?.name) {
      result = 'Remíza!'
    }

    embed.setDescription(
      `${targetUser} vybral/a ${targetUserChoice?.name} ${targetUserChoice?.emoji} \n${interaction.user} vybral/a ${initialUserChoice?.name} ${initialUserChoice?.emoji}. \n\n${result}`
    )
    reply.edit({
      content: '',
      embeds: [embed],
      components: [],
    })
  } catch (error) {
    console.error(error)
    interaction.reply('Něco se pokazilo.')
  }
}
