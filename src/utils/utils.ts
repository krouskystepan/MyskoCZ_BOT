import {
  CommandInteraction,
  Message,
  OmitPartialGroupDMChannel,
} from 'discord.js'
import mongoose from 'mongoose'

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

export const checkChannel = (
  interaction: CommandInteraction | OmitPartialGroupDMChannel<Message<boolean>>,
  channel: {
    id: string
    error: string
  }
) => {
  if (interaction.channelId !== channel.id) {
    return interaction.reply({
      content: channel.error,
      ephemeral: true,
    })
  }
}
