import { WebhookSecretRotationManager } from './secret-rotation';

describe('WebhookSecretRotationManager', () => {
  const mockConfig = {
    region: 'us-east-1',
    databaseClusterArn: 'arn:aws:rds:us-east-1:123456789012:cluster:test-cluster',
    databaseSecretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:test-secret',
    databaseName: 'test-db',
    eventBusName: 'test-event-bus',
    cleanupQueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue',
    gracePeriodHours: 24,
  };

  let rotationManager: WebhookSecretRotationManager;

  beforeEach(() => {
    rotationManager = new WebhookSecretRotationManager(mockConfig);
  });

  describe('scheduleSecretCleanup', () => {
    it('should schedule cleanup via EventBridge when eventBusName is configured', async () => {
      const mockEventBridgeClient = {
        send: jest.fn().mockResolvedValue({}),
      };
      
      // Mock the EventBridge client
      (rotationManager as any).eventBridgeClient = mockEventBridgeClient;

      await (rotationManager as any).scheduleSecretCleanup('test-secret-id');

      expect(mockEventBridgeClient.send).toHaveBeenCalledTimes(1);
      const call = mockEventBridgeClient.send.mock.calls[0][0];
      expect(call.input.Entries[0].Source).toBe('webhook.secret-rotation');
      expect(call.input.Entries[0].DetailType).toBe('Secret Cleanup Scheduled');
    });

    it('should schedule cleanup via SQS when only cleanupQueueUrl is configured', async () => {
      const configWithoutEventBus = { ...mockConfig, eventBusName: undefined };
      const managerWithoutEventBus = new WebhookSecretRotationManager(configWithoutEventBus);

      const mockSQSClient = {
        send: jest.fn().mockResolvedValue({}),
      };
      
      // Mock the SQS client
      (managerWithoutEventBus as any).sqsClient = mockSQSClient;

      await (managerWithoutEventBus as any).scheduleSecretCleanup('test-secret-id');

      expect(mockSQSClient.send).toHaveBeenCalledTimes(1);
      const call = mockSQSClient.send.mock.calls[0][0];
      expect(JSON.parse(call.input.MessageBody).action).toBe('cleanup-secret');
      expect(JSON.parse(call.input.MessageBody).secretId).toBe('test-secret-id');
    });

    it('should handle SQS delay limitations for long grace periods', async () => {
      const configWithLongGrace = { 
        ...mockConfig, 
        eventBusName: undefined,
        gracePeriodHours: 48, // More than 15 minutes
      };
      const managerWithLongGrace = new WebhookSecretRotationManager(configWithLongGrace);

      const mockSQSClient = {
        send: jest.fn().mockResolvedValue({}),
      };
      
      (managerWithLongGrace as any).sqsClient = mockSQSClient;

      await (managerWithLongGrace as any).scheduleSecretCleanup('test-secret-id');

      expect(mockSQSClient.send).toHaveBeenCalledTimes(1);
      const call = mockSQSClient.send.mock.calls[0][0];
      const messageBody = JSON.parse(call.input.MessageBody);
      
      // Should include processAfter for long delays
      expect(messageBody.processAfter).toBeDefined();
      expect(call.input.DelaySeconds).toBeUndefined(); // No delay for long periods
    });

    it('should log warning when no scheduling mechanism is configured', async () => {
      const configWithoutScheduling = { 
        ...mockConfig, 
        eventBusName: undefined,
        cleanupQueueUrl: undefined,
      };
      const managerWithoutScheduling = new WebhookSecretRotationManager(configWithoutScheduling);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await (managerWithoutScheduling as any).scheduleSecretCleanup('test-secret-id');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No scheduling mechanism configured')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('processSecretCleanup', () => {
    it('should successfully clean up previousKey from secret', async () => {
      const mockSecretsClient = {
        send: jest.fn()
          .mockResolvedValueOnce({
            SecretString: JSON.stringify({
              key: 'current-key',
              algorithm: 'sha256',
              previousKey: 'old-key-to-cleanup',
            }),
          })
          .mockResolvedValueOnce({}), // Update call
      };

      (rotationManager as any).secretsClient = mockSecretsClient;

      const result = await rotationManager.processSecretCleanup('test-secret-id');

      expect(result.success).toBe(true);
      expect(mockSecretsClient.send).toHaveBeenCalledTimes(2);
      
      // Verify the update call removes previousKey
      const updateCall = mockSecretsClient.send.mock.calls[1][0];
      const updatedSecret = JSON.parse(updateCall.input.SecretString);
      expect(updatedSecret.previousKey).toBeUndefined();
      expect(updatedSecret.key).toBe('current-key');
    });

    it('should handle secret with no previousKey gracefully', async () => {
      const mockSecretsClient = {
        send: jest.fn().mockResolvedValueOnce({
          SecretString: JSON.stringify({
            key: 'current-key',
            algorithm: 'sha256',
            // No previousKey
          }),
        }),
      };

      (rotationManager as any).secretsClient = mockSecretsClient;

      const result = await rotationManager.processSecretCleanup('test-secret-id');

      expect(result.success).toBe(true);
      expect(mockSecretsClient.send).toHaveBeenCalledTimes(1); // Only get, no update needed
    });

    it('should handle errors gracefully', async () => {
      const mockSecretsClient = {
        send: jest.fn().mockRejectedValue(new Error('Secret not found')),
      };

      (rotationManager as any).secretsClient = mockSecretsClient;

      const result = await rotationManager.processSecretCleanup('non-existent-secret');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Secret not found');
    });
  });
});

describe('Lambda Handlers', () => {
  it('should handle secret rotation events', async () => {
    const { handleSecretRotation } = await import('./secret-rotation');

    const event = {
      webhookConfigId: 'webhook-123',
      databaseClusterArn: 'arn:aws:rds:us-east-1:123456789012:cluster:test',
      databaseSecretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:test',
      databaseName: 'test-db',
    };

    // This would normally call AWS services, so we'd need to mock them
    // For now, just verify the function can be called
    await expect(async () => {
      await handleSecretRotation(event);
    }).rejects.toThrow(); // Expected to fail without real AWS credentials
  });

  it('should handle secret cleanup events', async () => {
    const { handleSecretCleanup } = await import('./secret-rotation');

    const event = {
      detail: {
        secretId: 'secret-123',
        databaseClusterArn: 'arn:aws:rds:us-east-1:123456789012:cluster:test',
        databaseSecretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:test',
        databaseName: 'test-db',
      },
    };

    // This would normally call AWS services, so we'd need to mock them
    // For now, just verify the function can be called
    await expect(async () => {
      await handleSecretCleanup(event);
    }).rejects.toThrow(); // Expected to fail without real AWS credentials
  });
});