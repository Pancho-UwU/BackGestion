import {producto_controlador} from '../controller/producto.js'
import { Router } from 'express'

const productoRouter = Router();
productoRouter.get('/getToBarCode/:barCode',producto_controlador.getProductoBarCode);
productoRouter.get('/all',producto_controlador.getAll);
productoRouter.post('/create', producto_controlador.createProduct);
productoRouter.patch('/actualizar',producto_controlador.actualizarProducto)
productoRouter.patch('/eliminar/:productoId', producto_controlador.deleteProduct)
export default productoRouter;