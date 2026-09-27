import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API endpoint for Gemini AI PJOK Ideas & Teaching Needs
  app.post('/api/ai/ideas', async (req, res) => {
    try {
      const { topic, gradeLevel, duration, needType, customNotes } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({
          success: true,
          content: generateFallbackPJOKPlan(topic, gradeLevel, duration, needType, customNotes),
          source: 'local_template'
        });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      const prompt = `
Sebagai Guru Ahli PJOK dan Kurikulum Pembelajaran Madrasah Tsanawiyah (MTs/SMP) di Indonesia, buatkan ide aktivitas dan kebutuhan pembelajaran praktis:
- Topik / Materi Pembelajaran: ${topic || 'Kebugaran Jasmani & Permainan Bola'}
- Jenjang Kelas: ${gradeLevel || 'Semua Kelas'}
- Alokasi Jam: ${duration || '2 Jam Pelajaran'}
- Kategori Kebutuhan: ${needType || 'Ide Aktivitas & Variasi Game Seru'}
- Catatan / Kendala Lapangan: ${customNotes || 'Sarana lapangan madrasah standar'}

Susun jawaban dengan format terstruktur rapi, bahasa Indonesia yang komunikatif dan siap dipraktikkan langsung di lapangan:
1. 🎯 **Tujuan Aktivitas Singkat**
2. 🔥 **Pemanasan & Ice Breaking Seru** (5-10 menit, memotivasi siswa dan aktif gerak)
3. 🏃‍♂️ **Aktivitas Inti / Game Modifikasi** (bertahap, menyenangkan, melatih teknik & kerjasama)
4. 🧘‍♂️ **Pendinginan & Refleksi Siswa** (pertanyaan reflektif bermakna)
5. 🛡️ **K3 & Keselamatan Lapangan** (antisipasi cedera dan tips cuaca)
6. 📋 **Kebutuhan Alat & Sarana Pendukung** (modifikasi alat murah/tersedia di madrasah)
7. 💡 **Asesmen Formatif Cepat** (rubrik pengamatan sikap dan keterampilan)

Berikan tips tambahan yang membangkitkan karakter akhlakul karimah dan sportivitas siswa madrasah.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Anda adalah asisten cerdas PJOK SMART MTsN Kota Sukabumi yang berdedikasi membantu guru PJOK merancang pembelajaran aktif, sehat, gembira, dan aman.'
        }
      });

      return res.json({
        success: true,
        content: response.text,
        source: 'gemini-3.8-flash'
      });
    } catch (error: any) {
      console.warn('Gemini API call returned error, using curated template fallback:', error?.message);
      const fallback = generateFallbackPJOKPlan(
        req.body?.topic,
        req.body?.gradeLevel,
        req.body?.duration,
        req.body?.needType,
        req.body?.customNotes
      );
      return res.json({
        success: true,
        content: fallback,
        source: 'local_fallback',
        error: error?.message
      });
    }
  });

  // Fallback function for offline / resilient operations
  function generateFallbackPJOKPlan(topic = 'Permainan Bola Besar', grade = 'Kelas 7', duration = '2 Jam Pelajaran', needType = 'Ide Aktivitas & Game', notes = '') {
    return `### 🏃‍♂️ Rencana Aktivitas PJOK MTsN Kota Sukabumi
**Materi:** ${topic} | **Jenjang:** ${grade} | **Alokasi:** ${duration}
*Kategori:* ${needType} ${notes ? `(${notes})` : ''}

---

#### 1. 🎯 Tujuan Pembelajaran
Siswa mampu memahami dan mempraktikkan keterampilan gerak dasar ${topic}, meningkatkan kebugaran jasmani, serta menumbuhkan sportivitas, kejujuran, dan kerjasama berlandaskan akhlak mulia.

#### 2. 🔥 Pemanasan & Ice Breaking (10 Menit)
- **Game "Lingkaran Gerak Berantai":** Siswa membentuk 3 lingkaran regu. Siswa pertama melakukan gerakan pemanasan dasar (lompat bintang, skipping, high knee), dilanjutkan berantai oleh teman di sebelahnya secara cepat.
- **Peregangan Dinamis & Statis:** Fokus pada otot tungkai kaki, bahu, sendi lutut, dan pergelangan tangan berhitung bersama.

#### 3. 🏃 Aktivitas Inti & Game Lapangan (${duration})
- **Aktivitas 1 (Eksplorasi Gerak Berpasangan):**
  Latihan teknik dasar ${topic} berpasangan dengan jarak bertahap (3m ➡️ 5m ➡️ 7m) selama 15 menit. Setiap siswa saling mengamati dan memberi umpan balik santun.
- **Aktivitas 2 (Tantangan Pos Sirkuit):**
  Lapangan dibagi menjadi 4 stasiun mini (Kecepatan, Akurasi Sasaran, Kerjasama Tim, dan Kelincahan). Setiap kelompok berotasi tiap 5 menit.
- **Aktivitas 3 (Mini Game Lapangan Modifikasi):**
  Permainan mini dengan aturan sederhana (misal: wajib minimal 3 kali operan sebelum mencetak poin). Siswa yang sedang cadangan bertugas sebagai wasit pengamat sportivitas.

#### 4. 🧘 Pendinginan & Refleksi Bermakna (10 Menit)
- Berjalan perlahan sambil mengatur pernapasan dalam.
- **Pertanyaan Refleksi:** *"Siapa yang hari ini merasa paling terbantu oleh rekan satu timnya? Gerakan apa yang paling mudah dan paling sulit dilakukan?"*

#### 5. 🛡️ K3 & Keselamatan Siswa
- Cek kondisi permukaan lapangan dari kerikil tajam atau genangan air.
- Pastikan siswa sudah minum air putih sebelum latihan dan tidak menahan sakit jika pusing.

#### 6. 📋 Kebutuhan Alat & Modifikasi
- Bola latihan (bisa menggunakan bola spon atau bola modifikasi jika bola standar terbatas).
- Cone / mangkuk penanda (bisa diganti botol minum atau garis kapur lapangan).
- Peluit dan lembar catatan observasi guru.

#### 7. 💡 Asesmen Formatif Cepat
- **Ceklist Keterampilan:** Ketepatan posisi tubuh, koordinasi mata-tangan/kaki, dan keseimbangan.
- **Sikap:** Menghargai teman yang belum lancar, tidak mengejek, dan menerima hasil latihan dengan lapang dada.`;
  }

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server PJOK SMART running on port ${PORT}`);
  });
}

startServer();
