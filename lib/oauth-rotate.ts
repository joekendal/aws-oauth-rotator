import * as cdk from '@aws-cdk/core';
import * as secretsmanager from '@aws-cdk/aws-secretsmanager'
import * as lambda from '@aws-cdk/aws-lambda-nodejs'


export interface OAuthRotateProps {
  clientId: string;
  clientSecret: string;
  authUrl: string;
  every?: cdk.Duration;
  secretName?: string;
}

export class OAuthRotate extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: OAuthRotateProps) {
    super(scope, id);

    const secret = new secretsmanager.Secret(this, 'OAuthSecret', {
      secretName: props.secretName
    });

    const rotate = new lambda.NodejsFunction(this, 'OAuthCreate', {
      entry: 'resources/rotate.ts',
      environment: {
        SECRET_REGION: secret.stack.region!,
        CLIENT_ID: props.clientId,
        CLIENT_SECRET: props.clientSecret,
        AUTH_URL: props.authUrl
      }
    })
    
    secret.addRotationSchedule('RotationSchedule', {
      rotationLambda: rotate,
      automaticallyAfter: props.every || cdk.Duration.days(1)
    })

    new cdk.CfnOutput(this, 'SecretName', {
      exportName: 'SecretName',
      value: secret.secretName
    })
  }
}