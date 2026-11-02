import fs from 'node:fs';
import path from 'node:path';

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
