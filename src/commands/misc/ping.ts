import { Client, CommandInteraction } from 'discord.js'

export default {
  name: 'ping',
  description: 'Odpoví s latencí bota a websocketu',
  // devOnly: Boolean,
  // testOnly: Boolean,
  // options: Object[],
  // deleted: true,

  callback: async (client: Client, interaction: CommandInteraction) => {
    await interaction.deferReply()

    const reply = await interaction.fetchReply()

    const ping = reply.createdTimestamp - interaction.createdTimestamp

    interaction.editReply(
      `🏓 Pong! \n **・** Klient: \`${ping}ms\` \n **・** Websocket: \`${client.ws.ping}ms\``
    )
  },
}
