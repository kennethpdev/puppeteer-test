import fs from 'fs';
import path from 'path';
import { execSync, execFileSync } from 'child_process';

const newLineRegex = /\r?\n/;

/**
 * Look for linux executables in 3 ways
 * 1. Look into CHROME_PATH env variable
 * 2. Look into the directories where .desktop are saved on gnome based distro's
 * 3. Look for google-chrome-stable & google-chrome executables by using the which command
 */
function linux() {
  let installations: string[] = [];

  // 1. Look into CHROME_PATH env variable
  const customChromePath = resolveChromePath();
  if (customChromePath) installations.push(customChromePath);

  // 2. Look into the directories where .desktop are saved on gnome based distro's
  const desktopInstallationFolders = [
    path.join(require('os').homedir(), '.local/share/applications/'),
    '/usr/share/applications/',
  ];
  desktopInstallationFolders.forEach(folder => {
    installations = installations.concat(findChromeExecutables(folder));
  });

  // Look for google-chrome(-stable) & chromium(-browser) executables by using the which command
  const executables = [
    'google-chrome-stable',
    'google-chrome',
    'chromium-browser',
    'chromium',
  ];
  executables.forEach(executable => {
    try {
      const chromePath = execFileSync('which', [executable], { stdio: 'pipe' })
        .toString()
        .split(newLineRegex)[0];
      if (canAccess(chromePath)) installations.push(chromePath);
    } catch (e) {
      // Not installed.
    }
  });

  if (!installations.length)
    throw new Error(
      'The environment variable CHROME_PATH must be set to executable of a build of Chromium version 54.0 or later.'
    );

  const priorities = [
    { regex: /chrome-wrapper$/, weight: 51 },
    { regex: /google-chrome-stable$/, weight: 50 },
    { regex: /google-chrome$/, weight: 49 },
    { regex: /chromium-browser$/, weight: 48 },
    { regex: /chromium$/, weight: 47 },
  ];

  if (process.env.CHROME_PATH)
    priorities.unshift({
      regex: new RegExp(`${process.env.CHROME_PATH}`),
      weight: 101,
    });

  return sort(uniq(installations.filter(Boolean)), priorities);
}

const win32 = () => {
  const installations = [];
  const suffixes = [
    `${path.sep}Google${path.sep}Chrome SxS${path.sep}Application${path.sep}chrome.exe`,
    `${path.sep}Google${path.sep}Chrome${path.sep}Application${path.sep}chrome.exe`,
  ];
  const prefixes = [
    process.env.LOCALAPPDATA,
    process.env.PROGRAMFILES,
    process.env['PROGRAMFILES(X86)'],
  ].filter(Boolean);

  const customChromePath = resolveChromePath();
  if (customChromePath) installations.push(customChromePath);

  prefixes.forEach(prefix =>
    suffixes.forEach(suffix => {
      const chromePath = path.join(`${prefix}`, suffix);
      if (canAccess(chromePath)) installations.push(chromePath);
    })
  );

  return installations;
};

const sort = (installations: string[], priorities: any[]) => {
  const defaultPriority = 10;
  return (
    installations
      // assign priorities
      .map(inst => {
        for (const pair of priorities) {
          if (pair.regex.test(inst)) return { path: inst, weight: pair.weight };
        }
        return { path: inst, weight: defaultPriority };
      })
      // sort based on priorities
      .sort((a, b) => b.weight - a.weight)
      // remove priority flag
      .map(pair => pair.path)
  );
};

const uniq = (arr: string[]) => {
  return Array.from(new Set(arr));
};

const resolveChromePath = () => {
  if (canAccess(`${process.env.CHROME_PATH}`)) return process.env.CHROME_PATH;
  return '';
};

const canAccess = (file: any) => {
  if (!file) return false;

  try {
    fs.accessSync(file);
    return true;
  } catch (e) {
    return false;
  }
};

const findChromeExecutables = (folder: string) => {
  const argumentsRegex = /(^[^ ]+).*/; // Take everything up to the first space
  const chromeExecRegex = '^Exec=/.*/(google-chrome|chrome|chromium)-.*';

  const installations: string[] = [];
  if (canAccess(folder)) {
    // Output of the grep & print looks like:
    //    /opt/google/chrome/google-chrome --profile-directory
    //    /home/user/Downloads/chrome-linux/chrome-wrapper %U
    let execPaths;

    // Some systems do not support grep -R so fallback to -r.
    // See https://github.com/GoogleChrome/chrome-launcher/issues/46 for more context.
    try {
      execPaths = execSync(
        `grep -ER "${chromeExecRegex}" ${folder} | awk -F '=' '{print $2}'`
      );
    } catch (e) {
      execPaths = execSync(
        `grep -Er "${chromeExecRegex}" ${folder} | awk -F '=' '{print $2}'`
      );
    }

    execPaths = execPaths
      .toString()
      .split(newLineRegex)
      .map(execPath => execPath.replace(argumentsRegex, '$1'));

    execPaths.forEach(
      execPath => canAccess(execPath) && installations.push(execPath)
    );
  }

  return installations;
};

export const findchrome = () => {
  if (process.platform === 'linux') return linux();
  if (process.platform === 'win32') return win32();
  return [];
};
