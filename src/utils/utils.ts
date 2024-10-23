import mongoose from 'mongoose'
import GuildConfiguration from '../models/GuildConfiguration'
import { Document } from 'mongoose'

export const connectToDatabase = async () => {
  try {
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
