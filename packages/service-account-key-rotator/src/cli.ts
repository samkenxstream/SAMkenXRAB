#!/usr/bin/env node
// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import yargs = require('yargs');
import {
  rotateSecret,
  fetchServiceAccountSecret,
} from './service-account-key-rotator';

interface Args {
  'service-account-project-id'?: string;
  'service-account'?: string;
  'secret-manager-project-id': string;
  'secret-name': string;
}

interface AuditArgs {
  'secret-manager-project-id': string;
  'secret-name': string;
}

const rotateCommand: yargs.CommandModule<{}, Args> = {
  command: 'rotate',
  describe: 'Rotate service account keys',
  builder(yargs) {
    return yargs
      .option('service-account-project-id', {
        describe: 'project that contains the service account',
        type: 'string',
      })
      .option('service-account', {
        describe: 'email address of the service account',
        type: 'string',
      })
      .option('secret-manager-project-id', {
        describe: 'project that contains the secret',
        type: 'string',
        demand: true,
      })
      .option('secret-name', {
        describe: 'name of the secret',
        type: 'string',
        demand: true,
      });
  },
  async handler(argv) {
    let serviceAccountProjectId = argv['service-account-project-id'];
    let serviceAccountEmail = argv['service-account'];
    const secretManagerProjectId = argv['secret-manager-project-id'];
    const secretName = argv['secret-name'];
    if (!serviceAccountProjectId || !serviceAccountEmail) {
      console.log('No service account specified - looking up via secret');
      const serviceAccount = await fetchServiceAccountSecret(
        secretManagerProjectId,
        secretName
      );
      if (!serviceAccount) {
        throw new Error(
          `Unable to find service account for secret ${secretName} (${secretManagerProjectId})`
        );
      }
      serviceAccountProjectId = serviceAccount.project_id;
      serviceAccountEmail = serviceAccount.client_email;
    }
    await rotateSecret(
      serviceAccountProjectId,
      serviceAccountEmail,
      secretManagerProjectId,
      secretName
    );
  },
};

const auditCommand: yargs.CommandModule<{}, AuditArgs> = {
  command: 'audit',
  describe: 'Fetch secret',
  builder(yargs) {
    return yargs
      .option('secret-manager-project-id', {
        describe: 'project that contains the secret',
        type: 'string',
        demand: true,
      })
      .option('secret-name', {
        describe: 'name of the secret',
        type: 'string',
        demand: true,
      });
  },
  async handler(argv) {
    const secret = await fetchServiceAccountSecret(
      argv['secret-manager-project-id'],
      argv['secret-name']
    );
    console.log(secret);
  },
};

export function parser(): yargs.Argv {
  return yargs
    .command(rotateCommand)
    .command(auditCommand)
    .showHelpOnFail(true)
    .strict();
}

// Only run the command if we're running this file directly
if (require.main === module) {
  parser().parse(process.argv.slice(2));
}
