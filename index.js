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
const Anagram = models.Anagram;
const path = require('path');
const { Vonage } = require('@vonage/server-sdk');
const admin = require('./src/admin');
const messages = require('./src/messages');

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
};

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
    .get('admin', '/admin', koaAuth({ name: process.env.BASIC_USERNAME, pass: process.env.BASIC_PASSWORD }), koaBody(), admin.admin_home,)
    .post('admin', '/admin', koaAuth({ name: process.env.BASIC_USERNAME, pass: process.env.BASIC_PASSWORD }), koaBody({ multipart: true }), admin.admin_home,)
    .get('admin_set_current', '/admin/setCurrent', koaAuth({ name: process.env.BASIC_USERNAME, pass: process.env.BASIC_PASSWORD }), koaBody({ multipart: true }), admin.admin_set_current,)
    .get('admin_delete_anagram', '/admin/delete', koaAuth({ name: process.env.BASIC_USERNAME, pass: process.env.BASIC_PASSWORD }), koaBody({ multipart: true }), admin.admin_delete_anagram,)
    .post('admin_clear_anagram', '/admin/clear_anagram', koaAuth({ name: process.env.BASIC_USERNAME, pass: process.env.BASIC_PASSWORD }), koaBody({ multipart: true }), admin.admin_clear_anagram,)
    .get('admin_delete_number', '/admin/delete_number', koaAuth({ name: process.env.BASIC_USERNAME, pass: process.env.BASIC_PASSWORD }), koaBody({ multipart: true }), admin.admin_delete_number,)
    .post('admin_notify', '/admin/notify', koaAuth({ name: process.env.BASIC_USERNAME, pass: process.env.BASIC_PASSWORD }), koaBody({ multipart: true }), admin.admin_notify,)
    .post('messages_inbound', '/events/messages', koaBody({ multipart: true }), messages.messages_inbound,)
    .post('messages_status', '/events/messages/status', koaBody({ multipart: true }), messages.messages_status,);

app.use(router.routes());

app.listen(process.env.PORT || 3000);
console.log('Application has started');