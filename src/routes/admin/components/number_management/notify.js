import { default as Models } from '#src/models/index.js';
import { getVonageClient } from '#src/Vonage.js';
import { SMS } from '@vonage/messages';

export default function(router) {
    router.post('/admin/components/number_management/notify', async (req, res) => {
        const vonage = getVonageClient();

        const numbers = await Models.Mobile.findAll({ where: { notify: true } });
        const fromNumber = await Models.AppConfig.findOne({ where: { configKey: "VONAGE_FROM"} });
        numbers.forEach(async (number) => {
            await vonage.messages.send(
                new SMS(
                    "This is Vonage! We just want to let you know the anagram has changed. Good luck!",
                    number.mobile_number,
                    fromNumber.configValue,
                )
            );
        });
        
        res.set({
            'HX-Trigger': 'reloadNumberManagement'
        });
        res.send();
    });
    return router;
}