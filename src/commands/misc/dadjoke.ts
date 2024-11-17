import { CommandData, CommandOptions, SlashCommandProps } from 'commandkit'
import { translate } from '@vitalets/google-translate-api'

export const data: CommandData = {
  name: 'dadjoke',
  description: 'Získá náhodný dadjoke přeložený do češtiny.',
  options: [],
  contexts: [0],
}

export const options: CommandOptions = {
  deleted: false,
}

const cooldownTime = 60 * 1000
const cooldowns = new Map<string, number>()

async function translateToCzech(text: string): Promise<string> {
  try {
    const result = await translate(text, { to: 'cs' })
    return result.text
  } catch (error) {
    console.error('Chyba při překladu:', error)
    return text
  }
}

export async function run({ interaction }: SlashCommandProps) {
  try {
    await interaction.deferReply()

    const userId = interaction.user.id
    const now = Date.now()

    const member = await interaction.guild?.members.fetch(userId)
    const isAdmin = member?.permissions.has('Administrator')

    if (!isAdmin) {
      if (cooldowns.has(userId)) {
        const lastUsed = cooldowns.get(userId)!
        const timePassed = now - lastUsed

        if (timePassed < cooldownTime) {
          const remainingTime = Math.ceil((cooldownTime - timePassed) / 1000)
          return interaction.reply({
            content: `Příkaz můžeš použít znovu za ${remainingTime} sekund.`,
            ephemeral: true,
          })
        }
      }
      cooldowns.set(userId, now)
    }

    const response = await fetch('https://api.api-ninjas.com/v1/dadjokes', {
      method: 'GET',
      headers: {
        'X-Api-Key': process.env.API_NINJAS_KEY!,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const data = await response.json()

    if (!data || data.length === 0) {
      return interaction.editReply(
        'Nepodařilo se získat dadjoke. Zkuste to prosím znovu.'
      )
    }

    const joke = data[0].joke
    const translatedJoke = await translateToCzech(joke)

    await interaction.editReply(
      `**${interaction.user.displayName} požádal o dadjoke:**\n\n**Originál:**\n*${joke}*\n\n**Přeloženo do češtiny:**\n*${translatedJoke}*`
    )
  } catch (error) {
    console.error('Chyba při získávání nebo překladu dadjoke:', error)
    await interaction.editReply(
      'Došlo k chybě při získávání dadjoke. Zkuste to prosím později.'
    )
  }
}
