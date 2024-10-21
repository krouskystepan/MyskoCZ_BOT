import { Client } from 'discord.js'
import getLocalCommands from '../../utils/getLocalCommands'
import { devs, testServer } from '../../../config.json'

const handleCommands = async (client: Client, interaction: any) => {
  if (!interaction.isChatInputCommand()) return

  const localCommands = await getLocalCommands()

  try {
    const commandObject = localCommands.find(
      (cmd) => cmd.name === interaction.commandName
    )

    if (!commandObject) return

    if (commandObject.devOnly) {
      if (!devs.includes(interaction.member.id)) {
        interaction.reply({
          content: 'Tenhle příkaz můžeš použít pouze jako vývojář.',
          ephemeral: true,
        })
        return
      }
    }

    if (commandObject.testOnly) {
      if (!(interaction.guild.id === testServer)) {
        interaction.reply({
          content: 'Tenhle příkaz můžeš použít pouze na testovacím serveru.',
          ephemeral: true,
        })
        return
      }
    }

    if (commandObject.permissionsRequired?.length) {
      for (const permission of commandObject.permissionsRequired) {
        if (!interaction.member.permissions.has(permission)) {
          interaction.reply({
            content: 'Na tohle nemáš dostatečná oprávnění.',
            ephemeral: true,
          })
          return
        }
      }
    }

    if (commandObject.botPermissions?.length) {
      for (const permission of commandObject.botPermissions) {
        const bot = interaction.guild.members.me

        if (!bot.permissions.has(permission)) {
          interaction.reply({
            content: "I don't have enough permissions.",
            ephemeral: true,
          })
          return
        }
      }
    }

    await commandObject.callback(client, interaction)
  } catch (error) {
    console.log(`There was an error running this command: ${error}`)
  }
}

export default handleCommands
