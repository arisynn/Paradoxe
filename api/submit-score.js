
import { Redis } from '@upstash/redis'

// Pastikan untuk mendaftarkan variabel environment ini di dashboard Vercel milikmu!
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { playerId, name, level, steps, stars, hintsUsed, pin } = req.body;

    // Validasi payload dasar
    if (!playerId || !name || !pin) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const userKey = `player:${playerId}`;
    
    try {
        const existingUser = await redis.hgetall(userKey);

        // Jika user sudah ada tapi PIN yang dikirim salah
        if (existingUser && existingUser.pin && existingUser.pin !== String(pin)) {
            return res.status(401).json({ error: 'PIN salah / Nama sudah dipakai orang lain.' });
        }

        // Anti-Cheat Ringan: Tolak kalau loncat level berlebihan dibanding rekam jejaknya
        if (existingUser && existingUser.level) {
            const oldLevel = Number(existingUser.level);
            if (Number(level) > oldLevel + 2) {
                return res.status(400).json({ error: 'Aktivitas mencurigakan (Level lompat tak wajar)' });
            }
        }

        // Membangun Komposit Score untuk sistem ranking ZADD
        // Urutan: Level (Terbesar) -> Bintang (Terbesar) -> Steps (Terkecil) -> Hints (Terkecil)
        const MAX_STEPS = 100000;
        const MAX_HINTS = 10000;
        
        // Membalik step dan hint agar nilai yang lebih kecil menghasilkan score yang lebih besar
        const safeSteps = Math.max(0, MAX_STEPS - Number(steps));
        const safeHints = Math.max(0, MAX_HINTS - Number(hintsUsed));
        
        // Score = (Level * 100juta) + (Stars * 100ribu) + (InverseSteps * 100) + InverseHints
        const score = (Number(level) * 100000000) 
                    + (Number(stars) * 100000) 
                    + (safeSteps * 100) 
                    + safeHints;

        // Simpan detail player ke Hash Table
        await redis.hset(userKey, {
            id: playerId,
            name: String(name).substring(0, 15),
            pin: String(pin), // Tidak dienkripsi penuh karena hanya recovery id ringan
            level: Number(level),
            totalStars: Number(stars),
            totalSteps: Number(steps),
            totalHints: Number(hintsUsed),
            updatedAt: Date.now()
        });

        // Masukkan / Update skor player di Sorted Set leaderboard
        await redis.zadd('leaderboard', { score, member: playerId });

        return res.status(200).json({ success: true });
        
    } catch (error) {
        console.error("Redis Error:", error);
        return res.status(500).json({ error: 'Terjadi kesalahan internal pada server' });
    }
}

