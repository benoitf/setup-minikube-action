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
import * as toolCache from '@actions/tool-cache';

import { inject, injectable } from 'inversify';

import { Configuration } from './configuration';

/**
 * There is already minikube installed on the system but
 * we might want to stick to a given minikube version.
 */
@injectable()
export class MinikubeSetupHelper {
  @inject(Configuration)
  private configuration: Configuration;

  public static readonly MINIKUBE_OWN_PATH = '/usr/local/sbin/minikube';
  public static readonly KUBECTL_OWN_PATH = '/usr/local/sbin/kubectl';

  public static readonly MINIKUBE_VERSION: string = 'minikube';
  public static readonly MINIKUBE_VERSION_DEFAULT: string = 'default';

  public static readonly MINIKUBE_LINK =
    'https://github.com/kubernetes/minikube/releases/download/${VERSION}/minikube-${PLATFORM}-${ARCH}';

  async setup(): Promise<void> {
    const minikubeVersion = this.configuration.minikubeVersion();
    // grab operating system
    const platform = os.platform();

    // use existing installed minikube version
    if (!minikubeVersion) {
      if (platform === 'linux') {
        core.info('Minikube version not specified. Will use pre-installed minikube version');
        return;
      } else {
        core.setFailed(`Need to specify minikube version as it is not installed by default on ${platform} runners.`);
        return;
      }
    }
    if (platform === 'darwin') {
      core.info('Installing kubectl on macos');
      // Download it through tool cache utility.
      const kubectlDownloadPath = await toolCache.downloadTool(
        'https://dl.k8s.io/release/v1.21.1/bin/darwin/amd64/kubectl'
      );
      core.info('Make kubectl executable');
      await execa('sudo', ['-E', 'chmod', '755', kubectlDownloadPath]);
      // move kubectl to a folder in path
      await execa('sudo', ['-E', 'mv', kubectlDownloadPath, MinikubeSetupHelper.KUBECTL_OWN_PATH]);
    }

    // download
    core.info(`'Downloading minikube ${minikubeVersion}...`);

    const arch = os.arch().replace('x64', 'amd64');
    const link = MinikubeSetupHelper.MINIKUBE_LINK.replace('${VERSION}', minikubeVersion)
      .replace('${PLATFORM}', platform)
      .replace('${ARCH}', arch);

    // Download it through tool cache utility.
    const minikubeDownloadPath = await toolCache.downloadTool(link);

    // make it executable
    core.info('Make minikube executable');
    await execa('sudo', ['-E', 'chmod', '755', minikubeDownloadPath]);

    // move minikube to a folder in path
    await execa('sudo', ['-E', 'mv', minikubeDownloadPath, MinikubeSetupHelper.MINIKUBE_OWN_PATH]);

    core.info('Minikube installed at ' + MinikubeSetupHelper.MINIKUBE_OWN_PATH);
  }
}
