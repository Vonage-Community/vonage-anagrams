require('dotenv').config();

const Koa = require('koa');
const router = require('@koa/router')();
const koaBody = require('koa-body');
const koaAuth = require('koa-basic-auth');
const koaStatic = require('koa-static');
const Twig = require('twig');
const twig = Twig.twig;
const views = require('koa-views');
const { Sequelize, Op } = require('sequelize');
const models = require('./models');
const path = require('path');
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
        const newAnagram = await Anagram.create({ anagram: ctx.request.body.anagram, solution: ctx.request.body.solution, current: false, used: false });
    }
    const anagrams = await Anagram.findAll({
        order: [
            ['current', 'DESC'],
            ['anagram', 'ASC']
        ]
    });
    await ctx.render('admin/index', { anagrams });
}

async function admin_set_current(ctx) {
    const anagram = await Anagram.findByPk(ctx.request.query.id);
    if (anagram) {
        await Anagram.update({ current: false }, { where: { id: { [Op.gt]: 0 } } });
        anagram.current = true;
        anagram.used = true;
        await anagram.save();
    }
    ctx.redirect('/admin');
}

async function admin_delete_anagram(ctx) {
    const anagram = await Anagram.findByPk(ctx.request.query.id);
    if (anagram) {
        Anagram.destroy({ where: { id: ctx.request.query.id } });
    }
    ctx.redirect('/admin');
}

const app = new Koa();
app.use(koaStatic(path.join(__dirname, '/public')))
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
    .get('admin_set_current', '/admin/setCurrent', koaAuth({ name: process.env.BASIC_USERNAME, pass: process.env.BASIC_PASSWORD }), koaBody({ multipart: true }), admin_set_current,)
    .get('admin_delete_anagram', '/admin/delete', koaAuth({ name: process.env.BASIC_USERNAME, pass: process.env.BASIC_PASSWORD }), koaBody({ multipart: true }), admin_delete_anagram,);

app.use(router.routes());

app.listen(process.env.PORT || 3000);
console.log('Application has started');