const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// CONFIGURACIÓN DE ROLES Y CANAL REQUERIDOS
const ROL_AUTORIZADO_1 = "1552017406107455519";
const ROL_AUTORIZADO_2 = "1552017464286515293";
const CANAL_DESTINO_ID = "1551705072667332655";

function esDtOAuxiliar(member) {
    return member.roles.cache.some(role => {
        const nombre = role.name.toLowerCase();
        return nombre.includes('dt') || nombre.includes('auxiliar') || nombre.includes('director técnico');
    });
}

client.once('ready', () => {
    console.log(`¡Bot conectado exitosamente como ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    if (message.content.startsWith('!fichaje')) {
        const args = message.content.trim().split(/ +/);

        if (args.length < 3) {
            return message.reply('❌ Uso incorrecto. Debes usar: `!fichaje @usuario @equipo`');
        }

        const autor = message.member;
        const tienePermiso = autor.roles.cache.has(ROL_AUTORIZADO_1) || autor.roles.cache.has(ROL_AUTORIZADO_2);

        if (!tienePermiso && !autor.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ No tienes el rol necesario (**1552017406107455519** o **1552017464286515293**) para realizar fichajes.');
        }

        const usuarioMencionado = message.mentions.members.first();
        if (!usuarioMencionado) {
            return message.reply('❌ Debes mencionar al usuario que deseas fichar. Ejemplo: `!fichaje @Usuario @Equipo`');
        }

        if (!esDtOAuxiliar(usuarioMencionado)) {
            return message.reply(`❌ El usuario ${usuarioMencionado.user.tag} no cuenta con un rol de **DT** o **Auxiliar**, por lo que no puede ser fichado.`);
        }

        const rolEquipo = message.mentions.roles.first();
        if (!rolEquipo) {
            return message.reply('❌ Debes mencionar el rol del equipo al que pertenece. Ejemplo: `!fichaje @Usuario @NombreDelEquipo`');
        }

        try {
            await usuarioMencionado.roles.add(rolEquipo);

            const canalDestino = await message.client.channels.fetch(CANAL_DESTINO_ID);
            if (!canalDestino) {
                return message.reply('⚠️ El canal de fichajes configurado no existe o el bot no tiene acceso.');
            }

            const embedFichaje = new EmbedBuilder()
                .setTitle('⚽ ¡NUEVO FICHAJE OFICIAL! ⚽')
                .setColor(0x00FF00)
                .setDescription('Se ha completado un nuevo fichaje con éxito en la liga.')
                .addFields(
                    { name: '👤 Usuario Fichado', value: `${usuarioMencionado} (${usuarioMencionado.user.tag})`, inline: true },
                    { name: '🛡️ Equipo', value: `${rolEquipo.name}`, inline: true },
                    { name: '✍️ Fichado por', value: `${message.author}`, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: 'Sistema de Fichajes Oficial' });

            await canalDestino.send({ embeds: [embedFichaje] });
            await message.reply('✅ ¡Fichaje realizado y registrado correctamente!');

        } catch (error) {
            console.error('Error al procesar el fichaje:', error);
            message.reply('❌ Hubo un error al intentar asignar el rol o enviar el mensaje. Asegúrate de que el bot tenga permisos superiores al rol del equipo.');
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
