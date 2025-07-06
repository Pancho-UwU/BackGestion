import express  from "express";
import productoRouter from "./routes/producto.js";
import barCodeRouter from "./routes/barCode.js";
import proveedorRouter from "./routes/proveedor.js";
import {corsMiddleware} from "../src/middleware/cors.js"
const app = express();

const PORT  = 3000;

app.use(corsMiddleware());
app.options(/.*/,corsMiddleware())
app.use(express.json());
app.use('/producto', productoRouter);
app.use('/barCode',barCodeRouter)
app.use('/proveedor',proveedorRouter)

app.listen(PORT,()=>{
    console.log(`Escuchando en el puerto 3000 htpp://localhost:${PORT}`);
})
