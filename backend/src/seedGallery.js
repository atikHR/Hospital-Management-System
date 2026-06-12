const pool = require('./config/db');

const seedGallery = async () => {
  try {
    // Seed hospital hero images
    const hospitalImages = [
      { title: 'Our Modern Campus', description: 'State-of-the-art medical facility with world-class infrastructure', image_url: '/uploads/hospital-images/hospital-1.png', display_order: 1 },
      { title: 'Welcome to MediCare', description: 'A warm and inviting environment designed for patient comfort', image_url: '/uploads/hospital-images/hospital-2.png', display_order: 2 },
      { title: 'Excellence in Healthcare', description: 'Comprehensive medical campus serving the community with dedication', image_url: '/uploads/hospital-images/hospital-3.png', display_order: 3 },
    ];

    for (const img of hospitalImages) {
      const exists = await pool.query('SELECT id FROM hospital_images WHERE image_url = $1', [img.image_url]);
      if (exists.rows.length === 0) {
        await pool.query(
          'INSERT INTO hospital_images (title, description, image_url, display_order) VALUES ($1, $2, $3, $4)',
          [img.title, img.description, img.image_url, img.display_order]
        );
        console.log(`  ✅ Added hospital image: ${img.title}`);
      } else {
        console.log(`  ⏭️  Hospital image already exists: ${img.title}`);
      }
    }

    // Seed facility images
    const facilityImages = [
      { title: 'Emergency Department', description: '24/7 emergency services with rapid response trauma care and modern life-saving equipment', image_url: '/uploads/facility-images/emergency.png', display_order: 1 },
      { title: 'Operation Theater', description: 'Advanced surgical suites equipped with robotic surgery systems and precision instruments', image_url: '/uploads/facility-images/operation.png', display_order: 2 },
      { title: 'Diagnostic Laboratory', description: 'Cutting-edge diagnostics with automated analyzers delivering accurate results fast', image_url: '/uploads/facility-images/lab.png', display_order: 3 },
      { title: 'Pharmacy', description: 'Full-service pharmacy with digital prescriptions and experienced pharmacists', image_url: '/uploads/facility-images/pharmacy.png', display_order: 4 },
      { title: 'Intensive Care Unit', description: 'Advanced ICU with continuous monitoring, ventilators, and round-the-clock critical care', image_url: '/uploads/facility-images/icu.png', display_order: 5 },
      { title: 'Radiology & Imaging', description: 'High-resolution MRI, CT scan, and X-ray facilities with expert radiologists', image_url: '/uploads/facility-images/radiology.png', display_order: 6 },
    ];

    for (const img of facilityImages) {
      const exists = await pool.query('SELECT id FROM facility_images WHERE image_url = $1', [img.image_url]);
      if (exists.rows.length === 0) {
        await pool.query(
          'INSERT INTO facility_images (title, description, image_url, display_order) VALUES ($1, $2, $3, $4)',
          [img.title, img.description, img.image_url, img.display_order]
        );
        console.log(`  ✅ Added facility image: ${img.title}`);
      } else {
        console.log(`  ⏭️  Facility image already exists: ${img.title}`);
      }
    }

    console.log('\n🎉 Gallery seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedGallery();
