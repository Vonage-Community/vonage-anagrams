import { default as Models } from '#src/models/index.js';

export default function(router) {
    router.get('/admin/anagram_management/get_anagrams', async (req, res) => {
        const anagrams = await Models.Anagram.findAll({
            order: [
                ['current', 'DESC'],
                ['anagram', 'ASC']
            ]
        });
        res.render('admin/components/anagram_management/get_anagrams.twig', { anagrams });
    });
    return router;
}