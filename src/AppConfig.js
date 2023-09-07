import { default as Models } from '#src/models/index.js';

export const appConfig = {};

export const refreshAppConfig = async () => {
    const data = await Models.AppConfig.findAll()
    data.forEach((row) => {
        appConfig[row.configKey] = row.configValue;
    })
}
refreshAppConfig();