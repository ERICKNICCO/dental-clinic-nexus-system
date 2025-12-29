require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function resetPassword() {
    const email = 'catherine@elitedentalclinic.co.tz';
    const newPassword = 'password123'; // Default password for testing

    try {
        console.log('🔐 Resetting password for:', email);

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the password
        const result = await pool.query(
            'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email, full_name, role',
            [hashedPassword, email]
        );

        if (result.rows.length > 0) {
            console.log('✅ Password reset successful!');
            console.log('📋 User details:');
            console.log(JSON.stringify(result.rows[0], null, 2));
            console.log('\n🔑 New credentials:');
            console.log(`   Email: ${email}`);
            console.log(`   Password: ${newPassword}`);
        } else {
            console.log('❌ User not found');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

resetPassword();
