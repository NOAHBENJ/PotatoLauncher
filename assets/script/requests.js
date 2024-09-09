const os = require('os');

function request(options){
    return new Promise(async resolve => {
        let request = new XMLHttpRequest();
        request.open((options.method?.toUpperCase() || 'GET'), options.url);

        options.headers['X-Epic-Device-Info'] = JSON.stringify({
            type: 'Microsoft',
            model: os.type().replace(/_/g, ' ')+' '+os.release().split('.')[0],
            os: os.release()
        });
        for (const [header, value] of Object.entries(options.headers)){
            request.setRequestHeader(header, value.toString());
        }

        request.send(options.body ?? '{}');
        request.onreadystatechange = () => {
            if (request.readyState !== 4) return;
            if (request.response) return resolve(JSON.parse(request.response));
            resolve();
        }
    });
}

function deleteRequest(url, headers){
    return new Promise(async resolve => {
        let r = await request({
            url: url,
            headers: headers,
            method: 'DELETE'
        });
        resolve(r);
    });
}

function get(url, headers) {
    return new Promise(async resolve => {
        let r = await request({
            url: url,
            headers: headers ?? {},
            method: 'GET'
        });

        //Friends list add display name
        if (url.endsWith('?displayNames=true')){
            const displayNameMap = {};
            const total = [...r.incoming, ...r.outgoing, ...r.friends];
            for (let i = 0; i <= total.length; i += 100){
                const accountIds = total.slice(i, i+100).map(u => u.accountId);
                const list = await get('https://account-public-service-prod.ol.epicgames.com/account/api/public/account?accountId=' + accountIds.join('&accountId='), headers);

                for (const { id, displayName } of list){
                    console.log('Set ' + id + ' as ' + displayName);
                    displayNameMap[id] = displayName ?? id;
                }
            }

            r.incoming = r.incoming.map(f => {
                f.displayName = displayNameMap[f.accountId] ?? f.accountId;
                return f;
            });
            r.outgoing = r.outgoing.map(f => {
                f.displayName = displayNameMap[f.accountId] ?? f.accountId;
                return f;
            });
            r.friends = r.friends.map(f => {
                f.displayName = displayNameMap[f.accountId] ?? f.accountId;
                return f;
            });
        }

        resolve(r);
    });
}

function post(url, payload = '{}', headers = {}){
    return new Promise(async resolve => {
        let r = await request({
            url: url,
            headers: headers,
            body: payload,
            method: 'POST'
        });
        resolve(r);
    });
}

export const axios = {
    delete: deleteRequest,
    get: get,
    post: post
};

//export const iosBasic = 'MzQ0NmNkNzI2OTRjNGE0NDg1ZDgxYjc3YWRiYjIxNDE6OTIwOWQ0YTVlMjVhNDU3ZmI5YjA3NDg5ZDMxM2I0MWE=';
//export const iosBasic = 'M2Y2OWU1NmM3NjQ5NDkyYzhjYzI5ZjFhZjA4YThhMTI6YjUxZWU5Y2IxMjIzNGY1MGE2OWVmYTY3ZWY1MzgxMmU='; 
//export const iosBasic = 'ZDg1NjZmMmU3ZjVjNDhmODk2ODMxNzNlYjUyOWZlZTE6MjU1YzcxMDljODI3NDI0MTk4NjYxNmUzNzAyNjc4YjU=';
//export const iosBasic = 'ZWM2ODRiOGM2ODdmNDc5ZmFkZWEzY2IyYWQ4M2Y1YzY6ZTFmMzFjMjExZjI4NDEzMTg2MjYyZDM3YTEzZmM4NGQ=';
export const iosBasic = 'YWY0M2RjNzFkZDkxNDUyMzk2ZmNkZmZiZDdhOGU4YTk6NFlYdlNFQkxGUlBMaDFoekdaQWtmT2k1bXF1cEZvaFo=';
export const launcherBasic = 'MzRhMDJjZjhmNDQxNGUyOWIxNTkyMTg3NmRhMzZmOWE6ZGFhZmJjY2M3Mzc3NDUwMzlkZmZlNTNkOTRmYzc2Y2Y=';
export const switchBasic = 'NTIyOWRjZDNhYzM4NDUyMDhiNDk2NjQ5MDkyZjI1MWI6ZTNiZDJkM2UtYmY4Yy00ODU3LTllN2QtZjNkOTQ3ZDIyMGM3=';