const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const pool = require('./config/db');
const fs = require('fs');

const seed = async () => {
  try {
    // Run schema first
    const schemaPath = path.join(__dirname, 'config', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schema);
    console.log('✅ Schema applied');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO users (name, email, password, role, phone)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING`,
      ['Admin', 'admin@hospital.com', adminPassword, 'admin', '01700000000']
    );
    console.log('✅ Admin user created (admin@hospital.com / admin123)');

    // Create categories
    const categories = [
      ['Cardiology', 'Heart and cardiovascular system specialists', '❤️'],
      ['Neurology', 'Brain and nervous system specialists', '🧠'],
      ['Orthopedics', 'Bone and joint specialists', '🦴'],
      ['Dermatology', 'Skin care specialists', '🧴'],
      ['Pediatrics', 'Child health specialists', '👶'],
      ['Ophthalmology', 'Eye care specialists', '👁️'],
      ['ENT', 'Ear, Nose, and Throat specialists', '👂'],
      ['General Medicine', 'General practitioners for common diseases', '🩺'],
      ['Gynecology', 'Women health specialists', '🏥'],
      ['Dentistry', 'Dental and oral health specialists', '🦷'],
    ];

    for (const [name, desc, icon] of categories) {
      await pool.query(
        'INSERT INTO categories (name, description, icon) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
        [name, desc, icon]
      );
    }
    console.log('✅ Categories created');

    // Create sample doctors
    const doctors = [
      {
        name: 'Dr. Sarah Ahmed', email: 'sarah@hospital.com', phone: '01712345001',
        category: 'Cardiology', specialty: 'Interventional Cardiology',
        bio: 'Dr. Sarah Ahmed is a leading cardiologist with 15 years of experience in treating complex heart conditions.',
        qualification: 'MBBS, MD (Cardiology), FACC', experience: 15, avg_time: 15
      },
      {
        name: 'Dr. Kamal Hasan', email: 'kamal@hospital.com', phone: '01712345002',
        category: 'Neurology', specialty: 'Clinical Neurology',
        bio: 'Dr. Kamal Hasan specializes in neurological disorders including epilepsy and migraine management.',
        qualification: 'MBBS, MD (Neurology)', experience: 12, avg_time: 20
      },
      {
        name: 'Dr. Fatima Rahman', email: 'fatima@hospital.com', phone: '01712345003',
        category: 'Orthopedics', specialty: 'Joint Replacement Surgery',
        bio: 'Dr. Fatima Rahman is an expert orthopedic surgeon specializing in hip and knee replacement.',
        qualification: 'MBBS, MS (Orthopedics)', experience: 10, avg_time: 12
      },
      {
        name: 'Dr. Arif Khan', email: 'arif@hospital.com', phone: '01712345004',
        category: 'Dermatology', specialty: 'Cosmetic Dermatology',
        bio: 'Dr. Arif Khan provides comprehensive skincare solutions and cosmetic dermatology services.',
        qualification: 'MBBS, DDV', experience: 8, avg_time: 10
      },
      {
        name: 'Dr. Nusrat Jahan', email: 'nusrat@hospital.com', phone: '01712345005',
        category: 'Pediatrics', specialty: 'Neonatal Care',
        bio: 'Dr. Nusrat Jahan is a compassionate pediatrician experienced in neonatal and child healthcare.',
        qualification: 'MBBS, DCH, MD (Pediatrics)', experience: 14, avg_time: 15
      },
      {
        name: 'Dr. Rafiq Islam', email: 'rafiq@hospital.com', phone: '01712345006',
        category: 'General Medicine', specialty: 'Internal Medicine',
        bio: 'Dr. Rafiq Islam is a general medicine specialist treating a wide range of common diseases.',
        qualification: 'MBBS, FCPS (Medicine)', experience: 20, avg_time: 10
      },
    ];

    const docPassword = await bcrypt.hash('doctor123', 10);

    for (const doc of doctors) {
      // Create user
      const userResult = await pool.query(
        `INSERT INTO users (name, email, password, role, phone)
         VALUES ($1, $2, $3, 'doctor', $4)
         ON CONFLICT (email) DO UPDATE SET name = $1 RETURNING id`,
        [doc.name, doc.email, docPassword, doc.phone]
      );

      // Get category id
      const catResult = await pool.query('SELECT id FROM categories WHERE name = $1', [doc.category]);

      // Create doctor profile
      await pool.query(
        `INSERT INTO doctors (user_id, category_id, specialty, bio, qualification, experience_years, avg_consult_time)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [userResult.rows[0].id, catResult.rows[0].id, doc.specialty, doc.bio, doc.qualification, doc.experience, doc.avg_time]
      );
    }
    console.log('✅ Sample doctors created (password: doctor123)');

    // Create sample patient
    const patientPassword = await bcrypt.hash('patient123', 10);
    await pool.query(
      `INSERT INTO users (name, email, password, role, phone)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING`,
      ['John Patient', 'patient@hospital.com', patientPassword, 'patient', '01700000001']
    );
    console.log('✅ Sample patient created (patient@hospital.com / patient123)');

    console.log('\n🎉 Seed completed! You can now login with:');
    console.log('   Admin:   admin@hospital.com   / admin123');
    console.log('   Doctor:  sarah@hospital.com   / doctor123');
    console.log('   Patient: patient@hospital.com / patient123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seed();
