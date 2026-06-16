
import { Redis } from '@upstash/redis'

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Ambil top 10 playerId dari Sorted Set yang memiliki skor tertinggi
        const topIds = await redis.zrevrange('leaderboard', 0, 9);

        if (!topIds || topIds.length === 0) {
            return res.status(200).json([]);
        }

        // Jalankan pipeline request untuk mengambil detail dari seluruh top player sekaligus
        const pipeline = redis.pipeline();
        topIds.forEach(id => {
            pipeline.hgetall(`player:${id}`);
        });
        
        const playersData = await pipeline.exec();

        // Format data dan pastikan tidak ada PIN/data rahasia yang ter-expose ke public
        const leaderboard = playersData.map((p) => ({
            id: p.id,
            name: p.name,
            level: Number(p.level),
            totalStars: Number(p.totalStars),
            totalSteps: Number(p.totalSteps),
            totalHints: Number(p.totalHints)
        }));

        // Set Cache-Control header supaya Vercel Edge Network men-cache response selama 60 detik,
        // mencegah spam request membebani Upstash.
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
        return res.status(200).json(leaderboard);
        
    } catch (error) {
        console.error("Redis Error:", error);
        return res.status(500).json({ error: 'Gagal mengambil data klasemen' });
    }
}
