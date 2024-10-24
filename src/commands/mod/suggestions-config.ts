import {
  ApplicationCommandOptionType,
  ChannelType,
  CommandInteractionOptionResolver,
} from 'discord.js'
import Suggestion from '../../models/Suggestion'
import { CommandData, CommandOptions, SlashCommandProps } from 'commandkit'
import { checkGuildConfiguration } from '../../utils/utils'

export const data: CommandData = {
  name: 'suggestions-config',
  description: 'Nastav konfiguraci serveru pro návrhy.',
  contexts: [0],
  options: [
    {
      name: 'add',
      description: 'Přídání kanálu pro návrhy.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'channel',
          description: 'Kanál pro návrhy.',
          type: ApplicationCommandOptionType.Channel,
          channel_types: [ChannelType.GuildText],
          required: true,
        },
      ],
    },
    {
      name: 'remove',
      description: 'Odebrání kanálu pro návrhy.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'channel',
          description: 'Kanál pro návrhy.',
          type: ApplicationCommandOptionType.Channel,
          channel_types: [ChannelType.GuildText],
          required: true,
        },
      ],
    },
    {
      name: 'remove-id',
      description: 'Odebrání kanálu pro návrhy skrze ID.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'channel-id',
          description: 'Kanál pro návrhy ID.',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: 'channels',
      description: 'Zobrazí kanály pro návrhy.',
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: 'check',
      description: 'Vypíše, kdo jak hlasoval pro daný návrh.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'id',
          description: 'ID návrhu.',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
  ],
}

export const options: CommandOptions = {
  userPermissions: ['Administrator'],
  botPermissions: ['Administrator'],
  deleted: false,
}

export async function run({ interaction, client, handler }: SlashCommandProps) {
  if (!interaction.guildId) {
    return interaction.reply({
      content: 'Něco se pokokazilo.',
    })
  }

  const guildConfiguration = await checkGuildConfiguration(interaction.guildId)

  const options = interaction.options as CommandInteractionOptionResolver

  const subcommand = options.getSubcommand()

  if (subcommand === 'add') {
    const channel = options.getChannel('channel')

    if (!channel) {
      return interaction.reply({
        content: 'Něco se pokazilo.',
      })
    }

    if (guildConfiguration.suggestionChannelIds.includes(channel.id)) {
      return await interaction.reply(
        `Kanál ${channel} už je nastavený pro návrhy.`
      )
    }

    guildConfiguration.suggestionChannelIds.push(channel.id)
    await guildConfiguration.save()

    return await interaction.reply(
      `Kanál ${channel} byl úspěšně přidán pro návrhy.`
    )
  }

  if (subcommand === 'remove') {
    const channel = options.getChannel('channel')

    if (!channel) {
      return interaction.reply({
        content: 'Něco se pokazilo.',
      })
    }

    if (!guildConfiguration.suggestionChannelIds.includes(channel.id)) {
      return await interaction.reply(
        `Kanál ${channel} není nastavený pro návrhy.`
      )
    }

    guildConfiguration.suggestionChannelIds =
      guildConfiguration.suggestionChannelIds.filter((id) => id !== channel.id)

    await guildConfiguration.save()

    return await interaction.reply(
      `Kanál ${channel} byl úspěšně odebrán z návrhů.`
    )
  }

  if (subcommand === 'remove-id') {
    const channelId = options.getString('channel-id')

    if (!channelId) {
      return interaction.reply({
        content: 'Něco se pokazilo.',
      })
    }

    if (!guildConfiguration.suggestionChannelIds.includes(channelId)) {
      return await interaction.reply(
        `Kanál s ID ${channelId} není nastavený pro návrhy.`
      )
    }

    guildConfiguration.suggestionChannelIds =
      guildConfiguration.suggestionChannelIds.filter((id) => id !== channelId)

    await guildConfiguration.save()

    return await interaction.reply(
      `Kanál s ID ${channelId} byl úspěšně odebrán z návrhů.`
    )
  }

  if (subcommand === 'channels') {
    const channels = guildConfiguration.suggestionChannelIds.map(
      (id) => `<#${id}> (ID: ${id})`
    )

    if (channels.length === 0) {
      return await interaction.reply({
        content: `Není nastavený žádný kanál pro návrhy.`,
      })
    }

    return await interaction.reply({
      content: `Kanály pro návrhy: \n${channels.join('\n')}`,
    })
  }

  if (subcommand === 'check') {
    const id = options.getString('id')

    const suggestion = await Suggestion.findOne({
      messageId: id,
    })

    if (!suggestion) {
      return await interaction.reply({
        content: 'Návrh nebyl nalezen.',
        ephemeral: true,
      })
    }

    const guild = interaction.guild

    if (!guild) {
      return await interaction.reply({
        content: 'Tento příkaz lze použít pouze na serveru.',
        ephemeral: true,
      })
    }

    const upvoteUsers = await Promise.all(
      suggestion.upvotes.map(async (userId) => {
        const member = await guild.members.fetch(userId)

        if (member.nickname) {
          return `${member.nickname} (${member.user.username})`
        }

        return member.user.username
      })
    )

    const downvoteUsers = await Promise.all(
      suggestion.downvotes.map(async (userId) => {
        const member = await guild.members.fetch(userId)

        if (member.nickname) {
          return `${member.nickname} (${member.user.username})`
        }

        return member.user.username
      })
    )

    return await interaction.reply({
      content: `
  Hlasování pro návrh \`${suggestion.content}\`: 
  \n👍 - ${upvoteUsers.join(', ')}
  \n👎 - ${downvoteUsers.join(', ')}
`,
    })
  }
}
