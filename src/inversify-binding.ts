/**********************************************************************
 * Copyright (c) 2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/
import 'reflect-metadata';

import { CollectMinikubeEventsHelper } from './collect-minikube-events-helper';
import { Configuration } from './configuration';
import { Container } from 'inversify';
import { LaunchMinikube } from './launch-minikube';
import { MinikubeSetupHelper } from './minikube-setup-helper';
import { MinikubeStartHelper } from './minikube-start-helper';
import { PostAction } from './post-action';

export class InversifyBinding {
  private container: Container;

  constructor(private configuration: Configuration) {}

  public async initBindings(): Promise<Container> {
    this.container = new Container();

    this.container.bind(MinikubeSetupHelper).toSelf().inSingletonScope();
    this.container.bind(MinikubeStartHelper).toSelf().inSingletonScope();
    this.container.bind(CollectMinikubeEventsHelper).toSelf().inSingletonScope();

    this.container.bind(Configuration).toConstantValue(this.configuration);
    this.container.bind(LaunchMinikube).toSelf().inSingletonScope();
    this.container.bind(PostAction).toSelf().inSingletonScope();

    return this.container;
  }
}
