const http = require('http');
const path = require('path');
const argon2 = require(path.join(__dirname, '../node_modules/argon2'));
const { Pool } = require(path.join(__dirname, '../node_modules/pg'));

const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/urban' });

const PORT = process.env.API_PORT || 5002;

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data ? (data.startsWith('{') || data.startsWith('[') ? JSON.parse(data) : data) : null
        });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function setupPortalUser() {
  const hash = await argon2.hash('Portal@12345', { type: argon2.argon2id });
  const check = await pool.query("SELECT id FROM users WHERE login_id = 'custdemo'");
  let res;
  if (check.rows.length > 0) {
    res = await pool.query(
      "UPDATE users SET password_hash = $1, role = 'contact', contact_id = 11 WHERE login_id = 'custdemo' RETURNING id, login_id, role, contact_id",
      [hash]
    );
  } else {
    res = await pool.query(
      "INSERT INTO users (full_name, login_id, email, password_hash, role, contact_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, login_id, role, contact_id",
      ['Portal Demo', 'custdemo', 'custdemo@example.com', hash, 'contact', 11]
    );
  }
  console.log('Setup portal user in DB:', res.rows[0]);
  await pool.end();
}

async function run() {
  await setupPortalUser();
  console.log('\n--- 1. Login as custdemo (contact_id: 11) ---');
  const loginRes = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { login_id: 'custdemo', password: 'Portal@12345' });

  console.log('Login HTTP status:', loginRes.status);
  console.log('Login response:', JSON.stringify(loginRes.data));

  const cookieHeader = loginRes.headers['set-cookie'];
  const cookie = cookieHeader ? cookieHeader.map(c => c.split(';')[0]).join('; ') : '';
  console.log('Session Cookie:', cookie ? 'Received' : 'NONE');

  const authHeaders = {
    'Cookie': cookie,
    'Content-Type': 'application/json'
  };

  console.log('\n--- 2. Fetch portal invoices (/api/portal/invoices) ---');
  const portalInvoices = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/api/portal/invoices',
    method: 'GET',
    headers: authHeaders
  });
  console.log('Portal invoices status:', portalInvoices.status);
  if (portalInvoices.data?.data) {
    console.log(`Found ${portalInvoices.data.data.length} invoices for contact 11.`);
    const sample = portalInvoices.data.data.slice(0, 3);
    console.log('Sample invoices:', sample.map(i => ({ id: i.id, number: i.number, total: i.total })));
  } else {
    console.log('Response:', portalInvoices.data);
  }

  console.log('\n--- 3. Fetch own invoice detail (ID 42 belongs to contact 11) ---');
  const ownInvoice = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/api/portal/invoices/42',
    method: 'GET',
    headers: authHeaders
  });
  console.log('Own invoice status:', ownInvoice.status);
  console.log('Own invoice found:', ownInvoice.data?.data?.number || ownInvoice.data);

  console.log('\n--- 4. IDOR TEST: Fetch another customer invoice (ID 28 belongs to contact 12) ---');
  const otherInvoice = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/api/portal/invoices/28',
    method: 'GET',
    headers: authHeaders
  });
  console.log('IDOR invoice attempt status (MUST BE 403 or 404):', otherInvoice.status);
  console.log('IDOR response:', JSON.stringify(otherInvoice.data));
}

run().catch(console.error);
