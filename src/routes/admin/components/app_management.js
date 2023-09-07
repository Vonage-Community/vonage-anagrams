import { appConfig } from '#src/AppConfig.js';
import { getVonageClient } from '#src/Vonage.js';

export default function(router) {
    router.get('/admin/components/app_management', async (req, res) => {
        const vonage = getVonageClient();
        const applicationId = appConfig.VONAGE_APPLICATION_ID;

        if (applicationId) {
            const application = await vonage.applications.getApplication(applicationId)
                .then(resp => resp)
                .catch(err => {
                    console.error('The application configured does not exist');
                });

            let applicationNumbers = [];
            let availableNumbers = [];
            await vonage.numbers.getOwnedNumbers({hasApplication: 0})
                .then(resp => {
                    if (resp.numbers) {
                        resp.numbers.forEach(number => {
                            if (number.app_id && number.app_id === applicationId) {
                                applicationNumbers.push(number)
                            } else {
                                availableNumbers.push(number)
                            }
                        })
                    }
                });
            res.render('admin/components/app_management/application_configure.twig', {
                application,
                applicationNumbers,
                availableNumbers,
                fromNumber: appConfig.VONAGE_FROM,
            });
        } else {
            const applications = await vonage.applications.listApplications();
            res.render('admin/components/app_management/application_setup.twig', {
                applications: applications._embedded?.applications || null
            });
        }
    });
    return router;
}