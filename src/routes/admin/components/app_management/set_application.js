import { setApplicationData } from '#src/Application.js';

export default function(router) {
    router.post('/admin/components/app_management/set_application', async (req, res) => {
        setApplicationData(req.body.application, req.body.privateKey);

        res.set({
            'HX-Trigger': 'reloadAppManagement'
        });
        res.status(204).send();
    });
    return router;
}