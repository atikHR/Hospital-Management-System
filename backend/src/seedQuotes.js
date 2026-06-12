const pool = require('./config/db');

const seedQuotes = async () => {
  try {
    // Check if quotes already exist
    const existing = await pool.query('SELECT COUNT(*) FROM health_quotes');
    if (parseInt(existing.rows[0].count) > 0) {
      console.log('Health quotes already seeded, skipping...');
      return;
    }

    const quotes = [
      {
        quote_text: 'Make use of five before five: your youth before your old age, your health before your sickness, your wealth before your poverty, your free time before your busyness, and your life before your death.',
        author: 'Prophet Muhammad (ﷺ)',
        source: 'Sahih al-Bukhari',
        category: 'hadith',
        display_order: 1,
      },
      {
        quote_text: 'The stomach is the home of disease, and abstinence is the head of every remedy.',
        author: 'Prophet Muhammad (ﷺ)',
        source: 'Al-Maqasid al-Hasanah',
        category: 'hadith',
        display_order: 2,
      },
      {
        quote_text: 'And when I am ill, it is He who cures me.',
        author: 'Quran',
        source: 'Surah Ash-Shu\'ara 26:80',
        category: 'hadith',
        display_order: 3,
      },
      {
        quote_text: 'There is no disease that Allah has created, except that He also has created its treatment.',
        author: 'Prophet Muhammad (ﷺ)',
        source: 'Sahih al-Bukhari 5678',
        category: 'hadith',
        display_order: 4,
      },
      {
        quote_text: 'The art of medicine consists of amusing the patient while nature cures the disease.',
        author: 'Voltaire',
        source: null,
        category: 'scholar',
        display_order: 5,
      },
      {
        quote_text: 'Prevention is better than cure.',
        author: 'Desiderius Erasmus',
        source: null,
        category: 'scholar',
        display_order: 6,
      },
      {
        quote_text: 'The greatest wealth is health.',
        author: 'Virgil',
        source: null,
        category: 'scholar',
        display_order: 7,
      },
      {
        quote_text: 'Medicine is not only a science; it is also an art. It does not consist of compounding pills and plasters; it deals with the very processes of life.',
        author: 'Paracelsus',
        source: null,
        category: 'scholar',
        display_order: 8,
      },
      {
        quote_text: 'Let food be thy medicine and medicine be thy food.',
        author: 'Hippocrates',
        source: null,
        category: 'scholar',
        display_order: 9,
      },
      {
        quote_text: 'He who has health, has hope; and he who has hope, has everything.',
        author: 'Thomas Carlyle',
        source: null,
        category: 'general',
        display_order: 10,
      },
    ];

    for (const q of quotes) {
      await pool.query(
        'INSERT INTO health_quotes (quote_text, author, source, category, display_order) VALUES ($1, $2, $3, $4, $5)',
        [q.quote_text, q.author, q.source, q.category, q.display_order]
      );
    }

    console.log(`✅ Seeded ${quotes.length} health quotes`);
  } catch (error) {
    console.error('Error seeding quotes:', error.message);
  }
};

module.exports = seedQuotes;
