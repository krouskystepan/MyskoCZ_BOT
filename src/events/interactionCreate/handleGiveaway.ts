import {
  ButtonInteraction,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  MessageFlags,
} from 'discord.js'
import Giveaway from '../../models/Giveaway'

const userCooldowns: Map<string, number> = new Map()

const COOLDOWN_TIME = 5000

export default async (interaction: ButtonInteraction) => {
  if (!interaction.isButton() || !interaction.customId) return

  try {
    const [type, messageId, action] = interaction.customId.split('.')

    if (!type || !messageId || !action) return
    if (type !== 'giveaway') return

    const userId = interaction.user.id
    const currentTime = Date.now()
    const lastInteractionTime = userCooldowns.get(userId)

    if (
      lastInteractionTime &&
      currentTime - lastInteractionTime < COOLDOWN_TIME
    ) {
      const remainingTime = COOLDOWN_TIME - (currentTime - lastInteractionTime)
      return await interaction.reply({
        content: `Prosím, počkej ${Math.ceil(
          remainingTime / 1000
        )} sekund, než budeš moci znovu interagovat.`,
        flags: MessageFlags.Ephemeral,
      })
    }

    userCooldowns.set(userId, currentTime)

    await interaction.deferReply({
      flags: MessageFlags.Ephemeral,
    })

    const targetGiveaway = await Giveaway.findOne({
      messageId,
    })

    if (!targetGiveaway || !interaction.channel) {
      return
    }

    if (!targetGiveaway || targetGiveaway.status !== 'active') {
      return await interaction.editReply('Tato giveaway již není aktivní.')
    }

    const targetMessage = await interaction.channel.messages.fetch(
      targetGiveaway.messageId
    )

    const targetMessageEmbed = targetMessage.embeds[0]

    if (action === 'join') {
      if (targetGiveaway.players.includes(userId)) {
        const joinButton = new ButtonBuilder()
          .setEmoji('🏃🏼')
          .setLabel('Opustit giveaway')
          .setStyle(ButtonStyle.Danger)
          .setCustomId(`giveaway.${messageId}.leave`)

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          joinButton
        )

        return await interaction.editReply({
          content:
            'Do této giveawaye jsi již připojený. Pokud chceš odejít, klikni na tlačítko níže.',
          components: [row],
        })
      }

      targetGiveaway.players.push(userId)
      await targetGiveaway.save()

      targetMessageEmbed.fields[2].value = `\`\`\`${targetGiveaway.players.length}\`\`\``

      await targetMessage.edit({
        embeds: [targetMessageEmbed],
      })

      return await interaction.editReply(
        'Úspěšně jsi se připojil do giveawaye!'
      )
    }

    if (action === 'leave') {
      if (!targetGiveaway.players.includes(userId)) {
        return await interaction.editReply('Do této giveawaye nejsi připojený.')
      }

      targetGiveaway.players.splice(targetGiveaway.players.indexOf(userId), 1)
      await targetGiveaway.save()

      targetMessageEmbed.fields[2].value = `\`\`\`${targetGiveaway.players.length}\`\`\``

      await targetMessage.edit({
        embeds: [targetMessageEmbed],
      })

      return await interaction.editReply('Úspěšně jsi odešel z giveawaye!')
    }
  } catch (error) {
    console.error('Chyba v giveaway interakci:', error)
  }
}
