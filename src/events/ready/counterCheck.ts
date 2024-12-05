import { Client } from 'discord.js'
import RoleCounter from '../../models/RoleCounter'

export default async (client: Client) => {
  const updateChannelNames = async () => {
    for (const guild of client.guilds.cache.values()) {
      const members = await guild.members.fetch()
      const roles = await guild.roles.fetch()
      const roleCounter = await RoleCounter.findOne({ guildId: guild.id })

      if (!roleCounter) continue

      for (const channelData of roleCounter.channels) {
        try {
          const channel = await guild.channels.fetch(channelData.channelId)

          if (!channel || !channel.isVoiceBased()) {
            roleCounter.channels = roleCounter.channels.filter(
              (data) => data.channelId !== channelData.channelId
            )
            await roleCounter.save()
            continue
          }

          const uniqueUserIds = new Set<string>()

          for (const roleData of channelData.roles) {
            const role = roles.get(roleData.roleId)
            if (role) {
              members.forEach((member) => {
                if (member.roles.cache.has(role.id)) {
                  uniqueUserIds.add(member.id)
                }
              })
            }
          }

          const totalUsers = uniqueUserIds.size
          const currentName = channel.name

          const match = currentName.match(/^(.*?)(?:\s\d+)?$/)
          const baseName = match ? match[1].trim() : currentName.trim()
          const newChannelName = `${baseName} ${totalUsers}`.trim()

          if (currentName !== newChannelName) {
            await channel.setName(newChannelName)
          }
        } catch (error) {
          if (error.code === 10003) {
            roleCounter.channels = roleCounter.channels.filter(
              (data) => data.channelId !== channelData.channelId
            )
            await roleCounter.save()
          }
        }
      }
    }
  }

  await updateChannelNames()

  setInterval(async () => {
    await updateChannelNames()
  }, 15 * 60 * 1000) // Every 15 minutes
}
