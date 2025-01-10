import 'dotenv/config'
import { Client, GatewayIntentBits } from 'discord.js'
import { connectToDatabase } from './utils/utils'
import { CommandKit } from 'commandkit'
import * as path from 'path'

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
})

async function startApp(client: Client) {
  console.log('⏳ Starting application...')

  console.log()

  await connectToDatabase()

  console.log()

  console.log('⏳ Initializing commands and events...')
  const commandKit = new CommandKit({
    client,
    commandsPath: path.join(__dirname, 'commands'),
    eventsPath: path.join(__dirname, 'events'),
    bulkRegister: true,
  })
  console.log(`✅ Commands initialized from ${commandKit.commandsPath}`)
  console.log(`✅ Events initialized from ${commandKit.eventsPath}`)

  console.log()

  console.log('⏳ Logging in to Discord...')
  await client.login(process.env.TOKEN)
}

startApp(client)
