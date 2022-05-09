import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import router from './routes';
dotenv.config();

const app = express();

let port = parseInt(process.env.PORT ?? '5000', 10);
if (isNaN(port)) {
    port = 5000;
}

// ログ設定
app.use(morgan('dev'));
// サイズ上限の引き上げ
app.use(express.json({ limit: '100mb' }));

// ルーティング
app.use('/thing', router);

app.listen(port, () => {
    console.log(`server listening on port ${port}`);
});
