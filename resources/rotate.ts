import { 
  SecretsManagerClient, 
  PutSecretValueCommand,
  PutSecretValueCommandInput,
  PutSecretValueCommandOutput,
  UpdateSecretVersionStageCommand,
  UpdateSecretVersionStageCommandInput,
  UpdateSecretVersionStageCommandOutput,
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

  var accessToken

  await fetch(url.href!, { 
    method: 'POST',
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
    .then(async res => await res.json())
    .then(json => {
      accessToken = json
    })
    .catch(err => {
      console.log(err)
    })

  return accessToken
}

const create = async (secretId: string, clientRequestToken: string) => {
  // get new access token
  const token = await getToken()
  if(!token) new Error("Access Token is undefined")

  const input: PutSecretValueCommandInput = {
    SecretId: secretId,
    // ClientRequestToken: clientRequestToken,
    SecretString: token,
    VersionStages: ["AWSPENDING"]
  }

  const command = new PutSecretValueCommand(input)

  const res: PutSecretValueCommandOutput = await client.send(command)
  
  console.log(res)
}

const set = () => {
  console.info("setSecret not processed.")
}

const test = () => {
  console.info("testSecret not processed.")
}

const finish = async (secretId: string, clientRequestToken: string) => {

  const input: UpdateSecretVersionStageCommandInput = {
    SecretId: secretId,
    VersionStage: "AWSCURRENT",
    // MoveToVersionId: clientRequestToken,
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
    case SecretStep.set:
      set()
      break;
    case SecretStep.test:
      test()
      break;
    case SecretStep.finish:
      finish(event.SecretId, event.ClientRequestToken)
      break;
    default:
      console.warn("Event not processed.")
      break;
  }
}