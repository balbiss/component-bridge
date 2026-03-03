require('dotenv').config();
const axios = require('axios');

const WUZAPI_URL = process.env.WUZAPI_URL || 'https://weeb.inoovaweb.com.br';
const WUZAPI_ADMIN = process.env.WUZAPI_ADMIN_TOKEN || '44507d94623ef3c92c7c8b908b786836';

(async () => {
    // 1. Get all Wuzapi users
    const usersResp = await axios.get(`${WUZAPI_URL}/admin/users`, {
        headers: { Authorization: WUZAPI_ADMIN }
    });

    const users = usersResp.data?.data || [];
    console.log('Total Wuzapi users:', users.length);

    const connected = users.find(u => u.connected === true && u.loggedIn === true);
    if (!connected) {
        console.log('No connected user found. Users:', users.map(u => ({ name: u.name, connected: u.connected, loggedIn: u.loggedIn })));
        return;
    }

    const phone = (connected.jid || '').split(':')[0].split('@')[0];
    console.log('Connected user:', connected.name, '| Phone:', phone);
    console.log('Token (first 15):', connected.token?.substring(0, 15));

    // 2. Test /user/avatar with different header formats
    for (const headerName of ['Authorization', 'token', 'Token']) {
        try {
            const avatarResp = await axios.post(`${WUZAPI_URL}/user/avatar`,
                { Phone: phone, Preview: false },
                { headers: { [headerName]: connected.token } }
            );
            console.log(`SUCCESS with '${headerName}':`, JSON.stringify(avatarResp.data, null, 2));
            break;
        } catch (err) {
            console.log(`FAIL with '${headerName}':`, err.response?.status, JSON.stringify(err.response?.data));
        }
    }
})().catch(console.error);
