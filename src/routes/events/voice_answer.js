export default function(router) {
    router.all('/events/voice', async (req, res) => {
        res.send([
            {
                action: "talk",
                text: "Thanks for calling! To register for anagram updates, please text this number instead. Sorry!"
            }
        ]);
    });
    return router;
}