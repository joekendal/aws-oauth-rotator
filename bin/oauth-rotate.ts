#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { OAuthRotate } from '../lib/oauth-rotate';

const app = new cdk.App();

const envDev = { 
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION
}

export interface OAuthRotateStackProps extends cdk.StackProps {
  secretName?: string;
}

export class OAuthRotateStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: OAuthRotateStackProps){
    super(scope, id, props)

    new OAuthRotate(this, 'OAuthRotate', {
      clientId: process.env.CLIENT_ID!,
      clientSecret: process.env.CLIENT_SECRET!,
      authUrl: process.env.AUTH_URL!,
      secretName: props?.secretName
    })

  }
}

new OAuthRotateStack(app, 'OAuthRotateStack', {
  env: envDev
});
