import { Schema, model, Document } from 'mongoose'
import { randomUUID } from 'crypto'

export type Suggestion = Document & {
  suggestionId: string
  authorId: string
  guildId: string
  messageId: string
  content: string
  status: 'pending' | 'accepted' | 'rejected'
  upvotes: string[]
  downvotes: string[]
  createdAt: Date
  updatedAt: Date
}

const suggestionSchema = new Schema<Suggestion>(
  {
    suggestionId: {
      type: String,
      default: randomUUID,
    },
    authorId: {
      type: String,
      required: true,
    },
    guildId: {
      type: String,
      required: true,
      unique: true,
    },
    messageId: {
      type: String,
      required: true,
      unique: true,
    },
    content: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: 'pending',
      enum: ['pending', 'accepted', 'rejected'],
    },
    upvotes: {
      type: [String],
      default: [],
    },
    downvotes: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
)

export default model<Suggestion>('Suggestion', suggestionSchema)
