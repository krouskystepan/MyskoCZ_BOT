import mongoose from 'mongoose'
import GuildConfiguration from '../models/GuildConfiguration'

export const connectToDatabase = async () => {
  try {
    console.log('⏳ Connecting to the database...')
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not defined')
    mongoose.set('strictQuery', false)
    await mongoose.connect(process.env.MONGO_URI)
    console.log('✅ Connected to the database')
  } catch (error) {
    console.error('Error connecting to the database:', error)
  }
}

export const checkGuildConfiguration = async (guildId: string) => {
  let guildConfiguration = await GuildConfiguration.findOne({
    guildId,
  })

  if (!guildConfiguration) {
    guildConfiguration = new GuildConfiguration({
      guildId,
    })
  }

  return guildConfiguration
}

export function parseTimeToSeconds(time: string): number {
  const regex = /(\d+)([smhd])/gi
  let totalSeconds = 0

  const matches = time.match(regex)

  if (!matches) {
    throw new Error(
      'Invalid time format. Use a format like "5s", "2m", "7h", or "90d".'
    )
  }

  matches.forEach((match) => {
    const value = parseInt(match.slice(0, -1), 10)
    const unit = match.slice(-1).toLowerCase()

    switch (unit) {
      case 's': // Seconds
        totalSeconds += value
        break
      case 'm': // Minutes
        totalSeconds += value * 60
        break
      case 'h': // Hours
        totalSeconds += value * 60 * 60
        break
      case 'd': // Days
        totalSeconds += value * 60 * 60 * 24
        break
      default:
        throw new Error('Unknown time unit. Use "s", "m", "h", or "d".')
    }
  })
  return totalSeconds
}
