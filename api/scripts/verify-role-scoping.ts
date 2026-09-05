import { scopeFor, UserPayload } from '../src/services/scope';
import { DashboardService } from '../src/services/dashboardService';
import { JournalEntryService } from '../src/services/journalEntryService';
import { pool } from '../src/db/pool';

async function run() {
  console.log('====================================================');
  console.log('LEVEL 2: MULTI-ROLE DATA SCOPING VERIFICATION');
  console.log('====================================================\n');

  const adminUser: UserPayload = {
    id: 1,
    login_id: 'adminuf',
    email: 'admin@urbanfurniture.local',
    full_name: 'Urban Furniture Admin',
    role: 'admin',
    contact_id: null,
  };

  const acctUser: UserPayload = {
    id: 2,
    login_id: 'acct01',
    email: 'acct@urbanfurniture.local',
    full_name: 'Staff Accountant',
    role: 'accountant',
    contact_id: null,
  };

  const managerUser: UserPayload = {
    id: 3,
    login_id: 'manager01',
    email: 'mgr@urbanfurniture.local',
    full_name: 'Showroom Manager',
    role: 'manager',
    contact_id: null,
  };

  const contactUser: UserPayload = {
    id: 4,
    login_id: 'portal_cust',
    email: 'contact@client.local',
    full_name: 'Client Contact',
    role: 'contact',
    contact_id: 42,
  };

  // Test 1: Record Rules on 'journal_entry'
  console.log('--- Test 1: scopeFor(user, "journal_entry") ---');
  const adminJeScope = scopeFor(adminUser, 'journal_entry');
  const acctJeScope = scopeFor(acctUser, 'journal_entry');
  const managerJeScope = scopeFor(managerUser, 'journal_entry');
  const contactJeScope = scopeFor(contactUser, 'journal_entry');

  console.log('Admin JE Scope:', adminJeScope);
  console.log('Accountant JE Scope:', acctJeScope);
  console.log('Manager JE Scope:', managerJeScope);
  console.log('Contact JE Scope:', contactJeScope);

  if (
    Object.keys(adminJeScope).length === 0 &&
    Object.keys(acctJeScope).length === 0 &&
    managerJeScope.allowed === false &&
    contactJeScope.allowed === false
  ) {
    console.log('✅ Correct: Manager & Contact restricted from raw journal entries at data layer\n');
  } else {
    console.error('❌ Failed Test 1: scopeFor journal_entry');
    process.exit(1);
  }

  // Test 2: Record Rules on 'financial_kpi'
  console.log('--- Test 2: scopeFor(user, "financial_kpi") ---');
  const adminKpiScope = scopeFor(adminUser, 'financial_kpi');
  const managerKpiScope = scopeFor(managerUser, 'financial_kpi');

  console.log('Admin KPI Scope:', adminKpiScope);
  console.log('Manager KPI Scope:', managerKpiScope);

  if (
    Object.keys(adminKpiScope).length === 0 &&
    managerKpiScope.redacted === true &&
    managerKpiScope.hideFinancials === true
  ) {
    console.log('✅ Correct: Manager flagged for data redaction on financial KPIs\n');
  } else {
    console.error('❌ Failed Test 2: scopeFor financial_kpi');
    process.exit(1);
  }

  // Test 3: Data-layer redaction in DashboardService.getKPI
  console.log('--- Test 3: DashboardService.getKPI(user) Data-Layer Scoping ---');
  const adminKpi = await DashboardService.getKPI(adminUser);
  const managerKpi = await DashboardService.getKPI(managerUser);

  console.log('Admin KPI output:', {
    cash: adminKpi.cash,
    bank: adminKpi.bank,
    netIncomeThisMonth: adminKpi.netIncomeThisMonth,
    isRedacted: adminKpi.isRedacted,
  });

  console.log('Manager KPI output:', {
    cash: managerKpi.cash,
    bank: managerKpi.bank,
    netIncomeThisMonth: managerKpi.netIncomeThisMonth,
    isRedacted: managerKpi.isRedacted,
    operational: managerKpi.operational,
  });

  if (
    adminKpi.isRedacted === false &&
    adminKpi.cash !== 'REDACTED' &&
    managerKpi.isRedacted === true &&
    managerKpi.cash === 'REDACTED' &&
    managerKpi.bank === 'REDACTED' &&
    managerKpi.netIncomeThisMonth === 'REDACTED' &&
    typeof managerKpi.operational?.stockUnits === 'number'
  ) {
    console.log('✅ Correct: Sensitive financial figures are strictly REDACTED at data layer for manager\n');
  } else {
    console.error('❌ Failed Test 3: DashboardService.getKPI data layer scoping');
    process.exit(1);
  }

  // Test 4: JournalEntryService.listEntries with Manager Scope
  console.log('--- Test 4: JournalEntryService.listEntries data layer enforcement ---');
  const adminEntries = await JournalEntryService.listEntries(adminJeScope);
  const managerEntries = await JournalEntryService.listEntries(managerJeScope);

  console.log(`Admin entries count: ${adminEntries.length}`);
  console.log(`Manager entries count: ${managerEntries.length}`);

  if (adminEntries.length > 0 && managerEntries.length === 0) {
    console.log('✅ Correct: Journal entries list completely stripped at data layer for manager\n');
  } else {
    console.error('❌ Failed Test 4: JournalEntryService.listEntries scoping');
    process.exit(1);
  }

  // Test 5: Customer Portal Scope Invariant Preserved
  console.log('--- Test 5: Customer Portal scopeFor invariant ---');
  const contactInvScope = scopeFor(contactUser, 'invoice');
  console.log('Contact invoice scope:', contactInvScope);

  if (contactInvScope.customerId === 42) {
    console.log('✅ Correct: Portal customer scope remains strictly pinned to contact_id\n');
  } else {
    console.error('❌ Failed Test 5: Portal customer scoping invariant');
    process.exit(1);
  }

  // Test 6: Zero-Delta Ledger Balance Invariant
  console.log('--- Test 6: Zero-Delta Ledger Invariant Check ---');
  const ledgerRes = await pool.query(
    'SELECT SUM(debit) as debit, SUM(credit) as credit, SUM(debit) - SUM(credit) as diff FROM journal_entry_lines;'
  );
  const { debit, credit, diff } = ledgerRes.rows[0];
  console.log(`Total Debit: ${debit}`);
  console.log(`Total Credit: ${credit}`);
  console.log(`Balance Diff: ${diff}`);

  if (diff === '0.00' || Number(diff) === 0) {
    console.log('✅ Correct: Zero-delta general ledger balance invariant strictly preserved\n');
  } else {
    console.error('❌ Failed Test 6: Ledger balance delta is non-zero!');
    process.exit(1);
  }

  console.log('====================================================');
  console.log('ALL LEVEL 2 ROLE SCOPING VERIFICATIONS PASSED!');
  console.log('====================================================');
  await pool.end();
}

run().catch((err) => {
  console.error('Verification script crashed:', err);
  process.exit(1);
});
