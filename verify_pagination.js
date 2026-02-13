const https = require('https');

const BASE_URL = "https://bukhorcha-backend-zuiy.onrender.com/api";

function request(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    body: data ? JSON.parse(data) : null
                });
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function main() {
    try {
        console.log("Logging in...");
        const loginRes = await request('POST', '/admin/auth/login', {
            username: "admin",
            password: "admin123"
        });

        if (loginRes.statusCode !== 200 && loginRes.statusCode !== 201) {
            console.error("Login failed:", loginRes.statusCode, loginRes.body);
            return;
        }

        const token = loginRes.body.result?.accessToken || loginRes.body.accessToken;
        if (!token) {
            console.error("Token not found in response");
            return;
        }

        console.log("Login successful. Token obtained.");

        const tests = [
            { path: "/admin/management/list", body: { page: 1, limit: 10 } },
        ];

        for (const test of tests) {
            console.log(`\nTesting POST ${test.path}...`);
            try {
                const res = await request('POST', test.path, test.body, token);
                console.log(`Status: ${res.statusCode}`);
                if (res.statusCode === 200 || res.statusCode === 201) {
                    console.log("Response keys:", Object.keys(res.body));
                    if (res.body.meta) {
                        console.log("Meta:", JSON.stringify(res.body.meta, null, 2));
                    }
                    if (res.body.pagination) {
                        console.log("Pagination:", JSON.stringify(res.body.pagination, null, 2));
                    }
                } else {
                    console.log("Error body:", res.body);
                }
            } catch (e) {
                console.error(`Error testing ${test.path}:`, e.message);
            }
        }

    } catch (e) {
        console.error("Script error:", e);
    }
}

main();
