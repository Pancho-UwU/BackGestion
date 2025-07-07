import {producto_controlador} from '../controller/producto.js'
import { Router } from 'express'

const productoRouter = Router();
productoRouter.get('/getToBarCode/:barCodeId',producto_controlador.getProductoBarCode);
productoRouter.get('/all',producto_controlador.getAll);
productoRouter.post('/create', producto_controlador.createProduct);
productoRouter.patch('/actualizar',producto_controlador.actualizarProducto)
productoRouter.patch('/eliminar/:productoId', producto_controlador.deleteProduct)
productoRouter.get('/Filter',producto_controlador.getProductByName)
export default productoRouter;