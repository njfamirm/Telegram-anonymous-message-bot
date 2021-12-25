import bot from "../common/bot";
import { Context } from "telegraf";
import { deleteMessageSentByAdmin } from "./delete";
import { privateChannelID, publicChannelID } from "../../data/json/config.json";
import { checkErrorCode } from "../common/checkError";
import { sendToChannel } from "../../data/json/message.json";

const regex = new RegExp(`https://t.me/${publicChannelID}/d*`, "gm");

// 1. send copy of message to channel
// 2. delete reply markup ( send to channel from admins & delete from user )
async function sendToPublicChannel(ctx: Context) {
  if (ctx.from === undefined) return;

  const postReplyLink = checkReply(ctx);
  if (postReplyLink != null && postReplyLink[0] != undefined) {
    const exit = await ctx
      .copyMessage(`@${publicChannelID}`, {
        reply_to_message_id: parseInt(
          postReplyLink[0].replace(`https://t.me/${publicChannelID}/`, "")
        ),
      })
      .catch((err) => {
        checkErrorCode(ctx, err, true);
        return true;
      });

    if (exit === true) return;
  } else {
    const exit = await ctx.copyMessage(`@${publicChannelID}`).catch((err) => {
      checkErrorCode(ctx, err, true);
      return true;
    });
    if (exit === true) return;
  }

  // get channel from callback_query
  var channel = (<any>ctx).callbackQuery.data;

  if (channel === "directSending") {
    sendToPrivateChannel(ctx, undefined);
    deleteMessageSentByAdmin(ctx);
  } else {
    ctx.editMessageReplyMarkup(undefined);
  }
}

async function sendToPrivateChannel(ctx: Context, menu: any) {
  if (ctx.from === undefined) return;

  if (menu != undefined) {
    const exit = await ctx
      .copyMessage(`${privateChannelID}`, {
        reply_markup: { inline_keyboard: menu },
      })
      .catch((err) => {
        checkErrorCode(ctx, err, true);
        return true;
      });

    if (exit === true) return;
  } else {
    const exit = await ctx.copyMessage(`${privateChannelID}`).catch((err) => {
      checkErrorCode(ctx, err, true);
      return true;
    });

    if (exit === true) return;
  }

  // delete message from private chat
  deleteMessageSentByAdmin(ctx);
}

// check post link exists in text
function checkReply(ctx: Context) {
  const text: string = (<any>ctx).update.callback_query.message.text;
  return regex.exec(text);
}

bot.action("indirectSending", sendToPublicChannel);
bot.action("directSending", sendToPublicChannel);
bot.action("sendToArchive", (ctx) => {
  sendToPrivateChannel(ctx, sendToChannel.inlineKeyboard);
});
