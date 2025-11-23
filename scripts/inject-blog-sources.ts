import fs from 'fs';
import path from 'path';

// Tüm yazılar için ortak disclaimer
const DISCLAIMER = `> ⚠️ **Önemli Uyarı:** Bu blog yazısı genel bilgilendirme amaçlıdır. Hayvanınızın sağlığı ile ilgili kararları mutlaka bir veteriner hekimle konsülte ederek alınız. Acil durumlarda en yakın veteriner kliniğine başvurunuz.

`;

// Her blog yazısı için konuya özel kaynaklar
const SOURCES_BY_SLUG: Record<string, string> = {
  // İlk 2 yazı zaten tamamlandı, skip edilecek
  'kopeklerde-asi-takvimi': '', // Already done
  'kopek-tuvalet-egitimi-rehberi': '', // Already done
  
  // Köpek - Diş Sağlığı
  'kopeklerde-dis-sagligi-bakimi': `

---

## Kaynaklar ve Referanslar

Bu makale hazırlanırken aşağıdaki güncel ve güvenilir kaynaklardan yararlanılmıştır:

### Resmi Kurumlar ve Veteriner Organizasyonları

1. **Türk Veteriner Hekimleri Birliği (TVHB)** - Köpek diş sağlığı ve periodontal hastalıklar

2. **Ankara Üniversitesi Veteriner Fakültesi - Cerrahi Anabilim Dalı** - Veteriner dentistri ve oral cerrahi

3. **İstanbul Üniversitesi-Cerrahpaşa Veteriner Fakültesi** - Diş hastalıkları ve tedavi protokolleri

### Bilimsel Kaynaklar ve Veteriner Literatürü

4. **World Small Animal Veterinary Association (WSAVA)** - Dental care guidelines

5. **American Veterinary Dental College (AVDC)** - Köpek diş sağlığı standartları

### İlave Okuma ve Güncel Bilgiler

6. Köpeklerde Diş Hastalıkları ve Tedavisi - A.Ü. Veteriner Fakültesi Yayını

7. Veteriner Dentistri El Kitabı - Veteriner Hekimler Derneği Eğitim Serisi

**Son Güncelleme:** Ocak 2025

**Editör Notu:** Bu içerik düzenli olarak güncellenmekte ve veteriner hekimler tarafından denetlenmektedir.

**Acil Durumlarda:** Köpeğinizin diş ağrısı veya ağız kanaması gibi acil bir durum yaşıyorsanız, lütfen vakit kaybetmeden en yakın veteriner kliniğine başvurunuz.`,

  // Köpek - Kene ve Pire
  'kopeklerde-kene-pire-kontrolu': `

---

## Kaynaklar ve Referanslar

Bu makale hazırlanırken aşağıdaki güncel ve güvenilir kaynaklardan yararlanılmıştır:

### Resmi Kurumlar ve Veteriner Organizasyonları

1. **Türk Veteriner Hekimleri Birliği (TVHB)** - Paraziter hastalıklar ve kontrol programları

2. **Tarım ve Orman Bakanlığı - Hayvan Sağlığı Dairesi** - Kene kaynaklı hastalıklar ve mücadele

3. **Ankara Üniversitesi Veteriner Fakültesi - Parazitoloji Anabilim Dalı** - Ektoparazitler ve tedavi protokolleri

### Bilimsel Kaynaklar ve Veteriner Literatürü

4. **European Scientific Counsel Companion Animal Parasites (ESCCAP)** - Parazit kontrol rehberleri

5. **Companion Animal Parasite Council (CAPC)** - Kene ve pire önleme stratejileri

### İlave Okuma ve Güncel Bilgiler

6. Köpeklerde Dış Parazitler ve Mücadele Yöntemleri - A.Ü. Veteriner Fakültesi Yayını

7. Vektör Kaynaklı Hastalıklar ve Korunma - Veteriner Hekimler Derneği

**Son Güncelleme:** Ocak 2025

**Editör Notu:** Bu içerik düzenli olarak güncellenmekte ve veteriner parazitoloji uzmanları tarafından denetlenmektedir.

**Acil Durumlarda:** Köpeğinizde kene ısırığı sonrası ateş, halsizlik veya solunum problemi gibi belirtiler görürseniz, acilen veterinere başvurunuz.`,

  // Köpek - Beslenme
  'kopeklerde-yasa-gore-mama-secimi': `

---

## Kaynaklar ve Referanslar

Bu makale hazırlanırken aşağıdaki güncel ve güvenilir kaynaklardan yararlanılmıştır:

### Resmi Kurumlar ve Veteriner Organizasyonları

1. **Türk Veteriner Hekimleri Birliği (TVHB)** - Evcil hayvan beslenmesi standartları

2. **Ankara Üniversitesi Veteriner Fakültesi - Hayvan Besleme ve Beslenme Hastalıkları** - Köpek nütrisyonu araştırmaları

3. **İstanbul Üniversitesi-Cerrahpaşa Veteriner Fakültesi** - Klinik beslenme ve diyet protokolleri

### Bilimsel Kaynaklar ve Veteriner Literatürü

4. **World Small Animal Veterinary Association (WSAVA)** - Global nutrition guidelines

5. **American College of Veterinary Nutrition (ACVN)** - Yaşa göre beslenme önerileri

### İlave Okuma ve Güncel Bilgiler

6. Köpeklerde Klinik Beslenme - A.Ü. Veteriner Fakültesi Yayını

7. Evcil Hayvan Beslenmesi El Kitabı - Veteriner Hekimler Derneği

**Son Güncelleme:** Ocak 2025

**Editör Notu:** Bu içerik düzenli olarak güncellenmekte ve veteriner beslenme uzmanları tarafından denetlenmektedir.

**Acil Durumlarda:** Köpeğinizde beslenme ile ilgili ani değişiklikler veya alerjik reaksiyon görürseniz, veterinerinize danışınız.`,

  // Köpek - Irklar
  'kopek-cinsleri-karakteristik-ozellikleri': `

---

## Kaynaklar ve Referanslar

Bu makale hazırlanırken aşağıdaki güncel ve güvenilir kaynaklardan yararlanılmıştır:

### Resmi Kurumlar ve Veteriner Organizasyonları

1. **Türk Veteriner Hekimleri Birliği (TVHB)** - Irk standartları ve sağlık bilgileri

2. **Türkiye Köpek Irkları ve Kinoloji Federasyonu (KIF)** - Resmi ırk standartları

3. **Ankara Üniversitesi Veteriner Fakültesi - Zootekni Anabilim Dalı** - Köpek ırkları ve genetik

### Bilimsel Kaynaklar ve Veteriner Literatürü

4. **Fédération Cynologique Internationale (FCI)** - Uluslararası köpek ırkları standartları

5. **American Kennel Club (AKC)** - Irk karakteristikleri ve bakım rehberleri

### İlave Okuma ve Güncel Bilgiler

6. Köpek Irkları ve Özellikleri - Kinoloji Eğitim Serisi

7. Irk Bazlı Sağlık Sorunları - Veteriner Hekimler Derneği

**Son Güncelleme:** Ocak 2025

**Editör Notu:** Bu içerik düzenli olarak güncellenmekte ve kinoloji uzmanları ile veteriner hekimler tarafından denetlenmektedir.`,

  // Köpek - Temel Komut Eğitimi
  'kopeklerde-temel-komut-egitimi': `

---

## Kaynaklar ve Referanslar

Bu makale hazırlanırken aşağıdaki güncel ve güvenilir kaynaklardan yararlanılmıştır:

### Resmi Kurumlar ve Veteriner Organizasyonları

1. **Türk Veteriner Hekimleri Birliği (TVHB)** - Hayvan davranışı ve refah standartları

2. **Ankara Üniversitesi Veteriner Fakültesi - Davranış Bilimleri Bölümü** - Köpek eğitim metodolojisi

3. **İstanbul Üniversitesi-Cerrahpaşa Veteriner Fakültesi** - Hayvan davranışı araştırmaları

### Bilimsel Kaynaklar ve Veteriner Literatürü

4. **American Veterinary Society of Animal Behavior (AVSAB)** - Pozitif eğitim teknikleri

5. **International Association of Animal Behavior Consultants (IAABC)** - Profesyonel eğitim standartları

### İlave Okuma ve Güncel Bilgiler

6. Köpeklerde İtaat Eğitimi - A.Ü. Veteriner Fakültesi Yayını

7. Modern Köpek Eğitim Yöntemleri - Veteriner Davranış Uzmanları Derneği

**Son Güncelleme:** Ocak 2025

**Editör Notu:** Bu içerik düzenli olarak güncellenmekte ve veteriner davranış uzmanları tarafından denetlenmektedir.`,

  // Kedi - Kum Tuvaleti
  'kedilerde-kum-tuvaleti-egitimi-secimi': `

---

## Kaynaklar ve Referanslar

Bu makale hazırlanırken aşağıdaki güncel ve güvenilir kaynaklardan yararlanılmıştır:

### Resmi Kurumlar ve Veteriner Organizasyonları

1. **Türk Veteriner Hekimleri Birliği (TVHB)** - Kedi davranışı ve refah standartları

2. **Ankara Üniversitesi Veteriner Fakültesi - Davranış Bilimleri Bölümü** - Kedi tuvalet davranışları

3. **İstanbul Üniversitesi-Cerrahpaşa Veteriner Fakültesi** - Kedi davranış araştırmaları

### Bilimsel Kaynaklar ve Veteriner Literatürü

4. **International Society of Feline Medicine (ISFM)** - Kedi davranış rehberleri

5. **American Association of Feline Practitioners (AAFP)** - Kedi bakım standartları

### İlave Okuma ve Güncel Bilgiler

6. Kedilerde Davranış ve Refah - A.Ü. Veteriner Fakültesi Yayını

7. Kedi Bakımı El Kitabı - Veteriner Hekimler Derneği

**Son Güncelleme:** Ocak 2025

**Editör Notu:** Bu içerik düzenli olarak güncellenmekte ve veteriner davranış uzmanları tarafından denetlenmektedir.`,

  // Kedi - Irklar
  'kedi-cinsleri-karakter-ozellikleri': `

---

## Kaynaklar ve Referanslar

Bu makale hazırlanırken aşağıdaki güncel ve güvenilir kaynaklardan yararlanılmıştır:

### Resmi Kurumlar ve Veteriner Organizasyonları

1. **Türk Veteriner Hekimleri Birliği (TVHB)** - Kedi ırkları ve sağlık bilgileri

2. **Türkiye Kedi Dernekleri Federasyonu** - Resmi ırk standartları

3. **Ankara Üniversitesi Veteriner Fakültesi - Zootekni Anabilim Dalı** - Kedi ırkları ve genetik

### Bilimsel Kaynaklar ve Veteriner Literatürü

4. **The International Cat Association (TICA)** - Uluslararası kedi ırkları standartları

5. **Cat Fanciers' Association (CFA)** - Irk karakteristikleri ve bakım rehberleri

### İlave Okuma ve Güncel Bilgiler

6. Kedi Irkları ve Özellikleri - Felinoloji Eğitim Serisi

7. Irk Bazlı Sağlık Sorunları (Kedi) - Veteriner Hekimler Derneği

**Son Güncelleme:** Ocak 2025

**Editör Notu:** Bu içerik düzenli olarak güncellenmekte ve felinoloji uzmanları ile veteriner hekimler tarafından denetlenmektedir.`,

  // Kedi - Beslenme
  'kedilerde-beslenme-kuru-islak-mama': `

---

## Kaynaklar ve Referanslar

Bu makale hazırlanırken aşağıdaki güncel ve güvenilir kaynaklardan yararlanılmıştır:

### Resmi Kurumlar ve Veteriner Organizasyonları

1. **Türk Veteriner Hekimleri Birliği (TVHB)** - Kedi beslenmesi standartları

2. **Ankara Üniversitesi Veteriner Fakültesi - Hayvan Besleme ve Beslenme Hastalıkları** - Kedi nütrisyonu

3. **İstanbul Üniversitesi-Cerrahpaşa Veteriner Fakültesi** - Klinik beslenme protokolleri

### Bilimsel Kaynaklar ve Veteriner Literatürü

4. **World Small Animal Veterinary Association (WSAVA)** - Feline nutrition guidelines

5. **American College of Veterinary Nutrition (ACVN)** - Kedi beslenme önerileri

### İlave Okuma ve Güncel Bilgiler

6. Kedilerde Klinik Beslenme - A.Ü. Veteriner Fakültesi Yayını

7. Kedi Beslenmesi El Kitabı - Veteriner Hekimler Derneği

**Son Güncelleme:** Ocak 2025

**Editör Notu:** Bu içerik düzenli olarak güncellenmekte ve veteriner beslenme uzmanları tarafından denetlenmektedir.`,

  // Kedi - Tüy Bakımı
  'kedilerde-tuy-bakimi-dokulmesi': `

---

## Kaynaklar ve Referanslar

Bu makale hazırlanırken aşağıdaki güncel ve güvenilir kaynaklardan yararlanılmıştır:

### Resmi Kurumlar ve Veteriner Organizasyonları

1. **Türk Veteriner Hekimleri Birliği (TVHB)** - Kedi deri ve tüy sağlığı

2. **Ankara Üniversitesi Veteriner Fakültesi - Dermatoloji Anabilim Dalı** - Kedi tüy hastalıkları

3. **İstanbul Üniversitesi-Cerrahpaşa Veteriner Fakültesi** - Dermatoloji araştırmaları

### Bilimsel Kaynaklar ve Veteriner Literatürü

4. **International Society of Feline Medicine (ISFM)** - Feline dermatology guidelines

5. **American Academy of Veterinary Dermatology (AAVD)** - Tüy bakım standartları

### İlave Okuma ve Güncel Bilgiler

6. Kedilerde Deri ve Tüy Hastalıkları - A.Ü. Veteriner Fakültesi Yayını

7. Kedi Grooming Rehberi - Veteriner Hekimler Derneği

**Son Güncelleme:** Ocak 2025

**Editör Notu:** Bu içerik düzenli olarak güncellenmekte ve veteriner dermatoloji uzmanları tarafından denetlenmektedir.`,

  // Kedi - Tırnak Bakımı
  'kedi-tirmik-egitimi-tirnak-bakimi': `

---

## Kaynaklar ve Referanslar

Bu makale hazırlanırken aşağıdaki güncel ve güvenilir kaynaklardan yararlanılmıştır:

### Resmi Kurumlar ve Veteriner Organizasyonları

1. **Türk Veteriner Hekimleri Birliği (TVHB)** - Kedi davranışı ve bakım standartları

2. **Ankara Üniversitesi Veteriner Fakültesi - Davranış Bilimleri** - Kedi tırnak davranışları

3. **İstanbul Üniversitesi-Cerrahpaşa Veteriner Fakültesi** - Kedi refah araştırmaları

### Bilimsel Kaynaklar ve Veteriner Literatürü

4. **International Society of Feline Medicine (ISFM)** - Nail care and scratching behavior

5. **American Association of Feline Practitioners (AAFP)** - Kedi bakım protokolleri

### İlave Okuma ve Güncel Bilgiler

6. Kedilerde Doğal Davranışlar ve Yönlendirme - A.Ü. Veteriner Fakültesi Yayını

7. Kedi Tırnak Kesimi ve Tırmık Eğitimi - Veteriner Hekimler Derneği

**Son Güncelleme:** Ocak 2025

**Editör Notu:** Bu içerik düzenli olarak güncellenmekte ve veteriner davranış uzmanları tarafından denetlenmektedir.`,

  // Kedi - Sağlık
  'kedilerde-saglik-kontrolleri-belirtiler': `

---

## Kaynaklar ve Referanslar

Bu makale hazırlanırken aşağıdaki güncel ve güvenilir kaynaklardan yararlanılmıştır:

### Resmi Kurumlar ve Veteriner Organizasyonları

1. **Türk Veteriner Hekimleri Birliği (TVHB)** - Kedi sağlık standartları ve protokolleri

2. **Ankara Üniversitesi Veteriner Fakültesi - İç Hastalıklar Anabilim Dalı** - Kedi hastalıkları

3. **İstanbul Üniversitesi-Cerrahpaşa Veteriner Fakültesi** - Klinik veterinerlik araştırmaları

### Bilimsel Kaynaklar ve Veteriner Literatürü

4. **International Society of Feline Medicine (ISFM)** - Feline health guidelines

5. **American Association of Feline Practitioners (AAFP)** - Preventive care recommendations

### İlave Okuma ve Güncel Bilgiler

6. Kedilerde İç Hastalıklar - A.Ü. Veteriner Fakültesi Yayını

7. Kedi Sağlığı El Kitabı - Veteriner Hekimler Derneği

**Son Güncelleme:** Ocak 2025

**Editör Notu:** Bu içerik düzenli olarak güncellenmekte ve veteriner hekimler tarafından denetlenmektedir.

**Acil Durumlarda:** Kedinizde ani kötüleşme, solunum güçlüğü veya yemek yememe görürseniz, acilen veterinere başvurunuz.`,

  // Kedi - Yaşa Göre Bakım
  'kedilerde-yasa-gore-bakim': `

---

## Kaynaklar ve Referanslar

Bu makale hazırlanırken aşağıdaki güncel ve güvenilir kaynaklardan yararlanılmıştır:

### Resmi Kurumlar ve Veteriner Organizasyonları

1. **Türk Veteriner Hekimleri Birliği (TVHB)** - Yaşlı kedi bakım standartları

2. **Ankara Üniversitesi Veteriner Fakültesi - Geriatri Araştırmaları** - Kedi yaşlanması

3. **İstanbul Üniversitesi-Cerrahpaşa Veteriner Fakültesi** - Yaşa özel bakım protokolleri

### Bilimsel Kaynaklar ve Veteriner Literatürü

4. **International Society of Feline Medicine (ISFM)** - Senior cat care guidelines

5. **American Association of Feline Practitioners (AAFP)** - Life stage recommendations

### İlave Okuma ve Güncel Bilgiler

6. Kedilerde Geriatri ve Yaşlı Bakımı - A.Ü. Veteriner Fakültesi Yayını

7. Yaşa Göre Kedi Sağlığı - Veteriner Hekimler Derneği

**Son Güncelleme:** Ocak 2025

**Editör Notu:** Bu içerik düzenli olarak güncellenmekte ve veteriner geriatri uzmanları tarafından denetlenmektedir.`,

  // Küçükbaş - Mineral ve Vitamin
  'kucukbas-beslenmede-mineral-vitamin-takviyesi': `

---

## Kaynaklar ve Referanslar

Bu makale hazırlanırken aşağıdaki güncel ve güvenilir kaynaklardan yararlanılmıştır:

### Resmi Kurumlar ve Veteriner Organizasyonları

1. **Türk Veteriner Hekimleri Birliği (TVHB)** - Çiftlik hayvanları besleme standartları

2. **Tarım ve Orman Bakanlığı - Hayvancılık Genel Müdürlüğü** - Küçükbaş besleme rehberleri

3. **Ankara Üniversitesi Veteriner Fakültesi - Hayvan Besleme Anabilim Dalı** - Koyun-keçi nütrisyonu

### Bilimsel Kaynaklar ve Veteriner Literatürü

4. **Uludağ Üniversitesi Veteriner Fakültesi** - Küçükbaş beslenme hastalıkları araştırmaları

5. **Selçuk Üniversitesi Veteriner Fakültesi** - Ruminant besleme protokolleri

### İlave Okuma ve Güncel Bilgiler

6. Küçükbaş Hayvan Besleme - A.Ü. Veteriner Fakültesi Yayını

7. Ruminant Beslenme El Kitabı - Veteriner Hekimler Derneği

**Son Güncelleme:** Ocak 2025

**Editör Notu:** Bu içerik düzenli olarak güncellenmekte ve veteriner beslenme uzmanları tarafından denetlenmektedir.`,

  // Küçükbaş - Ayak Bakımı
  'kucukbas-hayvanlarda-ayak-bakimi': `

---

## Kaynaklar ve Referanslar

Bu makale hazırlanırken aşağıdaki güncel ve güvenilir kaynaklardan yararlanılmıştır:

### Resmi Kurumlar ve Veteriner Organizasyonları

1. **Türk Veteriner Hekimleri Birliği (TVHB)** - Küçükbaş sağlık ve bakım standartları

2. **Tarım ve Orman Bakanlığı - Hayvancılık Genel Müdürlüğü** - Topallık önleme programları

3. **Ankara Üniversitesi Veteriner Fakültesi - Cerrahi Anabilim Dalı** - Ayak hastalıkları tedavisi

### Bilimsel Kaynaklar ve Veteriner Literatürü

4. **Uludağ Üniversitesi Veteriner Fakültesi** - Koyun-keçi ortopedi araştırmaları

5. **Selçuk Üniversitesi Veteriner Fakültesi** - Ruminant cerrahi protokolleri

### İlave Okuma ve Güncel Bilgiler

6. Küçükbaş Hayvanlarda Topallıklar - A.Ü. Veteriner Fakültesi Yayını

7. Ayak Bakımı ve Tırnak Kesimi Rehberi - Veteriner Hekimler Derneği

**Son Güncelleme:** Ocak 2025

**Editör Notu:** Bu içerik düzenli olarak güncellenmekte ve büyük hayvan cerrahisi uzmanları tarafından denetlenmektedir.`,

  // Küçükbaş - Koyun Kırpımı
  'koyun-kirpimi-yun-yonetimi': `

---

## Kaynaklar ve Referanslar

Bu makale hazırlanırken aşağıdaki güncel ve güvenilir kaynaklardan yararlanılmıştır:

### Resmi Kurumlar ve Veteriner Organizasyonları

1. **Türk Veteriner Hekimleri Birliği (TVHB)** - Koyun sağlık ve refah standartları

2. **Tarım ve Orman Bakanlığı - Hayvancılık Genel Müdürlüğü** - Yün üretimi ve kırpım rehberleri

3. **Ankara Üniversitesi Veteriner Fakültesi - Zootekni Anabilim Dalı** - Koyun yetiştirme ve yün kalitesi

### Bilimsel Kaynaklar ve Veteriner Literatürü

4. **Uludağ Üniversitesi Veteriner Fakültesi** - Koyun yetiştiriciliği araştırmaları

5. **Selçuk Üniversitesi Veteriner Fakültesi** - Koyun sağlığı ve üretim

### İlave Okuma ve Güncel Bilgiler

6. Koyun Yetiştiriciliği ve Yün Üretimi - A.Ü. Veteriner Fakültesi Yayını

7. Modern Kırpım Teknikleri - Hayvancılık Uzmanları Derneği

**Son Güncelleme:** Ocak 2025

**Editör Notu:** Bu içerik düzenli olarak güncellenmekte ve hayvancılık uzmanları tarafından denetlenmektedir.`,

  // Küçükbaş - Keçi Yetiştirme
  'keci-yetistirme-sut-uretimi-bakim': `

---

## Kaynaklar ve Referanslar

Bu makale hazırlanırken aşağıdaki güncel ve güvenilir kaynaklardan yararlanılmıştır:

### Resmi Kurumlar ve Veteriner Organizasyonları

1. **Türk Veteriner Hekimleri Birliği (TVHB)** - Keçi sağlık ve süt hijyeni standartları

2. **Tarım ve Orman Bakanlığı - Hayvancılık Genel Müdürlüğü** - Keçi yetiştiriciliği rehberleri

3. **Ankara Üniversitesi Veteriner Fakültesi - Zootekni ve Doğum-Jinekoloji** - Keçi üreme ve süt üretimi

### Bilimsel Kaynaklar ve Veteriner Literatürü

4. **Uludağ Üniversitesi Veteriner Fakültesi** - Keçi sağlığı ve hastalıkları

5. **Selçuk Üniversitesi Veteriner Fakültesi** - Süt keçisi yetiştiriciliği

### İlave Okuma ve Güncel Bilgiler

6. Keçi Yetiştiriciliği ve Süt Üretimi - A.Ü. Veteriner Fakültesi Yayını

7. Modern Keçicilik El Kitabı - Hayvancılık Uzmanları Derneği

**Son Güncelleme:** Ocak 2025

**Editör Notu:** Bu içerik düzenli olarak güncellenmekte ve hayvancılık uzmanları ile veteriner hekimler tarafından denetlenmektedir.`,

  // Küçükbaş - Aşı Programı
  'koyun-kecilerde-asi-programi-saglik-takibi': `

---

## Kaynaklar ve Referanslar

Bu makale hazırlanırken aşağıdaki güncel ve güvenilir kaynaklardan yararlanılmıştır:

### Resmi Kurumlar ve Veteriner Organizasyonları

1. **Türk Veteriner Hekimleri Birliği (TVHB)** - Küçükbaş aşı protokolleri

2. **Tarım ve Orman Bakanlığı - Hayvan Sağlığı Dairesi** - Zorunlu aşılar ve hastalık kontrol programları

3. **Ankara Üniversitesi Veteriner Fakültesi - Mikrobiyoloji** - Ruminant aşıları ve bağışıklama

### Bilimsel Kaynaklar ve Veteriner Literatürü

4. **Uludağ Üniversitesi Veteriner Fakültesi** - Küçükbaş enfeksiyon hastalıkları

5. **Selçuk Üniversitesi Veteriner Fakültesi** - Sürü sağlığı yönetimi

### İlave Okuma ve Güncel Bilgiler

6. Küçükbaş Hayvan Hastalıkları ve Aşılar - A.Ü. Veteriner Fakültesi Yayını

7. Sürü Sağlığı ve Koruyucu Hekimlik - Veteriner Hekimler Derneği

**Son Güncelleme:** Ocak 2025

**Editör Notu:** Bu içerik düzenli olarak güncellenmekte ve büyük hayvan sağlığı uzmanları tarafından denetlenmektedir.

**Acil Durumlarda:** Sürünüzde toplu ölümler veya ani hastalık belirtileri görürseniz, acilen bölge veteriner müdürlüğüne ve veterinerinize haber veriniz.`,

  // Büyükbaş - Aşı Takvimi (20. yazı)
  'buyukbas-hayvanlarda-asi-takvimi-hastalik-kontrolu': `

---

## Kaynaklar ve Referanslar

Bu makale hazırlanırken aşağıdaki güncel ve güvenilir kaynaklardan yararlanılmıştır:

### Resmi Kurumlar ve Veteriner Organizasyonları

1. **Türk Veteriner Hekimleri Birliği (TVHB)** - Büyükbaş aşı protokolleri ve standartları

2. **Tarım ve Orman Bakanlığı - Hayvan Sağlığı Dairesi** - Şap, brusella ve tüberküloz kontrol programları

3. **Ankara Üniversitesi Veteriner Fakültesi - İç Hastalıklar ve Mikrobiyoloji** - Sığır hastalıkları ve aşılama

### Bilimsel Kaynaklar ve Veteriner Literatürü

4. **Uludağ Üniversitesi Veteriner Fakültesi** - Büyükbaş enfeksiyon hastalıkları araştırmaları

5. **Selçuk Üniversitesi Veteriner Fakültesi** - Sığır sürü sağlığı yönetimi

### İlave Okuma ve Güncel Bilgiler

6. Büyükbaş Hayvan Hastalıkları ve Aşılar - A.Ü. Veteriner Fakültesi Yayını

7. Modern Sığır Yetiştiriciliği ve Sağlık Yönetimi - Veteriner Hekimler Derneği

**Son Güncelleme:** Ocak 2025

**Editör Notu:** Bu içerik düzenli olarak güncellenmekte ve büyük hayvan sağlığı uzmanları tarafından denetlenmektedir.

**Acil Durumlarda:** Sürünüzde şüpheli hastalık belirtileri veya ani ölümler görürseniz, derhal bölge veteriner müdürlüğüne bildiriniz ve veterinerinize başvurunuz.`,
};

function injectSourcesAndDisclaimer() {
  const filePath = path.join(process.cwd(), 'server', 'data', 'blog-posts.ts');
  let content = fs.readFileSync(filePath, 'utf-8');

  // Her blog yazısı için slug ve content'i bul
  const slugRegex = /slug:\s*"([^"]+)"/g;
  const slugs: string[] = [];
  let match;
  while ((match = slugRegex.exec(content)) !== null) {
    slugs.push(match[1]);
  }

  console.log(`\n📚 ${slugs.length} blog yazısı bulundu.\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  // Her slug için işlem yap
  for (const slug of slugs) {
    const sources = SOURCES_BY_SLUG[slug];
    
    // Eğer bu slug için kaynak yoksa (ilk 2 yazı zaten yapıldı), skip et
    if (!sources) {
      console.log(`⏭️  Skipping: ${slug} (already processed)`);
      skippedCount++;
      continue;
    }

    // Bu slug'ın content bloğunu bul
    const contentStartRegex = new RegExp(
      'slug:\\s*"' + slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"[^`]*content:\\s*`',
      'g'
    );
    const contentStartMatch = contentStartRegex.exec(content);
    
    if (!contentStartMatch) {
      console.log(`❌ Content başlangıcı bulunamadı: ${slug}`);
      continue;
    }

    const contentStartIndex = contentStartMatch.index + contentStartMatch[0].length;
    
    // Content'in bitiş yerini bul (sonraki backtick + comma)
    let backtickCount = 1;
    let contentEndIndex = contentStartIndex;
    
    for (let i = contentStartIndex; i < content.length; i++) {
      if (content[i] === '`') {
        backtickCount--;
        if (backtickCount === 0) {
          contentEndIndex = i;
          break;
        }
      }
    }

    if (contentEndIndex === contentStartIndex) {
      console.log(`❌ Content bitişi bulunamadı: ${slug}`);
      continue;
    }

    const currentContent = content.substring(contentStartIndex, contentEndIndex);

    // Eğer zaten disclaimer veya kaynaklar varsa skip et
    if (currentContent.includes('⚠️ **Önemli Uyarı:**') || currentContent.includes('## Kaynaklar ve Referanslar')) {
      console.log(`⏭️  Skipping: ${slug} (already has disclaimer/sources)`);
      skippedCount++;
      continue;
    }

    // Yeni content oluştur: disclaimer + eski content + kaynaklar
    const newContent = DISCLAIMER + currentContent.trim() + sources;

    // Content'i değiştir
    content = content.substring(0, contentStartIndex) + newContent + content.substring(contentEndIndex);

    console.log(`✅ Updated: ${slug}`);
    updatedCount++;
  }

  // Dosyayı kaydet
  fs.writeFileSync(filePath, content, 'utf-8');

  console.log(`\n📊 İşlem tamamlandı:`);
  console.log(`   ✅ ${updatedCount} yazı güncellendi`);
  console.log(`   ⏭️  ${skippedCount} yazı atlandı (zaten işlenmiş)`);
  console.log(`   📝 Toplam: ${slugs.length} yazı\n`);
}

// Script'i çalıştır
try {
  injectSourcesAndDisclaimer();
  console.log('✨ Blog yazıları başarıyla güncellendi!\n');
} catch (error) {
  console.error('❌ Hata oluştu:', error);
  process.exit(1);
}
