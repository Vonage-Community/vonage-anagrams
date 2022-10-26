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
const { Vonage } = require('@vonage/server-sdk');
const { SMS } = require('@vonage/messages/dist/classes/SMS/SMS');
const Anagram = models.Anagram;
const Mobile = models.Mobile;

const sequelize = new Sequelize(process.env.DB_DSN);
sequelize.authenticate()
    .then(() => { console.log("Connected to the database"); })
    .catch(err => { console.error(err); });

const vonage = new Vonage({
    apiKey: process.env.VONAGE_API_KEY,
    apiSecret: process.env.VONAGE_API_SECRET,
    privateKey: Buffer.from(process.env.VONAGE_PRIVATE_KEY, 'base64'),
    applicationId: process.env.VONAGE_APPLICATION_ID,
});

let smsFromNumber;
async function formatSMSNumber() {
    smsFromNumber = await vonage.numberInsights.basicLookup(process.env.VONAGE_FROM);
}
if (process.env.VONAGE_FROM) {
    formatSMSNumber();
}

async function home(ctx) {
    const currentAnagram = await Anagram.findOne({ where: { current: true } });
    await ctx.render('home', { currentAnagram, sms_number: smsFromNumber });
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
    const mobileNumbers = await Mobile.findAll();
    await ctx.render('admin/index', { anagrams, mobileNumbers });
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

async function admin_delete_number(ctx) {
    const mobile = await Mobile.findByPk(ctx.request.query.id);
    if (mobile) {
        mobile.destroy({ where: { id: ctx.request.query.id } });
    }
    ctx.redirect('/admin');
}

async function admin_notify(ctx) {
    const numbers = await Mobile.findAll({ where: { notify: true } });
    numbers.forEach(number => {
        vonage.messages.send(
            new SMS(
                "This is Vonage! We just want to let you know the anagram has changed. Good luck!",
                number.mobile_number,
                process.env.VONAGE_FROM
            )
        );
    });
    ctx.redirect('/admin');
}

async function messages_inbound(ctx) {
    if (ctx.request.body.text) {
        const text = ctx.request.body.text.toLowerCase();
        const mobile = await Mobile.findOne({ where: { mobile_number: ctx.request.body.from } });
        switch(text) {
            case 'register':
                if (mobile) {
                    mobile.notify = true;
                    await mobile.save();
                    await vonage.messages.send(
                        new SMS(
                            "Thank you for re-registering! We will notify you if the anagram changes. Reply STOP to unregister.",
                            ctx.request.body.from,
                            process.env.VONAGE_FROM
                        )
                    );
                } else {
                    await Mobile.create({ mobile_number: ctx.request.body.from, notify: true });
                    await vonage.messages.send(
                        new SMS(
                            "Thank you for registering! We will notify you if the anagram changes. Reply STOP to unregister.",
                            ctx.request.body.from,
                            process.env.VONAGE_FROM
                        )
                    );
                }
                break;
            case 'stop':
                if (mobile) {
                    mobile.notify = false;
                    await mobile.save();
                }
                await vonage.messages.send(
                    new SMS(
                        "We have unregistered your number and you will no longer receive updates about the Vonage Anagram puzzle. Reply REGISTER to re-register.",
                        ctx.request.body.from,
                        process.env.VONAGE_FROM
                    )
                );
                break;
        }
    }
    ctx.body = 'OK';
}

async function messages_status(ctx) {
    ctx.body = 'OK';
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
    .get('admin_delete_anagram', '/admin/delete', koaAuth({ name: process.env.BASIC_USERNAME, pass: process.env.BASIC_PASSWORD }), koaBody({ multipart: true }), admin_delete_anagram,)
    .get('admin_delete_number', '/admin/delete_number', koaAuth({ name: process.env.BASIC_USERNAME, pass: process.env.BASIC_PASSWORD }), koaBody({ multipart: true }), admin_delete_number,)
    .post('admin_notify', '/admin/notify', koaAuth({ name: process.env.BASIC_USERNAME, pass: process.env.BASIC_PASSWORD }), koaBody({ multipart: true }), admin_notify,)
    .post('messages_inbound', '/events/messages', koaBody({ multipart: true }), messages_inbound,)
    .post('messages_status', '/events/messages/status', koaBody({ multipart: true }), messages_status,);

app.use(router.routes());

app.listen(process.env.PORT || 3000);
console.log('Application has started');