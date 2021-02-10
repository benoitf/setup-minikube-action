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

import { Configuration } from './configuration';
import { InversifyBinding } from './inversify-binding';
import { LaunchMinikube } from './launch-minikube';
import { PostAction } from './post-action';

export class Main {
  public static readonly MINIKUBE_VERSION: string = 'minikube-version';
  public static readonly ACTION_STATE: string = 'minikube-state';
  public static readonly ACTION_STATE_MAIN: string = 'MAIN';
  public static readonly ACTION_STATE_POST: string = 'POST';

  async initConfiguration(): Promise<Configuration> {
    const minikubeVersion = core.getInput(Main.MINIKUBE_VERSION, { required: false });

    // custom job name ?
    const jobNameSuffix = process.env['JOB_NAME_SUFFIX'] || '';
    // configuration
    return {
      jobNameSuffix: () => jobNameSuffix,
      minikubeVersion: () => minikubeVersion,
    };
  }

  isPostAction(): boolean {
    const previousState = core.getState(Main.ACTION_STATE);
    if (previousState !== Main.ACTION_STATE_POST) {
      core.saveState(Main.ACTION_STATE, Main.ACTION_STATE_POST);
      return false;
    }
    return true;
  }

  protected async doStart(): Promise<void> {
    const configuration = await this.initConfiguration();
    const inversifyBinbding = new InversifyBinding(configuration);
    const container = await inversifyBinbding.initBindings();
    if (this.isPostAction()) {
      const postAction = container.get(PostAction);
      await postAction.execute();
    } else {
      const launchMinikube = container.get(LaunchMinikube);
      await launchMinikube.execute();
    }
  }

  async start(): Promise<boolean> {
    try {
      await this.doStart();
      return true;
    } catch (error) {
      console.error('stack=' + error.stack);
      console.error('Unable to start', error);
      return false;
    }
  }
}
