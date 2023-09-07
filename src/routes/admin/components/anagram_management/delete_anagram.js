import { default as Models } from '#src/models/index.js';

export default function(router) {
    router.post('/admin/anagram_management/delete_anagram', async (req, res) => {
        const id = req.query.id;
        const anagram = await Models.Anagram.findByPk(id);
        if (anagram) {
            Models.Anagram.destroy({ where: { id: id } });
        }
        
        res.set({
            'HX-Trigger': 'newAnagram'
        });
        res.send();
    });
    return router;
}