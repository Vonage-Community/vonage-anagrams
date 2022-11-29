require('dotenv').config();

const Koa = require('koa');
const router = require('@koa/router')();
const koaBody = require('koa-body');
const koaAuth = require('koa-basic-auth');
const koaStatic = require('koa-static');
const koaDepsi = require('koa-depsi')
const Twig = require('twig');
const twig = Twig.twig;
const views = require('koa-views');
const { Sequelize, Op } = require('sequelize');
const models = require('./models');
const Anagram = models.Anagram;
const AppConfig = models.AppConfig;
const Mobile = models.Mobile;
const path = require('path');
const { Vonage } = require('@vonage/server-sdk');
const admin = require('./src/admin');
const messages = require('./src/messages');
const fs = require('fs');

const sequelize = new Sequelize(process.env.DB_DSN);
const connectToDatabase = async () => {
    sequelize.authenticate()
    .then(async () => {
        console.log("Connected to the database");
        await checkForMigrations(); 
        await bootApplication();
    })
    .catch(err => { console.error(err); });
}
connectToDatabase();

async function checkForMigrations() {
    let migrations = fs.readdirSync(__dirname + '/migrations');
    await sequelize.query('CREATE TABLE IF NOT EXISTS "SequelizeMeta" (name VARCHAR(255) UNIQUE PRIMARY KEY)');
    let completedMigrations = await sequelize.query("SELECT * FROM \"SequelizeMeta\"", {type: Sequelize.QueryTypes.SELECT});
    
    for (let name in completedMigrations) {
        if (completedMigrations.hasOwnProperty(name)) {
            let index = migrations.indexOf(completedMigrations[name].name);
            if (index !== -1) {
                migrations.splice(index, 1);
            }
        }
    }
    
    for(let i = 0, c = migrations.length; i < c; i++){
       let migration = require(__dirname + '/../migrations/' + migrations[i]);
       migration.up(sequelize.queryInterface, Sequelize);
       await sequelize.query("INSERT INTO \"SequelizeMeta\" VALUES(:name)", {type: Sequelize.QueryTypes.INSERT, replacements: {name: migrations[i]}})
    }
}

async function bootApplication() {
    const appConfig = {};
    const refreshAppConfig = async () => {
        const data = await AppConfig.findAll()
        data.forEach((row) => {
            appConfig[row.configKey] = row.configValue;
        })
    }
    refreshAppConfig();
    
    let vonage;
    const refreshVonageClient = async(appConfig) => {
        if (appConfig.VONAGE_PRIVATE_KEY) {
            vonage = new Vonage({
                apiKey: appConfig['VONAGE_API_KEY'] || process.env.VONAGE_API_KEY,
                apiSecret: appConfig['VONAGE_API_SECRET'] || process.env.VONAGE_API_SECRET,
                privateKey: Buffer.from(appConfig['VONAGE_PRIVATE_KEY'], 'base64'),
                applicationId: appConfig['VONAGE_APPLICATION_ID'],
            })
        } else {
            vonage = new Vonage({
                apiKey: appConfig['VONAGE_API_KEY'] || process.env.VONAGE_API_KEY,
                apiSecret: appConfig['VONAGE_API_SECRET'] || process.env.VONAGE_API_SECRET,
            })
        }
    };
    refreshVonageClient(appConfig);
    
    let smsFromNumber;
    async function formatSMSNumber() {
        smsFromNumber = await vonage.numberInsights.basicLookup(process.env.VONAGE_FROM);
    }
    if (appConfig.VONAGE_FROM) {
        formatSMSNumber();
    }
    
    async function home(ctx) {
        const currentAnagram = await Anagram.findOne({ where: { current: true } });
        await ctx.render('home', { currentAnagram, sms_number: smsFromNumber });
    };
    
    const app = new Koa();
    app.use(koaDepsi({
        refreshAppConfig,
        refreshVonageClient,
        vonage,
        appConfigData: appConfig,
        models: {
            Anagram,
            AppConfig,
            Mobile,
        }
    }));
    
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
        .post('admin_update_callbacks', '/admin/admin_update_callbacks', koaAuth({ name: process.env.BASIC_USERNAME, pass: process.env.BASIC_PASSWORD }), koaBody({ multipart: true }), admin.admin_update_callbacks,)
        .post('admin_set_application', '/admin/admin_set_application', koaAuth({ name: process.env.BASIC_USERNAME, pass: process.env.BASIC_PASSWORD }), koaBody({ multipart: true }), admin.admin_set_application,)
        .post('admin_assign_number', '/admin/admin_assign_number', koaAuth({ name: process.env.BASIC_USERNAME, pass: process.env.BASIC_PASSWORD }), koaBody({ multipart: true }), admin.admin_assign_number,)
        .post('admin_create_application', '/admin/admin_create_application', koaAuth({ name: process.env.BASIC_USERNAME, pass: process.env.BASIC_PASSWORD }), koaBody({ multipart: true }), admin.admin_create_application,)
        .post('messages_inbound', '/events/messages', koaBody({ multipart: true }), messages.messages_inbound,)
        .post('messages_status', '/events/messages/status', koaBody({ multipart: true }), messages.messages_status,);
    
    app.use(router.routes());
    
    app.listen(process.env.PORT || 3000);
    console.log('Application has started');
}

