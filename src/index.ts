import { Client, GatewayIntentBits, Guild, GuildMember, GuildScheduledEvent, GuildScheduledEventStatus, Role } from "discord.js";
import { token } from './config.json';

const client = new Client({
    intents: [
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages
    ]
});

client.login(token);

client.once('ready', async () => {
    client.guilds.cache.forEach(guild => {
        initialize(guild);
    });
    console.log('Ready!');
});

client.on('guildScheduledEventUserAdd', async (e, user) => {
    const guild = client.guilds.cache.get(e.guildId) as Guild;
    let role: Role | undefined = guild.roles.cache.find(role => role.name == e.name);

    if (!role) {
        role = await guild.roles.create({
            'name': e.name,
            'mentionable': true
        });
    }

    const member = guild.members.cache.find(member => member.user.id == user.id) as GuildMember;
    if (!member.roles.cache.find(r => r.id == (role as Role).id)) {
        await member.roles.add(role as Role);
    }
});

client.on('guildScheduledEventUserRemove', async (e, user) => {
    const guild = client.guilds.cache.get(e.guildId) as Guild;
    let role: Role | undefined = guild.roles.cache.find(role => role.name == e.name);

    if (!role) {
        return;
    }

    const member = guild.members.cache.find(member => member.user.id == user.id) as GuildMember;
    if (member.roles.cache.find(r => r.id == (role as Role).id)) {
        await member.roles.remove(role as Role);
    }
});

client.on('messageCreate', async (message) => {
    if (message.content.trim() == '!refresh') {
        await message.channel.sendTyping();
        await initialize(message.guild as Guild);
        await message.channel.send('Events should be up-to-date');
    }
})

const initialize = async (guild: Guild) => {
    return new Promise((resolve, reject) => {
        console.log(guild.name);
        guild.scheduledEvents.cache.forEach(async event => {
            let role: Role | undefined = guild.roles.cache.find(role => role.name == event.name);
            
            if (!role) {
                role = await guild.roles.create({
                    'name': event.name,
                    'mentionable': true
                });
            }
    
            (await event.fetchSubscribers({ 'withMember': true })).forEach(async subsciber => {
                if (!subsciber.member.roles.cache.find(r => r.id == (role as Role).id)) {
                    await subsciber.member.roles.add(role as Role);
                }
            })
        })

        return resolve(null);
    });
}

