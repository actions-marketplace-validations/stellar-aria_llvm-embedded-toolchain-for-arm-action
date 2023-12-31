/* eslint-disable @typescript-eslint/naming-convention */

import semver from 'semver';
import fetch from 'node-fetch';

const versions: {[llvmRelease: string]: string[]} = {
  '16.0.0': ['Darwin', 'Windows-x86_64', 'Linux-x86_64'],
  '15.0.2': ['Windows-x86_64', 'Linux-x86_64'],
  '14.0.0': ['windows', 'linux'],
  '13.0.0': ['windows', 'linux'],
};

export function hasSHA256(llvmRelease: string): boolean {
  return llvmRelease !== '13.0.0' && llvmRelease !== '14.0.0';
}

export function availableVersions(): string[] {
  return Object.keys(versions);
}

export function latestVersion(): string {
  // Since ES6 (from node v8.x) JS objects are ordered
  return Object.keys(versions)[0];
}

export function hasDarwin(llvmRelease: string): boolean {
  return semver.satisfies(llvmRelease, '>=16.0.0');
}

export function distributionUrl(version: string, platform: string): string {
  const baseUrl = 'https://github.com/ARM-software/LLVM-embedded-toolchain-for-Arm/releases/download/';

  // Convert the node platform value to the versions URL keys
  let osName = '';
  if (version === '13.0.0' || version === '14.0.0') {
    switch (platform) {
      case 'linux':
        osName = 'linux';
        break;
      case 'win32':
        osName = 'windows';
        break;
      default:
        throw new Error(`platform ${platform} is not supported for version ${version}`);
    }
  } else {
    switch (platform) {
      case 'darwin':
        osName = 'Darwin';
        break;
      case 'linux':
        osName = 'Linux-x86_64';
        break;
      case 'win32':
        osName = 'Windows-x86_64';
        break;
      default:
        throw new Error(`platform ${platform} is not supported for version ${version}`);
    }
  }

  if (!versions.hasOwnProperty(version)) {
    throw new Error(`invalid LLVM version ${version}. Available: ${availableVersions()}`);
  }
  if (!versions[version].includes(osName)) {
    throw new Error(`invalid platform ${osName} for version ${version}`);
  }
  const ext: string = platform === 'win32' ? 'zip' : 'tar.gz';
  return baseUrl + `release-${version}/LLVMEmbeddedToolchainForArm-${version}-${osName}.${ext}`;
}

export async function getSHA256(version: string, platform: string): Promise<string> {
  const distUrl = distributionUrl(version, platform);
  const shaUrl = distUrl + '.sha256';
  let response = await fetch(shaUrl);
  if (response.redirected) {
    response = await fetch(response.url);
  }
  const text = await response.text();
  return text.split(' ')[0].trim(); // see sha526sum for formatting details
}
