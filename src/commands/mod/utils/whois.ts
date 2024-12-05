import { CommandData, CommandOptions, SlashCommandProps } from 'commandkit'
import {
  ApplicationCommandOptionType,
  CommandInteractionOptionResolver,
  EmbedBuilder,
} from 'discord.js'

export const data: CommandData = {
  name: 'whois',
  description: 'Získej informace o botovi, serveru a uptime.',
  contexts: [0],
  options: [
    {
      name: 'user',
      description: 'Uživatel, o kterém chcete získat informace.',
      type: ApplicationCommandOptionType.User,
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

  const user = options.getUser('user', true)

  const member = await interaction.guild?.members.fetch(user.id)
  if (!member) {
    return interaction.reply({
      content: 'Uživatel není na serveru.',
      ephemeral: true,
    })
  }

  const roles = member.roles.cache
    .filter((role) => role.id !== interaction.guild?.id)
    .map((role) => role.toString())
    .join(', ')

  const formattedJoinDate = member.joinedAt
    ? member.joinedAt.toLocaleDateString('cs-CZ')
    : 'Neznámé'
  const formattedCreatedAt = user.createdAt.toLocaleDateString('cs-CZ')

  const embed = new EmbedBuilder()
    .setColor(member.displayColor || 0x3498db)
    .setTitle('ℹ️ **INFORMACE O UŽIVATELI** ℹ️')
    .addFields(
      {
        name: '👤 Jméno Uživatele',
        value: `\`\`\`${user.username}\`\`\``,
        inline: true,
      },
      {
        name: '🤡 Přezdívka Uživatele',
        value: `\`\`\`${member.displayName}\`\`\``,
        inline: true,
      },
      {
        name: '🆔 ID Uživatele',
        value: `\`\`\`${user.id}\`\`\``,
        inline: false,
      },
      {
        name: '🗓️ Účet Vytvořen',
        value: `\`\`\`${formattedCreatedAt}\`\`\``,
        inline: true,
      },
      {
        name: '🗓️ Připojen na Server',
        value: `\`\`\`${formattedJoinDate}\`\`\``,
        inline: true,
      },
      {
        name: '🏅 Role',
        value: roles.length > 0 ? roles : 'Žádné role',
        inline: false,
      }
    )
    .setThumbnail(user.displayAvatarURL({ extension: 'png', size: 1024 }))
    .setTimestamp()
    .setFooter({ text: 'Informace vygenerovány botem' })

  return interaction.reply({
    embeds: [embed],
    ephemeral: false,
  })
}
