import { useMemo, useRef } from "react";

/**
 * Kullanıcıyı hiç uğraştırmayan bot koruması (reCAPTCHA'nın yerine).
 *
 * İki sinyal üretir ve istek gövdesine ekler:
 *  - `website`: ekranda görünmeyen bir alan. İnsan göremediği için boş kalır,
 *    formu otomatik dolduran bot doldurur.
 *  - `formFillMs`: formun açılmasıyla gönderilmesi arasında geçen süre.
 *    İnsanın bir formu 2 saniyeden kısa sürede doldurması mümkün değildir.
 *    Mutlak zaman damgası yerine SÜRE gönderilir; böylece kullanıcının saati
 *    sunucudan farklı olsa bile kontrol doğru çalışır.
 *
 * Sunucu tarafı (server/bot-protection.ts) yalnızca POZİTİF bot kanıtı varsa
 * reddeder; alanlar eksikse isteği geçirir. Bu yüzden burayı unutmak bir
 * şeyi bozmaz, sadece korumayı zayıflatır.
 *
 * Gizleme yöntemi: `display:none` yerine ekran dışına taşıma + `aria-hidden`
 * + `tabIndex={-1}`. Bazı basit botlar `display:none` alanları atlar; ekran
 * dışındaki alanı ise gerçek sanıp doldurur. Ekran okuyucular `aria-hidden`
 * sayesinde alanı görmez, klavyeyle de sekmeyle gelinemez.
 */
export function useBotTrap() {
  const acilisRef = useRef<number>(Date.now());
  const alanRef = useRef<HTMLInputElement | null>(null);

  return useMemo(
    () => ({
      /** Formun içine koyulacak gizli alan. */
      BotTrapField: () => (
        <input
          ref={alanRef}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          defaultValue=""
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            padding: 0,
            border: 0,
            overflow: "hidden",
            clip: "rect(0 0 0 0)",
            whiteSpace: "nowrap",
            left: "-9999px",
          }}
        />
      ),
      /** İstek gövdesine eklenecek alanlar. */
      botFields: () => ({
        website: alanRef.current?.value ?? "",
        // Mutlak damga degil, ayni saatin iki okumasi arasindaki fark:
        // kullanicinin saati ileri/geri olsa bile dogru calisir.
        formFillMs: Date.now() - acilisRef.current,
      }),
    }),
    []
  );
}
