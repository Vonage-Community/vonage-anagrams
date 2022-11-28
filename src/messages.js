const { Vonage } = require('@vonage/server-sdk');
const { SMS } = require('@vonage/messages/dist/classes/SMS/SMS');
const models = require('./../models');
const Mobile = models.Mobile;


module.exports = {
    async messages_inbound(ctx) {
        const vonage = ctx.deps.vonage;

        if (ctx.request.body.text) {
            const text = ctx.request.body.text.toLowerCase();
            const mobile = await Mobile.findOne({ where: { mobile_number: ctx.request.body.from } });
            switch(text) {
                case 'register':
                    if (mobile) {
                        mobile.notify = true;
                        await mobile.save();
                        await vonage.messages.send(
                            new SMS(
                                "Thank you for re-registering! We will notify you if the anagram changes. Reply STOP to unregister.",
                                ctx.request.body.from,
                                process.env.VONAGE_FROM
                            )
                        );
                    } else {
                        await Mobile.create({ mobile_number: ctx.request.body.from, notify: true });
                        await vonage.messages.send(
                            new SMS(
                                "Thank you for registering! We will notify you if the anagram changes. Reply STOP to unregister.",
                                ctx.request.body.from,
                                process.env.VONAGE_FROM
                            )
                        );
                    }
                    break;
                case 'stop':
                    if (mobile) {
                        mobile.notify = false;
                        await mobile.save();
                    }
                    await vonage.messages.send(
                        new SMS(
                            "We have unregistered your number and you will no longer receive updates about the Vonage Anagram puzzle. Reply REGISTER to re-register.",
                            ctx.request.body.from,
                            process.env.VONAGE_FROM
                        )
                    );
                    break;
            }
        }
        ctx.body = 'OK';
    },
    
    async messages_status(ctx) {
        ctx.body = 'OK';
    },
}