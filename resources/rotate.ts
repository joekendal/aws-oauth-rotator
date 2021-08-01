import { 
  SecretsManagerClient, 
  PutSecretValueCommand,
  PutSecretValueCommandInput,
  PutSecretValueCommandOutput,
  UpdateSecretVersionStageCommand,
  UpdateSecretVersionStageCommandInput,
  UpdateSecretVersionStageCommandOutput,
  ListSecretVersionIdsCommand,
  ListSecretVersionIdsCommandOutput,
  DescribeSecretCommand,
  CreateSecretCommand,
  CreateSecretCommandInput,
  GetSecretValueCommand,
  GetSecretValueCommandInput,
} from "@aws-sdk/client-secrets-manager"
import { assert } from "console"
import { format, parse } from "url"
import fetch from 'node-fetch';

type RotateSecretEvent = {
  ClientRequestToken: string;
  SecretId: string;
  Step: SecretStep;
}

enum SecretStep {
  create = "createSecret",
  set = "setSecret",
  test = "testSecret",
  finish = "finishSecret"
}

const client = new SecretsManagerClient({ 
  region: process.env.SECRET_REGION 
})

export const getToken = async () => {
  // prepare url
  const url = parse(format({
    protocol: 'https',
    hostname: process.env.AUTH_URL!,
    pathname: '/oauth2/token',
    query: {
      'client_id': process.env.CLIENT_ID!,
      'client_secret': process.env.CLIENT_SECRET!,
      'grant_type': 'client_credentials'
    }
  }))

  var accessToken: string | undefined;

  // post auth creds
  await fetch(url.href!, { 
    method: 'POST',
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
    .then(async res => await res.json())
    .then(json => {
      accessToken = json.access_token
    })
    .catch(err => {
      console.log(err)
    })

  return accessToken
}

const getSecret = async (secretId: string, stage: string, clientRequestToken?: string) => {
  const input: GetSecretValueCommandInput = {
    SecretId: secretId,
    VersionStage: stage,
    VersionId: clientRequestToken
  }
  const command = new GetSecretValueCommand(input)
  try {
    const out = await client.send(command)
    return out.SecretString
  } catch (err) {
    return
  }  
}

const create = async (secretId: string, clientRequestToken: string) => {
  var currentSecret = await getSecret(secretId, "AWSCURRENT")
  if(!currentSecret) return

  // get new access token
  const newToken = await getToken()
  if(!newToken) new Error("Access Token is undefined")

  const input: PutSecretValueCommandInput = {
    SecretId: secretId,
    ClientRequestToken: clientRequestToken,
    VersionStages: ["AWSPENDING"]
  }

  // get current pending and update it if exists else create new pending
  const pendingSecret = await getSecret(secretId, "AWSPENDING", clientRequestToken)
  if(!pendingSecret){
    currentSecret = newToken
    input.SecretString = currentSecret
  } else {
    input.SecretString = pendingSecret
  }

  const command = new PutSecretValueCommand(input)

  const res: PutSecretValueCommandOutput = await client.send(command)
  
  console.log(res)
}

const getCurrentVersion = async (secretId: string, clientRequestToken: string) => {
  const metadata = await client.send(new DescribeSecretCommand({
    SecretId: secretId
  }))
  var currentVersion;

  // loop through mapping to find current version
  for (const version in metadata.VersionIdsToStages) {
    if (Object.prototype.hasOwnProperty.call(metadata.VersionIdsToStages, version)) {
      const element = metadata.VersionIdsToStages[version];
      if(element.includes("AWSCURRENT")){
        // if correct version already marked as current
        if(version === clientRequestToken) return
        currentVersion = version
        break
      }
    }
  }

  return currentVersion;
}

const finish = async (secretId: string, clientRequestToken: string) => {

  const currentVersion = await getCurrentVersion(secretId, clientRequestToken)
  
  const input: UpdateSecretVersionStageCommandInput = {
    SecretId: secretId,
    VersionStage: "AWSCURRENT",
    MoveToVersionId: clientRequestToken,
    RemoveFromVersionId: currentVersion
  }
  const command = new UpdateSecretVersionStageCommand(input)

  const res: UpdateSecretVersionStageCommandOutput = await client.send(command)
  
  console.log(res)
}

export const handler = (event: RotateSecretEvent) => {
  console.log("ENVIRONMENT VARIABLES\n" + JSON.stringify(process.env, null, 2))
  console.info("EVENT\n" + JSON.stringify(event, null, 2))
  switch (event.Step) {
    case SecretStep.create:
      create(event.SecretId, event.ClientRequestToken)
      break;
    case SecretStep.finish:
      finish(event.SecretId, event.ClientRequestToken)
      break;
    default:
      console.warn("Event not processed.")
      break;
  }
}