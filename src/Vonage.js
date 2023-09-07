import { Vonage } from "@vonage/server-sdk";
import { Auth } from '@vonage/auth';
import { appConfig } from "#src/AppConfig.js";

function getAuth() {
    const privateKeyString = appConfig['VONAGE_PRIVATE_KEY'] || process.env.PRIVATE_KEY || null;
    const applicationId = appConfig['VONAGE_APPLICATION_ID'] || process.env.API_APPLICATION_ID || null;
    
    const authData = {
        apiKey: appConfig['VONAGE_API_KEY'] || process.env.VONAGE_API_KEY,
        apiSecret: appConfig['VONAGE_API_SECRET'] || process.env.VONAGE_API_SECRET
    };
    
    if (privateKeyString && applicationId) {
        authData['privateKey'] = Buffer.from(privateKeyString, 'base64');
        authData['applicationId'] = applicationId;
    }

    return new Auth(authData);
}

export function getVonageClient() {
    return new Vonage(getAuth(), { appendUserAgent: 'vonage-devrel-anagram'})
}