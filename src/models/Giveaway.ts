import { Schema, model, Document } from 'mongoose'
import { randomUUID } from 'crypto'

export type Giveaway = Document & {
  giveawayId: string
  authorId: string
  guildId: string
  messageId: string
  channelId: string
  name: string
  duration: number
  numberOfWinners: number
  players: string[]
  actualWinners: string[]
  prize: string
  endTime: Date
  status: 'active' | 'ended' | 'cancelled'
  // excludedPlayers?: string[]
}

const GiveawaySchema = new Schema<Giveaway>({
  giveawayId: {
    type: String,
    default: randomUUID,
  },
  authorId: { type: String, required: true },
  guildId: {
    type: String,
    required: true,
  },
  messageId: {
    type: String,
    required: true,
    unique: true,
  },
  channelId: {
    type: String,
    required: true,
  },
  name: { type: String, required: true },
  duration: { type: Number, required: true },
  numberOfWinners: { type: Number, required: true, min: 1 },
  players: { type: [String], required: true, default: [] },
  actualWinners: { type: [String], required: true, default: [] },
  prize: { type: String, required: true },
  endTime: { type: Date, required: true },
  status: {
    type: String,
    enum: ['active', 'ended', 'cancelled'],
    default: 'active',
  },
  // excludedPlayers: { type: [String], required: false, default: [] },
})

export default model<Giveaway>('Giveaway', GiveawaySchema)
