/* ==========================================
   SCRIPT.JS - Enflasyon Hesaplama Mantığı
   ========================================== */

document.addEventListener("DOMContentLoaded", function() {
    // 2026 yılı ilk 4 aylık enflasyon verileri dizisi
    const enflasyonVerileri2026 = [4.84, 2.96, 1.94, 4.18];

    // Bileşik (kümülatif) hesaplama başlangıç değeri
    let kume = 1;

    // Tüm oranları döngüye alarak bileşik çarpanı hesapla
    enflasyonVerileri2026.forEach(function(oran) {
        kume *= (1 + (oran / 100));
    });

    // Yüzdesel sonuca çevir ve virgülden sonra 2 basamak al
    let nihaiSonuc = ((kume - 1) * 100).toFixed(2);
    
    // Tarayıcı diline uygun formatlama (Noktayı virgüle çevirir: 14.64 -> 14,64)
    const formatliSonuc = "%" + nihaiSonuc.replace('.', ',');
    
    // HTML içindeki 'bilesik-sonuc' ID'sine sahip alanı bul ve güncelle
    const sonucElementi = document.getElementById("bilesik-sonuc");
    if (sonucElementi) {
        sonucElementi.innerText = formatliSonuc;
    }
    
    // Kontrol için konsola bilgi yazdır
    console.log("2026 İlk 4 Aylık Enflasyon Datası Başarıyla Hesaplandı: " + formatliSonuc);
});
