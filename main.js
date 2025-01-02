import './style.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';

import { Vector as VectorSource } from 'ol/source.js';
import VectorLayer from 'ol/layer/Vector';
import GeoJSON from 'ol/format/GeoJSON.js';
import { fromLonLat } from 'ol/proj.js';
import { Icon, Style } from 'ol/style.js';
import Overlay from 'ol/Overlay';

const kabRiau = new VectorLayer({
  source: new VectorSource({
    url: 'data/polygonpku.json',
    format: new GeoJSON(),
  }),
});

const riau = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON(),
    url: 'data/polygonpku.json',
  }),
});


const laundry = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON(),
    url: 'data/laundrypku.json',
  }),
  style: new Style({
    image: new Icon({
      anchor: [0.5, 46],
      anchorXUnits: 'fraction',
      anchorYUnits: 'pixels',
      src: 'icon/laundryic.png',
      width: 32,
      height: 32,
    }),
  }),
});

const container = document.getElementById('popup');
const content_element = document.getElementById('popup-content');
const closer = document.getElementById('popup-closer');

const popup = new Overlay({
  element: container,
  positioning: 'top-center',
  stopEvent: false,
  offset: [0, -15],
});


const map = new Map({
  target: "map",
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    kabRiau,
    laundry,
  ],
  overlays: [popup],
  view: new View({
    center: fromLonLat([101.447777, 0.507068]),
    zoom: 12,
  }),

  // view: new View({
  //   center: fromLonLat([101.6309, 0.55044]),
  //   zoom: 12,
  // }),
});

map.addOverlay(popup);

map.on('singleclick', function (evt) {
  const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
    return feature;
  });

  if (feature) {
    const coordinates = feature.getGeometry().getCoordinates();
    const gambar = feature.get('Gambar'); 
    const namaLaundry = feature.get('Nama_Pemetaan') || 'Tidak diketahui';
    const alamatLaundry = feature.get('Alamat') || 'Tidak diketahui';
    const kontakLaundry = feature.get('Informasi Kontak') || 'Tidak tersedia';
    const detailLaundry = feature.get('Informasi Detail') || 'Tidak tersedia';

    let content = `
      <h3>Informasi Laundry (Klik Untuk Detail)</h3>
      ${gambar ? `<a href="detail.html?namaLaundry=${encodeURIComponent(namaLaundry)}">Gambar: <img src="GambarLaundry/${gambar}" alt="Foto Laundry" style="width: 200px; height: auto;"></a>` : '<p>Gambar: <em>Tidak tersedia</em></p>'}
      <p>Nama Laundry: <strong>${namaLaundry}</strong></p>
      <p>Alamat Laundry: ${alamatLaundry}</p>
      <p>Kontak Laundry: ${kontakLaundry}</p>
      
    `;

    document.getElementById('popup-content').innerHTML = content;
    popup.setPosition(coordinates);
  } else {
    popup.setPosition(undefined);
  }
});

const urlParams = new URLSearchParams(window.location.search);
const filterNamaLaundry = urlParams.get('namaLaundry');

laundry.getSource().on('featuresloadend', () => {
  if (filterNamaLaundry) {
    const features = laundry.getSource().getFeatures();
    const filteredFeatures = features.filter(feature => 
      feature.get('Nama_Pemetaan') === filterNamaLaundry
    );

    // Hapus semua fitur dari layer dan tambahkan fitur yang difilter
    laundry.getSource().clear();
    laundry.getSource().addFeatures(filteredFeatures);

    // Jika ada fitur yang sesuai, ambil informasi dan tampilkan di elemen HTML
    if (filteredFeatures.length > 0) {
      const feature = filteredFeatures[0]; // Ambil fitur pertama yang cocok
      const namaLaundry = feature.get('Nama_Pemetaan');
      const alamatLaundry = feature.get('Alamat');
      const kontakLaundry = feature.get('Informasi Kontak')
      const detailLaundry = feature.get("Informasi Detail");
      const gambar = feature.get("Gambar")

      // Masukkan data ke elemen HTML
      const namaLaundryText = document.getElementById("nama_laundry");
      const alamatLaundryText = document.getElementById("alamat");
      const kontakLaundryText = document.getElementById("informasi_kontak");
      const detailLaundryText = document.getElementById("informasi_detail");
      let gambarLaundryImg = document.querySelectorAll(".gambar")


      gambarLaundryImg.forEach((img) => {
        img.src = `GambarLaundry/${gambar}`;
      });

      namaLaundryText.innerHTML = namaLaundry || 'Nama tidak ditemukan';
      alamatLaundryText.innerHTML = alamatLaundry || 'Alamat tidak ditemukan';
      kontakLaundryText.innerHTML = kontakLaundry || 'Kontak tidak ditemukan';
      detailLaundryText.innerHTML = detailLaundry || 'Deskripsi tidak ditemukan'
      
    } else {
      // Jika tidak ada fitur yang cocok
      namaLaundryText.innerHTML = 'Tidak ditemukan';
      kontakLaundryText.innerHTML ='Tidak ditemukan';
      alamatLaundryText.innerHTML = 'Tidak ditemukan';
      detailLaundryText.innerHTML = 'Tidak ditemukan';
    }
  }
});


laundry.getSource().refresh();


const featureOverlay = new VectorLayer({
  source: new VectorSource(),
  map: map,
  style: {
    'stroke-color': 'rgba(255, 255, 255, 0.7)',
    'stroke-width': 2,
  },
});


document.querySelector('input[type="text"]').addEventListener('input', (e) => {
  const searchValue = e.target.value.toLowerCase();
  const features = laundry.getSource().getFeatures();

  const filteredFeatures = features.filter(feature => 
    feature.get('Nama_Pemetaan').toLowerCase().includes(searchValue)
  );

  laundry.getSource().clear();
  laundry.getSource().addFeatures(filteredFeatures);
});

let highlight;


const highlightFeature = function (pixel) {
  const feature = map.forEachFeatureAtPixel(pixel, function (feature) {
    return feature;
  });

  if (feature !== highlight) {
    if (highlight) {
      featureOverlay.getSource().removeFeature(highlight);
    }
    if (feature) {
      featureOverlay.getSource().addFeature(feature);
    }
    highlight = feature;
  }
};


const displayFeatureInfo = function (pixel) {
  const feature = map.forEachFeatureAtPixel(pixel, function (feat) {
    return feat;
  });

  const info = document.getElementById('info');
  if (feature) {
    info.innerHTML = feature.get('Kabupaten') || '&nbsp;';
  } else {
    info.innerHTML = '&nbsp;';
  }
};


map.on('pointermove', function (evt) {
  if (evt.dragging) {
    popup.setPosition(undefined);
    return;
  }
  const pixel = map.getEventPixel(evt.originalEvent);
  highlightFeature(pixel);
  displayFeatureInfo(pixel);
});


const polygonLayerCheckbox = document.getElementById('polygon');
const pointLayerCheckbox = document.getElementById('point');

polygonLayerCheckbox.addEventListener('change', function () {
  kabRiau.setVisible(polygonLayerCheckbox.checked);
});

pointLayerCheckbox.addEventListener('change', function () {
  laundry.setVisible(pointLayerCheckbox.checked);
});


document.getElementById('search-input').addEventListener('input', function (e) {
  const searchValue = e.target.value.toLowerCase();

  console.log(searchValue)
  performSearch(searchValue);
});


function performSearch(keyword) {
  const features = laundry.getSource().getFeatures();
  const filteredFeatures = features.filter(feature => 
      feature.get('Nama_Pemetaan').toLowerCase().includes(keyword)
  );

  laundry.getSource().clear();
  laundry.getSource().addFeatures(filteredFeatures);

  if (filteredFeatures.length > 0) {
    const extent = new VectorSource({ features: filteredFeatures }).getExtent();
    map.getView().fit(extent, {
        duration: 1000,
        padding: [50, 50, 50, 50], // Tambahkan padding (atas, kanan, bawah, kiri)
        maxZoom: 20 // Atur zoom maksimal, misalnya ke level 15
    });
}
}


