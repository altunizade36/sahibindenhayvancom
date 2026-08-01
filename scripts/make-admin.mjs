/**
 * Bir hesabı yönetici (admin) yapar.
 *
 *   npm run make-admin -- eposta@ornek.com
 *   npm run make-admin -- eposta@ornek.com --role vet
 *
 * NEDEN BİR BETİK, NEDEN HTTP UCU DEĞİL
 * -------------------------------------
 * Rol değiştiren uç (`PATCH /api/admin/users/:id/role`) zaten yönetici yetkisi
 * istiyor. Sistemde hiç yönetici yokken bu bir tavuk-yumurta sorunu yaratır:
 * ilk yönetici hiçbir şekilde oluşturulamaz, dolayısıyla moderasyon
 * kuyruğundaki ilanlar sonsuza kadar "pending" durumunda kalır ve sitede
 * hiçbir ilan yayınlanamaz.
 *
 * Çözümü internete açık bir "ilk yöneticiyi oluştur" ucu olarak yazmak
 * tehlikelidir; böyle uçlar unutulur ve açık kalır. Bunun yerine yetki
 * yükseltme yalnızca veritabanı kimlik bilgilerine sahip olan kişinin
 * çalıştırabileceği bu betiğe bırakıldı — yani sunucuya erişimi olan kişiye.
 *
 * Güvenlik notu: rol değiştiğinde kullanıcının açık oturumları silinir, böylece
 * yetki değişikliği anında geçerli olur (bayat rol taşıyan oturum kalmaz).
 */
import "dotenv/config";
import pg from "pg";

const GECERLI_ROLLER = ["buyer", "seller", "vet", "transporter", "admin"];

const argv = process.argv.slice(2);
const email = argv.find((a) => !a.startsWith("--"));
const roleIdx = argv.indexOf("--role");
const role = roleIdx !== -1 ? argv[roleIdx + 1] : "admin";

function cik(mesaj) {
  console.error(`\n  ${mesaj}\n`);
  process.exit(1);
}

if (!email) {
  cik(
    "Kullanım: npm run make-admin -- eposta@ornek.com [--role admin]\n" +
      `  Geçerli roller: ${GECERLI_ROLLER.join(", ")}`
  );
}
if (!GECERLI_ROLLER.includes(role)) {
  cik(`Geçersiz rol: "${role}". Geçerli roller: ${GECERLI_ROLLER.join(", ")}`);
}
if (!process.env.DATABASE_URL) {
  cik("DATABASE_URL tanımlı değil. .env dosyanızı kontrol edin.");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  const { rows } = await pool.query(
    "SELECT id, email, role::text AS role, status::text AS status FROM users WHERE lower(email) = lower($1)",
    [email]
  );

  if (rows.length === 0) {
    cik(
      `"${email}" adresiyle kayıtlı kullanıcı bulunamadı.\n` +
        "  Önce siteden bu e-postayla üye olun, sonra bu komutu çalıştırın."
    );
  }

  const kullanici = rows[0];

  if (kullanici.role === role) {
    console.log(`\n  ${kullanici.email} zaten "${role}" rolünde. Değişiklik yapılmadı.\n`);
  } else {
    await pool.query("UPDATE users SET role = $1 WHERE id = $2", [role, kullanici.id]);

    // Rol değişikliği anında geçerli olsun diye açık oturumlar silinir.
    // Aksi halde kullanıcı, oturumu dolana kadar eski rolüyle dolaşır.
    const { rowCount: silinen } = await pool.query(
      "DELETE FROM sessions WHERE sess #>> '{passport,user,claims,sub}' = $1",
      [kullanici.id]
    );

    console.log(`\n  ${kullanici.email}: "${kullanici.role}" -> "${role}"`);
    if (silinen > 0) {
      console.log(`  ${silinen} açık oturum sonlandırıldı — yeniden giriş yapılmalı.`);
    }
  }

  if (kullanici.status !== "active") {
    console.log(
      `\n  UYARI: hesabın durumu "${kullanici.status}". Aktif olmayan hesap yönetici\n` +
        "  panelini kullanamaz; durumu 'active' yapmanız gerekir."
    );
  }

  const { rows: adminler } = await pool.query(
    "SELECT count(*)::int AS n FROM users WHERE role = 'admin'"
  );
  console.log(`  Sistemdeki yönetici sayısı: ${adminler[0].n}\n`);
} catch (hata) {
  cik(`Veritabanı hatası: ${hata.message}`);
} finally {
  await pool.end();
}
