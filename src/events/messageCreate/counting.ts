import { CommandKit } from 'commandkit'
import { Message, Client } from 'discord.js'
import Counting from '../../models/Counting'
import GuildConfiguration from '../../models/GuildConfiguration'

const guildConfigCache: { [key: string]: string } = {}
const countCache: {
  [key: string]: { count: number; lastCounter: string; highestCount: number }
} = {}

export default async (
  message: Message<true>,
  client: Client<true>,
  handler: CommandKit
) => {
  if (message.author.bot) return

  const guildId = message.guildId
  const userId = message.author.id
  const userMessage = message.content.trim()

  let countingChannelId = guildConfigCache[guildId]

  if (!countingChannelId) {
    const guildConfiguration = await GuildConfiguration.findOne({
      guildId: guildId,
    })

    if (!guildConfiguration?.countingChannelId) return
    countingChannelId = guildConfiguration.countingChannelId
    guildConfigCache[guildId] = countingChannelId
  }

  if (countingChannelId !== message.channelId) return

  const count = parseInt(userMessage, 10)
  if (isNaN(count)) {
    await resetCount(guildId, message, 'Zpráva neobsahuje číslo.')
    await message.react('❌')
    return
  }

  if (!countCache[guildId]) {
    const currentCounting = await Counting.findOne({ guildId })
    countCache[guildId] = {
      count: currentCounting?.count || 0,
      lastCounter: currentCounting?.lastCounter || '',
      highestCount: currentCounting?.highestCount || 0,
    }
  }

  const { count: currentCount, lastCounter, highestCount } = countCache[guildId]

  if (userId === lastCounter) {
    const success = Math.random() < 0.5
    if (!success) {
      await resetCount(
        guildId,
        message,
        'Nemůžeš počítat dvakrát za sebou (Máš 50% šanci na úspěch).'
      )
      await message.react('❌')
      return
    }
  }

  const nextNumber = currentCount + 1
  if (count !== nextNumber) {
    await resetCount(guildId, message, 'Špatné číslo.')
    await message.react('❌')
    return
  }

  countCache[guildId].count = nextNumber
  countCache[guildId].lastCounter = userId

  if (nextNumber > highestCount) {
    countCache[guildId].highestCount = nextNumber
    await message.react('☑️')
  } else {
    await message.react('✅')
  }

  switch (nextNumber) {
    case 69:
      await message.react('😏')
      break
    case 100:
      await message.react('🎉')
      break
    case 420:
      await message.react('🍀')
      break
    case 666:
      await message.react('😈')
      break
    case 777:
      await message.react('🎰')
      break
    case 404:
      await message.react('❓')
      break
    case 1234:
      await message.react('🔢')
      break
  }

  await Counting.updateOne(
    { guildId },
    {
      count: nextNumber,
      lastCounter: userId,
      highestCount: countCache[guildId].highestCount,
    },
    { upsert: true }
  )
}

const resetCount = async (
  guildId: string,
  message: Message<true>,
  reason: string
) => {
  const highestCount = countCache[guildId]?.highestCount || 0
  countCache[guildId] = {
    count: 0,
    lastCounter: '',
    highestCount: highestCount,
  }

  await Counting.updateOne(
    { guildId },
    { count: 0, lastCounter: '', highestCount: highestCount }
  )

  message.reply(
    `**<@${message.author.id}> to zkazil/a!**\n\n**Důvod:** ${reason}\n**Dosavadní rekord:** ${highestCount}.\n**Další číslo je:** 1.`
  )
}
