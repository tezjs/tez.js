import { commonContainer } from "@tezjs/common";
import { PayloadGenratorConfig } from "@tezjs/types";
import { BaseGenerator } from "./base-generator";
import { GlobWriter } from "./glob-writer";
import { PageRoute } from "./page-route";
import { RedirectRoute } from "./redirect-routes";
import { Sitemap } from "./sitemap";

export class PayloadModuleRunner  extends BaseGenerator {
    constructor(redirectRoute:RedirectRoute,sitemap:Sitemap,pageRoute:PageRoute,globWriter:GlobWriter){
        super(redirectRoute,sitemap,globWriter,pageRoute)
    }
   async runPayload(config:PayloadGenratorConfig,extendPages:any){
        const modules = commonContainer.tezConfig.modules;
        if(modules && Array.isArray(modules)){
            for(const tezModule of modules){
                if(tezModule.payload){
                    const payloadRoutes = await tezModule.payload(config);
                    if(payloadRoutes){
                        for (const [routePath, payload] of Object.entries(payloadRoutes)) {
                            let url = routePath.replace(/:/g,"_");
                            const extendPage = extendPages && extendPages[url] ? extendPages[url]:{};
                                this.generateRoute({...payload,...{url:url},...extendPage})
                                this.pageRoute.addDynamicRoute(routePath,url)
                        }
                    } 
                }
            }
        }
    }
}