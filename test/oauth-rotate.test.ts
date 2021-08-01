import { expect as expectCDK, haveResource } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import { OAuthRotateStack } from '../bin/oauth-rotate';

var stack: OAuthRotateStack
const testName = "test"

beforeAll(() => {
  const app = new cdk.App();

  stack = new OAuthRotateStack(app, 'MyTestStack', {
    secretName: testName
  })
})

test('Lambda function', () => {
  const hasEnvs = ({ Variables: envs }: { Variables: any }) => {
    expect(envs).toHaveProperty("SECRET_REGION")
    expect(envs).toHaveProperty("CLIENT_ID")
    expect(envs).toHaveProperty("CLIENT_SECRET")
    expect(envs).toHaveProperty("AUTH_URL")
    return true
  }
  expectCDK(stack).to(haveResource("AWS::Lambda::Function", {
    Runtime: "nodejs14.x",
    Environment: hasEnvs
  }))
})

test('Secrets Manager secret', () => {
  expectCDK(stack).to(haveResource("AWS::SecretsManager::Secret", {    
    Name: testName
  }))
})

test('Rotation schedule', () => {
  expectCDK(stack).to(haveResource("AWS::SecretsManager::RotationSchedule", {
    RotationRules: {
      "AutomaticallyAfterDays": 1
    }
  }))
})
