import { default as Models } from '#src/models/index.js';
import { Op } from 'sequelize';

export default function(router) {
    router.post('/admin/anagram_management/clear_current_anagram', async (req, res) => {
        await Models.Anagram.update({ current: false }, { where: { id: { [Op.gt]: 0 } } });
        
        res.set({
            'HX-Trigger': 'newAnagram'
        });
        res.send();
    });
    return router;
}