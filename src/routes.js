import { Router } from 'express';

import UserRouter  from "./routers/userRouter.js";
import AuthRouter from "./routers/authRouter.js";
import petRouter from "./routers/petRouter.js";
import reportRouter from "./routers/reportRouter.js";
import favoriteRouter from "./routers/favoriteRouter.js";

import InternalServerError from "./routers/helpers/500.js";
import NotFound from "./routers/helpers/404.js";

const routes = Router()
    routes.use('/api/login', AuthRouter);
    routes.use('/api/users', UserRouter);
    routes.use('/api/pets', petRouter);
    routes.use('/api/reports', reportRouter);
    routes.use('/api/favorites', favoriteRouter);
    
    
    routes.use(InternalServerError);
    routes.use(NotFound);
    

export default routes;