import express  from "express";
import db from './db/db.js'
const app = express();
const PORT  = 3000;
const router = express.Router();

app.use(express.json())

app.use('/api/',router);
router.get('/',async(req,res)=>{
    try{
        const products = await db('barCode').select()
        console.log(products)
        res.json(products)
    }catch(error)
    {
        res.status(500).json({message:"Error en el servidor " + error.message})
    }
})


app.listen(PORT,()=>{
    console.log(`Escuchando en el puerto 3000 htpp://localhost:${PORT}`);
})
