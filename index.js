console.log("NodeJS Version: " + process.version)
const Discord = require("discord.js")
//const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Discord.Intents.FLAGS.GUILD_MEMBERS, Discord.Intents.FLAGS. ] , fetchAllMembers : true});
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Discord.Intents.FLAGS.GUILD_MEMBERS ] , fetchAllMembers : true});
const secrets = new Map();
const DEFAULT_NUMBERS = 4;
const DEFAULT_ATTEMPTS = 50;
const STOPWORD = 'FLÜGGÅӘNKБ€ČHIŒSSØLĮÊN';
const FLUGGEGEHEINEN = new RegExp("^F.*GG.*N$")


var logWithDate = function(input,msg) {
  console.log(`${new Date().toISOString()} ${msg ?msg.channel.name : ''} : ${input}` )
}

var generateSecret = function(nrs) {
  let result = Math.floor(Math.random()*Math.pow(10, nrs));
  while(!containsNoDuplicates(""+result) || (""+result).length != nrs)
    result = Math.floor(Math.random()*Math.pow(10, nrs));
  return result;

}

client.on("ready", () => {
  logWithDate(`Logged in as ${client.user.tag}!`)
  logWithDate(`Logged in as ${client.user.id}!`)
})

var containsNoDuplicates = function(str) {
  let validationSet = new Set()
  str.split("").forEach(item => validationSet.add(item))
  return validationSet.size === str.length;
}

var buildKey = function(msg, userTag) {
  return msg.channelId+"_"+(userTag ? userTag : msg.author.tag);
}


var resetSecret = function(msg, user, numbers, attempts, vsUser) {
  if(!user) user = msg.author;
  let resetKey = buildKey(msg, user.tag)
  let existed = secrets.get(resetKey);
  if(existed) {
    if(!numbers) numbers = secrets.get(resetKey).numbers
    if(!attempts) attempts = secrets.get(resetKey).attempts
  }
  if(!numbers) numbers = DEFAULT_NUMBERS
  if(!attempts) attempts = DEFAULT_ATTEMPTS
  let secret =  generateSecret(numbers)
  logWithDate(`Secret ${secret} for ${resetKey}`, msg)  
  secrets.set(resetKey, { "numbers" : numbers, "attempts" : attempts, "secret" : secret, "attemptsLeft" : attempts})  
  
  if(existed) msg.reply(`${user}, access code to breach the ` + (vsUser ? `${vsUser}` : `${client.user}`) + ` reset to ${attempts} attempts and ${numbers} different digits`)
  else msg.reply(`${user}, to breach the ` + (vsUser ? `${vsUser}` : `${client.user}`) + `, enter the access code (${numbers} different digits). Countermeasures will be enabled after ${attempts} failed attempts.`)
}

client.on("messageCreate", msg => {
  if(msg.author.id === client.user.id) return

  let key = buildKey(msg);

 if(secrets.get(key) && msg.content) {
  if(FLUGGEGEHEINEN.test(msg.content.toUpperCase()) && !(msg.content.toUpperCase() === STOPWORD) && !secrets.get(key).pwned) {
      let secretToPWN = secrets.get(key);
      secretToPWN.pwned = true;  
      msg.reply(`https://tenor.com/view/bring-on-the-fluggegecheimen-fluggegecheimen-%D1%84%D0%BB%D1%8E%D0%B3%D0%B3%D0%B5%D0%B3%D0%B5%D1%85%D0%B0%D0%B9%D0%BC%D0%B5%D0%BD-gif-16111558`);
      msg.reply(`https://tenor.com/view/flugenheimer-tickle-scream-gif-16608814`);  
    }  else if(msg.content.toUpperCase() === STOPWORD) {
      let secretToStop = secrets.get(key);
      secretToStop.stopped = true;    
    } 
  }

  if( msg.member.roles.cache.some(r => r.name === "botmaster") && msg.content.startsWith("reset")) {
    let commandParts = msg.content.split(",");
    let numbers = parseInt(commandParts[1]);
    let attempts = parseInt(commandParts[2]);
    let userTag = commandParts[3];
    let vsUserTag = commandParts[4];

    if(!userTag) {
      for (let [snowflake, guildMember] of msg.channel.members) {   
        if(client.user.id === guildMember.user.id) continue
        resetSecret(msg, guildMember.user, numbers, attempts)
      }
    } else {
      let userByTag = client.users.cache.find(u => u.tag === userTag);

      let vsUserByTag = null;
      for (let [snowflake, guildMember] of msg.channel.members) {
        if(vsUserTag === guildMember.user.tag) vsUserByTag = guildMember.user
      }  
      resetSecret(msg, userByTag, numbers, attempts, vsUserByTag)
    }
    return
  }
  
  logWithDate("key="+key, msg)

  if(!secrets.get(key)) {
    resetSecret(msg)
    return
  } 

  if(secrets.get(key).solved && !msg.content.startsWith("reset")) {
    msg.reply(`Access granted!`);
    return
  }

  if(secrets.get(key).stopped && !msg.content.startsWith("reset")) {
    msg.reply(`Connection reset`);
    return
  }

  /*
  if(secrets.get(key).pwned && !msg.content.startsWith("reset")) {
    msg.reply(`PWNd!`);
    return
  }*/
    
  if(secrets.get(key).attemptsLeft < 1) 
  {
    msg.reply(`Countermeasures enabled!`)
    return
  }

  if(! new RegExp("^\\d{"+  secrets.get(key).numbers +"}$").test(msg.content)) {
    msg.reply(`Invalid input, access code consists of ${secrets.get(key).numbers} different digits`)
    return
  }

  if(!containsNoDuplicates(msg.content)) {
    msg.reply(`Invalid input, contains duplicate digits`)
    return
  }

    

  let inputChars = msg.content.split("");
  let secretString = new String(secrets.get(key).secret);
  let actualChars = secretString.split("");

  let bullsNr = 0; //bull is correct number in the correct position
  let cowsNr = 0; //cow is correct number in the incorrect position

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

  

  logWithDate(`${key} - bulls=${bullsNr} vs needed=${secrets.get(key).numbers}, secret=${secretString}`, msg)
  if(bullsNr === secrets.get(key).numbers) {
   msg.reply("Access granted!");
   secrets.get(key).solved = true;
   return
  }

  msg.reply(`[${msg.content}] ${bullsNr} digit(s) are placed correctly, ${cowsNr} digit(s) are placed incorrectly. ` 
    + (secrets.get(key).attemptsLeft < 1 ? 
        'Countermeasures enabled! ' 
        : `Countermeasures will be enabled after ${secrets.get(key).attemptsLeft} failed attempt(s)`))
})

client.login("ODk2NDg3NjgyNjE4ODQzMTc3.YWH1Nw.OchkF-1sC-4MWn6ynMUwXGHRg2I");