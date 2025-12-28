import bcrypt from 'bcrypt';
import { query } from '../db/index.js';

/**
 * Migration script to create dreamspawn user and assign all existing data
 */
async function migrateToDreamspawn() {
    try {
        console.log('\n🔄 Starting migration to dreamspawn user...\n');

        // 1. Create dreamspawn user
        const username = 'dreamspawn';
        const password = '123456';
        const passwordHash = await bcrypt.hash(password, 10);

        console.log('👤 Creating dreamspawn user...');
        const userResult = await query(
            `INSERT INTO users (username, password_hash, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (username) DO UPDATE SET password_hash = $2
       RETURNING id, username`,
            [username, passwordHash]
        );

        const userId = userResult.rows[0].id;
        console.log(`✅ User created: ${userResult.rows[0].username} (ID: ${userId})\n`);

        // 2. Update all existing records to belong to dreamspawn
        console.log('📦 Migrating existing data...');

        const clothingResult = await query(
            'UPDATE clothing_items SET user_id = $1 WHERE user_id IS NULL RETURNING id',
            [userId]
        );
        console.log(`   ✓ Clothing items: ${clothingResult.rowCount} migrated`);

        const modelsResult = await query(
            'UPDATE model_images SET user_id = $1 WHERE user_id IS NULL RETURNING id',
            [userId]
        );
        console.log(`   ✓ Model images: ${modelsResult.rowCount} migrated`);

        const outfitsResult = await query(
            'UPDATE saved_outfits SET user_id = $1 WHERE user_id IS NULL RETURNING id',
            [userId]
        );
        console.log(`   ✓ Saved outfits: ${outfitsResult.rowCount} migrated`);

        const prefsResult = await query(
            'UPDATE user_preferences SET user_id = $1 WHERE user_id IS NULL RETURNING id',
            [userId]
        );
        console.log(`   ✓ User preferences: ${prefsResult.rowCount} migrated`);

        // 3. Verify migration
        console.log('\n🔍 Verifying migration...');
        const verification = await query(
            `SELECT 
        (SELECT COUNT(*) FROM clothing_items WHERE user_id = $1) as clothing_count,
        (SELECT COUNT(*) FROM model_images WHERE user_id = $1) as models_count,
        (SELECT COUNT(*) FROM saved_outfits WHERE user_id = $1) as outfits_count,
        (SELECT COUNT(*) FROM user_preferences WHERE user_id = $1) as prefs_count`,
            [userId]
        );

        const stats = verification.rows[0];
        console.log(`   📊 Clothing items: ${stats.clothing_count}`);
        console.log(`   📊 Model images: ${stats.models_count}`);
        console.log(`   📊 Saved outfits: ${stats.outfits_count}`);
        console.log(`   📊 User preferences: ${stats.prefs_count}`);

        console.log('\n✅ Migration completed successfully!');
        console.log(`\n🔑 Login credentials:`);
        console.log(`   Username: ${username}`);
        console.log(`   Password: ${password}\n`);

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Run migration
migrateToDreamspawn();
