import { Client } from 'discord.js'
import { getAllFiles } from '../utils/getAllFiles'
import * as path from 'path'

export const eventHandlers = (client: Client) => {
  const eventFolders = getAllFiles(path.join(__dirname, '../events'), true)

  for (const eventFolder of eventFolders) {
    const eventFiles = getAllFiles(eventFolder)

    eventFiles.sort((a, b) => (a > b ? 1 : -1))

    const eventName = eventFolder.replace('/\\/g', '/').split('/').pop()

    if (eventName) {
      client.on(eventName, async (args) => {
        for (const eventFile of eventFiles) {
          const eventFunction = (await import(eventFile)).default
          await eventFunction(client, args)
        }
      })
    }
  }
}
