import {producto_controlador} from '../controller/producto.js'
import { Router } from 'express'

const productoRouter = Router();
productoRouter.get('/getToBarCode/:barCode',producto_controlador.getProductoBarCode);
productoRouter.get('/all',producto_controlador.getAll)
export default productoRouter;