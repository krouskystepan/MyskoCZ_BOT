import {
  ApplicationCommandOptionType,
  ChannelType,
  CommandInteractionOptionResolver,
} from 'discord.js'
import { CommandData, CommandOptions, SlashCommandProps } from 'commandkit'
import { checkGuildConfiguration } from '../../utils/utils'

export const data: CommandData = {
  name: 'games-config',
  description: 'Nastav konfiguraci serveru pro herní příkazy.',
  contexts: [0],
  options: [
    {
      name: 'add',
      description: 'Přídání kanálu pro hry.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'channel',
          description: 'Kanál pro hry.',
          type: ApplicationCommandOptionType.Channel,
          channel_types: [ChannelType.GuildText],
          required: true,
        },
      ],
    },
    {
      name: 'remove',
      description: 'Odebrání kanálu pro hry.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'channel',
          description: 'Kanál pro hry.',
          type: ApplicationCommandOptionType.Channel,
          channel_types: [ChannelType.GuildText],
          required: true,
        },
      ],
    },
    {
      name: 'remove-id',
      description: 'Odebrání kanálu pro hry skrze ID.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'channel-id',
          description: 'Kanál pro hry ID.',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: 'channels',
      description: 'Zobrazí kanály pro hry.',
      type: ApplicationCommandOptionType.Subcommand,
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

    if (guildConfiguration.gameChannelIds.includes(channel.id)) {
      return await interaction.reply(
        `Kanál ${channel} už je nastavený pro hry.`
      )
    }

    guildConfiguration.gameChannelIds.push(channel.id)
    await guildConfiguration.save()

    return await interaction.reply(
      `Kanál ${channel} byl úspěšně přidán pro hry.`
    )
  }

  if (subcommand === 'remove') {
    const channel = options.getChannel('channel')

    if (!channel) {
      return interaction.reply({
        content: 'Něco se pokazilo.',
      })
    }

    if (!guildConfiguration.gameChannelIds.includes(channel.id)) {
      return await interaction.reply(`Kanál ${channel} není nastavený pro hry.`)
    }

    guildConfiguration.gameChannelIds =
      guildConfiguration.gameChannelIds.filter((id) => id !== channel.id)

    await guildConfiguration.save()

    return await interaction.reply(
      `Kanál ${channel} byl úspěšně odebrán z her.`
    )
  }

  if (subcommand === 'remove-id') {
    const channelId = options.getString('channel-id')

    if (!channelId) {
      return interaction.reply({
        content: 'Něco se pokazilo.',
      })
    }

    if (!guildConfiguration.gameChannelIds.includes(channelId)) {
      return await interaction.reply(
        `Kanál s ID ${channelId} není nastavený pro hry.`
      )
    }

    guildConfiguration.gameChannelIds =
      guildConfiguration.gameChannelIds.filter((id) => id !== channelId)

    await guildConfiguration.save()

    return await interaction.reply(
      `Kanál s ID ${channelId} byl úspěšně odebrán z her.`
    )
  }

  if (subcommand === 'channels') {
    const channels = guildConfiguration.gameChannelIds.map(
      (id) => `<#${id}> (ID: ${id})`
    )

    if (channels.length === 0) {
      return await interaction.reply({
        content: `Není nastavený žádný kanál pro hry.`,
      })
    }

    return await interaction.reply({
      content: `Kanály pro hry: \n${channels.join('\n')}`,
    })
  }
}
