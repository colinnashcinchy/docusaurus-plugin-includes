import * as fse from "fs-extra";
const { join } = require('path');

export async function postBuildDeleteFolders(foldersToDelete) {
  const pluginLogPrefix = '[includes] ';
  console.log(`${pluginLogPrefix}Execute postBuildDeleteFolders...`);

  const CWD = process.cwd();
  const docusaurusBuildDir = join(CWD, "build");

  // Check if Docusaurus build directory exists
  if (!fse.existsSync(docusaurusBuildDir) ||
      !fse.existsSync(join(docusaurusBuildDir, "index.html")) ||
      !fse.existsSync(join(docusaurusBuildDir, "404.html"))) {
    throw new Error(`${pluginLogPrefix}Could not find a valid Docusaurus build directory at "${docusaurusBuildDir}".`);
  }

  // Read versions.json and prepare version infos
  let versions;
  try {
    versions = require(`${CWD}/versions.json`);
  } catch (e) {
    console.log(`${pluginLogPrefix}No versions.js file found. Continue without versions.`);
    versions = [];
  }

  let versionInfos = versions.length === 0 ? [{ version: 'next', urlAddIn: '' }] : [{ version: 'next', urlAddIn: 'next' }];
  versionInfos.push(...versions.map((version, index) => ({
    version,
    urlAddIn: index === 0 ? '' : version
  })));

  const pathsToDelete = [];
  for (const deleteFolder of foldersToDelete) {
    for (const versionInfo of versionInfos) {
      const folderPath = join(docusaurusBuildDir, 'docs', versionInfo.urlAddIn, deleteFolder);
      if (fse.existsSync(folderPath)) {
        pathsToDelete.push(folderPath);
      }
    }
  }

  // Log calculated paths for verification
  console.log(`${pluginLogPrefix}Paths to delete:`, pathsToDelete);

  if (pathsToDelete.length === 0) {
    console.log(`${pluginLogPrefix}No folders to delete.`);
    return;
  }

  try {
    // Using Promise.all for concurrent deletion
    await Promise.all(pathsToDelete.map(async (path) => {
      console.log(`${pluginLogPrefix}Deleting folder ${path}`);
      await fse.remove(path);
    }));

    console.log(`${pluginLogPrefix}postBuildDeleteFolders finished!`);
  } catch (error) {
    console.error(`${pluginLogPrefix}Error during folder deletion: ${error}`);
    throw error; // Rethrow to handle the error outside if needed
  }
}
