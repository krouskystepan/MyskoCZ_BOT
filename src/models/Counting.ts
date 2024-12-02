import { Schema, model, Document } from 'mongoose'

export type Counting = Document & {
  guildId: string
  count: number
  lastCounter: string
  highestCount: number
  specialNumbers: {
    number: number
    emoji: string
  }[]
}

const CountingSchema = new Schema<Counting>({
  guildId: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  lastCounter: { type: String, default: '' },
  highestCount: { type: Number, default: 0 },
  specialNumbers: [
    {
      number: { type: Number, required: true },
      emoji: { type: String, required: true },
    },
  ],
})

export default model<Counting>('Counting', CountingSchema)
