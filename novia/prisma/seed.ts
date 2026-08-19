import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const configuredDatabaseUrl = process.env.DATABASE_URL;
const databaseUrl = configuredDatabaseUrl?.startsWith('file:') || configuredDatabaseUrl?.startsWith('libsql:')
  ? configuredDatabaseUrl
  : 'file:./dev.db';
const adapter = new PrismaLibSql({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

const defaultQuestions = [
  // Custom first questions
  { text: 'Tulis nama lengkap kamu di kolom ini', category: 'icebreaker', order: 1 },
  { text: 'Berapa tanggal lahir kamu?', category: 'icebreaker', order: 2 },
  { text: 'Apa warna favorit kamu?', category: 'icebreaker', order: 3 },

  // Icebreaker (lanjutan)
  { text: 'Makanan favorit kamu apa? Kalau aku beliin, mau yang mana?', category: 'icebreaker', order: 4 },
  { text: 'Hobi kamu apa yang bisa dilakukan berjam-jam tanpa bosan?', category: 'icebreaker', order: 5 },
  { text: 'Film/series favorit yang bisa kamu tonton ulang berkali-kali?', category: 'icebreaker', order: 6 },
  { text: 'Tempat favorit kamu di kota ini untuk nongkrong?', category: 'icebreaker', order: 7 },
  { text: 'Kalau bisa teleportasi ke mana saja sekarang, mau ke mana?', category: 'icebreaker', order: 8 },

  // Fun & Random
  { text: 'Superpower yang kamu mau: terbang atau hidden? Kenapa?', category: 'fun', order: 9 },
  { text: 'Makanan paling aneh yang pernah kamu coba (dan enak/tidak)?', category: 'fun', order: 10 },
  { text: 'Karaoke go-to song kamu apa?', category: 'fun', order: 11 },
  { text: 'Kalau hidup ini game, cheat code yang kamu mau apa?', category: 'fun', order: 12 },
  { text: 'Hal paling konyol yang pernah kamu lakukan saat sedih/stress?', category: 'fun', order: 13 },

  // Values & Personality
  { text: 'Nilai apa yang paling kamu pegang teguh dalam hidup?', category: 'values', order: 14 },
  { text: 'Menurutmu, apa definisi "hubungan yang sehat"?', category: 'values', order: 15 },
  { text: 'Apa dealbreaker terbesar buatmu dalam hubungan?', category: 'values', order: 16 },
  { text: 'Kamu tipe yang suka plan detail atau go with the flow?', category: 'values', order: 17 },
  { text: 'Hal apa yang bikin kamu merasa paling dihargai?', category: 'values', order: 18 },

  // Deep & Meaningful
  { text: 'Mimpi terbesar kamu yang belum tercapai?', category: 'deep', order: 19 },
  { text: 'Kenangan masa kecil yang paling berkesan buat kamu?', category: 'deep', order: 20 },
  { text: 'Kalau bisa bikin satu perubahan di dunia, apa yang kamu ubah?', category: 'deep', order: 21 },
  { text: 'Apa yang paling kamu takutkan soal masa depan?', category: 'deep', order: 22 },
  { text: 'Pesan buat versi 5-tahun-lalu kamu?', category: 'deep', order: 23 },

  // Relationship & Future
  { text: 'Ideal date night kamu gimana?', category: 'relationship', order: 24 },
  { text: 'Love language kamu apa? (Words, Acts, Gifts, Quality Time, Touch)', category: 'relationship', order: 25 },
  { text: 'Menurutmu, kapan saat yang tepat buat kenalan orang tua?', category: 'relationship', order: 26 },
  { text: 'Kamu nggak pernah move on dari siapa/apa?', category: 'relationship', order: 27 },
  { text: 'Bayangin masa depan kita 5 tahun lagi. Kita lagi apa?', category: 'relationship', order: 28 },
];

async function main() {
  console.log('🌱 Seeding database...');

  for (const q of defaultQuestions) {
    await prisma.question.upsert({
      where: { id: `seed-${q.order}` },
      update: q,
      create: {
        id: `seed-${q.order}`,
        ...q,
      },
    });
  }

  console.log('✅ Seeded', defaultQuestions.length, 'questions');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });