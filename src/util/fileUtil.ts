import fs from 'node:fs';
import path from 'node:path';

export const humanFileSize = (size: number, decimals = 1): string => {
  if (size === 0) {
    return '0 B';
  }
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const bucketIndex = Math.floor(Math.log(size) / Math.log(1024));
  const formattedSize = parseFloat((size / (1024 ** bucketIndex)).toFixed(decimals < 0 ? 0 : decimals));
  return `${formattedSize} ${sizes[bucketIndex]}`;
};

export const copyFileSync = (sourceFilePath: string, targetPath: string): void => {
  let targetFilePath = targetPath;
  if (fs.existsSync(targetPath) && fs.lstatSync(targetPath).isDirectory()) {
    targetFilePath = path.join(targetPath, path.basename(sourceFilePath));
  }
  const targetDirectory = path.dirname(targetFilePath);
  if (!fs.existsSync(targetDirectory)) {
    fs.mkdirSync(targetDirectory, { recursive: true });
  }
  fs.writeFileSync(targetFilePath, fs.readFileSync(sourceFilePath));
};

export const copyDirectorySync = (sourceDirectory: string, targetDirectory: string): void => {
  if (!fs.lstatSync(sourceDirectory).isDirectory()) {
    throw new Error(`copyDirectorySync must be called with a directory. source ${sourceDirectory} is not a directory`);
  }
  if (!fs.existsSync(targetDirectory)) {
    fs.mkdirSync(targetDirectory, { recursive: true });
  } else if (!fs.lstatSync(sourceDirectory).isDirectory()) {
    throw new Error(`copyDirectorySync must be called with a directory. target ${targetDirectory} is not a directory`);
  }
  fs.readdirSync(sourceDirectory).forEach((filename: string): void => {
    const sourceFilePath = path.join(sourceDirectory, filename);
    const targetFilePath = path.join(targetDirectory, filename);
    if (fs.lstatSync(sourceFilePath).isDirectory()) {
      copyDirectorySync(sourceFilePath, targetFilePath);
    } else {
      copyFileSync(sourceFilePath, targetFilePath);
    }
  });
};
