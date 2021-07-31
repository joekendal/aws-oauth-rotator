#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { AwsOauthRotateStack } from '../lib/aws-oauth-rotate-stack';

const app = new cdk.App();
new AwsOauthRotateStack(app, 'AwsOauthRotateStack');
