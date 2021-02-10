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

import { Container } from 'inversify';
import { InversifyBinding } from '../src/inversify-binding';
import { Main } from '../src/main';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('Test Main with stubs', () => {
  const originalConsoleError = console.error;
  const mockedConsoleError = jest.fn();
  const launchMinikubeExecuteMethod = jest.fn();
  const launchMinikubeMock = {
    execute: launchMinikubeExecuteMethod as any,
  };
  let container: Container;

  beforeEach(() => {
    container = {
      get: jest.fn().mockReturnValue(launchMinikubeMock),
    } as any;
    const spyInitBindings = jest.spyOn(InversifyBinding.prototype, 'initBindings');
    spyInitBindings.mockImplementation(() => Promise.resolve(container));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  beforeEach(() => (console.error = mockedConsoleError));
  afterEach(() => (console.error = originalConsoleError));

  test('basic', async () => {
    const main = new Main();
    const returnCode = await main.start();
    expect(mockedConsoleError).toBeCalledTimes(0);
    expect(returnCode).toBeTruthy();
    expect(launchMinikubeExecuteMethod).toBeCalled();
  });

  test('basic post', async () => {
    const main = new Main();
    const isPostActionSpy = jest.spyOn(main, 'isPostAction');
    isPostActionSpy.mockReturnValue(true);
    const returnCode = await main.start();
    expect(mockedConsoleError).toBeCalledTimes(0);
    expect(returnCode).toBeTruthy();
    expect(launchMinikubeExecuteMethod).toBeCalled();
  });

  test('default configuration', async () => {
    const MINIKUBE_VERSION = '1.2.3';
    (core as any).__setInput(Main.MINIKUBE_VERSION, MINIKUBE_VERSION);

    const main = new Main();
    const configuration = await main.initConfiguration();
    expect(configuration.minikubeVersion()).toBe(MINIKUBE_VERSION);
  });

  test('is PostAction true', async () => {
    const main = new Main();
    const getStateSpy = jest.spyOn(core, 'getState');
    const saveStateSpy = jest.spyOn(core, 'saveState');
    getStateSpy.mockReturnValue(Main.ACTION_STATE_POST);
    const isPostAction = await main.isPostAction();
    expect(isPostAction).toBeTruthy();
    expect(getStateSpy).toHaveBeenCalledWith(Main.ACTION_STATE);
    expect(saveStateSpy).toHaveBeenCalledTimes(0);
  });

  test('is PostAction false', async () => {
    const main = new Main();
    const getStateSpy = jest.spyOn(core, 'getState');
    const saveStateSpy = jest.spyOn(core, 'saveState');
    getStateSpy.mockReturnValue('');
    const isPostAction = await main.isPostAction();
    expect(isPostAction).toBeFalsy();
    expect(getStateSpy).toHaveBeenCalledWith(Main.ACTION_STATE);
    expect(saveStateSpy).toHaveBeenCalledWith(Main.ACTION_STATE, Main.ACTION_STATE_POST);
  });

  test('error', async () => {
    jest.spyOn(InversifyBinding.prototype, 'initBindings').mockImplementation(() => {
      throw new Error('Dummy error');
    });
    const main = new Main();
    const returnCode = await main.start();
    expect(mockedConsoleError).toBeCalled();
    expect(returnCode).toBeFalsy();
    expect(launchMinikubeExecuteMethod).toBeCalledTimes(0);
  });
});
