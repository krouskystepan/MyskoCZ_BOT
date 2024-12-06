import { CommandData, CommandOptions, SlashCommandProps } from 'commandkit'
import {
  ApplicationCommandOptionType,
  CommandInteractionOptionResolver,
  EmbedBuilder,
  PermissionsBitField,
  Role,
} from 'discord.js'

export const data: CommandData = {
  name: 'roleinfo',
  description: 'Zobraz informace o roli.',
  contexts: [0],
  options: [
    {
      name: 'role',
      description: 'Role, o které chcete získat informace.',
      type: ApplicationCommandOptionType.Role,
      required: true,
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

  const role = options.getRole('role', true) as Role

  const permissions =
    new PermissionsBitField(role.permissions.bitfield)
      .toArray()
      .map(
        (perm) =>
          permissionMappings[perm] ||
          `✅ ${perm.replace(/_/g, ' ').toLowerCase()}`
      )
      .join('\n') || '❌ Žádná oprávnění'

  const roleColor = role.hexColor === '#000000' ? 'Bez barvy' : role.hexColor
  const roleCreatedAt = role.createdAt.toLocaleDateString('cs-CZ')
  const rolePosition = role.position

  const embed = new EmbedBuilder()
    .setColor(role.color || 0x3498db)
    .setTitle(`ℹ️ **INFORMACE O ROLI** ℹ️`)
    .addFields(
      {
        name: '📛 Jméno Role',
        value: `\`\`\`${role.name}\`\`\``,
        inline: true,
      },
      {
        name: '🎨 Barva Role',
        value: `\`\`\`${roleColor}\`\`\``,
        inline: true,
      },
      {
        name: '🆔 ID Role',
        value: `\`\`\`${role.id}\`\`\``,
        inline: false,
      },
      {
        name: '🔢 Pozice Role',
        value: `\`\`\`${rolePosition}\`\`\``,
        inline: true,
      },
      {
        name: '👥 Počet Členů',
        value: `\`\`\`${role.members.size}\`\`\``,
        inline: true,
      },
      {
        name: '🛠️ Oprávnění',
        value: `\`\`\`${permissions}\`\`\``,
        inline: false,
      },
      {
        name: '📅 Vytvořena Dne',
        value: `\`\`\`${roleCreatedAt}\`\`\``,
        inline: true,
      }
    )
    .setTimestamp()
    .setFooter({ text: 'Informace vygenerovány botem' })

  return interaction.reply({
    embeds: [embed],
    ephemeral: false,
  })
}

const permissionMappings: { [key: string]: string } = {
  Administrator: '👑 Administrator (all permissions)',
  ManageGuild: '✅ Manage Server',
  ManageRoles: '✅ Manage Roles',
  ManageChannels: '✅ Manage Channels',
  KickMembers: '✅ Kick Members',
  BanMembers: '✅ Ban Members',
  CreateInstantInvite: '✅ Create Instant Invite',
  ChangeNickname: '✅ Change Nickname',
  ManageNicknames: '✅ Manage Nicknames',
  ManageEmojisAndStickers: '✅ Manage Emojis and Stickers',
  ViewAuditLog: '✅ View Audit Log',
  ViewGuildInsights: '✅ View Server Insights',
  SendMessages: '✅ Send Messages',
  SendMessagesInThreads: '✅ Send Messages in Threads',
  CreatePublicThreads: '✅ Create Public Threads',
  CreatePrivateThreads: '✅ Create Private Threads',
  ManageThreads: '✅ Manage Threads',
  ManageMessages: '✅ Manage Messages',
  EmbedLinks: '✅ Embed Links',
  AttachFiles: '✅ Attach Files',
  ReadMessageHistory: '✅ Read Message History',
  MentionEveryone: '✅ Mention Everyone',
  AddReactions: '✅ Add Reactions',
  UseExternalEmojis: '✅ Use External Emojis',
  UseExternalStickers: '✅ Use External Stickers',
  UseApplicationCommands: '✅ Use Application Commands',
  Connect: '✅ Connect to Voice Channels',
  Speak: '✅ Speak in Voice Channels',
  Stream: '✅ Stream',
  UseVAD: '✅ Use Voice Activity',
  PrioritySpeaker: '✅ Priority Speaker',
  MuteMembers: '✅ Mute Members',
  DeafenMembers: '✅ Deafen Members',
  MoveMembers: '✅ Move Members',
  ManageEvents: '✅ Manage Events',
  CreateEvents: '✅ Create Scheduled Events',
  ModerateMembers: '✅ Moderate Members (Timeout)',
  RequestToSpeak: '✅ Request to Speak',
  UseEmbeddedActivities: '✅ Use Embedded Activities',
  UseSoundboard: '✅ Use Soundboard',
  CreateGuildExpressions: '✅ Create Guild Expressions',
  UseExternalSounds: '✅ Use External Sounds',
  SendVoiceMessages: '✅ Send Voice Messages',
  SendPolls: '✅ Send Polls',
  UseExternalApps: '✅ Use External Apps',
}
