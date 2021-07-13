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
import {rotateSecret} from './service-account-key-rotator';

interface Args {
  'service-account-project-id': string;
  'service-account': string;
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
        demand: true,
      })
      .option('service-account', {
        describe: 'email address of the service account',
        type: 'string',
        demand: true,
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
    await rotateSecret(
      argv['service-account-project-id'],
      argv['service-account'],
      argv['secret-manager-project-id'],
      argv['secret-name']
    );
  },
};

export function parser(): yargs.Argv {
  return yargs.command(rotateCommand).showHelpOnFail(true).strictCommands();
}

// Only run the command if we're running this file directly
if (require.main === module) {
  parser().parse(process.argv.slice(2));
}
