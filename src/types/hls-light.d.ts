// Version allégée de hls.js (sans sous-titres intégrés ni DRM), chargée à la demande par le
// lecteur vidéo. Même API que la version complète, mais sans déclaration de types propre.
// Version figée à 1.5.20 : sa version allégée tient dans le budget de 100 Ko compressés du
// code chargé à la demande (1.7.x : environ 115 Ko).
declare module 'hls.js/dist/hls.light.mjs' {
  export { default } from 'hls.js';
}
