import { default as Models } from '#src/models/index.js';

export default function(router) {
    router.get('/admin/components/number_management/delete_number', async (req, res) => {
        const id = parseInt(req.query.id);
        const mobile = await Models.Mobile.findByPk(id);
        if (mobile) {
            mobile.destroy({ where: { id } });
        }
        
        res.set({
            'HX-Trigger': 'reloadNumberManagement'
        });
        res.send();
    });
    return router;
}