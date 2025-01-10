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
import {
  createGiveawayEmbed,
  createGiveawayWinnerMessage,
  giveawayStatusMap,
} from '../../../utils/giveawayResponses'

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
    {
      name: 'reroll',
      description: 'Znovu vybere vítěze giveawaye.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'giveaway-id',
          description: 'ID giveawaye, který chcete znovu vylosovat.',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: 'protect-winners',
          description:
            'Zde zadejte ID hráčů, které CHCETE "ochránit" před novým losem např. id1, id2, id3.',
          type: ApplicationCommandOptionType.String,
          required: false,
        },
      ],
    },
    {
      name: 'end',
      description: 'Ukončí giveaway předčasně.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'giveaway-id',
          description: 'ID giveawaye, kterou chcete ukončit.',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: 'delete',
      description: 'Smazání giveawaye',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'giveaway-id',
          description: 'ID giveawaye, který chcete smazat.',
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

// cancel giveaway

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

      if (numberOfWinners < 1) {
        return interaction.reply({
          content: 'Počet vítězů musí být alespoň 1.',
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
        endTime,
        [],
        'active'
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
            'ended'
          )

          const winnerMessage = createGiveawayWinnerMessage(prize, winners)

          const channel = interaction.guild?.channels.cache.get(
            giveaway.channelId
          ) as TextChannel
          if (!channel) return

          const message = await channel.messages.fetch(giveawayMessage.id)
          if (!message) return

          await message.edit({
            embeds: [updatedEmbed],
            components: [],
          })

          return await giveawayMessage.reply({
            content: winnerMessage,
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

    if (subcommand === 'reroll') {
      const messageId = options.getString('giveaway-id', true)
      const protectedWinners = options.getString('protect-winners')

      const giveaway = await Giveaway.findOne({
        messageId,
        status: 'ended',
      })

      if (!giveaway) {
        return await interaction.reply({
          content: 'Giveaway s tímto ID nebyl nalezen.',
          flags: MessageFlags.Ephemeral,
        })
      }

      const protectedList = [
        ...(protectedWinners ? protectedWinners.split(',') : []),
      ]

      const validProtected = protectedList.filter((id) =>
        giveaway.actualWinners.includes(id.trim())
      )

      const invalidProtected = protectedList.filter(
        (id) => !giveaway.actualWinners.includes(id.trim())
      )

      if (invalidProtected.length > 0) {
        return await interaction.reply({
          content: `Někteří chránění uživatelé nejsou původními výherci giveawaye: ${invalidProtected
            .map((id) => `<@${id.trim()}>`)
            .join(', ')}.`,
          flags: MessageFlags.Ephemeral,
        })
      }

      const allProtected = giveaway.actualWinners.every((winner) =>
        validProtected.includes(winner)
      )

      if (allProtected) {
        return await interaction.reply({
          content:
            'Nelze znovu losovat, protože všichni výherci jsou chráněni.',
          flags: MessageFlags.Ephemeral,
        })
      }

      const previousWinners = new Set(giveaway.actualWinners || [])
      const playersToReroll = giveaway.players.filter(
        (player) =>
          !validProtected.includes(player) && !previousWinners.has(player)
      )

      const shuffledPlayers = playersToReroll.sort(() => 0.5 - Math.random())

      const winnersNeeded = giveaway.numberOfWinners - validProtected.length

      if (winnersNeeded < 0) {
        return await interaction.reply({
          content: `Počet chráněných výherců přesahuje počet výherců (${giveaway.numberOfWinners}).`,
          flags: MessageFlags.Ephemeral,
        })
      }

      const newWinners = shuffledPlayers.slice(0, winnersNeeded)

      const finalWinners = [...validProtected, ...newWinners]

      giveaway.actualWinners = finalWinners
      await giveaway.save()

      const channel = interaction.guild?.channels.cache.get(
        giveaway.channelId
      ) as TextChannel

      if (!channel) {
        return await interaction.reply({
          content: 'Channel nebyl nalezen.',
          flags: MessageFlags.Ephemeral,
        })
      }

      const message = await channel.messages.fetch(messageId)

      if (!message) {
        return await interaction.reply({
          content: 'Giveaway message nebyla nalezena.',
          flags: MessageFlags.Ephemeral,
        })
      }

      const updatedEmbed = createGiveawayEmbed(
        giveaway.name,
        giveaway.authorId,
        giveaway.prize,
        giveaway.numberOfWinners,
        giveaway.players.length,
        giveaway.endTime,
        finalWinners,
        'ended'
      )

      const winnerMessage = createGiveawayWinnerMessage(
        giveaway.prize,
        finalWinners,
        'rerolled'
      )

      await message.edit({
        embeds: [updatedEmbed],
      })

      await message.reply({
        content: winnerMessage,
      })

      return await interaction.reply({
        content: 'Giveaway byla úspěšně znovu losována.',
        flags: MessageFlags.Ephemeral,
      })
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
            .map((giveaway) => {
              const winnerList =
                giveaway.actualWinners.length > 0
                  ? giveaway.actualWinners.map((w) => `<@${w}>`).join(', ')
                  : 'Žádní výherci'

              const status =
                giveawayStatusMap[giveaway.status] || 'Neznámý stav'

              return `
**ID:** ${giveaway._id}
**Jméno:** ${giveaway.name}
**Cena:** ${giveaway.prize}
**Vytvořil:** <@${giveaway.authorId}>
**Uskutečněna:** <t:${Math.floor(giveaway.endTime.getTime() / 1000)}:D>
**Stav:** ${status}
**Výherce:** ${winnerList}`
            })
            .join('\n\n')
        )
        .setFooter({
          text: `Stránka ${page}/${Math.ceil(giveaways.length / pageSize)}`,
        })

      return interaction.reply({
        embeds: [embed],
      })
    }

    if (subcommand === 'end') {
      const messageId = options.getString('giveaway-id', true)

      const giveaway = await Giveaway.findOne({
        messageId,
        status: 'active',
      })

      if (!giveaway) {
        return await interaction.reply({
          content: 'Giveaway s tímto ID nebyla nalezena.',
          flags: MessageFlags.Ephemeral,
        })
      }

      giveaway.status = 'prematurely_ended'

      const shuffledPlayers = giveaway.players.sort(() => 0.5 - Math.random())
      const winners = shuffledPlayers.slice(0, giveaway.numberOfWinners)

      giveaway.actualWinners = winners
      await giveaway.save()

      const channel = interaction.guild?.channels.cache.get(
        giveaway.channelId
      ) as TextChannel

      if (!channel) {
        return await interaction.reply({
          content: 'Channel nebyl nalezen.',
          flags: MessageFlags.Ephemeral,
        })
      }

      const message = await channel.messages.fetch(giveaway.messageId)

      if (!message) {
        return await interaction.reply({
          content: 'Giveaway message nebyla nalezena.',
          flags: MessageFlags.Ephemeral,
        })
      }

      const updatedEmbed = createGiveawayEmbed(
        giveaway.name,
        giveaway.authorId,
        giveaway.prize,
        giveaway.numberOfWinners,
        giveaway.players.length,
        giveaway.endTime,
        giveaway.actualWinners,
        'prematurely_ended'
      )

      const winnerMessage = createGiveawayWinnerMessage(
        giveaway.prize,
        giveaway.actualWinners,
        'prematurely_ended'
      )

      await message.edit({
        embeds: [updatedEmbed],
        components: [],
      })

      return await interaction.reply({
        content: winnerMessage,
      })
    }

    if (subcommand === 'delete') {
      const messageId = options.getString('giveaway-id', true)

      const giveaway = await Giveaway.findOne({
        messageId,
      })

      if (!giveaway) {
        return await interaction.reply({
          content: 'Giveaway s tímto ID nebyla nalezena.',
          flags: MessageFlags.Ephemeral,
        })
      }

      if (giveaway.status === 'active') {
        return await interaction.reply({
          content: 'Nelze smazat aktivní giveaway.',
          flags: MessageFlags.Ephemeral,
        })
      }

      giveaway.status = 'cancelled'
      await giveaway.save()

      interaction.reply({
        content: 'Giveaway byla úspěšně smazána.',
        flags: MessageFlags.Ephemeral,
      })
    }
  } catch (error) {
    console.log(error)
    return await interaction.reply({
      content: `Něco se pokazilo.`,
      flags: MessageFlags.Ephemeral,
    })
  }
}
