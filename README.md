Spine

Okuduğum kitapları takip etmek için yaptığım küçük bir web uygulaması. Letterboxd'u kullanırken kitaplar için de böyle bir şey olsun istedim, Spine de bu fikirden çıktı.

Kitap arayıp rafa ekleyebiliyor, okuduklarını puanlayıp not düşebiliyorsun. Bitirdiğin kitaplar tarih sırasıyla bir günlükte listeleniyor.

Özellikler
Open Library üzerinden kitap arama (API anahtarı gerekmiyor)
Üç raf: Okumak istiyorum, Okuyorum, Okudum
5 yıldız üzerinden puanlama ve kitaplara yorum ekleme
Okunan kitapların günlüğü
Basit istatistikler: puan dağılımı, en çok okunan yazarlar, toplam sayfa sayısı
Kütüphaneyi JSON dosyası olarak dışa aktarma ve geri yükleme
Koyu tema, mobilde de düzgün görünüyor
Kullanılan teknolojiler
HTML, CSS, JavaScript (framework kullanmadım)
Open Library Search API ve Covers API
Veri saklama için tarayıcının localStorage'ı

Backend ya da veritabanı yok, her şey tarayıcıda çalışıyor. Bu yüzden veriler sadece kullandığın tarayıcıda duruyor. Başka bir cihaza taşımak için dışa aktarma özelliğini ekledim.

Dosyalar
spine-book-tracker/
├── index.html   # sayfa yapısı
├── style.css    # tasarım
├── app.js       # uygulamanın mantığı (arama, raflar, modal, istatistikler)
└── README.md
Çalıştırma

Kurulum gerektirmiyor. index.html dosyasını tarayıcıda açman yeterli. Arama kısmının sorunsuz çalışması için basit bir yerel sunucuyla açmak daha iyi:

bash
python3 -m http.server 8080

Sonra tarayıcıda http://localhost:8080 adresine git.

Nasıl çalışıyor?
Arama kutusuna yazılan kelime Open Library'nin search.json adresine gönderiliyor. Gelen sonuçlarda kapak, yazar ve ilk basım yılı gösteriliyor.
Bir kitap rafa eklendiğinde bilgileri localStorage'a kaydediliyor.
"Okudum" olarak işaretlenen kitaplar puan ve yorumla birlikte günlükte görünüyor.
Dışa aktar butonu tüm kütüphaneyi .json dosyası olarak indiriyor, içe aktar ile bu dosya geri yüklenebiliyor.
