/**
 * Phase 2 Verification Script
 * Validates:
 * 1. Login with seeded admin credentials -> 200 + Set-Cookie httpOnly
 * 2. Login with wrong credentials -> 401 + exact message "Invalid Login Id or Password"
 * 3. GET /api/auth/me without cookie -> 401
 * 4. GET /api/auth/me with cookie -> 200 + user data
 * 5. POST /api/auth/signup -> creates role='accountant' only
 * 6. Scoping verification (scopeFor)
 * 7. POST /api/auth/logout -> clears cookie
 */

import { scopeFor, UserPayload } from '../src/services/scope';

async function main() {
  const baseUrl = 'http://localhost:5000';
  console.log('====================================================');
  console.log('PHASE 2 VERIFICATION RUN');
  console.log('====================================================\n');

  // Test 1: Wrong password
  console.log('--- Test 1: POST /api/auth/login (wrong password) ---');
  const wrongLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login_id: 'adminuf', password: 'wrongpassword' }),
  });
  const wrongLoginBody = (await wrongLoginRes.json()) as any;
  console.log(`HTTP Status: ${wrongLoginRes.status}`);
  console.log('Response Body:', JSON.stringify(wrongLoginBody, null, 2));
  if (
    wrongLoginRes.status === 401 &&
    wrongLoginBody.error?.message === 'Invalid Login Id or Password'
  ) {
    console.log('✅ Correct: Returned 401 with exact message "Invalid Login Id or Password"\n');
  } else {
    console.error('❌ Failed wrong password test');
    process.exit(1);
  }

  // Test 2: Correct admin login
  console.log('--- Test 2: POST /api/auth/login (seeded admin credentials) ---');
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login_id: 'adminuf', password: 'Admin@12345' }),
  });
  const cookieHeader = loginRes.headers.get('set-cookie');
  const loginBody = (await loginRes.json()) as any;
  console.log(`HTTP Status: ${loginRes.status}`);
  console.log(`Set-Cookie: ${cookieHeader}`);
  console.log('Response Body:', JSON.stringify(loginBody, null, 2));

  if (
    loginRes.status === 200 &&
    cookieHeader &&
    cookieHeader.includes('HttpOnly') &&
    loginBody.data?.user?.login_id === 'adminuf'
  ) {
    console.log('✅ Correct: Returned 200 + httpOnly Set-Cookie\n');
  } else {
    console.error('❌ Failed admin login test');
    process.exit(1);
  }

  // Extract cookie
  const tokenCookie = cookieHeader.split(';')[0];

  // Test 3: GET /api/auth/me WITHOUT cookie
  console.log('--- Test 3: GET /api/auth/me (without cookie) ---');
  const noAuthRes = await fetch(`${baseUrl}/api/auth/me`);
  const noAuthBody = (await noAuthRes.json()) as any;
  console.log(`HTTP Status: ${noAuthRes.status}`);
  console.log('Response Body:', JSON.stringify(noAuthBody, null, 2));
  if (noAuthRes.status === 401) {
    console.log('✅ Correct: 401 without cookie\n');
  } else {
    console.error('❌ Failed no-cookie test');
    process.exit(1);
  }

  // Test 4: GET /api/auth/me WITH cookie
  console.log('--- Test 4: GET /api/auth/me (with cookie) ---');
  const authRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Cookie: tokenCookie },
  });
  const authBody = (await authRes.json()) as any;
  console.log(`HTTP Status: ${authRes.status}`);
  console.log('Response Body:', JSON.stringify(authBody, null, 2));
  if (authRes.status === 200 && authBody.data?.user?.login_id === 'adminuf') {
    console.log('✅ Correct: 200 with cookie\n');
  } else {
    console.error('❌ Failed with-cookie test');
    process.exit(1);
  }

  // Test 5: Signup creates role='accountant' ONLY
  console.log('--- Test 5: POST /api/auth/signup (accountant only) ---');
  const testLoginId = `acct_${Math.floor(1000 + Math.random() * 9000)}`;
  const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      login_id: testLoginId,
      email: `${testLoginId}@urbanfurniture.local`,
      full_name: 'Test Accountant',
      password: 'AcctPassword@123',
    }),
  });
  const signupBody = (await signupRes.json()) as any;
  console.log(`HTTP Status: ${signupRes.status}`);
  console.log('Response Body:', JSON.stringify(signupBody, null, 2));
  if (signupRes.status === 201 && signupBody.data?.user?.role === 'accountant') {
    console.log('✅ Correct: Created user strictly with role="accountant"\n');
  } else {
    console.error('❌ Failed signup role test');
    process.exit(1);
  }

  // Test 6: Scoping verification (scopeFor)
  console.log('--- Test 6: scopeFor(user, resource) record rules ---');
  const adminUser: UserPayload = {
    id: 1,
    login_id: 'adminuf',
    email: 'admin@urban.local',
    full_name: 'Admin',
    role: 'admin',
    contact_id: null,
  };
  const acctUser: UserPayload = {
    id: 2,
    login_id: 'acct01',
    email: 'acct@urban.local',
    full_name: 'Accountant',
    role: 'accountant',
    contact_id: null,
  };
  const contactUser: UserPayload = {
    id: 3,
    login_id: 'portal_cust',
    email: 'cust@client.local',
    full_name: 'Client Contact',
    role: 'contact',
    contact_id: 42,
  };

  const adminScope = scopeFor(adminUser, 'invoice');
  const acctScope = scopeFor(acctUser, 'invoice');
  const contactScope = scopeFor(contactUser, 'invoice');

  console.log('Admin scope:', adminScope);
  console.log('Accountant scope:', acctScope);
  console.log('Contact scope:', contactScope);

  if (
    Object.keys(adminScope).length === 0 &&
    Object.keys(acctScope).length === 0 &&
    contactScope.customerId === 42
  ) {
    console.log('✅ Correct: scopeFor applies record rules at the data layer\n');
  } else {
    console.error('❌ Failed scopeFor test');
    process.exit(1);
  }

  // Test 7: Logout
  console.log('--- Test 7: POST /api/auth/logout ---');
  const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { Cookie: tokenCookie },
  });
  const logoutCookie = logoutRes.headers.get('set-cookie');
  const logoutBody = await logoutRes.json();
  console.log(`HTTP Status: ${logoutRes.status}`);
  console.log(`Set-Cookie: ${logoutCookie}`);
  console.log('Response Body:', JSON.stringify(logoutBody, null, 2));
  if (logoutRes.status === 200 && logoutCookie?.includes('token=;')) {
    console.log('✅ Correct: Cookie cleared server-side\n');
  } else {
    console.error('❌ Failed logout test');
    process.exit(1);
  }

  console.log('====================================================');
  console.log('ALL PHASE 2 VERIFICATIONS PASSED PERFECTLY!');
  console.log('====================================================');
}

main().catch((err) => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
