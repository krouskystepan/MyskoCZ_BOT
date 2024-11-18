import type { CommandData, SlashCommandProps, CommandOptions } from 'commandkit'
import { ApplicationCommandOptionType } from 'discord.js'
import puppeteer from 'puppeteer'

export const data: CommandData = {
  name: 'chatgpt',
  description: 'Zeptej se na cokoliv a já ti odpovím.',
  options: [
    {
      name: 'prompt',
      description: 'Otázka, na kterou chceš odpověď.',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
}

export const options: CommandOptions = {
  deleted: false,
}

export async function run({ interaction, client, handler }: SlashCommandProps) {
  await interaction.deferReply()

  const { options } = interaction
  const prompt = options.getString('prompt', true)

  const czechPrompt = `Odpověz na následující dotaz v češtině: ${prompt}`

  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  await page.goto('https://chat-app-f2d296.zapier.app')
  await page.waitForSelector('textarea[placeholder="automate"]')
  await page.focus('textarea[placeholder="automate"]')
  await new Promise((resolve) => setTimeout(resolve, 1000))
  await page.keyboard.type(czechPrompt)
  await page.keyboard.press('Enter')

  await new Promise((resolve) => setTimeout(resolve, 10000))
  await page.waitForSelector('[data-testid="bot-message"] p')
  const value = await page.$$eval(
    '[data-testid="bot-message"]',
    async (elements) => {
      return elements.map((el) => el.textContent)
    }
  )

  setTimeout(async () => {
    if (value.length == 0)
      return await interaction.editReply(
        'Něco se pokazilo, zkuste to prosím znovu.'
      )
  }, 30000)

  await browser.close()
  value.shift()
  const message = value.join('\n\n\n\n')

  await interaction.editReply(message)
}
