import { REST, Routes, SlashCommandBuilder } from 'discord.js'
import dotenv from 'dotenv'

dotenv.config()

const commands = [
  new SlashCommandBuilder().setName('convert').setDescription('Convert currency to currency').setDescriptionLocalization("ja", "通貨を別の通貨に変換")
    .addIntegerOption(option => option.setName('amount').setDescription('Amount of money').setDescriptionLocalization("ja", "金額").setRequired(true))
    .addStringOption(option => option.setName('from').setDescription('Currency before conversion').setDescriptionLocalization("ja", "変換前の通貨").setRequired(true))
    .addStringOption(option => option.setName('to').setDescription('Currency after conversion').setDescriptionLocalization("ja", "変換後の通貨").setRequired(true)),
  new SlashCommandBuilder().setName('rates').setDescription('Show Exchange Rate').setDescriptionLocalization("ja", "為替レートを表示")
    .addStringOption(option => option.setName('from').setDescription('Currency before conversion').setDescriptionLocalization("ja", "変換前の通貨").setRequired(true))
    .addStringOption(option => option.setName('to').setDescription('Currency after conversion').setDescriptionLocalization("ja", "変換後の通貨").setRequired(true))
    .addStringOption(option => option.setName('range').setDescription('Range for displaying exchange rates').setDescriptionLocalization("ja", "為替レートの表示範囲").addChoices(
      { name: 'Today', value: 'today' },
      { name: '1 Month', value: 'month' },
      { name: '3 Months', value: 'threeMonths' },
      { name: '1 Year', value: 'year' },
    )),
].map(command => command.toJSON());

const token: string = process.env.TOKEN ?? 'a'
const appid: string = process.env.APP_ID ?? "a"

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands(appid), {
      body: commands,
    });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})()