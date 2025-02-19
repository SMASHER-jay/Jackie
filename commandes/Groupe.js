const { zokou } = require("../framework/zokou");
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { ajouterOuMettreAJourJid, mettreAJourAction, verifierEtatJid } = require("../bdd/antilien");
const { atbajouterOuMettreAJourJid, atbverifierEtatJid } = require("../bdd/antibot");
const { search, download } = require("aptoide-scraper");
const fs = require("fs-extra");
const conf = require("../set");
const { default: axios } = require('axios');
const cron = require("../bdd/cron");
const { exec } = require("child_process");


keith({ nomCom: "tagall", categorie: 'Group', reaction: "📣" }, async (dest, zk, commandeOptions) => {
  const { ms, repondre, arg, verifGroupe, nomGroupe, infosGroupe, nomAuteurMessage, verifAdmin, superUser } = commandeOptions;

  // Ensure command is for a group
  if (!verifGroupe) { 
    repondre("✋🏿 ✋🏿this command is reserved for groups ❌"); 
    return; 
  }

  // If no message argument, set a default message
  let mess = arg && arg.trim() ? arg.join(' ') : 'Aucun Message';

  // Get group participants if it's a group
  let membresGroupe = verifGroupe ? await infosGroupe.participants : [];

  // Prepare the initial message tag
  let tag = `========================\n  
        ✌️ *JACK MD* ✌️
========================\n
👥 Group : ${nomGroupe} 🚀 
👤 Author : *${nomAuteurMessage}* 👋 
📜 Message : *${mess}* 📝
========================\n\n`;

  // Emoji array and random selection logic
  const emoji = ['🦴', '👀', '😮‍💨', '❌', '✔️', '😇', '⚙️', '🔧', '🎊', '😡', '🙏🏿', '⛔️', '$', '😟', '🥵', '🐅'];
  const random = Math.floor(Math.random() * emoji.length); // Fixed random calculation

  // Loop through the group members, numbering them from 1 to last
  membresGroupe.forEach((membre, index) => {
    tag += `${index + 1}. ${emoji[random]} @${membre.id.split("@")[0]}\n`;
  });

  // Send the message if user is an admin or super user
  if (verifAdmin || superUser) {
    zk.sendMessage(dest, { text: tag, mentions: membresGroupe.map(m => m.id) }, { quoted: ms });
  } else {
    repondre('command reserved for admins');
  }
});

keith({ nomCom: "invite", categorie: 'Group', reaction: "🙋" }, async (dest, zk, commandeOptions) => {
  const { repondre, nomGroupe, nomAuteurMessage, verifGroupe } = commandeOptions;
  if (!verifGroupe) {
    return repondre("Wait bro, do you want the link to my DM?");
  }

  const link = await zk.groupInviteCode(dest);
  const lien = `https://chat.whatsapp.com/${link}`;
  const mess = `Hello ${nomAuteurMessage}, here is the group link of ${nomGroupe} \n\nClick Here To Join: ${lien}`;
  repondre(mess);
});

/** Promote a member to admin */

const stickers = [
  'https://files.catbox.moe/kbue6l.webp',
  'https://files.catbox.moe/vel483.webp',
  'https://files.catbox.moe/kbue6l.webp'
];

/** ***fin démettre**** **/
/** **retirer** */
keith({ nomCom: "remove", categorie: 'Group', reaction: "👨🏿‍💼" }, async (dest, zk, commandeOptions) => {
  let { repondre, msgRepondu, infosGroupe, auteurMsgRepondu, verifGroupe, nomAuteurMessage, auteurMessage, superUser, idBot } = commandeOptions;
  let membresGroupe = verifGroupe ? await infosGroupe.participants : "";
  if (!verifGroupe) { return repondre("for groups only"); }

  const verifMember = (user) => {
    for (const m of membresGroupe) {
      if (m.id !== user) continue;
      else return true;
    }
  };

  const memberAdmin = (membresGroupe) => {
    let admin = [];
    for (m of membresGroupe) {
      if (m.admin == null) continue;
      admin.push(m.id);
    }
    return admin;
  };

  const a = verifGroupe ? memberAdmin(membresGroupe) : '';
  let admin = verifGroupe ? a.includes(auteurMsgRepondu) : false;
  let membre = verifMember(auteurMsgRepondu);
  let autAdmin = verifGroupe ? a.includes(auteurMessage) : false;
  let zkad = verifGroupe ? a.includes(idBot) : false;

  try {
    if (autAdmin || superUser) {
      if (msgRepondu) {
        if (zkad) {
          if (membre) {
            if (admin == false) {
              const stickerUrl = stickers[Math.floor(Math.random() * stickers.length)];
              const sticker = new Sticker(stickerUrl, {
                pack: 'ALPHA-MD',
                author: nomAuteurMessage,
                type: StickerTypes.FULL,
                categories: ['🤩', '🎉'],
                id: '12345',
                quality: 50,
                background: '#000000'
              });

              await sticker.toFile("st.webp");
              const txt = `@${auteurMsgRepondu.split("@")[0]} was removed from the group.\n`;
              await zk.groupParticipantsUpdate(dest, [auteurMsgRepondu], "remove");
              zk.sendMessage(dest, { text: txt, mentions: [auteurMsgRepondu] });
              zk.sendMessage(dest, { sticker: fs.readFileSync("st.webp") }, { quoted: msgRepondu });
            } else {
              repondre("This member cannot be removed because he is an administrator of the group.");
            }
          } else {
            return repondre("This user is not part of the group.");
          }
        } else {
          return repondre("Sorry, I cannot perform this action because I am not an administrator of the group.");
        }
      } else {
        repondre("Please tag the member to be removed.");
      }
    } else {
      return repondre("Sorry I cannot perform this action because you are not an administrator of the group.");
    }
  } catch (e) {
    repondre("Oops " + e);
  }
});

/** ***fin démettre**** **/
/** *****fin retirer */

keith({ nomCom: "add", categorie: 'Group', reaction: "👨🏿‍💼" }, async (dest, zk, commandeOptions) => {
  let { repondre, msgRepondu, infosGroupe, auteurMsgRepondu, verifGroupe, nomAuteurMessage, auteurMessage, superUser, idBot } = commandeOptions;
  let membresGroupe = verifGroupe ? await infosGroupe.participants : "";
  if (!verifGroupe) { return repondre("for groups only"); } 

  const participants = await zk.groupMetadata(dest);
  const isImAdmin = participants.participants.some(p => p.id === zk.user.jid && p.isAdmin);
  if (!isImAdmin) return repondre("I'm not an admin.");
  const match = msgRepondu?.participant || arg[0];
  if (!match) return repondre('Example: add 254757835036');
  
  const res = await zk.groupParticipantsUpdate(dest, [match], 'add');
if (res === '403') return repondre('Failed, Invite sent.');
  if (res && res !== '200') return repondre(res, { quoted: msgRepondu });

  const stickerUrl = stickers[Math.floor(Math.random() * stickers.length)];
  const sticker = new Sticker(stickerUrl, {
    pack: 'ALPHA-MD',
    author: nomAuteurMessage,
    type: StickerTypes.FULL,
    categories: ['🤩', '🎉'],
    id: '12345',
    quality: 50,
    background: '#000000'
  });

  await sticker.toFile("st.webp");
  zk.sendMessage(dest, { sticker: fs.readFileSync("st.webp") }, { quoted: msgRepondu });
});



keith({ nomCom: "promote", categorie: 'Group', reaction: "👨🏿‍💼" }, async (dest, zk, commandeOptions) => {
  let { repondre, msgRepondu, infosGroupe, auteurMsgRepondu, verifGroupe, auteurMessage, superUser, idBot } = commandeOptions;
  let membresGroupe = verifGroupe ? await infosGroupe.participants : [];

  if (!verifGroupe) return repondre("For groups only");

  const verifMember = (user) => membresGroupe.some(m => m.id === user);
  const memberAdmin = (membresGroupe) => membresGroupe.filter(m => m.admin != null).map(m => m.id);
  const admins = verifGroupe ? memberAdmin(membresGroupe) : [];
  const admin = verifGroupe ? admins.includes(auteurMsgRepondu) : false;
  const membre = verifMember(auteurMsgRepondu);
  const autAdmin = verifGroupe ? admins.includes(auteurMessage) : false;
  const zkad = verifGroupe ? admins.includes(idBot) : false;

  try {
    if (autAdmin || superUser) {
      if (msgRepondu) {
        if (zkad) {
          if (membre) {
            if (!admin) {
              const txt = `🎊🍾 @${auteurMsgRepondu.split("@")[0]} has been promoted as a group Admin.`;
              await zk.groupParticipantsUpdate(dest, [auteurMsgRepondu], "promote");
              zk.sendMessage(dest, { text: txt, mentions: [auteurMsgRepondu] });

              const stickerUrl = stickers[Math.floor(Math.random() * stickers.length)];
              const sticker = new Sticker(stickerUrl, {
                pack: 'ALPHA-MD',
                author: auteurMessage,
                type: StickerTypes.FULL,
                categories: ['🤩', '🎉'],
                id: '12345',
                quality: 50,
                background: '#000000'
              });

              await sticker.toFile("st.webp");
              zk.sendMessage(dest, { sticker: fs.readFileSync("st.webp") }, { quoted: msgRepondu });
            } else {
              return repondre("This member is already an administrator of the group.");
            }
          } else {
            return repondre("This user is not part of the group.");
          }
        } else {
          return repondre("Sorry, I cannot perform this action because I am not an administrator of the group.");
        }
      } else {
        repondre("Please tag the member to be nominated.");
      }
    } else {
      return repondre("Sorry, I cannot perform this action because you are not an administrator of the group.");
    }
  } catch (e) {
    repondre("Oops, something went wrong: " + e);
  }
});

/** Demote a member */
keith({ nomCom: "demote", categorie: 'Group', reaction: "👨🏿‍💼" }, async (dest, zk, commandeOptions) => {
  let { repondre, msgRepondu, infosGroupe, auteurMsgRepondu, verifGroupe, auteurMessage, superUser, idBot } = commandeOptions;
  let membresGroupe = verifGroupe ? await infosGroupe.participants : [];

  if (!verifGroupe) return repondre("For groups only");

  const verifMember = (user) => membresGroupe.some(m => m.id === user);
  const memberAdmin = (membresGroupe) => membresGroupe.filter(m => m.admin != null).map(m => m.id);
  const admins = verifGroupe ? memberAdmin(membresGroupe) : [];
  const admin = verifGroupe ? admins.includes(auteurMsgRepondu) : false;
  const membre = verifMember(auteurMsgRepondu);
  const autAdmin = verifGroupe ? admins.includes(auteurMessage) : false;
  const zkad = verifGroupe ? admins.includes(idBot) : false;

  try {
    if (autAdmin || superUser) {
      if (msgRepondu) {
        if (zkad) {
          if (membre) {
            if (admin) {
const txt = `@${auteurMsgRepondu.split("@")[0]} has been removed from their position as a group administrator.`;
              await zk.groupParticipantsUpdate(dest, [auteurMsgRepondu], "demote");
              zk.sendMessage(dest, { text: txt, mentions: [auteurMsgRepondu] });

              const stickerUrl = stickers[Math.floor(Math.random() * stickers.length)];
              const sticker = new Sticker(stickerUrl, {
                pack: 'ALPHA-MD',
                author: auteurMessage,
                type: StickerTypes.FULL,
                categories: ['🤩', '🎉'],
                id: '12345',
                quality: 50,
                background: '#000000'
              });

              await sticker.toFile("st.webp");
              zk.sendMessage(dest, { sticker: fs.readFileSync("st.webp") }, { quoted: msgRepondu });
            } else {
              return repondre("This member is not a group administrator.");
            }
          } else {
            return repondre("This user is not part of the group.");
          }
        } else {
          return repondre("Sorry, I cannot perform this action because I am not an administrator of the group.");
        }
      } else {
        repondre("Please tag the member to be removed.");
      }
    } else {
      return repondre("Sorry, I cannot perform this action because you are not an administrator of the group.");
    }
  } catch (e) {
    repondre("Oops, something went wrong: " + e);
  }
});

keith({ nomCom: "del", categorie: 'Group',reaction:"🧹" }, async (dest, zk, commandeOptions) => {

  const { ms, repondre, verifGroupe,auteurMsgRepondu,idBot, msgRepondu, verifAdmin, superUser} = commandeOptions;
  
  if (!msgRepondu) {
    repondre("Please mention the message to delete.");
    return;
  }
  if(superUser && auteurMsgRepondu==idBot )
  {
    
       if(auteurMsgRepondu==idBot)
       {
         const key={
            remoteJid:dest,
      fromMe: true,
      id: ms.message.extendedTextMessage.contextInfo.stanzaId,
         }
         await zk.sendMessage(dest,{delete:key});return;
       } 
  }

          if(verifGroupe)
          {
               if(verifAdmin || superUser)
               {
                    
                         try{
                
      
            const key=   {
               remoteJid : dest,
               id : ms.message.extendedTextMessage.contextInfo.stanzaId ,
               fromMe : false,
               participant : ms.message.extendedTextMessage.contextInfo.participant

            }        
         
         await zk.sendMessage(dest,{delete:key});return;

             }catch(e){repondre( "I need admin rights.")}
                    
                      
               }else{repondre("Sorry, you are not an administrator of the group.")}
          }

});

keith({ nomCom: "info", categorie: 'Group' }, async (dest, zk, commandeOptions) => {
  const { ms, repondre, verifGroupe } = commandeOptions;
  if (!verifGroupe) { repondre("order reserved for the group only"); return };

 try { ppgroup = await zk.profilePictureUrl(dest ,'image') ; } catch { ppgroup = conf.URL}

    const info = await zk.groupMetadata(dest)

    /*console.log(metadata.id + ", title: " + metadata.subject + ", description: " + metadata.desc)*/


    let mess = {
      image: { url: ppgroup },
      caption:  `*━━━━『GROUP INFO』━━━━*\n\n*🎐Name:* ${info.subject}\n\n*🔩Group's ID:* ${dest}\n\n*🔍Desc:* \n\n${info.desc}`
    }


    zk.sendMessage(dest, mess, { quoted: ms })
  });
keith({ nomCom: "antilink", categorie: 'Group', reaction: "🔗" }, async (dest, zk, commandeOptions) => {


  var { repondre, arg, verifGroupe, superUser, verifAdmin } = commandeOptions;
  

  
  if (!verifGroupe) {
    return repondre("*for groups only*");
  }
  
  if( superUser || verifAdmin) {
    const enetatoui = await verifierEtatJid(dest)
    try {
      if (!arg || !arg[0] || arg === ' ') { repondre("antilink on to activate the anti-link feature\nantilink off to deactivate the anti-link feature\nantilink action/remove to directly remove the link without notice\nantilink action/warn to give warnings\nantilink action/delete to remove the link without any sanctions\n\nPlease note that by default, the anti-link feature is set to delete.") ; return};
     
      if(arg[0] === 'on') {

      
       if(enetatoui ) { repondre("the antilink is already activated for this group")
                    } else {
                  await ajouterOuMettreAJourJid(dest,"oui");
                
              repondre("the antilink is activated successfully") }
     
            } else if (arg[0] === "off") {

              if (enetatoui) { 
                await ajouterOuMettreAJourJid(dest , "non");

                repondre("The antilink has been successfully deactivated");
                
              } else {
                repondre("antilink is not activated for this group");
              }
            } else if (arg.join('').split("/")[0] === 'action') {
                            

              let action = (arg.join('').split("/")[1]).toLowerCase() ;

              if ( action == 'remove' || action == 'warn' || action == 'delete' ) {

                await mettreAJourAction(dest,action);

                repondre(`The anti-link action has been updated to ${arg.join('').split("/")[1]}`);

              } else {
                  repondre("The only actions available are warn, remove, and delete") ;
              }
            

            } else repondre("antilink on to activate the anti-link feature\nantilink off to deactivate the anti-link feature\nantilink action/remove to directly remove the link without notice\nantilink action/warn to give warnings\nantilink action/delete to remove the link without any sanctions\n\nPlease note that by default, the anti-link feature is set to delete.")

      
    } catch (error) {
       repondre(error)
    }

  } else { repondre('You are not entitled to this order') ;
  }

});




 //------------------------------------antibot-------------------------------

 keith({ nomCom: "antibot", categorie: 'Group', reaction: "🔗" }, async (dest, zk, commandeOptions) => {


  var { repondre, arg, verifGroupe, superUser, verifAdmin } = commandeOptions;
  

  
  if (!verifGroupe) {
    return repondre("*for groups only*");
  }
  
  if( superUser || verifAdmin) {
    const enetatoui = await atbverifierEtatJid(dest)
    try {
      if (!arg || !arg[0] || arg === ' ') { repondre('antibot on to activate the anti-bot feature\nantibot off to deactivate the antibot feature\nantibot action/remove to directly remove the bot without notice\nantibot action/warn to give warnings\nantilink action/delete to remove the bot message without any sanctions\n\nPlease note that by default, the anti-bot feature is set to delete.') ; return};
     
      if(arg[0] === 'on') {

      
       if(enetatoui ) { repondre("the antibot is already activated for this group")
                    } else {
                  await atbajouterOuMettreAJourJid(dest,"oui");
                
              repondre("the antibot is successfully activated") }
     
            } else if (arg[0] === "off") {

              if (enetatoui) { 
                await atbajouterOuMettreAJourJid(dest , "non");

                repondre("The antibot has been successfully deactivated");
                
              } else {
                repondre("antibot is not activated for this group");
              }
            } else if (arg.join('').split("/")[0] === 'action') {

              let action = (arg.join('').split("/")[1]).toLowerCase() ;

              if ( action == 'remove' || action == 'warn' || action == 'delete' ) {

                await mettreAJourAction(dest,action);

                repondre(`The anti-bot action has been updated to ${arg.join('').split("/")[1]}`);

              } else {
                  repondre("The only actions available are warn, remove, and delete") ;
              }
            

            } else {  
              repondre('antibot on to activate the anti-bot feature\nantibot off to deactivate the antibot feature\nantibot action/remove to directly remove the bot without notice\nantibot action/warn to give warnings\nantilink action/delete to remove the bot message without any sanctions\n\nPlease note that by default, the anti-bot feature is set to delete.') ;

                            }
    } catch (error) {
       repondre(error)
    }

  } else { repondre('You are not entitled to this order') ;

  }

});

//----------------------------------------------------------------------------

keith({ nomCom: "group", categorie: 'Group' }, async (dest, zk, commandeOptions) => {

  const { repondre, verifGroupe, verifAdmin, superUser, arg } = commandeOptions;

  if (!verifGroupe) { repondre("order reserved for group only"); return };
  if (superUser || verifAdmin) {

    if (!arg[0]) { repondre('Instructions:\n\nType group open or close'); return; }
    const option = arg.join(' ')
    switch (option) {
      case "open":
        await zk.groupSettingUpdate(dest, 'not_announcement')
        repondre('group open')
        break;
      case "close":
        await zk.groupSettingUpdate(dest, 'announcement');
        repondre('Group close successfully');
        break;
      default: repondre("Please don't invent an option")
    }

    
  } else {
    repondre("order reserved for the administratorr");
    return;
  }
 

});

keith({ nomCom: "left", categorie: "Mods" }, async (dest, zk, commandeOptions) => {

  const { repondre, verifGroupe, superUser } = commandeOptions;
  if (!verifGroupe) { repondre("order reserved for group only"); return };
  if (!superUser) {
    repondre("command reserved for the bot owner");
    return;
  }
  await repondre('sayonnara') ;
   
  zk.groupLeave(dest)
});

keith({ nomCom: "gname", categorie: 'Group' }, async (dest, zk, commandeOptions) => {
  const { arg, repondre, verifAdmin } = commandeOptions;

  if (!verifAdmin) {
    repondre("Order reserved for administrators of the group");
    return;
  }
  if (!arg[0]) {
    repondre("Please enter the group name");
    return;
  }
  const nom = arg.join(' ');
  await zk.groupUpdateSubject(dest, nom);
  repondre(`Group name updated to: *${nom}*`);
});

// Update group description
keith({ nomCom: "gdesc", categorie: 'Group' }, async (dest, zk, commandeOptions) => {
  const { arg, repondre, verifAdmin } = commandeOptions;

  if (!verifAdmin) {
    repondre("Order reserved for administrators of the group");
    return;
  }
  if (!arg[0]) {
    repondre("Please enter the group description");
    return;
  }
  const desc = arg.join(' ');
  await zk.groupUpdateDescription(dest, desc);
  repondre(`Group description updated to: *${desc}*`);
});

// Update group profile picture
keith({ nomCom: "gpp", categorie: 'Group' }, async (dest, zk, commandeOptions) => {
  const { repondre, msgRepondu, verifAdmin } = commandeOptions;

  if (!verifAdmin) {
    repondre("Order reserved for administrators of the group");
    return;
  }
  if (msgRepondu.imageMessage) {
    const pp = await zk.downloadAndSaveMediaMessage(msgRepondu.imageMessage);

    await zk.updateProfilePicture(dest, { url: pp })
      .then(() => {
        zk.sendMessage(dest, { text: "Group profile picture changed" });
        fs.unlinkSync(pp);
      })
      .catch(err => zk.sendMessage(dest, { text: err.toString() }));
  } else {
    repondre('Please mention an image');
  }
});

keith({nomCom:"hidetag",categorie:'Group',reaction:"🌹"},async(dest,zk,commandeOptions)=>{

  const {repondre,msgRepondu,verifGroupe,arg ,verifAdmin , superUser}=commandeOptions;

  if(!verifGroupe)  { repondre('This command is only allowed in groups.')} ;
  if (verifAdmin || superUser) { 

  let metadata = await zk.groupMetadata(dest) ;

  //console.log(metadata.participants)
 let tag = [] ;
  for (const participant of metadata.participants ) {

      tag.push(participant.id) ;
  }
  //console.log(tag)

    if(msgRepondu) {
      console.log(msgRepondu)
      let msg ;

      if (msgRepondu.imageMessage) {

        

     let media  = await zk.downloadAndSaveMediaMessage(msgRepondu.imageMessage) ;
     // console.log(msgRepondu) ;
     msg = {

       image : { url : media } ,
       caption : msgRepondu.imageMessage.caption,
       mentions :  tag
       
     }
    

      } else if (msgRepondu.videoMessage) {

        let media  = await zk.downloadAndSaveMediaMessage(msgRepondu.videoMessage) ;

        msg = {

          video : { url : media } ,
          caption : msgRepondu.videoMessage.caption,
          mentions :  tag
          
        }

      } else if (msgRepondu.audioMessage) {
    
        let media  = await zk.downloadAndSaveMediaMessage(msgRepondu.audioMessage) ;
       
        msg = {
   
          audio : { url : media } ,
          mimetype:'audio/mp4',
          mentions :  tag
           }     
        
      } else if (msgRepondu.stickerMessage) {

    
        let media  = await zk.downloadAndSaveMediaMessage(msgRepondu.stickerMessage)

        let stickerMess = new Sticker(media, {
          pack: 'JACKIE MD-tag',
          type: StickerTypes.CROPPED,
          categories: ["🤩", "🎉"],
          id: "12345",
          quality: 70,
          background: "transparent",
        });
        const stickerBuffer2 = await stickerMess.toBuffer();
       
        msg = { sticker: stickerBuffer2 , mentions : tag}


      }  else {
          msg = {
             text : msgRepondu.conversation,
             mentions : tag
          }
      }

    zk.sendMessage(dest,msg)

    } else {

        if(!arg || !arg[0]) { repondre('Enter the text to announce or mention the message to announce');
        ; return} ;

      zk.sendMessage(
         dest,
         {
          text : arg.join(' ') ,
          mentions : tag
         }     
      )
    }

} else {
  repondre('Command reserved for administrators.')
}

});


keith({
  nomCom: 'automute',
  categorie: 'Group'
}, async (dest, zk, commandeOptions) => {
  const { arg, repondre, verifAdmin } = commandeOptions;

  if (!verifAdmin) {
    repondre('You are not an administrator of the group');
    return;
  }

  const group_cron = await cron.getCronById(dest);

  if (!arg || arg.length === 0) {
    let state;
    if (group_cron == null || group_cron.mute_at == null) {
      state = "No time set for automatic mute";
    } else {
      state = `The group will be muted at ${(group_cron.mute_at).split(':')[0]}:${(group_cron.mute_at).split(':')[1]}`;
    }

    const msg = `*State:* ${state}\n*Instructions:* To activate automatic mute, add the minute and hour after the command separated by ':'. Example: automute 9:30\n*To delete the automatic mute, use the command* automute del`;

    repondre(msg);
    return;
  } else {
    const texte = arg.join(' ');

    if (texte.toLowerCase() === 'del') {
      if (group_cron == null) {
        repondre('No cronometrage is active');
      } else {
        await cron.delCron(dest);
        repondre("The automatic mute has been removed; restart to apply changes")
          .then(() => {
            exec("pm2 restart all");
          });
      }
    } else if (texte.includes(':')) {
      await cron.addCron(dest, "mute_at", texte);
      repondre(`Setting up automatic mute for ${texte}; restart to apply changes`)
        .then(() => {
          exec("pm2 restart all");
        });
    } else {
      repondre('Please enter a valid time with hour and minute separated by ":"');
    }
  }
});

keith({
  nomCom: 'autounmute',
  categorie: 'Group'
}, async (dest, zk, commandeOptions) => {
  const { arg, repondre, verifAdmin } = commandeOptions;

  if (!verifAdmin) {
    repondre('You are not an administrator of the group');
    return;
  }

  const group_cron = await cron.getCronById(dest);

  if (!arg || arg.length === 0) {
    let state;
    if (group_cron == null || group_cron.unmute_at == null) {
      state = "No time set for autounmute";
    } else {
      state = `The group will be un-muted at ${(group_cron.unmute_at).split(':')[0]}:${(group_cron.unmute_at).split(':')[1]}`;
    }

    const msg = `*State:* ${state}\n*Instructions:* To activate autounmute, add the minute and hour after the command separated by ':'. Example: autounmute 7:30\n*To delete autounmute, use the command* autounmute del`;

    repondre(msg);
    return;
  } else {
    const texte = arg.join(' ');

    if (texte.toLowerCase() === 'del') {
      if (group_cron == null) {
        repondre('No cronometrage has been activated');
      } else {
        await cron.delCron(dest);
        repondre("The autounmute has been removed; restart to apply the changes")
          .then(() => {
            exec("pm2 restart all");
          });
      }
    } else if (texte.includes(':')) {
      await cron.addCron(dest, "unmute_at", texte);
      repondre(`Setting up autounmute for ${texte}; restart to apply the changes`)
        .then(() => {
          exec("pm2 restart all");
        });
    } else {
      repondre('Please enter a valid time with hour and minute separated by ":"');
    }
  }
});


keith({
  nomCom: 'fkick',
  aliases: ['foreigner', 'countrykick'],
  categorie: 'Group'
}, async (dest, zk, commandeOptions) => {
  const { arg, repondre, verifAdmin, superUser, verifZokouAdmin } = commandeOptions;

  if (verifAdmin || superUser) {
    if (!verifZokouAdmin) {
      repondre('You need administrative rights to perform this command');
      return;
    }

    if (!arg || arg.length === 0) {
      repondre('Please enter the country code whose members will be removed');
      return;
    }

    const metadata = await zk.groupMetadata(dest);
    const participants = metadata.participants;

    for (let i = 0; i < participants.length; i++) {
      if (participants[i].id.startsWith(arg[0]) && participants[i].admin === null) {
        await zk.groupParticipantsUpdate(dest, [participants[i].id], "remove");
      }
    }
  } else {
    repondre('Sorry, you are not an administrator of the group');
  }
});

keith({
  nomCom: 'nsfw',
  categorie: 'Group'
}, async (dest, zk, commandeOptions) => {
  const { arg, repondre, verifAdmin } = commandeOptions;

  if (!verifAdmin) {
    repondre('Sorry, you cannot enable NSFW content without being an administrator of the group');
    return;
  }

  const hbd = require('../bdd/hentai');
  const isHentaiGroupe = await hbd.checkFromHentaiList(dest);

  if (arg[0] === 'on') {
    if (isHentaiGroupe) {
      repondre('NSFW content is already active for this group');
      return;
    }

    await hbd.addToHentaiList(dest);
    repondre('NSFW content is now active for this group');
  } else if (arg[0] === 'off') {
    if (!isHentaiGroupe) {
      repondre('NSFW content is already disabled for this group');
      return;
    }

    await hbd.removeFromHentaiList(dest);
    repondre('NSFW content is now disabled for this group');
  } else {
    repondre('You must enter "on" or "off"');
  }
});


