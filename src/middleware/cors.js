import cors from 'cors'
export const corsMiddleware= ()=>cors({
    origin:(origin,callback)=>{
        const ACCEPTED_ORIGINS = [
            'http://localhost:8080',
            'http://localhost:3000',
            'http://localhost:4200',
            'http://localhost:5173'
        ]
        if(ACCEPTED_ORIGINS.includes(origin)){
            return callback(null,origin)
        }
        if(!origin)
            {
                return callback(null,true)
            }
        return callback(new Error('Not allowed by CORS'))
    },
    credentials:true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS','PATCH'],
    allowedHeaders: ['Content-Type','Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token']

})