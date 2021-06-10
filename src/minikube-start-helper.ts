/**********************************************************************
 * Copyright (c) 2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import * as core from '@actions/core';
import * as execa from 'execa';
import * as os from 'os';

import { injectable } from 'inversify';

/**
 * Launch minikube with all add-ons required by Eclipse Che (like ingress).
 * Try to use all memory available on Github Action Runners.
 */
@injectable()
export class MinikubeStartHelper {
  async start(): Promise<void> {
    // use options to perform the chown to let users (not root) access minikube instance
    const options: execa.Options = {
      env: {
        CHANGE_MINIKUBE_NONE_USER: 'true',
        MINIKUBE_WANTUPDATENOTIFICATION: 'false',
      },
    };
    core.info('Starting minikube...');

    let cpus = '2';
    let memory = '6500';
    let vmDriver = 'docker';
    // Github mac runners has more cpu and memory and a different driver than linux one
    if (os.platform() === 'darwin') {
      cpus = '3';
      memory = '8192';
      vmDriver = 'virtualbox';
    }

    const execaProcess = execa(
      'minikube',
      ['start', `--vm-driver=${vmDriver}`, '--addons=ingress', '--cpus', cpus, '--memory', memory],
      options
    );
    if (execaProcess.stdout) {
      execaProcess.stdout.pipe(process.stdout);
    }
    if (execaProcess.stderr) {
      execaProcess.stderr.pipe(process.stderr);
    }
    await execaProcess;
  }
}
