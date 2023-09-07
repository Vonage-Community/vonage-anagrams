import { default as Models } from '#src/models/index.js';

export default function(router) {
    router.get('/admin/components/number_management', async (req, res) => {
        const mobileNumbers = await Models.Mobile.findAll();
        res.render('admin/components/number_management.twig', {
            mobileNumbers
        });
    });
    return router;
}