import { getVonageClient } from '#src/Vonage.js';
import { setApplicationData } from '#src/Application.js';

function makeId(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export default function(router) {
    router.post('/admin/components/app_management/create_application', async (req, res) => {
        const vonage = getVonageClient();

        const domain = `http${req.secure ? 's' : ''}://${req.get('host')}`;
        await vonage.applications.createApplication({
            name: 'vonage-anagram-' + makeId(6),
            capabilities: {
                messages: {
                    webhooks: {
                        inbound_url: { address: `${domain}/events/messages`, http_method: 'POST'},
                        status_url: { address: `${domain}/events/messages/status`, http_method: 'POST'},
                    },
                },
                voice: {
                    webhooks: {
                        answer_url: { address: `${domain}/events/voice`, http_method: 'POST'},
                    }
                }
            }
        })
            .then(async (resp) => {
                setApplicationData(resp.id, resp.keys.private_key);
                res.set({
                    'HX-Trigger': 'reloadAppManagement'
                });
                res.status(204).send();
            })
    });
    return router;
}