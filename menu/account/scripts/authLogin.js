import { axios, iosBasic } from '../../../assets/script/requests.js';

const electron = require('electron');
const fs = require('fs');

async function authLogin(){
    const input = document.getElementById('input').value;
    document.getElementById('output').innerHTML = 'Loading <img src="../../assets/img/loading.gif" width="20pt" alt="loading">';
    let token = await axios.post('https://account-public-service-prod.ol.epicgames.com/account/api/oauth/token',
        'grant_type=authorization_code&code='+input,
        {
            'Authorization': 'basic '+iosBasic,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    );
    if (!token.access_token) return document.getElementById('output').innerHTML = token.errorMessage;
    

    if (!fs.existsSync(process.env.appdata+'/a.bakedpotato')) fs.mkdirSync(process.env.appdata+'/a.bakedpotato');
    if (!fs.existsSync(process.env.appdata+'/a.bakedpotato/fnappv2')) fs.mkdirSync(process.env.appdata+'/a.bakedpotato/fnappv2');
    if (!fs.existsSync(process.env.appdata+'/a.bakedpotato/fnappv2/tokens')) fs.mkdirSync(process.env.appdata+'/a.bakedpotato/fnappv2/tokens');

    let accountsFile = (fs.existsSync(process.env.appdata+'/a.bakedpotato/fnappv2/accounts.json')) ?
        JSON.parse(fs.readFileSync(process.env.appdata+'/a.bakedpotato/fnappv2/accounts.json').toString())
        : [];
    let thisAcc = accountsFile.filter(acc => acc.accountId === token.account_id);

    if (thisAcc[0]){
        let checkAcc = await axios.post('https://account-public-service-prod.ol.epicgames.com/account/api/oauth/token',
            'grant_type=device_auth&account_id='+thisAcc[0].accountId+'&device_id='+thisAcc[0].deviceId+'&secret='+thisAcc[0].secret,
            {
                'Authorization': 'basic '+iosBasic,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        );
        if (!checkAcc.access_token) thisAcc = [];
    }

    if (thisAcc[0]){
        accountsFile[accountsFile.indexOf(thisAcc[0])].displayName = token.displayName;
        document.getElementById('output').innerHTML = 'Your account has been updated.';
    } else {
        let devAuth = await axios.post('https://account-public-service-prod.ol.epicgames.com/account/api/public/account/'+token.account_id+'/deviceAuth',
            '{}',
            {
                'Authorization': 'bearer '+token.access_token,
                'Content-Type': 'application/json'
            }
        );

        

        accountsFile.push({
            accountId: token.account_id,
            deviceId: devAuth.deviceId,
            secret: devAuth.secret,
            displayName: token.displayName
        });
        document.getElementById('output').innerHTML = 'Hello, <a>'+token.displayName + '</a>. Your account has been saved. The following information is needed to log in:<br>Device ID: '+devAuth.deviceId+'<br>Secret: '+devAuth.secret;
    }
    
    accountsFile = accountsFile.sort((a, b) => a.displayName.toLowerCase().localeCompare(b.displayName.toLowerCase()));
    fs.writeFileSync(process.env.appdata+'/a.bakedpotato/fnappv2/accounts.json', JSON.stringify(accountsFile, null, '\t'));
}

electron.shell.openExternal('https://www.epicgames.com/id/api/redirect?clientId=af43dc71dd91452396fcdffbd7a8e8a9&responseType=code').then();

window.authLogin = authLogin;