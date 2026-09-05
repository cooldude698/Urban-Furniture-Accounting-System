import { io } from 'socket.io-client';

const API_BASE = process.env.API_BASE || 'http://localhost:5000';

async function main() {
  console.log('[Verification] 1. Logging in to get httpOnly session cookie...');
  const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login_id: 'adminuf', password: 'Admin@12345' }),
  });

  if (!loginRes.ok) {
    throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
  }

  // Extract set-cookie header
  const rawCookies = loginRes.headers.get('set-cookie') || '';
  const tokenMatch = rawCookies.match(/token=([^;]+)/);
  const cookieHeader = tokenMatch ? `token=${tokenMatch[1]}` : rawCookies;

  console.log('[Verification] 2. Connecting to Socket.IO server with httpOnly cookie auth...');
  const socket = io(API_BASE, {
    withCredentials: true,
    extraHeaders: {
      cookie: cookieHeader,
    },
    transports: ['websocket', 'polling'],
  });

  const eventPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timed out waiting for ledger:changed event'));
    }, 15000);

    socket.on('connect', () => {
      console.log(`[Verification] Socket connected successfully! Socket ID: ${socket.id}`);
    });

    socket.on('connect_error', (err: any) => {
      clearTimeout(timeout);
      reject(new Error(`Socket connection error: ${err.message}`));
    });

    socket.on('ledger:changed', (payload: any) => {
      clearTimeout(timeout);
      resolve(payload);
    });
  });

  // Wait for socket to connect
  await new Promise<void>((resolve, reject) => {
    if (socket.connected) return resolve();
    socket.once('connect', () => resolve());
    socket.once('connect_error', (err: any) => reject(err));
  });

  console.log('[Verification] 3. Creating a draft customer invoice...');
  const createInvRes = await fetch(`${API_BASE}/api/invoices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: cookieHeader,
    },
    body: JSON.stringify({
      customerId: 22,
      invoiceDate: '2026-09-05',
      dueDate: '2026-09-20',
      lines: [
        {
          productId: 1,
          qty: '2',
          unitPrice: '15000.00',
          taxRate: '18.00',
        },
      ],
    }),
  });

  const invJson: any = await createInvRes.json();
  if (!createInvRes.ok || !invJson.data?.id) {
    throw new Error(`Failed to create draft invoice: ${JSON.stringify(invJson)}`);
  }

  const invoiceId = invJson.data.id;
  const invoiceNumber = invJson.data.number;
  console.log(`[Verification] Created draft invoice #${invoiceId} (${invoiceNumber})`);

  console.log(`[Verification] 4. Confirming invoice #${invoiceId} via POST /api/invoices/${invoiceId}/confirm ...`);
  const confirmRes = await fetch(`${API_BASE}/api/invoices/${invoiceId}/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: cookieHeader,
    },
  });

  const confirmJson: any = await confirmRes.json();
  if (!confirmRes.ok) {
    throw new Error(`Failed to confirm invoice: ${JSON.stringify(confirmJson)}`);
  }
  console.log(`[Verification] Invoice confirmed! Status: ${confirmJson.data?.status}`);


  console.log('[Verification] 5. Awaiting real-time "ledger:changed" event from Socket.IO...');
  const payload = await eventPromise;

  console.log('\n================ REAL RECEIVED EVENT PAYLOAD ================');
  console.log(JSON.stringify(payload, null, 2));
  console.log('=============================================================\n');

  socket.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('[Verification Failed]:', err);
  process.exit(1);
});
