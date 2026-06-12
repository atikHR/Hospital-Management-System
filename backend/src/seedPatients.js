const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const pool = require('./config/db');

const seedPatients = async () => {
  try {
    const password = await bcrypt.hash('patient123', 10);

    const patients = [
      { name: 'Rahim Uddin', email: 'rahim@patient.com', phone: '01811000001' },
      { name: 'Karim Ahmed', email: 'karim@patient.com', phone: '01811000002' },
      { name: 'Jasmine Akter', email: 'jasmine@patient.com', phone: '01811000003' },
      { name: 'Sakib Hasan', email: 'sakib@patient.com', phone: '01811000004' },
      { name: 'Nadia Islam', email: 'nadia@patient.com', phone: '01811000005' },
      { name: 'Tanvir Rahman', email: 'tanvir@patient.com', phone: '01811000006' },
      { name: 'Farhana Begum', email: 'farhana@patient.com', phone: '01811000007' },
      { name: 'Imran Khan', email: 'imran@patient.com', phone: '01811000008' },
      { name: 'Sumaiya Khatun', email: 'sumaiya@patient.com', phone: '01811000009' },
      { name: 'Arman Hossain', email: 'arman@patient.com', phone: '01811000010' },
    ];

    const patientIds = [];
    for (const p of patients) {
      const res = await pool.query(
        `INSERT INTO users (name, email, password, role, phone)
         VALUES ($1, $2, $3, 'patient', $4)
         ON CONFLICT (email) DO UPDATE SET name = $1 RETURNING id`,
        [p.name, p.email, password, p.phone]
      );
      patientIds.push(res.rows[0].id);
      console.log(`✅ Patient: ${p.name} (${p.email})`);
    }

    const doctorRes = await pool.query('SELECT id FROM doctors WHERE is_active = true ORDER BY id LIMIT 1');
    const doctorId = doctorRes.rows[0].id;

    const notes = [
      'Chest pain and shortness of breath',
      'Regular checkup',
      'Heart palpitations',
      'High blood pressure follow-up',
      'Dizziness and fatigue',
      'Post-surgery checkup',
      'Irregular heartbeat',
      'Family history screening',
      'Exercise stress test',
      'Annual cardiac evaluation',
    ];

    await pool.query(
      `INSERT INTO queue_tracking (doctor_id, appointment_date, current_serial)
       VALUES ($1, CURRENT_DATE, 0) ON CONFLICT (doctor_id, appointment_date) DO NOTHING`,
      [doctorId]
    );

    for (let i = 0; i < patientIds.length; i++) {
      await pool.query(
        `INSERT INTO appointments (patient_id, doctor_id, appointment_date, serial_number, status, notes)
         VALUES ($1, $2, CURRENT_DATE, $3, 'waiting', $4)
         ON CONFLICT (doctor_id, appointment_date, serial_number) DO NOTHING`,
        [patientIds[i], doctorId, i + 1, notes[i]]
      );
      console.log(`📋 Appointment #${i + 1}: ${patients[i].name}`);
    }

    console.log('\n🎉 10 patients with today\'s appointments seeded!');
    console.log('   All passwords: patient123');
    console.log('   Doctor login: sarah@hospital.com / doctor123');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

seedPatients();
