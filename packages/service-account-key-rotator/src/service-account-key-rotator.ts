// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {GoogleAuth} from 'google-auth-library';
import {iam} from '@googleapis/iam';
import {v1 as SecretManagerV1} from '@google-cloud/secret-manager';

async function createServiceAccountKey(
  auth: GoogleAuth,
  serviceAccountProjectId: string,
  serviceAccountEmail: string
): Promise<Buffer> {
  const client = await iam({
    version: 'v1',
    auth,
  });
  const name = `projects/${serviceAccountProjectId}/serviceAccounts/${serviceAccountEmail}`;
  const key = await client.projects.serviceAccounts.keys.create({
    name,
    requestBody: {
      privateKeyType: 'TYPE_GOOGLE_CREDENTIALS_FILE',
    },
  });
  if (!key.data.privateKeyData) {
    throw new Error('unable to return data');
  }
  return Buffer.from(key.data.privateKeyData, 'base64');
}

async function updateSecret(
  auth: GoogleAuth,
  secretManagerProjectId: string,
  secretName: string,
  data: Buffer
): Promise<string | undefined | null> {
  const secretsClient = new SecretManagerV1.SecretManagerServiceClient({
    auth,
  });
  const parent = `projects/${secretManagerProjectId}/secrets/${secretName}`;
  const [version] = await secretsClient.addSecretVersion({
    parent,
    payload: {
      data,
    },
  });
  return version.name;
}

export async function rotateSecret(
  serviceAccountProjectId: string,
  serviceAccountEmail: string,
  secretManagerProjectId: string,
  secretName: string
): Promise<boolean> {
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  console.log(
    `creating new key for service account: ${serviceAccountEmail} (${serviceAccountProjectId})`
  );
  const serviceAccountKey = await createServiceAccountKey(
    auth,
    serviceAccountProjectId,
    serviceAccountEmail
  );
  console.log(`updating secret: ${secretName} (${secretManagerProjectId})`);
  const version = await updateSecret(
    auth,
    secretManagerProjectId,
    secretName,
    serviceAccountKey
  );
  console.log(`updated secret: ${version}`);
  return true;
}
