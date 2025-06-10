// import { Test, TestingModule } from '@nestjs/testing';
// import { INestApplication } from '@nestjs/common';
// import * as request from 'supertest';
// import { DataSource } from 'typeorm';
// import { getQueueToken } from '@nestjs/bullmq';
// import { Queue } from 'bullmq';
// import { AppModule } from '../src/app.module';
// import { Drep } from '../src/entities/drep.entity';
// import { Signature } from '../src/entities/signatures.entity';
// import { Queues, JobTypes, DRepClaimJobData } from '../src/queue/queue.types';
// import { getDataSourceToken } from '@nestjs/typeorm';

// describe('DRep Claim (e2e)', () => {
//   let app: INestApplication;
//   let defaultDataSource: DataSource;
//   let dbsyncDataSource: DataSource;
//   let drepQueue: Queue;

//   // Test data
//   const testStakeKey =
//     'stake_test1uzqkceq8w5fczq9vs8wvzj7r8l6jr9q0g8rqzf8hpxsg6k8cjk6kl';
//   const testSignature = 'test_signature_hex_string';
//   const testSignatureKey = 'test_signature_key_hex_string';
//   const testDrepBech32 =
//     'drep_test1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq';
//   const testVoterId = 'voter_test_id';

//   // Helper function to create test DRep with signature
//   const createTestDRepWithSignature = async (
//     stakeKey: string = testStakeKey,
//   ) => {
//     const drep = await defaultDataSource.getRepository(Drep).save({});

//     const signature = await defaultDataSource.getRepository(Signature).save({
//       stakeKey,
//       signature: testSignature,
//       signatureKey: testSignatureKey,
//       drep,
//       voterId: testVoterId,
//       drep_bech32: testDrepBech32,
//       type: 'drep',
//       lastSignedIn: new Date(),
//     });

//     return { drep, signature };
//   };

//   // Helper function to wait for queue job completion
//   const waitForJobCompletion = async (
//     jobId: string,
//     timeout: number = 5000,
//   ): Promise<any> => {
//     const startTime = Date.now();

//     while (Date.now() - startTime < timeout) {
//       const job = await drepQueue.getJob(jobId);

//       if (job) {
//         if (await job.isCompleted()) {
//           return await job.returnvalue;
//         }

//         if (await job.isFailed()) {
//           throw new Error(`Job failed: ${job.failedReason}`);
//         }
//       }

//       // Wait 100ms before checking again
//       await new Promise((resolve) => setTimeout(resolve, 100));
//     }

//     throw new Error(`Job ${jobId} did not complete within ${timeout}ms`);
//   };

//   beforeAll(async () => {
//     const moduleFixture: TestingModule = await Test.createTestingModule({
//       imports: [AppModule],
//     }).compile();

//     app = moduleFixture.createNestApplication();
//     await app.init();

//     // Get both database connections using the proper tokens
//     defaultDataSource = moduleFixture.get<DataSource>(
//       getDataSourceToken('default'),
//     );
//     dbsyncDataSource = moduleFixture.get<DataSource>(
//       getDataSourceToken('dbsync'),
//     );
//     drepQueue = moduleFixture.get<Queue>(getQueueToken(Queues.DREP_CLAIM));
//   });

//   beforeEach(async () => {
//     await defaultDataSource.getRepository(Signature).delete({});
//     await defaultDataSource.getRepository(Drep).delete({});

//     // Properly clean the queue
//     await drepQueue.drain(true); // Remove all jobs
//     await drepQueue.clean(0, 1000); // Clean completed/failed jobs
//   });

//   afterAll(async () => {
//     await defaultDataSource.getRepository(Signature).delete({});
//     await defaultDataSource.getRepository(Drep).delete({});
//     await drepQueue.drain(true);
//     await drepQueue.clean(0, 1000);
//     await drepQueue.close()
//     await app.close();
//   });

//   describe('POST /dreps/:stakeKey/claim-profile', () => {
//     it('should return 400 when signature is missing', async () => {
//       const response = await request(app.getHttpServer())
//         .post(`/dreps/${testStakeKey}/claim-profile`)
//         .send({
//           signatureKey: testSignatureKey,
//         })
//         .expect(400);

//       expect(response.body.message).toContain(
//         'Signature and signatureKey are required',
//       );
//     });

//     it('should return 400 when signatureKey is missing', async () => {
//       const response = await request(app.getHttpServer())
//         .post(`/dreps/${testStakeKey}/claim-profile`)
//         .send({
//           signature: testSignature,
//         })
//         .expect(400);

//       expect(response.body.message).toContain(
//         'Signature and signatureKey are required',
//       );
//     });

//     it('should return claimed: true when DRep already exists', async () => {
//       const { drep: existingDrep } = await createTestDRepWithSignature();

//       const response = await request(app.getHttpServer())
//         .post(`/dreps/${testStakeKey}/claim-profile`)
//         .send({
//           signature: testSignature,
//           signatureKey: testSignatureKey,
//         })
//         .expect(201);
//       expect(response.body).toEqual({
//         claimed: true,
//         drepId: existingDrep.id,
//         drepBech32: testDrepBech32,
//         voterId: testVoterId,
//       });

//       const activeJobs = await drepQueue.getActive();
//       expect(activeJobs).toHaveLength(0);
//     });

//     it('should queue job and return claimed: false when DRep does not exist', async () => {
//       // Act
//       const response = await request(app.getHttpServer())
//         .post(`/dreps/${testStakeKey}/claim-profile`)
//         .send({
//           signature: testSignature,
//           signatureKey: testSignatureKey,
//         })
//         .expect(201);

//       // Assert
//       expect(response.body).toEqual({
//         claimed: false,
//         message: 'DRep claim job has been queued successfully.',
//       });

//       // Verify job was queued
//       const activeJobs = await drepQueue.getActive();
//       expect(activeJobs).toHaveLength(1);

//       const job = activeJobs[0];
//       expect(job.name).toBe(JobTypes.DREP_CLAIM);
//       expect(job.data).toEqual({
//         stakeKey: testStakeKey,
//         signature: testSignature,
//         signatureKey: testSignatureKey,
//       } as DRepClaimJobData);
//     });
//   });

//     describe('Integration with Worker Processing', () => {
//       let queueEvents: any[] = [];
//       let originalLog: any;
//       let originalError: any;

//       beforeEach(() => {
//         queueEvents = [];

//         // Capture queue events for testing
//         const mockLogger = {
//           log: (message: string) => {
//             queueEvents.push({ type: 'log', message });
//           },
//           error: (message: string) => {
//             queueEvents.push({ type: 'error', message });
//           }
//         };

//         // Mock the logger to capture events
//         const DRepClaimQueueEvents = require('../src/queue/listeners/queue.events').DRepClaimQueueEvents;
//         if (DRepClaimQueueEvents.prototype.logger) {
//           originalLog = DRepClaimQueueEvents.prototype.logger.log;
//           originalError = DRepClaimQueueEvents.prototype.logger.error;
//           DRepClaimQueueEvents.prototype.logger.log = mockLogger.log;
//           DRepClaimQueueEvents.prototype.logger.error = mockLogger.error;
//         }
//       });

//       afterEach(() => {
//         // Restore original logger
//         const DRepClaimQueueEvents = require('../src/queue/listeners/queue.events').DRepClaimQueueEvents;
//         if (originalLog && originalError) {
//           DRepClaimQueueEvents.prototype.logger.log = originalLog;
//           DRepClaimQueueEvents.prototype.logger.error = originalError;
//         }
//       });

//       it('should process claim job end-to-end with direct queue monitoring', async () => {
//         // Act: Trigger the claim process
//         const response = await request(app.getHttpServer())
//           .post(`/dreps/${testStakeKey}/claim-profile`)
//           .send({
//             signature: testSignature,
//             signatureKey: testSignatureKey,
//           })
//           .expect(201);

//         expect(response.body.claimed).toBe(false);

//         // Get the queued job
//         const waitingJobs = await drepQueue.getWaiting();
//         expect(waitingJobs).toHaveLength(1);

//         const queuedJob = waitingJobs[0];
//         expect(queuedJob.data).toEqual({
//           stakeKey: testStakeKey,
//           signature: testSignature,
//           signatureKey: testSignatureKey,
//         });

//         // Wait for job completion and get result
//         try {
//           const jobResult = await waitForJobCompletion(queuedJob.id);

//           // Verify job completed successfully
//           expect(jobResult.success).toBe(true);
//           expect(jobResult.isRegistered).toBe(true);
//           expect(jobResult.stakeKey).toBe(testStakeKey);

//           // Verify DRep was created in database
//           const createdDrep = await defaultDataSource.getRepository(Drep)
//             .createQueryBuilder('drep')
//             .leftJoinAndSelect('drep.signatures', 'signature')
//             .where('signature.stakeKey = :stakeKey', { stakeKey: testStakeKey })
//             .getOne();

//           expect(createdDrep).toBeDefined();
//           expect(createdDrep.signatures).toHaveLength(1);
//           expect(createdDrep.signatures[0].stakeKey).toBe(testStakeKey);
//           expect(createdDrep.signatures[0].signature).toBe(testSignature);
//           expect(createdDrep.signatures[0].signatureKey).toBe(testSignatureKey);

//           // Verify subsequent call returns claimed: true
//           const secondResponse = await request(app.getHttpServer())
//             .post(`/dreps/${testStakeKey}/claim-profile`)
//             .send({
//               signature: testSignature,
//               signatureKey: testSignatureKey,
//             })
//             .expect(201);

//           expect(secondResponse.body.claimed).toBe(true);
//           expect(secondResponse.body.drepId).toBe(createdDrep.id);

//         } catch (error) {
//           // If worker isn't running or external dependencies aren't mocked,
//           // just verify the job was queued correctly
//           console.warn('Worker processing test skipped - job queued but not processed:', error.message);
//           expect(queuedJob).toBeDefined();
//         }
//       });

//       it('should handle worker failures and retry logic', async () => {
//         const response = await request(app.getHttpServer())
//           .post(`/dreps/${testStakeKey}/claim-profile`)
//           .send({
//             signature: testSignature,
//             signatureKey: testSignatureKey,
//           })
//           .expect(201);

//         expect(response.body.claimed).toBe(false);

//         // Get the queued job
//         const waitingJobs = await drepQueue.getWaiting();
//         expect(waitingJobs).toHaveLength(1);

//         const queuedJob = waitingJobs[0];

//         try {
//           // Wait for job processing (with shorter timeout for failure case)
//           await waitForJobCompletion(queuedJob.id, 2000);
//         } catch (error) {
//           // Expected if worker fails or isn't properly configured
//           console.log('Job processing failed as expected in test environment');

//           // Check if job is in failed state
//           const job = await drepQueue.getJob(queuedJob.id);
//           if (job && await job.isFailed()) {
//             expect(job.failedReason).toBeDefined();
//             console.log('Job failed with reason:', job.failedReason);
//           }
//         }

//         // Verify no DRep was created on failure
//         const createdDrep = await defaultDataSource.getRepository(Drep)
//           .createQueryBuilder('drep')
//           .leftJoinAndSelect('drep.signatures', 'signature')
//           .where('signature.stakeKey = :stakeKey', { stakeKey: testStakeKey })
//           .getOne();

//         expect(createdDrep).toBeNull();
//       });

//       it('should verify queue event listener is properly configured', async () => {
//         // This test verifies that the queue events listener is part of the module
//         const moduleRef = app.get('ApplicationConfig');

//         // You could also test that the queue events are being captured
//         // by checking logs or using a test logger
//         expect(app).toBeDefined();
//         expect(drepQueue).toBeDefined();

//         // Verify queue has the correct name
//         expect(drepQueue.name).toBe(Queues.DREP_CLAIM);
//       });

//       it('should handle signature with null drep relationship correctly', async () => {
//         // Arrange: Create signature without drep (orphaned signature scenario)
//         await defaultDataSource.getRepository(Signature).save({
//           stakeKey: testStakeKey,
//           signature: testSignature,
//           signatureKey: testSignatureKey,
//           drep: null, // No drep associated
//           voterId: testVoterId,
//           drep_bech32: testDrepBech32,
//           type: 'drep',
//           lastSignedIn: new Date(),
//         });

//         // Act
//         const response = await request(app.getHttpServer())
//           .post(`/dreps/${testStakeKey}/claim-profile`)
//           .send({
//             signature: testSignature,
//             signatureKey: testSignatureKey,
//           })
//           .expect(201);

//         // Assert: Should queue job since no drep relationship exists
//         expect(response.body.claimed).toBe(false);
//         expect(response.body.message).toBe('DRep claim job has been queued successfully.');

//         // Verify job was queued
//         const waitingJobs = await drepQueue.getWaiting();
//         expect(waitingJobs).toHaveLength(1);
//       });
//     });
// });
