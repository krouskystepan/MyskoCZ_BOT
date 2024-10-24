import { Schema, model } from 'mongoose'

const CountingSchema = new Schema({
  guildId: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  lastCounter: { type: String, default: '' },
  highestCount: { type: Number, default: 0 },
})

export default model('Counting', CountingSchema)
