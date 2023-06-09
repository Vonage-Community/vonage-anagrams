const { Vonage } = require('@vonage/server-sdk');
const { SMS } = require('@vonage/messages/dist/classes/SMS/SMS');
const models = require('./../models');
const Mobile = models.Mobile;


module.exports = {
    async voice_inbound(ctx) {
        const ncco = [
            {
                action: "talk",
                text: "Thanks for calling! To register for anagram updates, please text this number instead. Sorry!"
            }
        ]
        ctx.body = ncco;
    }
}