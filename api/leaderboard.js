
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    if (!supabase) {
        return res.status(500).json({ error: 'Supabase belum dikonfigurasi.' });
    }

    try {
        const { data, error } = await supabase
            .from('players')
            .select('player_uid, username, level, total_stars, total_steps, total_hints')
            .order('level', { ascending: false })
            .order('total_stars', { ascending: false })
            .order('total_steps', { ascending: true })
            .order('total_hints', { ascending: true })
            .limit(10);

        if (error) throw error;

        const leaderboard = (data || []).map((p) => ({
            id: p.player_uid,
            name: p.username,
            level: Number(p.level || 1),
            totalStars: Number(p.total_stars || 0),
            totalSteps: Number(p.total_steps || 0),
            totalHints: Number(p.total_hints || 0)
        }));

        // Cache singkat agar refresh leaderboard tidak memukul database terus-menerus.
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
        return res.status(200).json(leaderboard);
        
    } catch (error) {
        console.error("Supabase leaderboard error:", error);
        return res.status(500).json({ error: 'Gagal mengambil data klasemen' });
    }
}
