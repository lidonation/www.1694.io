import { Logger } from "@nestjs/common";
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Drep } from '../entities/governance/drep.entity';
import { DrepDelegator } from '../entities/governance/drep-delegator.entity';
import { Proposal } from '../entities/governance/proposal.entity';
import { ProposalMetadata } from '../entities/governance/proposal-metadata.entity';
import { ProposalVote } from '../entities/governance/proposal-vote.entity';

@Injectable()
export class GovernanceMigrationService {
  private readonly logger = new Logger(GovernanceMigrationService.name);

  constructor(
    @InjectDataSource('default')
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Check if the new governance tables have data
   */
  async checkGovernanceDataStatus() {
    try {
      const [drepsCount, proposalsCount, votesCount, delegatorsCount] = await Promise.all([
        this.dataSource.getRepository(Drep).count(),
        this.dataSource.getRepository(Proposal).count(),
        this.dataSource.getRepository(ProposalVote).count(),
        this.dataSource.getRepository(DrepDelegator).count(),
      ]);

      const status = {
        hasData: drepsCount > 0 || proposalsCount > 0,
        counts: {
          dreps: drepsCount,
          proposals: proposalsCount, 
          votes: votesCount,
          delegators: delegatorsCount,
        },
        recommendations: [] as string[]
      };

      if (drepsCount === 0) {
        status.recommendations.push('Run governance sync job to populate DReps data');
      }

      if (proposalsCount === 0) {
        status.recommendations.push('Run governance sync job to populate proposals data');
      }

      if (delegatorsCount === 0) {
        status.recommendations.push('Run governance sync job to populate delegators data');
      }

      if (status.recommendations.length === 0) {
        status.recommendations.push('Governance data is populated and ready to use');
      }

      return status;
    } catch (error) {
      this.logger.error('Failed to check governance data status', error);
      throw error;
    }
  }

  /**
   * Validate governance data integrity
   */
  async validateGovernanceDataIntegrity() {
    try {
      const issues: any[] = [];

      // Check for DReps without delegators
      const drepsWithoutDelegators = await this.dataSource.query(`
        SELECT d.drep_id, d.amount_lovelace
        FROM dreps d
        LEFT JOIN drep_delegators dd ON d.drep_id = dd.drep_id
        WHERE dd.drep_id IS NULL
        AND d.amount_lovelace::bigint > 0
        LIMIT 10
      `);

      if (drepsWithoutDelegators.length > 0) {
        issues.push({
          type: 'missing_delegators',
          count: drepsWithoutDelegators.length,
          description: 'DReps with voting power but no delegators found',
          sample: drepsWithoutDelegators.slice(0, 3)
        });
      }

      // Check for proposals without metadata
      const proposalsWithoutMetadata = await this.dataSource.query(`
        SELECT p.id, p.governance_type
        FROM proposals p
        LEFT JOIN proposal_metadata pm ON p.id = pm.proposal_id
        WHERE pm.proposal_id IS NULL
        LIMIT 10
      `);

      if (proposalsWithoutMetadata.length > 0) {
        issues.push({
          type: 'missing_metadata',
          count: proposalsWithoutMetadata.length,
          description: 'Proposals without metadata found',
          sample: proposalsWithoutMetadata.slice(0, 3)
        });
      }

      // Check for orphaned votes
      const orphanedVotes = await this.dataSource.query(`
        SELECT pv.proposal_id, COUNT(*) as vote_count
        FROM proposal_votes pv
        LEFT JOIN proposals p ON pv.proposal_id = p.id
        WHERE p.id IS NULL
        GROUP BY pv.proposal_id
        LIMIT 10
      `);

      if (orphanedVotes.length > 0) {
        issues.push({
          type: 'orphaned_votes',
          count: orphanedVotes.length,
          description: 'Votes referencing non-existent proposals',
          sample: orphanedVotes.slice(0, 3)
        });
      }

      return {
        isValid: issues.length === 0,
        issues,
        summary: `Found ${issues.length} data integrity issues`
      };
    } catch (error) {
      this.logger.error('Failed to validate governance data integrity', error);
      throw error;
    }
  }

  /**
   * Get statistics about the governance data migration
   */
  async getGovernanceStats() {
    try {
      const stats = await this.dataSource.query(`
        SELECT 
          'dreps' as table_name,
          COUNT(*) as total_records,
          COUNT(*) FILTER (WHERE retired = false) as active_records,
          COUNT(*) FILTER (WHERE expired = true) as expired_records,
          MAX(updated_at) as last_updated
        FROM dreps
        
        UNION ALL
        
        SELECT 
          'proposals' as table_name,
          COUNT(*) as total_records,
          COUNT(*) FILTER (WHERE ratified_epoch IS NOT NULL) as active_records,
          COUNT(*) FILTER (WHERE expired_epoch IS NOT NULL) as expired_records,
          MAX(updated_at) as last_updated
        FROM proposals
        
        UNION ALL
        
        SELECT 
          'proposal_votes' as table_name,
          COUNT(*) as total_records,
          COUNT(*) FILTER (WHERE vote = 'yes') as active_records,
          COUNT(*) FILTER (WHERE vote = 'no') as expired_records,
          MAX(updated_at) as last_updated
        FROM proposal_votes
        
        UNION ALL
        
        SELECT 
          'drep_delegators' as table_name,
          COUNT(*) as total_records,
          COUNT(*) FILTER (WHERE voting_power_lovelace IS NOT NULL) as active_records,
          COUNT(*) FILTER (WHERE voting_power_lovelace IS NULL) as expired_records,
          MAX(updated_at) as last_updated
        FROM drep_delegators
      `);

      return stats;
    } catch (error) {
      this.logger.error('Failed to get governance stats', error);
      throw error;
    }
  }
}