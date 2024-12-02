import {
  ApplicationCommandOptionType,
  ChannelType,
  CommandInteractionOptionResolver,
  Role,
} from 'discord.js'
import { CommandData, CommandOptions, SlashCommandProps } from 'commandkit'
import RoleCounter from '../../../models/RoleCounter'

export const data: CommandData = {
  name: 'counter-config',
  description: 'Nastavení kanálu pro sledování statistik',
  contexts: [0],
  options: [
    {
      name: 'add',
      description: 'Přidání kanálu pro statistiky.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'channel',
          description: 'Kanál pro statistiky.',
          type: ApplicationCommandOptionType.Channel,
          channel_types: [ChannelType.GuildVoice],
          required: true,
        },
        {
          name: 'roles',
          description: 'ID role ke sledování (oddělte čárkou).',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: 'delete',
      description: 'Smazání kanálu pro statistiky.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'channel',
          description: 'ID kanálu pro statistiky ke smazání.',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: 'channels',
      description: 'Zobrazí všechny sledované kanály a role.',
      type: ApplicationCommandOptionType.Subcommand,
    },
  ],
}

export const options: CommandOptions = {
  userPermissions: ['Administrator'],
  botPermissions: ['Administrator'],
  deleted: false,
}

export async function run({ interaction }: SlashCommandProps) {
  if (!interaction.guildId) {
    return interaction.reply({
      content: 'Tato akce je možná pouze na serveru.',
      ephemeral: true,
    })
  }

  const options = interaction.options as CommandInteractionOptionResolver
  const subcommand = options.getSubcommand()

  const guild = interaction.guild
  if (!guild) {
    return interaction.reply({
      content: 'Nepodařilo se získat informace o serveru.',
      ephemeral: true,
    })
  }

  if (subcommand === 'add') {
    const channel = options.getChannel('channel', true)
    const rolesInput = options.getString('roles', true)

    const roleIds = rolesInput
      .split(',')
      .map((role) => role.trim())
      .filter((role) => role !== '')

    if (roleIds.length === 0) {
      return interaction.reply({
        content: 'Musíte zadat alespoň jednu platnou roli.',
        ephemeral: true,
      })
    }

    const roles = roleIds
      .map((roleId) => guild.roles.cache.get(roleId))
      .filter((role): role is Role => !!role)

    if (roles.length === 0) {
      return interaction.reply({
        content: 'Nebyla nalezena žádná platná role.',
        ephemeral: true,
      })
    }

    let roleCounter = await RoleCounter.findOne({
      guildId: interaction.guildId,
    })
    if (!roleCounter) {
      roleCounter = new RoleCounter({
        guildId: interaction.guildId,
        channels: [],
      })
    }

    const channelEntry = roleCounter.channels.find(
      (ch) => ch.channelId === channel.id
    )

    if (channelEntry) {
      return interaction.reply({
        content: `Kanál ${channel} už je nastaven pro sledování statistik.`,
        ephemeral: true,
      })
    }

    roleCounter.channels.push({
      channelId: channel.id,
      roles: roles.map((role) => ({ roleId: role.id, count: 0 })),
    })

    await roleCounter.save()

    return interaction.reply({
      content: `Kanál ${channel} byl nastaven pro sledování rolí: ${roles
        .map((role) => role.toString())
        .join(', ')}.`,
    })
  }

  if (subcommand === 'delete') {
    const channelId = options.getString('channel', true)

    let roleCounter = await RoleCounter.findOne({
      guildId: interaction.guildId,
    })
    if (!roleCounter || roleCounter.channels.length === 0) {
      return interaction.reply({
        content: 'Žádné kanály nebyly nastaveny pro sledování statistik.',
        ephemeral: true,
      })
    }

    const channelIndex = roleCounter.channels.findIndex(
      (ch) => ch.channelId === channelId
    )
    if (channelIndex === -1) {
      return interaction.reply({
        content: 'Kanál nebyl nalezen.',
        ephemeral: true,
      })
    }

    roleCounter.channels.splice(channelIndex, 1)
    await roleCounter.save()

    return interaction.reply({
      content: `Kanál s ID ${channelId} byl úspěšně smazán.`,
    })
  }

  if (subcommand === 'channels') {
    const roleCounter = await RoleCounter.findOne({
      guildId: interaction.guildId,
    })

    if (!roleCounter || roleCounter.channels.length === 0) {
      return interaction.reply({
        content: 'Žádné kanály nebyly nastaveny pro sledování statistik.',
        ephemeral: true,
      })
    }

    const members = await guild.members.fetch()

    const channelInfo = roleCounter.channels
      .map((ch) => {
        const uniqueMembers = new Set<string>()
        ch.roles.forEach((r) => {
          members.forEach((member) => {
            if (member.roles.cache.has(r.roleId)) {
              uniqueMembers.add(member.id)
            }
          })
        })

        const roles = ch.roles
          .map((r) => `<@&${r.roleId}> (${r.roleId})`)
          .join(', ')
        return `Kanál: <#${ch.channelId}> (${ch.channelId})\nRole: ${roles}\nPočet unikátních uživatelů: ${uniqueMembers.size}`
      })
      .join('\n\n')

    return interaction.reply({
      content: `Sledované kanály a role:\n\n${channelInfo}`,
    })
  }
}
