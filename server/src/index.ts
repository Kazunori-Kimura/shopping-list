import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import router from './routes';

dotenv.config();
const app = express();

let port = parseInt(process.env.PORT ?? '8080', 10);
if (isNaN(port)) {
    port = 5000;
}

// ログ設定
app.use(morgan('dev'));
app.use(cors({ origin: ['http://localhost:3000', 'https://shoppinglistdevelopment.z11.web.core.windows.net'] }));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true }));

// ルーティング
app.use('/thing', router);

app.listen(port, () => {
    console.log(`server listening on port ${port}`);
});
