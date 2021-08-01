#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { OAuthRotate } from '../lib/oauth-rotate';

const app = new cdk.App();

const envDev = { 
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION
}

export class OAuthRotateStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps){
    super(scope, id, props)

    new OAuthRotate(this, 'OAuthRotate', {
      clientId: process.env.CLIENT_ID!,
      clientSecret: process.env.CLIENT_SECRET!,
      authUrl: process.env.AUTH_URL!,
      every: cdk.Duration.days(1)
    })

  }
}

new OAuthRotateStack(app, 'OauthRotateStack', {
  env: envDev
});
