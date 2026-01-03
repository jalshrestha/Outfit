import pg from 'pg';
const { Pool } = pg;

// Database connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://outfit_user:outfit_password@localhost:5433/outfit_db',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.on('connect', () => {
    console.log('📦 Database connected');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
});

// Query helper with error handling
export async function query(text, params) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('📊 Query executed:', { text: text.substring(0, 50) + '...', duration: `${duration}ms`, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('❌ Query error:', error.message);
        throw error;
    }
}

// Get a client from the pool (for transactions)
export async function getClient() {
    const client = await pool.connect();
    return client;
}

// Health check
export async function healthCheck() {
    try {
        const res = await pool.query('SELECT NOW()');
        return { status: 'healthy', timestamp: res.rows[0].now };
    } catch (error) {
        return { status: 'unhealthy', error: error.message };
    }
}

// Initialize database with migrations
export async function initDatabase() {
    try {
        // Create planned_outfits table for calendar feature
        await pool.query(`
            CREATE TABLE IF NOT EXISTS planned_outfits (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                date DATE NOT NULL,
                outfit_id VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, date)
            )
        `);

        // Add is_favorite column to clothing_items
        await pool.query(`
            ALTER TABLE clothing_items ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE
        `);

        console.log('✅ Database migrations applied');
    } catch (error) {
        console.error('❌ Migration error:', error.message);
    }
}

// Run migrations on module load
initDatabase();

export default pool;

