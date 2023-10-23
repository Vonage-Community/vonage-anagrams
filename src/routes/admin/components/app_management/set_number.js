import { default as Models } from '#src/models/index.js';
import { appConfig, refreshAppConfig } from '#src/AppConfig.js';
import { getVonageClient } from '#src/Vonage.js';

export default function(router) {
    router.post('/admin/components/app_management/set_number', async (req, res) => {
        const vonage = getVonageClient();

        const numberData = await vonage.numbers.getOwnedNumbers({ pattern: req.body.fromNumber });

        await vonage.numbers.updateNumber({
            country: numberData.numbers[0].country,
            msisdn: req.body.fromNumber,
            applicationId: appConfig.VONAGE_APPLICATION_ID
        })
            .then(async (resp) => {
                const result = await Models.AppConfig.findOrCreate({where: { 'configKey': 'VONAGE_FROM'}});
                const fromNumber = result[0];
        
                await Models.AppConfig.update(
                    { configValue: req.body.fromNumber },
                    { where: { id: fromNumber.id } }
                );
                await refreshAppConfig();
            })

        res.set({
            'HX-Trigger': 'reloadAppManagement'
        });
        res.status(204).send();
    });
    return router;
}