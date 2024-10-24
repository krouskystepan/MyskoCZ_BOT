import { Schema, model } from 'mongoose'

const guildConfigurationSchema = new Schema({
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
  countingChannelId: {
    type: String,
    default: '',
  },
})

export default model('GuildConfiguration', guildConfigurationSchema)
