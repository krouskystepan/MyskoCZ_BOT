import {
  ApplicationCommandOptionType,
  ChannelType,
  CommandInteractionOptionResolver,
  Role,
  VoiceChannel,
} from 'discord.js'
import { CommandData, CommandOptions, SlashCommandProps } from 'commandkit'
import RoleCounter from '../../../models/RoleCounter'
import { randomUUID } from 'crypto'

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

    const members = await guild.members.fetch()
    const uniqueUserIds = new Set<string>()

    roles.forEach((role) => {
      members.forEach((member) => {
        if (member.roles.cache.has(role.id)) {
          uniqueUserIds.add(member.id)
        }
      })
    })

    const totalUsers = uniqueUserIds.size

    let newChannel: VoiceChannel
    try {
      const uuid = randomUUID().split('-')[0]
      const channelName = `Counter-${uuid} (${totalUsers})`

      newChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildVoice,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: ['Connect'],
          },
          {
            id: interaction.client.user?.id,
            allow: ['ManageChannels', 'ViewChannel'],
          },
        ],
      })
    } catch (error) {
      console.error('Failed to create channel:', error)
      return interaction.reply({
        content:
          'Došlo k chybě při vytváření kanálu. Zkontrolujte oprávnění bota.',
        ephemeral: true,
      })
    }

    if (!newChannel) {
      return interaction.reply({
        content: 'Nepodařilo se vytvořit kanál.',
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

    roleCounter.channels.push({
      channelId: newChannel.id,
      roles: roles.map((role) => ({ roleId: role.id })),
    })

    await roleCounter.save()

    return interaction.reply({
      content: `Kanál "${
        newChannel.name
      }" byl vytvořen pro sledování rolí: ${roles
        .map((role) => role.toString())
        .join(', ')}.`,
    })
  }

  if (subcommand === 'delete') {
    const channelId = options.getString('channel', true)
    console.log(`[CounterConfig] Deleting channel with ID: ${channelId}`)

    const channel = await guild.channels.fetch(channelId).catch(() => null)
    if (!channel) {
      return interaction.reply({
        content: 'Kanál neexistuje nebo již byl odstraněn.',
        ephemeral: true,
      })
    }

    let roleCounter = await RoleCounter.findOne({
      guildId: interaction.guildId,
    })
    if (!roleCounter || roleCounter.channels.length === 0) {
      return interaction.reply({
        content: 'Žádné kanály nebyly nastaveny pro sledování statistik.',
        ephemeral: true,
      })
    }

    roleCounter.channels = roleCounter.channels.filter(
      (ch) => ch.channelId !== channelId
    )
    await roleCounter.save()

    return interaction.reply({
      content: `Kanál "${channel.name}" byl úspěšně smazán.`,
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

        const roles = ch.roles.map((r) => `<@&${r.roleId}>`).join(', ')
        return `Kanál: <#${ch.channelId}> (${ch.channelId})\nRole: ${roles}\nPočet unikátních uživatelů: ${uniqueMembers.size}`
      })
      .join('\n\n')

    return interaction.reply({
      content: `Sledované kanály a role:\n\n${channelInfo}`,
    })
  }
}
