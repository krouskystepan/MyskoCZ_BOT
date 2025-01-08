import { CommandData, CommandOptions, SlashCommandProps } from 'commandkit'
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  CommandInteractionOptionResolver,
  EmbedBuilder,
  Message,
  MessageFlags,
  TextChannel,
} from 'discord.js'
import Giveaway from '../../../models/Giveaway'
import { parseTimeToSeconds } from '../../../utils/utils'
import { createGiveawayEmbed } from '../../../utils/giveawayEmbed'

export const data: CommandData = {
  name: 'giveaway',
  description: 'Giveaway správce.',
  contexts: [0],
  options: [
    {
      name: 'create',
      description: 'Vytvoří nový giveaway.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'name',
          description: 'Název giveawaye.',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: 'duration',
          description:
            'Čas za jak dlouho giveaway skončí. (např. 14d, 7h, 30m)',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: 'winners',
          description: 'Počet vítězů giveawaye.',
          type: ApplicationCommandOptionType.Integer,
          required: true,
        },
        {
          name: 'prize',
          description: 'Cena, kterou může uživatel vyhrát.',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: 'list',
      description: 'Zobrazí všechny giveawaye.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'page',
          description: 'Stránka, kterou chcete zobrazit.',
          type: ApplicationCommandOptionType.Integer,
          required: false,
        },
      ],
    },
  ],
}

/*
check minimum duration, edit dates, reply to first embed with win message
add reroll, end, delete
*/

export const options: CommandOptions = {
  userPermissions: ['Administrator'],
  botPermissions: ['Administrator'],
  deleted: false,
}

export async function run({ interaction }: SlashCommandProps) {
  const options = interaction.options as CommandInteractionOptionResolver
  const subcommand = options.getSubcommand()

  try {
    if (subcommand === 'create') {
      const guildId = interaction.guild?.id
      const createdBy = interaction.user.id
      const name = options.getString('name', true)
      const duration = parseTimeToSeconds(options.getString('duration', true))
      const numberOfWinners = options.getInteger('winners', true)
      const prize = options.getString('prize', true)

      if (duration < 30) {
        return interaction.reply({
          content: 'Minimální délka giveawaye je 30 sekund.',
          flags: MessageFlags.Ephemeral,
        })
      }

      const endTime = new Date(Date.now() + duration * 1000)

      const embed = createGiveawayEmbed(
        name,
        createdBy,
        prize,
        numberOfWinners,
        0,
        endTime
      )

      await interaction.deferReply({
        flags: MessageFlags.Ephemeral,
      })

      let giveawayMessage: Message<true>

      try {
        giveawayMessage = await (interaction.channel as TextChannel).send(
          'Vytvaření giveawaye, prosím čekejte...'
        )
      } catch (error) {
        return await interaction.editReply('Giveaway se nepodařilo vytvořit.')
      }

      const joinButton = new ButtonBuilder()
        .setEmoji('🎉')
        .setLabel('Připojit se')
        .setStyle(ButtonStyle.Primary)
        .setCustomId(`giveaway.${giveawayMessage.id}.join`)

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        joinButton
      )

      try {
        await giveawayMessage.edit({
          content: '',
          embeds: [embed],
          components: [row],
        })

        const newGiveaway = new Giveaway({
          guildId,
          authorId: createdBy,
          duration,
          numberOfWinners,
          players: [],
          actualWinners: [],
          prize,
          endTime,
          status: 'active',
          name,
          messageId: giveawayMessage.id,
          channelId: giveawayMessage.channelId,
        })

        await newGiveaway.save()

        await interaction.followUp({
          content: 'Giveaway byla úspěšně vytvořena!',
          flags: MessageFlags.Ephemeral,
        })

        setTimeout(async () => {
          const giveaway = await Giveaway.findOne({
            messageId: giveawayMessage.id,
          })

          if (!giveaway || giveaway.status !== 'active') return

          const winners = giveaway.players
            .sort(() => 0.5 - Math.random())
            .slice(0, giveaway.numberOfWinners)

          giveaway.actualWinners = winners
          giveaway.status = 'ended'

          await giveaway.save()

          const updatedEmbed = createGiveawayEmbed(
            name,
            createdBy,
            prize,
            numberOfWinners,
            giveaway.players.length,
            endTime,
            winners,
            true
          )

          const channel = interaction.guild?.channels.cache.get(
            giveaway.channelId
          ) as TextChannel
          if (!channel) return

          const message = await channel.messages.fetch(giveawayMessage.id)
          if (!message) return

          return await message.edit({
            embeds: [updatedEmbed],
            components: [],
          })
        }, duration * 1000)
      } catch (error) {
        console.error(error)
        return interaction.followUp({
          content: 'Chyba při vytváření giveawaye. Zkuste to znovu.',
          flags: MessageFlags.Ephemeral,
        })
      }
    }

    if (subcommand === 'list') {
      const page = options.getInteger('page') ?? 1
      const pageSize = 5

      const giveaways = await Giveaway.find({
        guildId: interaction.guild?.id,
      })

      if (!giveaways || giveaways.length === 0) {
        return interaction.reply({
          content: 'Na tomto serveru nebyly žádné giveawaye.',
          flags: MessageFlags.Ephemeral,
        })
      }

      const paginatedGiveaways = giveaways
        .reverse()
        .slice((page - 1) * pageSize, page * pageSize)

      const embed = new EmbedBuilder()
        .setTitle('Giveaway List')
        .setDescription(
          paginatedGiveaways
            .map((giveaway, index) => {
              return `**${(page - 1) * pageSize + index + 1}.\nCena: ${
                giveaway.prize
              }**\n**Vytvořil:** <@${
                giveaway.authorId
              }>\n**Uskutečněna:** <t:${Math.floor(
                giveaway.endTime.getTime() / 1000
              )}:D>\n**Stav:** ${
                giveaway.status === 'active'
                  ? 'Probíhá'
                  : giveaway.status === 'ended'
                  ? 'Ukončena'
                  : 'Zrušena'
              }\n**Výherce:** ${
                giveaway.actualWinners.length > 0
                  ? giveaway.actualWinners.map((w) => `<@${w}>`).join(', ')
                  : 'Žádní výherci'
              }\n`
            })
            .join('\n')
        )
        .setFooter({
          text: `Stránka ${page}/${Math.ceil(giveaways.length / pageSize)}`,
        })

      return interaction.reply({
        embeds: [embed],
      })
    }
  } catch (error) {
    return await interaction.reply({
      content: 'Něco se pokazilo.',
      flags: MessageFlags.Ephemeral,
    })
  }
}
