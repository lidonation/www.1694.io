/**
 * Integration tests for YaciStoreService.
 *
 * Requires a live Yaci Store DB. Set YACI_STORE_DB_* env vars before running:
 *   YACI_STORE_DB_HOST=... YACI_STORE_DB_PORT=5432 YACI_STORE_DB_USERNAME=... \
 *   YACI_STORE_DB_PASSWORD=... YACI_STORE_DB_NAME=yaci_store \
 *   npx jest yaci-store.service.integration --testTimeout=30000
 */

import { DataSource } from 'typeorm';
import { YaciStoreService } from './yaci-store.service';

const REQUIRED_VARS = [
  'YACI_STORE_DB_HOST',
  'YACI_STORE_DB_USERNAME',
  'YACI_STORE_DB_PASSWORD',
  'YACI_STORE_DB_NAME',
];

const skip = REQUIRED_VARS.some(v => !process.env[v]);

// Skips the entire suite when env vars are absent so CI stays green.
const describeOrSkip = skip ? describe.skip : describe;

describeOrSkip('YaciStoreService — integration', () => {
  let db: DataSource;
  let service: YaciStoreService;

  beforeAll(async () => {
    db = new DataSource({
      type: 'postgres',
      host:     process.env.YACI_STORE_DB_HOST,
      port:     Number(process.env.YACI_STORE_DB_PORT ?? 5432),
      username: process.env.YACI_STORE_DB_USERNAME,
      password: process.env.YACI_STORE_DB_PASSWORD,
      database: process.env.YACI_STORE_DB_NAME ?? 'yaci_store',
    });
    await db.initialize();
    service = new YaciStoreService(db as any);
  }, 15_000);

  afterAll(async () => {
    await db.destroy();
  });

  // ── Connectivity ──────────────────────────────────────────────────────────

  describe('connectivity', () => {
    it('can execute a simple query', async () => {
      const rows = await db.query('SELECT 1 AS ok');
      expect(rows[0].ok).toBe('1');
    });
  });

  // ── Schema ────────────────────────────────────────────────────────────────

  describe('schema', () => {
    const tables: { name: string; columns: string[] }[] = [
      {
        name: 'drep_registration',
        columns: ['tx_hash', 'cert_index', 'action_type', 'drep_hash', 'drep_type', 'slot', 'epoch'],
      },
      {
        name: 'delegation_vote',
        columns: ['tx_hash', 'cert_index', 'address', 'drep_hash', 'drep_type', 'slot', 'epoch'],
      },
      {
        name: 'gov_action_proposal',
        columns: ['tx_hash', 'index', 'type', 'slot', 'epoch', 'expiration'],
      },
      {
        name: 'voting_procedure',
        columns: ['tx_hash', 'index', 'voter_hash', 'voter_type', 'gov_action_tx_hash', 'gov_action_index', 'vote', 'slot'],
      },
      {
        name: 'epoch_stake',
        columns: ['stake_address', 'epoch_no', 'amount'],
      },
      {
        name: 'epoch',
        columns: ['epoch_no', 'start_slot'],
      },
    ];

    for (const { name, columns } of tables) {
      it(`table "${name}" exists with expected columns`, async () => {
        const rows = await db.query<{ column_name: string }[]>(
          `SELECT column_name FROM information_schema.columns
           WHERE table_name = $1 AND table_schema = 'public'`,
          [name],
        );
        const present = rows.map(r => r.column_name);
        expect(present.length).toBeGreaterThan(0);
        for (const col of columns) {
          expect(present).toContain(col);
        }
      });
    }
  });

  // ── Data presence ─────────────────────────────────────────────────────────

  describe('data', () => {
    it('drep_registration has rows', async () => {
      const [{ count }] = await db.query<{ count: string }[]>(
        'SELECT COUNT(*)::text AS count FROM drep_registration',
      );
      expect(Number(count)).toBeGreaterThan(0);
    });

    it('delegation_vote has rows', async () => {
      const [{ count }] = await db.query<{ count: string }[]>(
        'SELECT COUNT(*)::text AS count FROM delegation_vote',
      );
      expect(Number(count)).toBeGreaterThan(0);
    });

    it('gov_action_proposal has rows', async () => {
      const [{ count }] = await db.query<{ count: string }[]>(
        'SELECT COUNT(*)::text AS count FROM gov_action_proposal',
      );
      expect(Number(count)).toBeGreaterThan(0);
    });

    it('voting_procedure has rows', async () => {
      const [{ count }] = await db.query<{ count: string }[]>(
        'SELECT COUNT(*)::text AS count FROM voting_procedure',
      );
      expect(Number(count)).toBeGreaterThan(0);
    });

    it('epoch_stake has rows', async () => {
      const [{ count }] = await db.query<{ count: string }[]>(
        'SELECT COUNT(*)::text AS count FROM epoch_stake',
      );
      expect(Number(count)).toBeGreaterThan(0);
    });

    it('epoch table has boundary slots for at least 5 epochs', async () => {
      const [{ count }] = await db.query<{ count: string }[]>(
        'SELECT COUNT(*)::text AS count FROM epoch WHERE start_slot IS NOT NULL',
      );
      expect(Number(count)).toBeGreaterThanOrEqual(5);
    });

    it('block table reflects a recent mainnet slot (> 100_000_000)', async () => {
      const rows = await db.query<{ slot: string }[]>(
        'SELECT MAX(slot_no)::text AS slot FROM block',
      );
      const slot = Number(rows[0]?.slot ?? 0);
      expect(slot).toBeGreaterThan(100_000_000);
    });
  });

  // ── Service query correctness ─────────────────────────────────────────────

  describe('service queries', () => {
    let currentEpoch: number;

    beforeAll(async () => {
      const rows = await db.query<{ epoch_no: number }[]>(
        'SELECT MAX(epoch_no) AS epoch_no FROM epoch',
      );
      currentEpoch = rows[0]?.epoch_no ?? 500;
    });

    it('getLatestSyncedSlot returns a non-zero slot', async () => {
      const slot = await service.getLatestSyncedSlot();
      expect(slot).toBeGreaterThan(0n);
    });

    it('getEpochBoundarySlot returns a valid slot for the current epoch', async () => {
      const slot = await service.getEpochBoundarySlot(currentEpoch);
      expect(slot).not.toBeNull();
      expect(slot!).toBeGreaterThan(0n);
    });

    it('getEpochBoundarySlot returns null for a far-future epoch', async () => {
      const slot = await service.getEpochBoundarySlot(99999);
      expect(slot).toBeNull();
    });

    it('getEpochStake returns rows for the current epoch', async () => {
      const rows = await service.getEpochStake(currentEpoch);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0]).toHaveProperty('stake_address');
      expect(rows[0]).toHaveProperty('amount');
    });

    it('getLatestDelegationPerAddress returns unique addresses', async () => {
      const boundarySlot = await service.getEpochBoundarySlot(currentEpoch);
      const rows = await service.getLatestDelegationPerAddress(boundarySlot!);
      expect(rows.length).toBeGreaterThan(0);

      const addresses = rows.map(r => r.address);
      const unique = new Set(addresses);
      expect(unique.size).toBe(addresses.length); // DISTINCT ON guarantee
    });

    it('getAllDRepRegistrations returns one row per drep_hash (latest action)', async () => {
      const rows = await service.getAllDRepRegistrations();
      expect(rows.length).toBeGreaterThan(0);

      const hashes = rows.map(r => r.drep_hash);
      const unique = new Set(hashes);
      expect(unique.size).toBe(hashes.length); // DISTINCT ON guarantee
    });

    it('getVotesSince(0) returns votes with expected fields', async () => {
      const rows = await service.getVotesSince(0n);
      expect(rows.length).toBeGreaterThan(0);

      const sample = rows[0];
      expect(sample).toHaveProperty('voter_hash');
      expect(sample).toHaveProperty('voter_type');
      expect(sample).toHaveProperty('gov_action_tx_hash');
      expect(sample).toHaveProperty('vote');
      expect(['YES', 'NO', 'ABSTAIN']).toContain(sample.vote?.toUpperCase());
    });

    it('epoch_stake + delegation_vote join produces non-zero DRep stake for current epoch', async () => {
      const boundarySlot = await service.getEpochBoundarySlot(currentEpoch);
      const [stakeRows, delegRows] = await Promise.all([
        service.getEpochStake(currentEpoch),
        service.getLatestDelegationPerAddress(boundarySlot!),
      ]);

      const delegMap = new Map(delegRows.map(d => [d.address, d]));

      let matched = 0;
      let totalLovelace = 0n;
      for (const row of stakeRows) {
        const d = delegMap.get(row.stake_address);
        if (d?.drep_hash && d.drep_type !== 'ALWAYS_ABSTAIN') {
          matched++;
          totalLovelace += BigInt(row.amount);
        }
      }

      expect(matched).toBeGreaterThan(0);
      expect(totalLovelace).toBeGreaterThan(0n);
    });
  });
});
