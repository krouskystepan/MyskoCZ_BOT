import 'dotenv/config'
import { Client } from 'discord.js'
import { connectToDatabase } from './utils/utils'
import { CommandKit } from 'commandkit'
import * as path from 'path'

const client = new Client({
  intents: ['Guilds', 'GuildMembers', 'GuildMessages', 'MessageContent'],
})

async function startApp(client: Client) {
  await connectToDatabase()

  new CommandKit({
    client,
    commandsPath: path.join(__dirname, 'commands'),
    eventsPath: path.join(__dirname, 'events'),
    // validationsPath: path.join(__dirname, 'validations'),
    // devGuildIds: [],
    // devUserIds: [],
    // devRoleIds: [],
    bulkRegister: false,
  })

  client.login(process.env.TOKEN)
}

startApp(client)
