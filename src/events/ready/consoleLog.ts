import { Client } from 'discord.js'

export default async (client: Client) => {
  const currentTime = new Date().toLocaleString('cs-CZ')

  console.log(`✅ ${client.user?.tag} is online\n⏳Time: ${currentTime}`)
}
