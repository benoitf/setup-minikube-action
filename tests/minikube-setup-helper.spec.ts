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
import * as os from 'os';
import * as toolCache from '@actions/tool-cache';

import { Configuration } from '../src/configuration';
import { Container } from 'inversify';
import { MinikubeSetupHelper } from '../src/minikube-setup-helper';

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('execa');

describe('Test MinikubeStartHelper', () => {
  let container: Container;
  let minikubeSetupHelper: MinikubeSetupHelper;
  let configuration: any;
  const minikubeVersionMethod = jest.fn();

  beforeEach(() => {
    container = new Container();
    configuration = {
      minikubeVersion: minikubeVersionMethod,
    };
    container.bind(Configuration).toConstantValue(configuration);
    container.bind(MinikubeSetupHelper).toSelf().inSingletonScope();
    minikubeSetupHelper = container.get(MinikubeSetupHelper);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  test('start default minikube', async () => {
    await minikubeSetupHelper.setup();
    // core.info
    expect(core.info).toBeCalledTimes(1);
    expect((core.info as any).mock.calls[0][0]).toContain('use pre-installed minikube version');
    expect(execa as any).toBeCalledTimes(0);
  });

  test('start custom minikube', async () => {
    (execa as any).mockResolvedValue({ exitCode: 0, stdout: undefined });
    const customMinikubeVersion = '1.2.3-custom-minikube';
    minikubeVersionMethod.mockReturnValue(customMinikubeVersion);

    const osPlatformSpy = jest.spyOn(os, 'platform');
    osPlatformSpy.mockReturnValue('linux');
    const osArchSpy = jest.spyOn(os, 'arch');
    osArchSpy.mockReturnValue('x64');

    const fakeDownloadedPath = '/fake/download-archive';
    const downloadToolSpy = jest.spyOn(toolCache, 'downloadTool');
    downloadToolSpy.mockResolvedValue(fakeDownloadedPath);
    await minikubeSetupHelper.setup();
    // core.info
    expect(core.info).toBeCalled();
    expect((core.info as any).mock.calls[0][0]).toContain(`Downloading minikube ${customMinikubeVersion}...`);

    expect(downloadToolSpy).toBeCalled();
    expect(downloadToolSpy.mock.calls[0][0]).toBe(
      'https://github.com/kubernetes/minikube/releases/download/1.2.3-custom-minikube/minikube-linux-amd64'
    );

    expect(execa).toBeCalledTimes(2);
    expect((execa as any).mock.calls[0][0]).toBe('sudo');
    expect((execa as any).mock.calls[0][1][0]).toBe('-E');
    expect((execa as any).mock.calls[0][1][1]).toBe('chmod');
    expect((execa as any).mock.calls[0][1][2]).toBe('755');
    expect((execa as any).mock.calls[0][1][3]).toBe(fakeDownloadedPath);

    expect((execa as any).mock.calls[1][0]).toBe('sudo');
    expect((execa as any).mock.calls[1][1][0]).toBe('-E');
    expect((execa as any).mock.calls[1][1][1]).toBe('mv');
  });

  test('start custom minikube on macos', async () => {
    (execa as any).mockResolvedValue({ exitCode: 0, stdout: undefined });
    const customMinikubeVersion = '1.2.3-custom-minikube';
    minikubeVersionMethod.mockReturnValue(customMinikubeVersion);

    const osPlatformSpy = jest.spyOn(os, 'platform');
    osPlatformSpy.mockReturnValue('darwin');
    const osArchSpy = jest.spyOn(os, 'arch');
    osArchSpy.mockReturnValue('x64');

    const fakeDownloadedPath = '/fake/download-archive';
    const downloadToolSpy = jest.spyOn(toolCache, 'downloadTool');
    downloadToolSpy.mockResolvedValue(fakeDownloadedPath);
    await minikubeSetupHelper.setup();
    // core.info
    expect(core.info).toBeCalled();
    expect((core.info as any).mock.calls[0][0]).toContain(`Downloading minikube ${customMinikubeVersion}...`);

    expect(downloadToolSpy).toBeCalled();
    expect(downloadToolSpy.mock.calls[0][0]).toBe(
      'https://github.com/kubernetes/minikube/releases/download/1.2.3-custom-minikube/minikube-darwin-amd64'
    );
  });
});
