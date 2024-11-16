import { CommandData, CommandOptions, SlashCommandProps } from 'commandkit'
import { translate } from '@vitalets/google-translate-api'

export const data: CommandData = {
  name: 'quote',
  description: 'Získá náhodný citát přeložený do češtiny.',
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

    const response = await fetch('https://api.api-ninjas.com/v1/quotes', {
      method: 'GET',
      headers: {
        'X-Api-Key': process.env.API_NINJAS_KEY!,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const data = await response.json()

    if (!data || !data[0]?.quote || !data[0]?.author) {
      return interaction.editReply(
        'Nepodařilo se získat citát. Zkuste to prosím znovu.'
      )
    }

    const originalQuote = data[0].quote
    const author = data[0].author

    const translatedQuote = await translateToCzech(originalQuote)

    await interaction.editReply(
      `**${interaction.user.displayName} získal citát:**\n\n> *"${translatedQuote}"*\n— ${author}`
    )
  } catch (error) {
    console.error('Chyba při získávání nebo překladu citátu:', error)
    await interaction.editReply(
      'Došlo k chybě při získávání citátu. Zkuste to prosím později.'
    )
  }
}
