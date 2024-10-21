import {
  ApplicationCommandOptionType,
  ChannelType,
  Client,
  CommandInteraction,
  CommandInteractionOptionResolver,
  PermissionFlagsBits,
} from 'discord.js'
import GuildConfiguration from '../../models/GuildConfiguration'
import { channel } from 'diagnostics_channel'

export default {
  name: 'config-suggestions',
  description: 'Nastav konfiguraci serveru pro návrhy',
  dm_permissions: false,
  options: [
    {
      name: 'add',
      description: 'Přídání kanálu pro návrhy',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'channel',
          description: 'Kanál pro návrhy',
          type: ApplicationCommandOptionType.Channel,
          channel_types: [ChannelType.GuildText],
          required: true,
        },
      ],
    },
    {
      name: 'remove',
      description: 'Odebrání kanálu pro návrhy',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'channel',
          description: 'Kanál pro návrhy',
          type: ApplicationCommandOptionType.Channel,
          channel_types: [ChannelType.GuildText],
          required: true,
        },
      ],
    },
  ],
  permissionsRequired: [PermissionFlagsBits.Administrator],
  botPermissions: [PermissionFlagsBits.Administrator],

  callback: async (client: Client, interaction: CommandInteraction) => {
    let guildConfiguration = await GuildConfiguration.findOne({
      guildId: interaction.guildId,
    })

    if (!guildConfiguration) {
      guildConfiguration = new GuildConfiguration({
        guildId: interaction.guildId,
      })
    }

    const options = interaction.options as CommandInteractionOptionResolver

    const subcommand = options.getSubcommand()

    if (subcommand === 'add') {
      const channel = options.getChannel('channel')

      if (!channel) {
        return interaction.reply({
          content: 'Něco se pokazilo',
        })
      }

      if (guildConfiguration.suggestionChannelIds.includes(channel.id)) {
        return await interaction.reply(
          `Kanál ${channel} už je nastavený pro návrhy`
        )
      }

      guildConfiguration.suggestionChannelIds.push(channel.id)
      await guildConfiguration.save()

      return await interaction.reply(
        `Kanál ${channel} byl úspěšně přidán pro návrhy`
      )
    }

    if (subcommand === 'remove') {
      const channel = options.getChannel('channel')

      if (!channel) {
        return interaction.reply({
          content: 'Něco se pokazilo',
        })
      }

      if (!guildConfiguration.suggestionChannelIds.includes(channel.id)) {
        return await interaction.reply(
          `Kanál ${channel} není nastavený pro návrhy`
        )
      }

      guildConfiguration.suggestionChannelIds =
        guildConfiguration.suggestionChannelIds.filter(
          (id) => id !== channel.id
        )

      await guildConfiguration.save()

      return await interaction.reply(
        `Kanál ${channel} byl úspěšně odebrán z návrhů`
      )
    }
  },
}
