/*
Release format example
current version - 0.0.3

----------------------------------
Output
----------------------------------
beta        ---     0.0.4-beta.0
major       ---     1.0.0
minor       ---     0.1.0
stable      ---     0.0.11
preminor    ---     0.1.0-beta.0
premjor     ---     1.0.0-beta.0
-----------------------------------
*/

import prompts from 'prompts';
import  path from 'path'
import  semver from 'semver'
import  fs from 'fs'
import {globby} from 'globby';
import { execa } from 'execa';

const packages = ["cli","common","create-tez","payload","types","vite","vue","js"];
const rootDir = process.cwd();
const packagesFolderName = 'packages';
function getPackageInfo(packageName){
    const packageDirectory = path.resolve(rootDir,packagesFolderName,packageName);
    const packagePath = path.resolve(packageDirectory,'package.json');
    const packageJson = require(packagePath);
    return {packageJson,packagePath,packageDirectory}; 
}

function getVersion(currentVersion,releaseType){
    return semver.inc(currentVersion,releaseType);
}

async function getReleaseType(){
    const {releaseType} = await prompts({
        type: 'select',
        name: 'releaseType',
        message: 'Select release type',
        choices: [
            { title: 'Beta', value: 'beta' },
            { title: 'PreMinor', value: 'preminor' },
            { title: 'Minor', value: 'minor' },
            { title: 'PreMajor', value: 'premajor' },
            { title: 'Major', value: 'major' },
            { title: 'Stable', value: 'patch' }
          ]
      })
      return releaseType;
}

async function updateDependencies(packageState){
    const packageNames = Object.keys(packageState);
    for(const packageName of packageNames){
        const {packageJson,packagePath,packageDirectory}  = packageState[packageName];
        for(const dependencyPackageName of packageNames){
            if(packageJson.dependencies[dependencyPackageName])
                packageJson.dependencies[dependencyPackageName] = packageState[dependencyPackageName].packageJson.version
            if(packageJson.devDependencies && packageJson.devDependencies[dependencyPackageName])
                packageJson.devDependencies[dependencyPackageName] = packageState[dependencyPackageName].packageJson.version
        }
        fs.writeFileSync(packagePath,JSON.stringify(packageJson, null, 2) + '\n')

    }
}

async function publishPackage( bin,
    args,
    opts = {},isRelease){
        if(isRelease)
            await execa(bin,args,opts)
        else
            console.log(bin,args,opts)

    
}

async function updateTemplateDependenciesPackage(packageState){
    const filePaths = await globby('packages/create-tez', {
		expandDirectories: {
			files: ['package.json']
		},
        gitignore:true
	});
    const packageNames = Object.keys(packageState);
    for(const packageJsonPath of filePaths){
        const templatePackageJson = require(`${rootDir}/${packageJsonPath}`);
            for(const dependencyPackageName of packageNames){
                if(templatePackageJson.dependencies && templatePackageJson.dependencies[dependencyPackageName])
                    templatePackageJson.dependencies[dependencyPackageName] = packageState[dependencyPackageName].packageJson.version
                if(templatePackageJson.devDependencies && templatePackageJson.devDependencies[dependencyPackageName])
                    templatePackageJson.devDependencies[dependencyPackageName] = packageState[dependencyPackageName].packageJson.version
            }
            fs.writeFileSync(packageJsonPath,JSON.stringify(templatePackageJson, null, 2) + '\n')
}
}

async function publishPackages(packageDirectories,isRelease){
    for(const packageDirectory of packageDirectories){
        await publishPackage('npm',['publish'],{
            stdio: 'pipe',
            cwd: packageDirectory
          },isRelease)
    }
}

async function init(){
    
    const releaseType = await getReleaseType();    
    const packageState = {};
    let packageDirectories= new Array<string>();
    for(let packageName of packages){
        const {packageJson,packagePath,packageDirectory} = getPackageInfo(packageName);
        console.log(packageJson.version)
        packageJson.version = getVersion(packageJson.version,releaseType);
        console.log(packageJson.name,packageJson.version)
        packageState[packageJson.name] = {packageJson:packageJson,packagePath:packagePath,packageDirectory:packageDirectory};
        packageDirectories.push(packageDirectory)
    }
    await updateDependencies(packageState);
    await updateTemplateDependenciesPackage(packageState);
    await publishPackages(packageDirectories,process.argv.length === 2)
}

init()
