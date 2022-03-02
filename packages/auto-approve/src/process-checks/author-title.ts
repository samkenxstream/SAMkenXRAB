// Copyright 2022 Google LLC
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

import {Process, PullRequest} from '../interfaces';
import {
  checkAuthor,
  checkTitleOrBody,
  reportIndividualChecks,
} from '../utils-for-pr-checking';
import {Octokit} from '@octokit/rest';

export class AuthorTitleProcess extends Process {
  author: string;
  titleRegex: RegExp;

  constructor(octokit: Octokit, author: string, titleRegex: RegExp) {
    super(octokit);

    this.author = author;
    this.titleRegex = titleRegex;
  }

  public async checkPR(incomingPR: PullRequest): Promise<boolean> {
    const authorshipMatches = checkAuthor(this.author, incomingPR.author);

    const titleMatches = checkTitleOrBody(incomingPR.title, this.titleRegex);
    reportIndividualChecks(
      ['authorshipMatches', 'titleMatches'],
      [authorshipMatches, titleMatches],
      incomingPR.repoOwner,
      incomingPR.repoName,
      incomingPR.prNumber
    );

    return authorshipMatches && titleMatches;
  }
}
