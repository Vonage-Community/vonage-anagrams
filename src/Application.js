import { default as Models } from '#src/models/index.js';
import { refreshAppConfig } from '#src/AppConfig.js';

export const setApplicationData = async (applicationId, privateKeyString) => {
    const appIdResult = await Models.AppConfig.findOrCreate({where: { 'configKey': 'VONAGE_APPLICATION_ID'}});
    const appId = appIdResult[0];

    await Models.AppConfig.update(
        { configValue: applicationId },
        { where: { id: appId.id } }
    );

    const privateKeyResult = await Models.AppConfig.findOrCreate({where: { 'configKey': 'VONAGE_PRIVATE_KEY'}});
    const privateKey = privateKeyResult[0];

    await Models.AppConfig.update(
        { configValue: Buffer.from(privateKeyString, 'ascii').toString('base64') },
        { where: { id: privateKey.id } }
    ).catch(err => console.log(err));

    await refreshAppConfig();
}