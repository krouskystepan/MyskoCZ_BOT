import { Schema, model, Document } from 'mongoose'

export type GuildConfiguration = Document & {
  guildId: string
  suggestionChannelIds: string[]
  gameChannelIds: string[]
  countingChannelId: string
}

const guildConfigurationSchema = new Schema<GuildConfiguration>({
  guildId: {
    type: String,
    required: true,
    unique: true,
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

export default model<GuildConfiguration>(
  'GuildConfiguration',
  guildConfigurationSchema
)
