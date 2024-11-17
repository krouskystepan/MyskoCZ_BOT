import { CommandData, CommandOptions, SlashCommandProps } from 'commandkit'
import { EmbedBuilder } from 'discord.js'

export const data: CommandData = {
  name: 'info',
  description: 'Získej informace o botovi, serveru a uptime.',
}

export const options: CommandOptions = {
  userPermissions: ['Administrator'],
  botPermissions: ['Administrator'],
  deleted: false,
}

export async function run({ interaction }: SlashCommandProps) {
  const { client, guild } = interaction

  const botName = client.user?.username || 'Bot'
  const botNickname = interaction.guild?.members.me?.nickname
  const botCreatedAt = client.user?.createdAt
  const botCreatedAtFormatted = botCreatedAt
    ? `${formatDateWithoutTime(botCreatedAt)} (${calculateTimeDifference(
        botCreatedAt
      )})`
    : 'Datum neznámé'

  const uptime = client.uptime ?? 0
  const formattedUptime = formatUptime(uptime)

  const serverName = guild?.name || 'Neznámý server'
  const serverCreatedAt = guild?.createdAt
  const serverCreatedAtFormatted = serverCreatedAt
    ? `${formatDateWithoutTime(serverCreatedAt)} (${calculateTimeDifference(
        serverCreatedAt
      )})`
    : 'Neznámý'

  const embed = new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle('ℹ️ **BOT INFORMACE** ℹ️')
    .addFields(
      {
        name: '🤖 Jméno Bota',
        value: `\`\`\`${botName}\`\`\``,
        inline: true,
      },
      {
        name: '🤡 Přezdívka Bota',
        value: `\`\`\`${botNickname ?? 'N/A'}\`\`\``,
        inline: true,
      },
      {
        name: '🗓️ Bot Vytvořen',
        value: `\`\`\`${botCreatedAtFormatted}\`\`\``,
        inline: false,
      },
      {
        name: '⏳ Uptime',
        value: `\`\`\`${formattedUptime}\`\`\``,
        inline: false,
      },
      {
        name: '🏰 Jméno Serveru',
        value: `\`\`\`${serverName}\`\`\``,
        inline: true,
      },
      {
        name: '🗓️ Server Vytvořen',
        value: `\`\`\`${serverCreatedAtFormatted}\`\`\``,
        inline: false,
      }
    )
    .setTimestamp()
    .setFooter({ text: 'Informace vygenerovány botem' })

  return interaction.reply({ embeds: [embed] })
}

function formatDateWithoutTime(date: Date): string {
  return date.toLocaleDateString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function calculateTimeDifference(date: Date) {
  const now = new Date()
  const years = now.getFullYear() - date.getFullYear()
  let months = now.getMonth() - date.getMonth()
  let days = now.getDate() - date.getDate()

  if (months < 0) {
    months += 12
  }

  if (days < 0) {
    months -= 1
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate()
  }

  if (years > 0) {
    return `${years} years and ${months} months ago`
  } else if (months > 0) {
    return `${months} months ago`
  } else {
    return `${days} days ago`
  }
}

function formatUptime(uptime: number) {
  if (uptime <= 0) return 'Uptime není k dispozici'

  const days = Math.floor(uptime / (1000 * 60 * 60 * 24))
  const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((uptime % (1000 * 60)) / 1000)

  const now = new Date()
  const startedAt = new Date(now.getTime() - uptime)
  const startedAtFormatted = formatDateWithoutTime(startedAt)

  let formattedUptime = `${startedAtFormatted} (`
  if (days > 0) formattedUptime += `${days} days, `
  if (hours > 0 || days > 0) formattedUptime += `${hours} hours, `
  if (minutes > 0 || hours > 0 || days > 0)
    formattedUptime += `${minutes} minutes, `
  formattedUptime += `${seconds} seconds ago)`

  return formattedUptime
}
