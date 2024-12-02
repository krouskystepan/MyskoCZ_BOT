import { Schema, model, Document } from 'mongoose'

export type RoleCounter = Document & {
  guildId: string
  channels: {
    channelId: string
    roles: {
      roleId: string
    }[]
  }[]
}

const RoleCounterSchema = new Schema({
  guildId: { type: String, required: true, unique: true },
  channels: [
    {
      channelId: { type: String, required: true },
      roles: [
        {
          roleId: { type: String, required: true },
        },
      ],
    },
  ],
})

export default model<RoleCounter>('RoleCounter', RoleCounterSchema)
