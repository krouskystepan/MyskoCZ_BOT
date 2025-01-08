import { EmbedBuilder } from 'discord.js'

export const createGiveawayEmbed = (
  name: string,
  authorId: string,
  prize: string,
  numberOfWinners: number,
  numberOfPlayers: number,
  endTime: Date,
  winners: string[] = [],
  ended: boolean = false
) => {
  return new EmbedBuilder()
    .setTitle(`${name}${ended ? ' - Giveaway skončila!' : ''}`)
    .setDescription(
      `${
        ended
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
        value: `${
          ended
            ? `👑 **Výherci:** ${
                winners.length > 0
                  ? winners.map((w) => `<@${w}>`).join(', ')
                  : 'Žádní výherci'
              }`
            : `👑 Výherci budou vybráni náhodně.`
        }`,
        inline: false,
      }
    )
    .setTimestamp()
}
