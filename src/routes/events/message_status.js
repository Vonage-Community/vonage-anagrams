export default function(router) {
    router.all('/events/messages/status', async (req, res) => {
        res.status(204).send();
    });
    return router;
}