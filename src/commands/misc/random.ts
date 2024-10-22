import { ApplicationCommandOptionType } from 'discord.js'
import type { CommandData, SlashCommandProps, CommandOptions } from 'commandkit'

import { channels } from '../../../config.json'

export const data: CommandData = {
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
}

export const options: CommandOptions = {
  deleted: false,
}

export async function run({ interaction, client, handler }: SlashCommandProps) {
  // TODO: Get this from DB
  if (interaction.channelId !== '1297661219007758356')
    return interaction.reply(
      'Tento příkaz můžeš použít pouze v kanálu <#1297661219007758356>!'
    )

  const maxNumber = Number(interaction.options.get('počet', true)?.value)

  if (maxNumber < 2)
    return interaction.reply({
      content: 'Napiš číslo větší než 1!',
      ephemeral: true,
    })
  if (maxNumber > 10000)
    return interaction.reply({
      content: 'Napiš číslo menší než 1000!',
      ephemeral: true,
    })

  const roll = Math.floor(Math.random() * maxNumber) + 1

  await interaction.reply(
    `${interaction.user} tvoje náhodné číslo od 1 do ${maxNumber} je: **${roll}**!`
  )
}
