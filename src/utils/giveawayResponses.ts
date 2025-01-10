import { EmbedBuilder } from 'discord.js'

export const giveawayStatusMap = {
  active: 'Probíhá',
  ended: 'Ukončena',
  prematurely_ended: 'Ukončena předčasně',
  cancelled: 'Zrušena',
}

export const createGiveawayEmbed = (
  name: string,
  authorId: string,
  prize: string,
  numberOfWinners: number,
  numberOfPlayers: number,
  endTime: Date,
  winners: string[] = [],
  status: 'active' | 'ended' | 'prematurely_ended' | 'cancelled'
) => {
  let winnerMessage = ''

  if (status === 'active') {
    winnerMessage = '👑 Výherci budou vybráni náhodně.'
  } else if (status === 'cancelled') {
    winnerMessage = '❌ Giveaway byla zrušena.'
  } else if (status === 'ended' || status === 'prematurely_ended') {
    winnerMessage = `${
      winners.length > 0
        ? `👑 Výherci: ${winners.map((w) => `<@${w}>`).join(', ')}`
        : '❌ Výherce se nepodařilo vybrat.'
    }`
  }

  let embedColor = 0

  switch (status) {
    case 'active':
      embedColor = 0x3498db
      break

    case 'ended':
    case 'prematurely_ended':
      embedColor = winners.length <= 0 ? 0xe74c3c : 0x2ecc71
      break

    case 'cancelled':
      embedColor = 0x992d22
      break
  }

  return new EmbedBuilder()
    .setTitle(`${name} - ${giveawayStatusMap[status]}`)
    .setColor(embedColor)
    .setDescription(
      `${
        status === 'ended' || status === 'prematurely_ended'
          ? `⌛ Skončila: <t:${Math.floor(endTime.getTime() / 1000)}:d>`
          : `⌛ Končí: <t:${Math.floor(
              endTime.getTime() / 1000
            )}:R> - <t:${Math.floor(endTime.getTime() / 1000)}:d>`
      }\n👨🏼‍💻 Vytvořil uživatel: <@${authorId}>\n\u200B`
    )
    .addFields(
      {
        name: '🎁 Cena',
        value: `\`\`\`${prize}\`\`\``,
        inline: false,
      },
      {
        name: '🎉 Počet vítězů',
        value: `\`\`\`${numberOfWinners}\`\`\``,
        inline: true,
      },
      {
        name: '👥 Počet soutěžících',
        value: `\`\`\`${numberOfPlayers}\`\`\``,
        inline: true,
      },
      {
        name: '\n\u200B',
        value: winnerMessage,
        inline: false,
      }
    )
    .setTimestamp()
}

export const createGiveawayWinnerMessage = (
  name: string,
  winners: string[],
  status: 'ended' | 'prematurely_ended' | 'rerolled' | 'cancelled' = 'ended'
) => {
  const winnersAsText = winners.map((w) => `<@${w}>`).join(', ')

  switch (status) {
    case 'rerolled':
      return `🎉 Giveaway ${name} byla znovu vylosována! 🎉\nGratulujeme novým výhercům! 🎉\n${winnersAsText}`

    case 'cancelled':
      return `❌ Giveaway ${name} byla zrušena! ❌`

    case 'prematurely_ended':
      if (winners.length === 0) {
        return `🎉 Giveaway ${name} byla předčasně ukončena! 🎉\nBohužel se nepodařilo vybrat výherce! ❌`
      } else {
        return `🎉 Giveaway ${name} byla předčasně ukončena! 🎉\nGratulujeme výhercům! 🎉\n${winnersAsText}`
      }

    case 'ended':
      if (winners.length === 0) {
        return `🎉 Giveaway ${name} skončila! 🎉\nBohužel se nepodařilo vybrat výherce! ❌`
      } else {
        return `🎉 Giveaway ${name} skončila! 🎉\nGratulujeme výhercům! 🎉\n${winnersAsText}`
      }
  }
}
