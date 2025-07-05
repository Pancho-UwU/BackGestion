import express  from "express";
import productoRouter from "./routes/producto.js";
const app = express();

const PORT  = 3000;

app.use(express.json())
app.use('/producto', productoRouter);


app.listen(PORT,()=>{
    console.log(`Escuchando en el puerto 3000 htpp://localhost:${PORT}`);
})
