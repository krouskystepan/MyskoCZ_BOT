import {
  ApplicationCommandOptionType,
  Client,
  CommandInteraction,
  PermissionFlagsBits,
} from 'discord.js'

export default {
  name: 'ban',
  description: 'test Ban a user',
  // devOnly: Boolean,
  // testOnly: Boolean,
  options: [
    {
      name: 'user',
      description: 'The user to ban',
      type: ApplicationCommandOptionType.Mentionable,
      required: true,
    },
    {
      name: 'reason',
      description: 'The reason for the ban',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],
  permissionsRequired: [PermissionFlagsBits.Administrator],
  botPermissions: [PermissionFlagsBits.Administrator],

  callback: (client: Client, interaction: CommandInteraction) => {
    interaction.reply(`ban`)
  },
}
