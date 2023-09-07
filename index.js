import dotenv from 'dotenv';
dotenv.config();

import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import basicAuth from 'express-basic-auth';
import Twig from 'twig';
import RouteLoader from './src/RouteLoader.js';

const expressPort = process.env.PORT || process.env.NERU_APP_PORT || 3000;

const app = express();
app.set('views', './views');
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('./public'));
app.set('view engine', 'twig');
Twig.cache(false);
app.set('twig', Twig);

app.use(async (req, res, next) => {
    if (req.path.startsWith('/admin')) {
        const users = {};
        users[process.env.BASIC_USERNAME] = process.env.BASIC_PASSWORD;
        return basicAuth({
            users,
            unauthorizedResponse: (req) => {
                return req.auth ? `${req.auth.user}:${req.auth.password} rejected` : 'No credentials supplied';
            },
            challenge: true
        })(req, res, (err) => {
            if (err) return next(err);
            return next();
        });
    } else {
        return next();
    }
})

const routes = await RouteLoader('./src/routes/**/*.js');
app.use('/', routes);

app.listen(expressPort, () => {
    console.log(`Listening on ${expressPort}`);
});