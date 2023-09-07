import { default as Models } from '#src/models/index.js';
import { appConfig } from '#src/AppConfig.js';
import { getVonageClient } from '#src/Vonage.js';
import { SMS } from '@vonage/messages';

export default function(router) {
    router.post('/events/messages', async (req, res) => {
        const vonage = getVonageClient();

        if (req.body.text) {
            const text = req.body.text.toLowerCase();
            const mobile = await Models.Mobile.findOne({ where: { mobile_number: req.body.from } });
            switch(text) {
                case 'register':
                    if (mobile) {
                        mobile.notify = true;
                        await mobile.save();
                        await vonage.messages.send(
                            new SMS(
                                "Thank you for re-registering! We will notify you if the anagram changes. Reply STOP to unregister.",
                                req.body.from,
                                appConfig.VONAGE_FROM
                            )
                        );
                    } else {
                        await Models.Mobile.create({ mobile_number: req.body.from, notify: true });
                        await vonage.messages.send(
                            new SMS(
                                "Thank you for registering! We will notify you if the anagram changes. Reply STOP to unregister.",
                                req.body.from,
                                appConfig.VONAGE_FROM
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
                            req.body.from,
                            appConfig.VONAGE_FROM
                        )
                    );
                    break;
            }
        }

        res.status(204).send();
    });
    return router;
}