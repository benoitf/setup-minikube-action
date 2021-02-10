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

import { CollectMinikubeEventsHelper } from '../src/collect-minikube-events-helper';
import { Container } from 'inversify';
import { PostAction } from '../src/post-action';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('Test PostAction', () => {
  let container: Container;
  let collectMinikubeEventsHelper: CollectMinikubeEventsHelper;

  beforeEach(() => {
    container = new Container();
    container.bind(PostAction).toSelf().inSingletonScope();

    collectMinikubeEventsHelper = {
      collect: jest.fn(),
    } as any;
    container.bind(CollectMinikubeEventsHelper).toConstantValue(collectMinikubeEventsHelper);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('basic', async () => {
    const postAction = container.get(PostAction);
    await postAction.execute();

    expect(collectMinikubeEventsHelper.collect).toBeCalled();
  });
});
