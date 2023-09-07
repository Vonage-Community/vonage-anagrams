import { default as Models } from '#src/models/index.js';
import { Op } from 'sequelize';

export default function(router) {
    router.post('/admin/anagram_management/set_current_anagram', async (req, res) => {
        const id = req.query.id;
        const anagram = await Models.Anagram.findByPk(id);
        if (anagram) {
            await Models.Anagram.update({ current: false }, { where: { id: { [Op.gt]: 0 } } });
            anagram.current = true;
            anagram.used = true;
            await anagram.save();
        }
        
        res.set({
            'HX-Trigger': 'newAnagram'
        });
        res.send();
    });
    return router;
}