const { SMS } = require('@vonage/messages/dist/classes/SMS/SMS');
const { Op } = require('sequelize');

function makeId(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

async function setApplicationData(ctx, AppConfig, applicationId, privateKeyString) {
    const appIdResult = await AppConfig.findOrCreate({where: { 'configKey': 'VONAGE_APPLICATION_ID'}});
    const appId = appIdResult[0];

    await AppConfig.update(
        { configValue: applicationId },
        { where: { id: appId.id } }
    );

    const privateKeyResult = await AppConfig.findOrCreate({where: { 'configKey': 'VONAGE_PRIVATE_KEY'}});
    const privateKey = privateKeyResult[0];

    await AppConfig.update(
        { configValue: Buffer.from(privateKeyString, 'ascii').toString('base64') },
        { where: { id: privateKey.id } }
    ).catch(err => console.log(err));

    await ctx.deps.refreshAppConfig();
    await ctx.deps.refreshVonageClient(ctx.deps.appConfigData);
}

module.exports = {
    async admin_home(ctx) {
        const Anagram = ctx.deps.models.Anagram;
        const Mobile = ctx.deps.models.Mobile;
        const vonage = ctx.deps.vonage;

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

        const applicationId = ctx.deps.appConfigData.VONAGE_APPLICATION_ID;
        let applications;
        let availableNumbers = [];
        let application;
        let applicationNumbers = [];

        if (applicationId) {
            application = await vonage.applications.getApplication(applicationId)
                .then(resp => resp)
                .catch(err => {
                    console.error('The application configured does not exist');
                });
        } else {
            applications = await vonage.applications.listApplications();
        }

        await vonage.numbers.getOwnedNumbers({hasApplication: 0})
            .then(resp => {
                if (resp.numbers) {
                    resp.numbers.forEach(number => {
                        if (number.app_id && number.app_id === applicationId) {
                            applicationNumbers.push(number)
                        } else {
                            availableNumbers.push(number)
                        }
                    })
                }
            })

        await ctx.render('admin/index', {
            anagrams,
            mobileNumbers,
            application,
            applications: applications?._embedded?.applications || null,
            fromNumber: ctx.deps.appConfigData.VONAGE_FROM,
            applicationNumbers,
            availableNumbers,
         });
    },
    
    async admin_set_current(ctx) {
        const Anagram = ctx.deps.models.Anagram;
        const anagram = await Anagram.findByPk(ctx.request.query.id);
        if (anagram) {
            await Anagram.update({ current: false }, { where: { id: { [Op.gt]: 0 } } });
            anagram.current = true;
            anagram.used = true;
            await anagram.save();
        }
        ctx.redirect('/admin');
    },
    
    async admin_delete_anagram(ctx) {
        const Anagram = ctx.deps.models.Anagram;
        const anagram = await Anagram.findByPk(ctx.request.query.id);
        if (anagram) {
            Anagram.destroy({ where: { id: ctx.request.query.id } });
        }
        ctx.redirect('/admin');
    },

    async admin_clear_anagram(ctx) {
        const Anagram = ctx.deps.models.Anagram;
        await Anagram.update({ current: false }, { where: { id: { [Op.gt]: 0 } } });
        ctx.redirect('/admin');
    },
    
    async admin_delete_number(ctx) {
        const Mobile = ctx.deps.models.Mobile;
        const mobile = await Mobile.findByPk(ctx.request.query.id);
        if (mobile) {
            mobile.destroy({ where: { id: ctx.request.query.id } });
        }
        ctx.redirect('/admin');
    },
    
    async admin_notify(ctx) {
        const AppConfig = ctx.deps.models.AppConfig;
        const Mobile = ctx.deps.models.Mobile;
        const vonage = ctx.deps.vonage;

        const numbers = await Mobile.findAll({ where: { notify: true } });
        const fromNumber = await AppConfig.findOne({ where: { configKey: "VONAGE_FROM"} });
        numbers.forEach(number => {
            vonage.messages.send(
                new SMS(
                    "This is Vonage! We just want to let you know the anagram has changed. Good luck!",
                    number.mobile_number,
                    fromNumber.configValue,
                )
            );
        });
        ctx.redirect('/admin');
    },

    async admin_update_callbacks(ctx) {
        const vonage = ctx.deps.vonage;

        await vonage.applications.getApplication(ctx.deps.appConfigData.VONAGE_APPLICATION_ID)
            .then(resp => {
                if (!resp.capabilities.messages) {
                    resp.capabilities.messages = {
                        webhooks: {
                            inbound_url: { address: '', http_post: ''},
                            status_url: { address: '', http_post: ''},
                        }
                    }
                }

                resp.capabilities.messages.webhooks.inbound_url = { address: ctx.request.header.origin + '/events/messages', http_method: 'POST'};
                resp.capabilities.messages.webhooks.status_url = { address: ctx.request.header.origin + '/events/messages/status', http_method: 'POST'};
                resp.capabilities.voice.webhooks.answer_url = { address: ctx.request.header.origin + '/events/voice', http_method: 'POST'}

                vonage.applications.updateApplication(resp)
                    .then(resp => {
                        console.log('Updated webhooks')
                    })
                    .catch(resp => {
                        console.log('There was an error updating the webhooks');
                        console.error(resp);
                        console.error(resp.response.data)
                    })
            })
            ctx.redirect('/admin');
    },

    async admin_set_application(ctx) {
        const AppConfig = ctx.deps.models.AppConfig;
        setApplicationData(ctx, AppConfig, ctx.request.body.application, ctx.request.body.privateKey);
        ctx.redirect('/admin');
    },

    async admin_assign_number(ctx) {
        const AppConfig = ctx.deps.models.AppConfig;
        const vonage = ctx.deps.vonage;

        await vonage.numbers.updateNumber({
            country: 'US',
            msisdn: ctx.request.body.fromNumber,
            applicationId: ctx.deps.appConfigData.VONAGE_APPLICATION_ID
        })
            .then(async (resp) => {
                const result = await AppConfig.findOrCreate({where: { 'configKey': 'VONAGE_FROM'}});
                const fromNumber = result[0];
        
                await AppConfig.update(
                    { configValue: ctx.request.body.fromNumber },
                    { where: { id: fromNumber.id } }
                );
                await ctx.deps.refreshAppConfig();
            })
        

        ctx.redirect('/admin');
    },

    async admin_create_application(ctx) {
        const AppConfig = ctx.deps.models.AppConfig;
        const vonage = ctx.deps.vonage;

        await vonage.applications.createApplication({
            name: 'vonage-anagram-' + makeId(6),
            capabilities: {
                messages: {
                    webhooks: {
                        inbound_url: { address: ctx.request.header.origin + '/events/messages', http_method: 'POST'},
                        status_url: { address: ctx.request.header.origin + '/events/messages/status', http_method: 'POST'},
                    },
                },
                voice: {
                    webhooks: {
                        answer_url: { address: ctx.request.header.origin + '/events/voice', http_method: 'POST'},
                    }
                }
            }
        })
            .then(async (resp) => {
                await setApplicationData(ctx, AppConfig, resp.id, resp.keys.private_key);
                ctx.redirect('/admin')
            })
    }
}