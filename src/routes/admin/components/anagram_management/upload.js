import { default as Models } from '#src/models/index.js';
import multer from 'multer';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { realpathSync, readFileSync } from 'fs';
import { parse } from 'csv/sync';

const currentDir = dirname(fileURLToPath(import.meta.url));
const dest = realpathSync(`${currentDir}/../../../../../data/`);
const upload = multer({ dest});

export default function(router) {
    router.post('/admin/components/anagram_management/upload', upload.single('csv_file'), async (req, res) => {
        if (req.file && req.file.path) {
            const anagrams = parse(readFileSync(req.file.path));
            for (const anagram of anagrams) {
                await Models.Anagram.create({
                    anagram: anagram[0],
                    solution: anagram[1],
                    current: false,
                    used: false 
                });
            }
        }

        res.set({
            'HX-Trigger': 'newAnagram'
        });
        res.status(204).send();
    });
    return router;
}