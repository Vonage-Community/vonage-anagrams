import { default as Models } from '#src/models/index.js';
import { appConfig } from '#src/AppConfig.js';
import { getVonageClient } from '#src/Vonage.js';

export default function(router) {
    router.get('/', async (req, res) => {
        let smsFromNumber = null;
        if (appConfig.VONAGE_FROM) {
            const vonage = getVonageClient();
            smsFromNumber = await vonage.numberInsights.basicLookup(appConfig.VONAGE_FROM);
        }
        const currentAnagram = await Models.Anagram.findOne({ where: { current: true } });

        res.render('home.twig', { currentAnagram, sms_number: smsFromNumber });
    });
    return router;
}