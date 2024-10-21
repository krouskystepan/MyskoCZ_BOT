import 'dotenv/config'
import { Client } from 'discord.js'
import { eventHandlers } from './handlers/eventHandlers'
import { connectToDatabase } from './utils/utils'

const client = new Client({
  intents: ['Guilds', 'GuildMembers', 'GuildMessages', 'MessageContent'],
})

async function startApp(client: Client) {
  await connectToDatabase()
  eventHandlers(client)
}

startApp(client)

client.login(process.env.TOKEN)
