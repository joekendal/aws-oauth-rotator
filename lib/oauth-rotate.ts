import * as cdk from '@aws-cdk/core';
import * as secretsmanager from '@aws-cdk/aws-secretsmanager'
import * as lambda from '@aws-cdk/aws-lambda-nodejs'

export interface OAuthRotateProps {
  clientId: string;
  clientSecret: string;
  authUrl: string;
  every: cdk.Duration
}

export class OAuthRotate extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: OAuthRotateProps) {
    super(scope, id);

    const secret = new secretsmanager.Secret(this, 'OAuthSecret');

    const rotate = new lambda.NodejsFunction(this, 'OAuthCreate', {
      entry: 'resources/rotate.ts',
      environment: {
        OAUTH_SECRET_REGION: secret.stack.region!,
        OAUTH_CLIENT_ID: props.clientId,
        OAUTH_CLIENT_SECRET: props.clientSecret,
        OAUTH_URL: props.authUrl
      }
    })
    
    secret.addRotationSchedule('RotationSchedule', {
      rotationLambda: rotate,
      automaticallyAfter: props.every
    })
  }
}