const { Client, GatewayIntentBits } = require('discord.js');
const {
    joinVoiceChannel,
    getVoiceConnection,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
} = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');

const token = require('./config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates // necessário para detectar canais de voz
    ]
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Erro não tratado:', reason);
});

client.once('ready', () => {
    console.log(`fernando: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === 'fernando some') {
        if (!message.member.permissions.has('ManageMessages')) {
            return message.reply('nao pode');
        }

        const canal = message.channel;
        const agora = Date.now();
        const umaHora = 60 * 60 * 1000;
        const limite14dias = 14 * 24 * 60 * 60 * 1000;

        try {
            const mensagens = await canal.messages.fetch({ limit: 100 });

            const mensagensParaApagar = mensagens.filter(msg => {
                const idade = agora - msg.createdTimestamp;
                const dentroDaHora = idade <= umaHora;
                const dentroDoLimiteDiscord = idade < limite14dias;

                const contemFernando = msg.content.toLowerCase().includes('fernando');
                const ehDoBot = msg.author.id === client.user.id;

                return dentroDaHora && dentroDoLimiteDiscord && (contemFernando || ehDoBot);
            });

            let apagadas = 0;
            for (const [id, msg] of mensagensParaApagar) {
                try {
                    await msg.delete();
                    apagadas++;
                } catch (erro) {
                    console.warn(`Falha ao apagar ${id}:`, erro.code || erro.message);
                }
            }

            canal.send(`sumi em ${apagadas} mensagens`)
                .then(msg => setTimeout(() => msg.delete().catch(() => { }), 5000))
                .catch(() => { });

        } catch (erro) {
            console.error('Erro geral ao apagar mensagens:', erro);
            message.reply('deu nao');
        }
    }

    const connection = getVoiceConnection(message.guild.id);
    const canal = message.member.voice.channel;

    if (connection) {
        if (message.content === 'fernando cola ai') return message.reply('ja to');
        if (message.content === 'fernando vaza') {
            connection.destroy();
            return message.reply('falou');
        }
        if (['fernando fala', 'fernando toca aquela'].includes(message.content)) {

            const player = createAudioPlayer();

            const nomedoaudio = message.content === 'fernando fala' ? 'fernando' : 'aquela';
            const audioPath = path.join(__dirname, nomedoaudio + '.mp3');
            if (!fs.existsSync(audioPath)) {
                return message.reply('sei nao');
            }

            const resource = createAudioResource(audioPath);
            connection.subscribe(player);

            player.on(AudioPlayerStatus.Playing, () => {
                console.log('▶️ Tocando áudio');
            });

            player.on(AudioPlayerStatus.Idle, () => {
                console.log('⏹️ Áudio finalizado');
                message.reply('falei');
                // opcional: desconectar após o áudio
                // connection.destroy();
            });

            player.on('error', error => {
                console.error('Erro no player:', error);
                message.reply('deu erro');
            });

            return player.play(resource);
        }
    } else {
        if (message.content === 'fernando cola ai') {
            if (!canal) return message.reply('colar onde doido?');
            try {
                joinVoiceChannel({
                    channelId: canal.id,
                    guildId: canal.guild.id,
                    adapterCreator: canal.guild.voiceAdapterCreator
                });
                return message.reply('bora');
            } catch (erro) {
                console.error('Erro ao entrar no canal de voz:', erro);
                return message.reply('putz nem deu men');
            }
        }
        if (message.content === 'fernando vaza') return message.reply('men, nem to');
        if (message.content === 'fernando fala') return message.reply('me chama primeiro doido');
    }

    // !oi
    if (message.content.toLowerCase().indexOf('fernando') != -1) {
        return message.reply('fernando');
    }
});

client.login(token.token);