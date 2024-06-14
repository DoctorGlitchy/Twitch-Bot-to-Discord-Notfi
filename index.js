const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

// Create a new Discord client with intents
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

// Twitch API credentials
const clientId = process.env.TWITCH_CLIENT_ID;
const clientSecret = process.env.TWITCH_CLIENT_SECRET;
let accessToken = null;

// Specify the Twitch username to track
const twitchUsername = 'DoctorGlitchy';

// Specify the Discord server and channel IDs
const discordServerId = '1251118532771577866';
const discordChannelId = '1251156842495610951';

let isLive = false;

// Get Twitch access token
async function getTwitchAccessToken() {
    const response = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`, {
        method: 'POST'
    });
    const data = await response.json();
    accessToken = data.access_token;
}

// Function to check if the user is live
async function checkTwitchLiveStatus() {
    if (!accessToken) {
        await getTwitchAccessToken();
    }

    const response = await fetch(`https://api.twitch.tv/helix/streams?user_login=${twitchUsername}`, {
        headers: {
            'Client-ID': clientId,
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        console.error(`Error fetching Twitch stream data: Status ${response.status}, ${response.statusText}`);
        const errorData = await response.json().catch(() => null); // Try to parse error response JSON
        if (errorData) {
            console.error('Error response:', errorData);
        }
        return;
    }

    const data = await response.json();
    const channel = client.channels.cache.get(discordChannelId);

    if (!data || !data.data || data.data.length === 0) {
        console.log(`${twitchUsername} is not live.`);
        isLive = false;
        return;
    }

    const stream = data.data[0];
    if (stream && !isLive) {
        isLive = true;
        if (channel) {
            channel.send(`@everyone ${twitchUsername} is now live on Twitch! Watch here: https://www.twitch.tv/${twitchUsername}`);
        } else {
            channel.send('Channel not found!');
        }
    } else if (!stream && isLive) {
        isLive = false;
    }
}



client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    checkTwitchLiveStatus();
    // Check live status every minute
    setInterval(checkTwitchLiveStatus, 60000);
});

client.login(process.env.DISCORD_BOT_TOKEN);
