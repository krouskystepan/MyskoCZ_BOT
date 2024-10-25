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
      name: 'set-count',
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
    {
      name: 'add-special-number',
      description: 'Nastaví speciální emoji pro zadané číslo.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'number',
          description: 'Číslo',
          type: ApplicationCommandOptionType.Number,
          required: true,
        },
        {
          name: 'emoji',
          description: 'Emoji',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: 'remove-special-number',
      description: 'Smaže speciální emoji pro zadané číslo.',
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
    {
      name: 'special-numbers',
      description: 'Zobrazí speciální čísla s emoji.',
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

  if (subcommand === 'channel') {
    const channel = options.getChannel('channel')

    if (!channel) {
      return interaction.reply({
        content: 'Něco se pokazilo.',
        ephemeral: true,
      })
    }

    if (guildConfiguration.countingChannelId === channel.id) {
      return await interaction.reply({
        content: `Kanál ${channel} už je nastavený pro počítání.`,
        ephemeral: true,
      })
    }

    if (guildConfiguration.countingChannelId) {
      return await interaction.reply({
        content: `Pro počítání nemůže být nastaven více než jeden kanál.`,
        ephemeral: true,
      })
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
        ephemeral: true,
      })
    }

    if (guildConfiguration.countingChannelId !== channel.id) {
      return await interaction.reply({
        content: `Kanál ${channel} není nastavený pro počítaní.`,
        ephemeral: true,
      })
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
        ephemeral: true,
      })
    }

    if (guildConfiguration.countingChannelId !== channelId) {
      return await interaction.reply({
        content: `Kanál s ID ${channelId} není nastavený pro počítání.`,
        ephemeral: true,
      })
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

  if (subcommand === 'set-count') {
    const number = options.getNumber('number')

    if (!number) {
      return interaction.reply({
        content: 'Něco se pokazilo.',
        ephemeral: true,
      })
    }

    await Counting.updateOne(
      { guildId: interaction.guildId },
      { count: number }
    )

    return await interaction.reply({
      content: `Počítání bylo nastaveno na číslo ${number}.`,
    })
  }

  if (subcommand === 'add-special-number') {
    const number = options.getNumber('number')
    const emoji = options.getString('emoji')

    if (typeof number !== 'number' || !emoji) {
      return interaction.reply({
        content: 'Něco se pokazilo. Zkontrolujte číslo a emoji.',
        ephemeral: true,
      })
    }

    const counting = await Counting.findOne({ guildId: interaction.guildId })

    if (!counting) {
      return interaction.reply({
        content: 'Něco se pokazilo. Konfigurace pro počítání nebyla nalezena.',
        ephemeral: true,
      })
    }

    const existingEntry = counting.specialNumbers.find(
      (entry) => entry.number === number
    )

    if (existingEntry) {
      return interaction.reply({
        content: `Pro číslo ${number} už je nastavené emoji.`,
        ephemeral: true,
      })
    } else {
      counting.specialNumbers.push({ number, emoji })
    }

    await counting.save()

    return interaction.reply({
      content: `Emoji ${emoji} bylo nastaveno pro číslo ${number}.`,
    })
  }

  if (subcommand === 'remove-special-number') {
    const number = options.getNumber('number')

    if (!number) {
      return interaction.reply({
        content: 'Něco se pokazilo.',
        ephemeral: true,
      })
    }

    const counting = await Counting.findOne({ guildId: interaction.guildId })

    if (!counting) {
      return interaction.reply({
        content: 'Něco se pokazilo.',
        ephemeral: true,
      })
    }

    const existingEntry = counting.specialNumbers.find(
      (entry) => entry.number === number
    )

    if (!existingEntry) {
      return interaction.reply({
        content: `Pro číslo ${number} není nastavené žádné emoji.`,
        ephemeral: true,
      })
    } else {
      counting.specialNumbers.pull({ number })
    }

    await counting.save()

    return interaction.reply({
      content: `Emoji pro číslo ${number} bylo úspěšně odebráno.`,
    })
  }

  if (subcommand === 'special-numbers') {
    const counting = await Counting.findOne({ guildId: interaction.guildId })

    if (!counting) {
      return interaction.reply({
        content: 'Něco se pokazilo.',
        ephemeral: true,
      })
    }

    const specialNumbers = counting.specialNumbers.map(
      (specialNumber) => `${specialNumber.number}: ${specialNumber.emoji}`
    )

    return await interaction.reply({
      content: `Speciální čísla s emoji: \n${specialNumbers.join('\n')}`,
    })
  }
}
