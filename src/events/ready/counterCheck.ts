import { Client, Collection, GuildMember } from 'discord.js'
import RoleCounter from '../../models/RoleCounter'

export default async (client: Client) => {
  const cachedMembers = new Map<string, Collection<string, GuildMember>>()

  const fetchMembersWithRetry = async (
    guild: any,
    retries = 3
  ): Promise<Collection<string, GuildMember>> => {
    let lastError: any

    for (let i = 0; i < retries; i++) {
      try {
        return await guild.members.fetch()
      } catch (error) {
        lastError = error
        console.warn(
          `Retrying member fetch for guild ${guild.id} (${i + 1}/${retries})...`
        )
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    throw (
      lastError || new Error(`Failed to fetch members for guild ${guild.id}`)
    )
  }

  const updateChannelNames = async () => {
    for (const guild of client.guilds.cache.values()) {
      try {
        const members =
          cachedMembers.get(guild.id) || (await fetchMembersWithRetry(guild))
        cachedMembers.set(guild.id, members)

        setTimeout(() => cachedMembers.delete(guild.id), 15 * 60 * 1000)

        const roles = await guild.roles.fetch()
        const roleCounter = await RoleCounter.findOne({ guildId: guild.id })

        if (!roleCounter) continue

        for (const channelData of roleCounter.channels) {
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

          try {
            const channel = await guild.channels.fetch(channelData.channelId)

            if (!channel || !channel.isVoiceBased()) {
              roleCounter.channels = roleCounter.channels.filter(
                (data) => data.channelId !== channelData.channelId
              )
              await roleCounter.save()
              continue
            }

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
            } else {
              console.error(
                `Error updating channel in guild ${guild.id}:`,
                error
              )
            }
          }
        }
      } catch (error) {
        console.error(`Error processing guild ${guild.id}:`, error)
      }
    }
  }

  await updateChannelNames()

  setInterval(async () => {
    await updateChannelNames()
  }, 15 * 60 * 1000) // 15 minutes
}
