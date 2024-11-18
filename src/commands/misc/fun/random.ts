import { ApplicationCommandOptionType } from 'discord.js'
import type { CommandData, SlashCommandProps, CommandOptions } from 'commandkit'
import GuildConfiguration from '../../../models/GuildConfiguration'

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
  const guildConfiguration = await GuildConfiguration.findOne({
    guildId: interaction.guildId,
  })

  if (!guildConfiguration?.gameChannelIds.length) {
    return await interaction.reply({
      content:
        'Tento server nebyl ještě nastaven pro používání příkazu `/random`. Kontaktujte prosím administrátory serveru.',
      ephemeral: true,
    })
  }

  if (!guildConfiguration.gameChannelIds.includes(interaction.channelId)) {
    return await interaction.reply({
      content: `Tento kanál není nastaven pro používání příkazu \`/random\`. Zkuste jeden z těchto kanálů: ${guildConfiguration.gameChannelIds
        .map((id) => `<#${id}>`)
        .join(', ')}.`,
      ephemeral: true,
    })
  }

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
