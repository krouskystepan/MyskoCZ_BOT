import { Client } from 'discord.js'

export default async (client: Client) => {
  console.log(`✅ ${client.user?.tag} is online. \n`)
}
