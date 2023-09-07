import { appConfig } from '#src/AppConfig.js';
import { getVonageClient } from '#src/Vonage.js';

export default function(router) {
    router.post('/admin/components/app_management/update_callbacks', async (req, res) => {
        const vonage = getVonageClient();
        await vonage.applications.getApplication(appConfig.VONAGE_APPLICATION_ID)
            .then(resp => {
                if (!resp.capabilities.messages) {
                    resp.capabilities.messages = {
                        webhooks: {
                            inbound_url: { address: '', http_post: ''},
                            status_url: { address: '', http_post: ''},
                        }
                    };
                    resp.capabilities.voice = {
                        webhooks: {
                            answer_url: { address: '', http_post: ''},
                        }
                    }
                }

                const domain = `http${req.secure ? 's' : ''}://${req.get('host')}`;
                resp.capabilities.messages.webhooks.inbound_url = { address: `${domain}/events/messages`, http_method: 'POST'};
                resp.capabilities.messages.webhooks.status_url = { address: `${domain}/events/messages/status`, http_method: 'POST'};
                resp.capabilities.voice.webhooks.answer_url = { address: `${domain}/events/voice`, http_method: 'POST'}

                vonage.applications.updateApplication(resp)
                    .then(resp => {
                        console.log('Updated webhooks')
                    })
                    .catch(resp => {
                        console.log('There was an error updating the webhooks');
                        console.error(resp);
                        console.error(resp.response.data)
                    })
            });

        res.set({
            'HX-Trigger': 'reloadAppManagement'
        });
        res.status(204).send();
    });
    return router;
}