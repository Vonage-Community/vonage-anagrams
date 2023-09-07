export default function(router) {
    router.all('/events/voice_events', async (req, res) => {
        res.status(204).send();
    });
    return router;
}