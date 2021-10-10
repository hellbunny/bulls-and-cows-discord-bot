console.log("NodeJS Version: " + process.version)
const Discord = require("discord.js")
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS ] });

const secrets = new Map();




var generateSecret = function(nrs) 
{
  let result = Math.floor(Math.random()*Math.pow(10, nrs));
  while(!containsNoDuplicates(""+result) || (""+result).length != nrs)
    result = Math.floor(Math.random()*Math.pow(10, nrs));
  return result;

}

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)
  console.log(`Logged in as ${client.user.id}!`)
})

var containsNoDuplicates = function(str) 
{
  let validationSet = new Set()
  str.split("").forEach(item => validationSet.add(item))
  return validationSet.size === str.length;
}

client.on("messageCreate", msg => {
  if(msg.author.id === client.user.id) return
  let key = msg.channelId+"_"+msg.author.tag;
  
  if(secrets.get(key) && secrets.get(key).solved && !msg.content.startsWith("reset")) 
  {
    msg.reply(`Access granted!`);
    return
  }
  console.log("key="+key);
  if(
    !secrets.get(key) 
    ||
    (msg.member.roles.cache.some(r => r.name === "botmaster") && msg.content.startsWith("reset"))
  ) 
  {
    
    let commandParts = msg.content.split(",");
    let numbers = commandParts[1];
    let attempts = commandParts[2];

    if(secrets.get(key)) {
      if(!numbers) numbers = secrets.get(key).numbers;
      if(!attempts) attempts = secrets.get(key).attempts;
    }

    if(!numbers) numbers = 4;
    if(!attempts) attempts = 50;

    let secret =  generateSecret(numbers);
    console.log(`Secret ${secret} for ${key}`)
    secrets.set(key, { "numbers" : numbers, "attempts" : attempts, "secret" : secret, "attemptsLeft" : attempts});

    if(msg.content.startsWith("reset")) {
      msg.reply(`Password reset to ${attempts} attempts and ${numbers} different digits`);
      return
    } else {
      msg.reply(`Enter password (${numbers} different digits)`);
    }
  }

  let nr = secrets.get(key).secret;

  if(! new RegExp("^\\d{"+  secrets.get(key).numbers +"}$").test(msg.content)) {
    msg.reply(`Invalid input, please enter ${secrets.get(key).numbers} digits`)
    return
  }

  if(!containsNoDuplicates(msg.content)) {
    msg.reply(`Invalid input, contains duplicates`)
    return
  }
  
  if(secrets.get(key).attemptsLeft < 1) 
  {
    msg.reply(`No attempts left. Reset required!`)
    return
  }
    

  let inputChars = msg.content.split("");
  let secretString = new String(secrets.get(key).secret);
  let actualChars = secretString.split("");
  //bull is correct number in the correct position
  //cow is correct number in the incorrect position
  let bullsNr = 0;
  let cowsNr = 0;

  for (let i = 0; i < inputChars.length; i++) {
    //arrays are same size, ensured by validation
    let inputChar = inputChars[i];
    if(inputChar === actualChars[i]) bullsNr++;
    else {
      let idx = secretString.indexOf(inputChar);
      if(idx === -1) continue
      if(inputChars[idx] !== actualChars[idx]) cowsNr++;
    }
  }


  secrets.get(key).attemptsLeft--;

  if(bullsNr === secrets.get(key).numbers) {
   msg.reply("Access granted!");
   secrets.get(key).solved = true;
   return
  }

  msg.reply(`[${msg.content}] contains ${bullsNr} bulls, ${cowsNr} cows, you have ${secrets.get(key).attemptsLeft}/${secrets.get(key).attempts} attempts left.`)
})

//client.login(process.env["DISCORD_BOT_TOKEN"]);

client.login("ODk2NDg3NjgyNjE4ODQzMTc3.YWH1Nw.OchkF-1sC-4MWn6ynMUwXGHRg2I");