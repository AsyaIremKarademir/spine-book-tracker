# Spine 

Letterboxd'un kitap versiyonu. Okuduğun, okumakta olduğun ve okumak istediğin kitapları takip et; puanla, yorumla, günlüğünü tut. Tamamen istemci taraflı (HTML/CSS/JS), sunucu veya build adımı gerektirmez.


## Özellikler

-  **Kitap ara** — [Open Library](https://openlibrary.org/developers/api) kataloğunda arama, API anahtarı gerekmez
-  **Raflar** — Okumak istiyorum / Okuyorum / Okudum
-  **Puanlama** — 5 yıldızlı puanlama sistemi
-  **Yorumlar** — her kitaba kendi notlarını ekle
-  **Günlük akışı** — bitirdiğin kitapların kronolojik günlüğü
-  **İstatistikler** — puan dağılımı, en çok okunan yazarlar, toplam sayfa
-  **Veri dışa/içe aktarma** — kütüphaneni JSON olarak yedekle
-  Mor tonlarında, koyu temalı, mobil uyumlu tasarım
-  Veriler yalnızca kendi tarayıcında (`localStorage`) saklanır — hesap, backend yok

## Dosya yapısı

```
spine/
├── index.html        # sayfa iskeleti
├── css/
│   └── style.css     # tüm tasarım
├── js/
│   └── app.js         # uygulama mantığı (state, arama, modal, render)
└── README.md
```

## Yerelde çalıştırma

Build adımı yok. Sadece `index.html` dosyasını bir tarayıcıda aç, ya da basit bir sunucu ile servis et (fetch/CORS için sunucu üzerinden açman önerilir):

```bash
# Python varsa
python3 -m http.server 8080

# veya Node varsa
npx serve .
```

Sonra tarayıcıda `http://localhost:8080` adresini aç.


## Nasil calisir?

- Arama, Open Library'nin `search.json` uç noktasını kullanır ve sonuç başına kapak, yazar, ilk basım yılı bilgisini gösterir.
- Bir kitabı bir rafa eklediğinde (İstiyorum / Okuyorum / Okudum) kayıt `localStorage`'a yazılır.
- Bir kitabı "Okudum" olarak işaretleyip yıldız + yorum eklediğinde otomatik olarak günlük akışında belirir.
- "Verini dışa aktar" butonu tüm kütüphaneni `.json` dosyası olarak indirir; "Veri içe aktar" ile bu dosyayı geri yükleyebilir veya cihazlar arasında taşıyabilirsin.


