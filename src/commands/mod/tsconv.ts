import {
  ApplicationCommandOptionType,
  CommandInteractionOptionResolver,
} from 'discord.js'
import { CommandData, CommandOptions, SlashCommandProps } from 'commandkit'

export const data: CommandData = {
  name: 'tsconv',
  description: 'Převod timestampů.',
  contexts: [0],
  options: [
    {
      name: 'use',
      description: 'Tahák, jak používat timestamp na Discordu.',
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: 'current',
      description: 'Získej aktuální datum a timestamp.',
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: 'convert',
      description: 'Převeď datum na timestamp.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'date',
          description:
            'Datum k převodu ve formátu "dd.MM.yyyy" nebo "dd.MM.yyyy HH:mm:ss".',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
  ],
}

export const options: CommandOptions = {
  userPermissions: ['Administrator'],
  botPermissions: ['Administrator'],
  deleted: false,
}

export async function run({ interaction }: SlashCommandProps) {
  const options = interaction.options as CommandInteractionOptionResolver
  const subcommand = options.getSubcommand()

  if (subcommand === 'current') {
    const now = new Date()
    const formattedDate = now.toLocaleString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    const currentTimestamp = Math.floor(now.getTime() / 1000)

    return interaction.reply(
      `Aktuální datum: **${formattedDate}** => Timestamp: **${currentTimestamp}**`
    )
  }

  if (subcommand === 'convert') {
    const dateString = options.getString('date')
    if (!dateString) {
      return interaction.reply({
        content:
          'Musíš zadat datum ve formátu "dd.MM.yyyy" nebo "dd.MM.yyyy HH:mm:ss".',
        ephemeral: true,
      })
    }

    const datePattern = /^\d{2}\.\d{2}\.\d{4}(?: \d{2}:\d{2}:\d{2})?$/
    if (!datePattern.test(dateString)) {
      return interaction.reply({
        content:
          'Neplatný formát. Použij "dd.MM.yyyy" nebo "dd.MM.yyyy HH:mm:ss".',
        ephemeral: true,
      })
    }

    const [datePart, timePart] = dateString.split(' ')
    const [day, month, year] = datePart.split('.').map(Number)

    let hour = 0,
      minute = 0,
      second = 0
    if (timePart) {
      const timeParts = timePart.split(':').map(Number)
      if (timeParts.length !== 3) {
        return interaction.reply({
          content: 'Čas musí být ve formátu HH:mm:ss.',
          ephemeral: true,
        })
      }
      ;[hour, minute, second] = timeParts
    }

    const date = new Date(year, month - 1, day, hour, minute, second)
    if (isNaN(date.getTime())) {
      return interaction.reply({
        content: 'Neplatné datum. Zkontroluj, zda zadáváš existující datum.',
        ephemeral: true,
      })
    }

    const timestamp = Math.floor(date.getTime() / 1000)
    return interaction.reply(
      `Datum: **${dateString}** => Timestamp: **${timestamp}**`
    )
  }

  if (subcommand === 'use') {
    return interaction.reply({
      content: `Timestampy na Discordu jsou ve formátu **<t:TIMESTAMP:FORMAT>**, kde:

- **t** -> klíčové slovo pro timestamp.
- **TIMESTAMP** -> časové razítko v sekundách.
- **FORMAT** -> časové razítko v sekundách.  
      - **t**   
          ↳ Krátký čas (např. "14:30")
      - **T**   
          ↳ Dlouhý čas včetně sekund (např. "14:30:45")
      - **d**   
          ↳ Krátké datum (např. "13. 11. 2024")
      - **D**   
          ↳ Dlouhé datum (např. "13. listopad 2024")
      - **f**   
          ↳ Krátké datum a čas (např. "13. listopad 2024 14:30")
      - **F**   
          ↳ Dlouhé datum a čas (např. "středa, 13. listopad 2024 14:30")
      - **R**   
          ↳ Relativní čas (např. "před 5 minutami")`,
    })
  }
}
