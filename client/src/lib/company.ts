/**
 * Kurumsal / yasal bilgiler — TEK KAYNAK.
 *
 * 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun ve ilgili
 * yönetmelik, hizmet sağlayıcının ticaret unvanını, MERSİS numarasını,
 * tam adresini ve iletişim bilgilerini sitede **erişilebilir biçimde**
 * bulundurmasını zorunlu kılar. KVKK aydınlatma metni de veri sorumlusunun
 * kimliğini açıkça göstermek zorundadır.
 *
 * ⚠️  AŞAĞIDAKİ BOŞ ALANLAR DOLDURULMALIDIR.
 *     Boş bırakılan alanlar sayfalarda gösterilmez; yayına almadan önce
 *     gerçek değerleri girin. Tek yerden değiştirmek tüm yasal sayfaları,
 *     footer'ı ve "Hakkımızda" sayfasını günceller.
 */

export const COMPANY = {
  /** Görünen marka adı */
  brand: "sahibindenhayvan.com",

  /** Ticaret unvanı — örn. "Örnek Bilişim ve Ticaret Ltd. Şti." */
  legalName: "",

  /** MERSİS numarası (16 hane) */
  mersisNo: "",

  /** Vergi dairesi ve numarası — örn. "Bayrampaşa V.D. — 1234567890" */
  taxOffice: "",

  /** Açık adres (mahalle, sokak, no, ilçe/il, posta kodu) */
  address: "",

  /** İletişim telefonu — örn. "+90 212 000 00 00" */
  phone: "",

  /** Genel iletişim e-postası */
  email: "info@sahibindenhayvan.com",

  /** KVKK başvuruları için e-posta */
  kvkkEmail: "kvkk@sahibindenhayvan.com",

  /** Yasal metinlerin son güncellenme tarihi (tek yerden yönetilir) */
  legalLastUpdated: "1 Ağustos 2026",

  /** Sosyal medya — boş bırakılanlar gösterilmez */
  social: {
    instagram: "",
    facebook: "",
    x: "",
    youtube: "",
  },
} as const;

/** Yasal sayfalarda gösterilecek kimlik satırları (boş alanlar atlanır). */
export function companyIdentityRows(): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Platform", value: COMPANY.brand },
  ];
  if (COMPANY.legalName) rows.push({ label: "Ticaret Unvanı", value: COMPANY.legalName });
  if (COMPANY.mersisNo) rows.push({ label: "MERSİS No", value: COMPANY.mersisNo });
  if (COMPANY.taxOffice) rows.push({ label: "Vergi Dairesi / No", value: COMPANY.taxOffice });
  if (COMPANY.address) rows.push({ label: "Adres", value: COMPANY.address });
  if (COMPANY.phone) rows.push({ label: "Telefon", value: COMPANY.phone });
  rows.push({ label: "E-posta", value: COMPANY.email });
  return rows;
}

/** Kurumsal bilgiler eksikse geliştirme ortamında uyar. */
export function hasCompleteLegalInfo(): boolean {
  return Boolean(COMPANY.legalName && COMPANY.mersisNo && COMPANY.address && COMPANY.phone);
}
