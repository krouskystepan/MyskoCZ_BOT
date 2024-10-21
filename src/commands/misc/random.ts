import {
  ApplicationCommandOptionType,
  Client,
  CommandInteraction,
} from 'discord.js'
import { channels } from '../../../config.json'
import { checkChannel } from '../../utils/utils'

export default {
  name: 'random',
  description: 'Získej náhodné číslo!',
  options: [
    {
      name: 'počet',
      description: 'Řekni si jaké chceš největší číslo!',
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
  ],
  callback: async (client: Client, interaction: CommandInteraction) => {
    checkChannel(interaction, {
      id: channels.games.id,
      error: channels.games.error,
    })

    const maxNumber = Number(interaction.options.get('počet', true)?.value)

    const roll = Math.floor(Math.random() * maxNumber) + 1

    await interaction.reply(
      `${interaction.user} tvoje náhodné číslo od 1 do ${maxNumber} je: **${roll}**!`
    )
  },
}
