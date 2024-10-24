"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.options = exports.data = void 0;
exports.run = run;
exports.data = {
    name: 'ping',
    description: 'Odpoví s latencí bota a websocketu.',
};
exports.options = {
    deleted: false,
};
async function run({ interaction, client, handler }) {
    await interaction.deferReply();
    const reply = await interaction.fetchReply();
    const ping = reply.createdTimestamp - interaction.createdTimestamp;
    interaction.editReply(`🏓 Pong! \n **・** Klient: \`${ping}ms\` \n **・** Websocket: \`${client.ws.ping}ms\``);
}
