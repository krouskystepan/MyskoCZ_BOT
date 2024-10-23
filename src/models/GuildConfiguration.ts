import { Schema, model } from 'mongoose'

const guildConfiguration = new Schema({
  guildId: {
    type: String,
    required: true,
  },
  suggestionChannelIds: {
    type: [String],
    default: [],
  },
  gameChannelIds: {
    type: [String],
    default: [],
  },
})

export default model('GuildConfiguration', guildConfiguration)
