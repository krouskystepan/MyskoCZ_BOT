import { Client, TextChannel } from 'discord.js'
import Giveaway from '../../models/Giveaway'
import {
  createGiveawayEmbed,
  createGiveawayWinnerMessage,
} from '../../utils/giveawayResponses'

export default async (client: Client) => {
  const giveaways = await Giveaway.find({ status: 'active' })

  for (const giveaway of giveaways) {
    const now = new Date()
    const endTime = new Date(giveaway.endTime)

    if (now >= endTime) {
      const winners = giveaway.players
        .sort(() => 0.5 - Math.random())
        .slice(0, giveaway.numberOfWinners)

      const updatedGiveaway = await Giveaway.findOneAndUpdate(
        { _id: giveaway._id, status: 'active' },
        {
          $set: {
            actualWinners: winners,
            status: 'ended',
          },
        },
        { new: true }
      )

      if (!updatedGiveaway) {
        console.error(`Giveaway ${giveaway._id} již byla aktualizována.`)
        continue
      }

      const channel = client.channels.cache.get(giveaway.channelId)
      if (channel instanceof TextChannel) {
        try {
          const message = await channel.messages.fetch(giveaway.messageId)
          if (message) {
            const updatedEmbed = createGiveawayEmbed(
              updatedGiveaway.name,
              updatedGiveaway.authorId,
              updatedGiveaway.prize,
              updatedGiveaway.numberOfWinners,
              updatedGiveaway.players.length,
              endTime,
              winners,
              'ended'
            )

            const winnerMessage = createGiveawayWinnerMessage(
              updatedGiveaway.prize,
              updatedGiveaway.actualWinners
            )

            await message.edit({
              embeds: [updatedEmbed],
              components: [],
            })

            await message.reply({
              content: winnerMessage,
            })
          }
        } catch (error) {
          console.error('Failed to fetch giveaway message:', error)
        }
      }
    } else {
      const timeUntilEnd = endTime.getTime() - now.getTime()

      setTimeout(async () => {
        const refreshedGiveaway = await Giveaway.findOneAndUpdate(
          { _id: giveaway._id, status: 'active' },
          {
            $set: {
              actualWinners: giveaway.players
                .sort(() => 0.5 - Math.random())
                .slice(0, giveaway.numberOfWinners),
              status: 'ended',
            },
          },
          { new: true }
        )

        if (!refreshedGiveaway) {
          console.error(`Giveaway ${giveaway._id} již byla aktualizována.`)
          return
        }

        const channel = client.channels.cache.get(refreshedGiveaway.channelId)
        if (channel instanceof TextChannel) {
          try {
            const message = await channel.messages.fetch(
              refreshedGiveaway.messageId
            )
            if (message) {
              const updatedEmbed = createGiveawayEmbed(
                refreshedGiveaway.name,
                refreshedGiveaway.authorId,
                refreshedGiveaway.prize,
                refreshedGiveaway.numberOfWinners,
                refreshedGiveaway.players.length,
                endTime,
                refreshedGiveaway.actualWinners,
                'ended'
              )

              const winnerMessage = createGiveawayWinnerMessage(
                refreshedGiveaway.prize,
                refreshedGiveaway.actualWinners
              )

              await message.edit({
                embeds: [updatedEmbed],
                components: [],
              })

              await message.reply({
                content: winnerMessage,
              })
            }
          } catch (error) {
            console.error('Failed to fetch giveaway message:', error)
          }
        }
      }, timeUntilEnd)
    }
  }
}
