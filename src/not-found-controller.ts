import { Request, Response, Router } from 'express';
import { Controller } from './controller';

export class NotFoundController extends Controller {
  protected linkRoutes(router: Router): void {
    router.use(this.catchAll);
  }

  private catchAll = (req: Request, res: Response) => {
    this.errorJsonResp(res, 404);
  }
}
