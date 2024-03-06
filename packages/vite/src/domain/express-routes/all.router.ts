import { commonContainer} from '@tezjs/common';
import * as express from 'express'
import * as path from 'path'
import { appContainer } from '../../const/container.const';
import { refreshData } from '../../functions/refresh-data';
import { HtmlPage } from '../html-page';


export class AllRouter{
    public path = '*';
    public router = express.Router();
    public htmlCache:string = undefined;
    public routes:Array<{name:string,path:string,fPath:string}>;
    constructor(private vite:any){
      this.initializeRoutes();
      this.routes = commonContainer.getAppRoutes();
    }

    initializeRoutes(){
      this.router.get(this.path,this.get);
    }

    get = async (request:express.Request,response:express.Response)=>{
        try {
          if(request.originalUrl && request.originalUrl.indexOf("tez/deps") === -1){
            let htmlCache = undefined;
            // await refreshData(request.url)
            const route=this.routes.filter(route=>route.path === request.url)[0] || {"name":"","path":"/","fPath":`${path.sep}index`}
              await appContainer.addOrUpdateTezTS(route);
              ++appContainer.versionId;
              var htmlPage = new HtmlPage(route)
              htmlCache = htmlPage.createPage();
              response.status(200).set({ 'Content-Type': 'text/html' }).end(htmlCache)
          }else
            response.status(404).end();    
        } catch (e) {
          this.vite && this.vite.ssrFixStacktrace(e)
          console.log(e.stack)
          response.status(500).end(e.stack)
        }
    }
}
export default AllRouter;