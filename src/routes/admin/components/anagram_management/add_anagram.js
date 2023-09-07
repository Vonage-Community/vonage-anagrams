import { default as Models } from '#src/models/index.js';

export default function(router) {
    router.post('/admin/anagram_management/add_anagram', async (req, res) => {
        const { anagram, solution } = req.body;
        await Models.Anagram.create({
            anagram,
            solution,
            current: false,
            used: false 
        });
        
        res.set({
            'HX-Trigger': 'newAnagram'
        });
        res.render('admin/components/anagram_management/add_anagram.twig');
    });
    return router;
}