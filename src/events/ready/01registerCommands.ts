import { Client } from 'discord.js'
import { testServer } from '../../../config.json'
import getLocalCommands from '../../utils/getLocalCommands'
import getApplicationCommands from '../../utils/getApplicationCommands'
import { areCommandsDifferent } from '../../utils/areCommandsDifferent'

export default async (client: Client) => {
  try {
    const localCommands = await getLocalCommands()
    const applicationCommands = await getApplicationCommands(client, testServer)

    for (const localCommand of localCommands) {
      const { name, description, options } = localCommand

      const existingCommand = applicationCommands.cache.find(
        (cmd: any) => cmd.name === name
      )

      if (existingCommand) {
        if (localCommand.deleted) {
          await applicationCommands.delete(existingCommand.id)
          console.log(`❌ Deleted command: ${name}`)
          continue
        }

        if (areCommandsDifferent(existingCommand, localCommand)) {
          await applicationCommands.edit(existingCommand.id, {
            description,
            options,
          })

          console.log(`🖊️ Edited command: ${name}`)
        }
      } else {
        if (localCommand.deleted) {
          console.log(`⏭️ Skipping deleted command: ${name}`)
          continue
        }
        await applicationCommands.create({
          name,
          description,
          options,
        })

        console.log(`✅ Registered command: ${name}`)
      }
    }
  } catch (error) {
    console.error(error)
  }
}
