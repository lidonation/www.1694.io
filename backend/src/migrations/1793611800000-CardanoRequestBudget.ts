import { MigrationInterface, QueryRunner } from 'typeorm';

export class CardanoRequestBudget1793611800000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`CREATE TABLE cardano_request_budget (
      scope text PRIMARY KEY, reset_hour integer, period_start timestamptz NOT NULL DEFAULT 'epoch',
      used integer NOT NULL DEFAULT 0, batch_used integer NOT NULL DEFAULT 0,
      cap integer NOT NULL DEFAULT 0, batch_cap integer NOT NULL DEFAULT 0,
      blocked_until timestamptz NOT NULL DEFAULT 'epoch', reason text
    )`);
    await runner.query(`CREATE TABLE cardano_sync_run (
      scope text PRIMARY KEY, id uuid NOT NULL UNIQUE, finished boolean NOT NULL DEFAULT false,
      epoch integer, options jsonb NOT NULL DEFAULT '{}', started_at timestamptz NOT NULL DEFAULT now(),
      next_run_at timestamptz, reason text
    )`);
    await runner.query(`CREATE TABLE cardano_sync_stage (
      run_id uuid NOT NULL REFERENCES cardano_sync_run(id) ON DELETE CASCADE,
      key text NOT NULL, value jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY(run_id,key)
    )`);
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query('DROP TABLE cardano_sync_stage');
    await runner.query('DROP TABLE cardano_sync_run');
    await runner.query('DROP TABLE cardano_request_budget');
  }
}
