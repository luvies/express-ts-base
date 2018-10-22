import { Response, Router } from 'express';
import statuses from 'statuses';

export abstract class Controller {
  public router(): Router {
    const router = Router({
      mergeParams: true,
    });

    // link routes from implementing class
    this.linkRoutes(router);

    return router;
  }

  protected abstract linkRoutes(router: Router): void;

  protected errorJsonResp(res: Response, status: number, { error, msg }: { error?: string, msg?: string } = {}): void {
    if (!error) {
      error = statuses[status];
    }

    res.status(status).json({
      status,
      error,
      msg,
    });
  }
}
