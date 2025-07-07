import { proveedor_controller } from "../controller/proveedor.js";
import {Router} from 'express';

const proveedorRouter = Router();

proveedorRouter.get('/all',proveedor_controller.getAll)
proveedorRouter.get('/filter',proveedor_controller.getFilter)

export default proveedorRouter;