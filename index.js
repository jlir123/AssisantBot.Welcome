const { Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const sharp = require('sharp');
const path = require('path');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageContent // Add this if you want to use message content
  ]
});
const express = require('express');
const app = express();
app.listen(process.env.PORT || 3824);
app.get('/', (req, res) => {
  res.send("Hello World");
});

async function convertWebpToPng(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return await sharp(buffer).png().toBuffer();
}

async function generateWelcomeImage(username, avatarUrl) {
  console.log(`Generating image for ${username} with avatar URL: ${avatarUrl}`);
  const canvas = createCanvas(900, 305);
  const ctx = canvas.getContext('2d');

  try {
    // Load and draw background image
    const backgroundPath = path.join(__dirname, 'welcome-image.png');
    const backgroundImage = await loadImage(backgroundPath);
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    // Convert WebP to PNG and load the avatar image
    console.log('Converting and loading avatar image...');
    const pngBuffer = await convertWebpToPng(avatarUrl);
    const avatarImage = await loadImage(pngBuffer);
    console.log('Avatar image loaded successfully');

    // Draw circular avatar
    const avatarSize = 250;
    const avatarX = 620;
    const avatarY = (canvas.height - avatarSize) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatarImage, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();

    // Add username text at the specified position (300, 200)
    ctx.font = 'bold 40px Arial';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    const textX = 300;
    const textY = 200;
    ctx.strokeText(username, textX, textY);
    ctx.fillText(username, textX, textY);

    return canvas.toBuffer();
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('guildMemberAdd', async (member) => {
  try {
    const avatarUrl = member.user.displayAvatarURL({ extension: 'webp', size: 256 });
    const imageBuffer = await generateWelcomeImage(member.user.username, avatarUrl);
    const attachment = new AttachmentBuilder(imageBuffer, { name: 'welcome.png' });

    const channel = member.guild.channels.cache.get("1280254663069007876");

    const autorole = member.guild.roles.cache.get("1280263399112052780");

    if (!channel) {
      console.log(`Welcome channel not found for guild ${member.guild.id}`);
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`Welcome To ${member.guild.name}`)
      .setDescription(`
> <@${member.id}>
> Please Read Rules 
> You're The Member ${member.guild.memberCount} :busts_in_silhouette:
${autorole ? `> AutoRole: ${autorole}` : ''}
      `)
      .setFooter({ text: member.guild.name });

    await channel.send({ files: [attachment], embeds: [embed] });

    if (autorole) {
      console.log(`Assigning role ${autorole.id} to ${member.user.tag}`);
      try {
        await member.roles.add(autorole);
        console.log(`Role assigned successfully`);
      } catch (roleError) {
        console.error(`Failed to assign role: ${roleError.message}`);
      }
    } else {
      console.log('No autorole to assign');
    }
  } catch (error) {
    console.error('Error in guildMemberAdd event:', error);
  }
});

client.login('MTI4MDg5Mjk5MjEwNTc0NjU0Mw.GIVQvp.PHmb2Rgx3cIjIzb0ck1ugp0NIRmKDV37bVrEyE');
