import {
  ApplicationCommandOptionType,
  ChannelType,
  CommandInteractionOptionResolver,
} from 'discord.js'
import { CommandData, CommandOptions, SlashCommandProps } from 'commandkit'
import { checkGuildConfiguration } from '../../utils/utils'
import Counting from '../../models/Counting'

export const data: CommandData = {
  name: 'counting-config',
  description: 'Nastav konfiguraci serveru pro počítání.',
  contexts: [0],
  options: [
    {
      name: 'add',
      description: 'Přídání kanálu pro počítaní.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'channel',
          description: 'Kanál pro počítání.',
          type: ApplicationCommandOptionType.Channel,
          channel_types: [ChannelType.GuildText],
          required: true,
        },
      ],
    },
    {
      name: 'remove',
      description: 'Odebrání kanálu pro počítání.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'channel',
          description: 'Kanál pro počítaní.',
          type: ApplicationCommandOptionType.Channel,
          channel_types: [ChannelType.GuildText],
          required: true,
        },
      ],
    },
    {
      name: 'remove-id',
      description: 'Odebrání kanálu pro počítání skrze ID.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'channel-id',
          description: 'Kanál pro počítání ID.',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: 'channel',
      description: 'Zobrazí kanál pro počítání.',
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: 'set',
      description: 'Nastaví počítání na zadané číslo.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'number',
          description: 'Číslo',
          type: ApplicationCommandOptionType.Number,
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

    if (guildConfiguration.countingChannelId === channel.id) {
      return await interaction.reply(
        `Kanál ${channel} už je nastavený pro počítání.`
      )
    }

    if (guildConfiguration.countingChannelId) {
      return await interaction.reply(
        `Pro počítání nemůže být nastaven více než jeden kanál.`
      )
    }

    guildConfiguration.countingChannelId = channel.id
    await guildConfiguration.save()

    return await interaction.reply(
      `Kanál ${channel} byl úspěšně přidán pro počítaní.`
    )
  }

  if (subcommand === 'remove') {
    const channel = options.getChannel('channel')

    if (!channel) {
      return interaction.reply({
        content: 'Něco se pokazilo.',
      })
    }

    if (guildConfiguration.countingChannelId !== channel.id) {
      return await interaction.reply(
        `Kanál ${channel} není nastavený pro počítaní.`
      )
    }

    guildConfiguration.countingChannelId = ''

    await guildConfiguration.save()

    return await interaction.reply(
      `Kanál ${channel} byl úspěšně odebrán z počítaní.`
    )
  }

  if (subcommand === 'remove-id') {
    const channelId = options.getString('channel-id')

    if (!channelId) {
      return interaction.reply({
        content: 'Něco se pokazilo.',
      })
    }

    if (guildConfiguration.countingChannelId !== channelId) {
      return await interaction.reply(
        `Kanál s ID ${channelId} není nastavený pro počítání.`
      )
    }

    guildConfiguration.countingChannelId = ''

    await guildConfiguration.save()

    return await interaction.reply(
      `Kanál s ID ${channelId} byl úspěšně odebrán z počítání.`
    )
  }

  if (subcommand === 'channel') {
    const channelId = guildConfiguration.countingChannelId
    const channel = `<#${channelId}> (ID: ${channelId})`

    if (!channelId) {
      return await interaction.reply({
        content: `Není nastavený žádný kanál pro hry.`,
      })
    }

    return await interaction.reply({
      content: `Kanál pro počítaní: \n${channel}`,
    })
  }

  if (subcommand === 'set') {
    const number = options.getNumber('number')

    if (!number) {
      return interaction.reply({
        content: 'Něco se pokazilo.',
      })
    }

    await Counting.updateOne(
      { guildId: interaction.guildId },
      { count: number }
    )

    return await interaction.reply({
      content: `Počítání bylo nastaveno na číslo ${number}.`,
      ephemeral: true,
    })
  }
}
