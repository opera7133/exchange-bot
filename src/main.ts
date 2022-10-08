import { Client, AttachmentBuilder, EmbedBuilder } from 'discord.js'
import dotenv from 'dotenv'
import { subYears, subMonths, subDays } from 'date-fns'
import { exchangeRates, convert } from 'exchange-rates-api'
import { TopLevelSpec, compile } from 'vega-lite'
import { View, parse } from 'vega'
import sharp from 'sharp'

dotenv.config()

const client = new Client({ intents: ["Guilds", "GuildMessages"] })

interface range {
  [key: string]: Date
}

client.once('ready', async () => {
  console.log('Ready!')
  console.log(client.user?.tag)
})

client.on("interactionCreate", async (interaction: any) => {
  await exchangeRates()
  if (!interaction.isCommand()) {
    return
  }
  const { commandName, options } = interaction
  let today = new Date()
  if (commandName === 'convert') {
    try {
      let amount = await convert(options.getInteger("amount"), options.getString("from"), options.getString("to"), "latest")
      await interaction.reply(`現在の${options.getInteger("amount")} ${options.getString("from")}は${amount} ${options.getString("to")}です。`)
    } catch (e) {
      await interaction.reply(`エラーが発生しました ${e}`)
    }
  } else if (commandName === "rates") {
    interaction.deferReply()
    try {
      const rangeBefore: range = { today: subDays(today, 1), month: subMonths(today, 1), threeMonths: subMonths(today, 3), year: subYears(today, 1) }
      let history = await exchangeRates().from(rangeBefore[options.getString("range") ?? "month"]).to(today).base(options.getString("from")).symbols([options.getString("to")]).fetch()
      let mapped = Object.entries(history).map(([date, amount]) => ({ date: date, amount: amount[options.getString("to").toUpperCase()] }))
      const vegaLiteSpec: TopLevelSpec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        title: `${options.getString("from").toUpperCase()}/${options.getString("to").toUpperCase()}`,
        width: 640,
        height: 480,
        padding: 20,
        config: {
          axis: {
            labelFont: 'Noto Sans JP,sans-serif,Apple Color Emoji,Segoe UI Emoji',
            titleFont: 'Noto Sans JP,sans-serif,Apple Color Emoji,Segoe UI Emoji',
          },
          point: {
            color: '#222'
          },
        },
        transform: [
          {
            timeUnit: 'yearmonthdate',
            field: 'date',
            as: 'monthdate',
          },
        ],
        layer: [
          {
            mark: {
              type: 'line',
              point: true,
              color: '#222',
            },
            data: {
              values: mapped,
            },
            encoding: {
              x: {
                title: "",
                timeUnit: 'monthdate',
                field: 'date',
                axis: {
                  grid: false,
                  title: null,
                },
              },
              y: {
                title: "",
                aggregate: 'mean',
                field: 'amount',
                scale: {
                  zero: false
                }
              },
            },
          },
        ],
      }
      const vegaSpec = compile(vegaLiteSpec).spec
      const view = new View(parse(vegaSpec), { renderer: 'none' })
      view.toSVG()
        .then(async function (svg) {
          const file = await sharp(Buffer.from(svg)).png().toBuffer()
          const uri = new AttachmentBuilder(file, { name: "chart.png" })
          return interaction.editReply({ files: [uri] })
        })
        .catch(function (err) { console.error(err); });
    } catch (e) {
      return interaction.editReply(`エラーが発生しました ${e}`)
    }
  }
});

client.login(process.env.TOKEN)
