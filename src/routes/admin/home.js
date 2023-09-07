export default function(router) {
    router.get('/admin', async (req, res) => {
        res.render('admin/home.twig');
    });
    return router;
}