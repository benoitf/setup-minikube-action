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

import * as core from '@actions/core';
import * as execa from 'execa';

import { Container } from 'inversify';
import { MinikubeStartHelper } from '../src/minikube-start-helper';

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('execa');

describe('Test MinikubeStartHelper', () => {
  let container: Container;
  let minikubeStartHelper: MinikubeStartHelper;

  beforeEach(() => {
    container = new Container();

    container.bind(MinikubeStartHelper).toSelf().inSingletonScope();
    minikubeStartHelper = container.get(MinikubeStartHelper);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  test('start no stdout/stderr', async () => {
    const stdout = 'dummy output of start minikube';

    (execa as any).mockResolvedValue({ exitCode: 0, stdout });

    await minikubeStartHelper.start();
    // core.info
    expect(core.info).toBeCalled();
    expect((core.info as any).mock.calls[0][0]).toContain('Starting minikube...');

    expect((execa as any).mock.calls[0][0]).toBe('minikube');
    expect((execa as any).mock.calls[0][1][0]).toBe('start');
  });

  test('start with stdout/stderr', async () => {
    const output = { pipe: jest.fn() };
    const err = { pipe: jest.fn() };
    const stdOutAfterResolve = 'dummy output of start minikube';

    const promise = new Promise((res: any) => {
      res({ stdout: stdOutAfterResolve });
    });

    (promise as any).exitCode = 0;
    (promise as any).stdout = output;
    (promise as any).stderr = err;

    (execa as any).mockReturnValue(promise);

    await minikubeStartHelper.start();
    // core.info
    expect(core.info).toBeCalled();
    expect((core.info as any).mock.calls[0][0]).toContain('Starting minikube...');

    expect((execa as any).mock.calls[0][0]).toBe('minikube');
    expect((execa as any).mock.calls[0][1][0]).toBe('start');
  });
});
