const fs = require('fs');
const querystring = require('querystring');
const axios = require('axios');

/**
 * 
 * @param {string} accountId - accountId
 * @param {string} deviceId - deviceId
 * @param {string} secret - device_secret
 * @param {string} authorization - Authorization header - has to be the same as what generated device/secret
 * @returns Bearer token from/for device/secret's client/id. 
 */
async function generateBearerToken(accountId, deviceId, secret, AUTHORIZATION_HEADER) {
    try {
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': AUTHORIZATION_HEADER.includes('Basic') ? AUTHORIZATION_HEADER : `Basic ${AUTHORIZATION_HEADER}`,
        };
        const body = querystring.stringify({
            grant_type: 'device_auth',
            account_id: accountId,
            device_id: deviceId,
            secret: secret,
        });

        var tokenResponse;
        try { tokenResponse = await axios.post('https://account-public-service-prod.ol.epicgames.com/account/api/oauth/token', body, { headers }); }
        catch {return null;}
        if (tokenResponse.status!== 200) throw new Error(`Token request failed with status ${tokenResponse.status}`);
        return tokenResponse.data.access_token

    } catch (error) {
        console.error(error);
    }
}

/**
 * 
 * @param {string} bearer - bearer token
 * @param {string} consumingClientId - id of client this code is going to be used for
 * @returns - exchange code from/for consumingClientId's client
 */
async function generateExchangeCode(bearer, consumingClientId) {
    const url = "https://account-public-service-prod.ol.epicgames.com/account/api/oauth/exchange?consumingClientId=" + consumingClientId;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${bearer}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error status: ${response.status}`);
        }

        const text = await response.text();
        return text;
    } catch (error) {
        handleError(error);
        return "go fuck yourself Visual Studio";
    }
}

/**
 * 
 * @param {string} exchange_code - exchange code (if from client/secret, has to be an iOS generated client)
 * @param {string} authorization - auth header, for instance launch is fortnitePcClient clientid:secret (base64)
 * @returns - bearer token for authorization's client
 */
async function getBearerUsingAnExchangeCode(exchange_code, authorization) {
    const url = "https://account-public-service-prod.ol.epicgames.com/account/api/oauth/token";
    const requestBody = `grant_type=exchange_code&exchange_code=${encodeURIComponent(exchange_code)}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authorization}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: requestBody
        });

        if (!response.ok) {
            console.log("penis  ; " + response.json());
            throw new Error(`HTTP error status: ${response.status}`);
        }

        const text = await response.text();
        return text;
    } catch (error) {
        console.log(error.message);
        return error.message;
    }
}

module.exports = {
    generateBearerToken,
    generateExchangeCode,
    getBearerUsingAnExchangeCode,
}