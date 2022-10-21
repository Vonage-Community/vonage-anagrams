require('dotenv').config();

const Koa = require('koa');
const router = require('@koa/router')();
const koaBody = require('koa-body');
const koaAuth = require('koa-basic-auth');
const Twig = require('twig');
const twig = Twig.twig;
const views = require('koa-views');
const { Sequelize } = require('sequelize');
const models = require('./models');
const Anagram = models.Anagram;

const sequelize = new Sequelize(process.env.DB_DSN);
sequelize.authenticate()
    .then(() => { console.log("Connected to the database"); })
    .catch(err => { console.error(err); });

async function home(ctx) {
    const currentAnagram = await Anagram.findOne({ where: { current: true } });
    await ctx.render('home', { currentAnagram });
}

async function admin_home(ctx) {
    if (ctx.request.body.anagram && ctx.request.body.solution) {
        console.log('Saving');
        const newAnagram = await Anagram.create({ anagram: ctx.request.body.anagram, solution: ctx.request.body.solution, current: false, used: false });
    }
    const anagrams = await Anagram.findAll();
    await ctx.render('admin/index', { anagrams });
}

async function admin_set_current(ctx) {
    const anagram = await Anagram.findByPk(ctx.request.query.id);
    if (anagram) {
        anagram.current = true;
        await anagram.save();
    }
    ctx.redirect('/admin');
}

const app = new Koa();
const render = views(__dirname + '/views', {
    options: {
        allow_async: true,
    },
    extension: 'twig',
    map: {
        html: 'twig'
    }
});
app.use(render);

router
    .get('/', home)
    .get('', home)
    .get('admin', '/admin', koaAuth({ name: process.env.BASIC_USERNAME, pass: process.env.BASIC_PASSWORD }), koaBody(), admin_home,)
    .post('admin', '/admin', koaAuth({ name: process.env.BASIC_USERNAME, pass: process.env.BASIC_PASSWORD }), koaBody({ multipart: true }), admin_home,)
    .get('admin_set_current', '/admin/setCurrent', koaAuth({ name: process.env.BASIC_USERNAME, pass: process.env.BASIC_PASSWORD }), koaBody({ multipart: true }), admin_set_current,);

app.use(router.routes());

app.listen(process.env.PORT || 3000);
console.log('Application has started');