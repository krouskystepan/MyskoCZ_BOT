import type { CommandData, SlashCommandProps, CommandOptions } from 'commandkit'

export const data: CommandData = {
  name: 'ping',
  description: 'Odpoví s latencí bota a websocketu',
}

export const options: CommandOptions = {
  deleted: false,
}

export async function run({ interaction, client, handler }: SlashCommandProps) {
  await interaction.deferReply()

  const reply = await interaction.fetchReply()

  const ping = reply.createdTimestamp - interaction.createdTimestamp

  interaction.editReply(
    `🏓 Pong! \n **・** Klient: \`${ping}ms\` \n **・** Websocket: \`${client.ws.ping}ms\``
  )
}
