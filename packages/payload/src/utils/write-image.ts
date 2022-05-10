import * as fs from 'fs';
import axios from 'axios';
import * as sharp from 'sharp';
import {CommonPathResolver, commonContainer } from "@tezjs/common";
import { defaultContainer } from '../const/core.const';
const pathResolver = new CommonPathResolver();
export async function writeImage(imagePath:string){
    return new Promise(async (resolve, reject) => {
            try {
                let filePath = `${pathResolver.imageFolderPath}${imagePath}`;
                
                if(!pathResolver.pathExists(filePath)){
                    let fileExtension = filePath.split('.').pop();
                    const response = await getImage(imagePath)
                    const writer = fs.createWriteStream(filePath);
                    writer.on("error", (err) => {
                        console.log("downloadFileFn writer error called → ", err);
                        error = err;
                        writer.close();
                        resolve(true);
                    });
                    writer.on("close", () => {
                        if (!error) {
                            if(commonContainer.tezConfig.image?.enableWebPConversion){
                                sharp(filePath).webp().toBuffer().then(t=>{
                                    sharp(t).toFile(filePath.replace(`.${fileExtension}`,'.webp'));
                                    resolve(true);
                                })
                            }else
                                resolve(true);
                            
                        }
                    });
                    response.data.pipe(writer);
                    let error = null;
                }else{
                    resolve(true)
                }
            } catch (err) {
                console.log(err)
                reject(err);
            }
    });
}

async function getImage(imageUrl:string){
    return await axios({
        method: "get",
        url: `${defaultContainer.moduleOptions.apiUri}${imageUrl}`,
        responseType: "stream",
    });
}