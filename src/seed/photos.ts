import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Payload } from 'payload';
import sharp from 'sharp';
import { MEDIA_MIN_WIDTH } from '@/collections/Media';
import type { Bilingual } from './content';

// Photos fournies par l'équipe (dossier `public/activites illustration/`, non versionné) :
// importées par le seed quand le dossier est présent, sinon le seed garde ses visuels de
// remplacement. Textes alternatifs = ce que montre réellement la photo (WCAG 1.1.1), sans
// affirmer un lieu non vérifié. Provenance « à vérifier » : auteur, droits et lieu exacts
// doivent être confirmés avant toute mise en ligne (constitution V).

export const PHOTO_DIR = join(process.cwd(), 'public', 'activites illustration');

const MAX_WIDTH = 2000;

export const photoCatalog = {
  horseRide: {
    file: 'balade-en-cheval.jpg',
    alt: {
      fr: 'Trois cavaliers à cheval sous un baobab, dans la savane sèche',
      en: 'Three riders on horseback under a baobab in the dry savannah',
    },
  },
  sunset: {
    file: 'couche du soleil.jpg',
    alt: {
      fr: 'Avant d’un bateau face au coucher du soleil sur le fleuve',
      en: 'The bow of a boat facing the sunset over the river',
    },
  },
  bolongPirogue: {
    file: 'excursion bateau 2.jpg',
    alt: {
      fr: 'Voyageurs dans une pirogue au toit coloré, entre les palétuviers d’un bolong',
      en: 'Travellers in a pirogue with a colourful canopy, between the mangroves of a bolong',
    },
  },
  groupPirogue: {
    file: 'excursion-en-bateau.webp',
    alt: {
      fr: 'Groupe de voyageurs installés dans une pirogue couverte, sur le fleuve',
      en: 'A group of travellers seated in a covered pirogue on the river',
    },
  },
  mangroveKayak: {
    file: 'excursion2.webp',
    alt: {
      fr: 'Deux kayakistes pagaient dans un chenal bordé de mangrove',
      en: 'Two kayakers paddling along a channel lined with mangroves',
    },
  },
  cormorants: {
    file: 'ile des oiseaux 2.jpg',
    alt: {
      fr: 'Cormorans et pélicans sur un banc de sable, un baobab à l’arrière-plan',
      en: 'Cormorants and pelicans on a sandbank, a baobab in the background',
    },
  },
  gullColony: {
    file: 'ile des oiseaux 3.jpg',
    alt: {
      fr: 'Colonie de goélands et de sternes sur une plage de sable',
      en: 'A colony of gulls and terns on a sandy beach',
    },
  },
  egret: {
    file: 'ile des oiseaux.jpg',
    alt: {
      fr: 'Aigrette blanche perchée dans les palétuviers',
      en: 'A white egret perched in the mangrove trees',
    },
  },
  familyKayak: {
    file: 'Iles-du-Saloum-Decouverte-2.jpg',
    alt: {
      fr: 'Deux enfants en kayak sur une eau turquoise, devant la mangrove',
      en: 'Two children in a kayak on turquoise water, in front of the mangroves',
    },
  },
  flagPirogue: {
    file: 'les-iles-du-saloum-2024 (1).jpg',
    alt: {
      fr: 'Deux voyageuses photographient le paysage depuis une pirogue au drapeau sénégalais',
      en: 'Two travellers photographing the landscape from a pirogue flying the Senegalese flag',
    },
  },
  aerialMangrove: {
    file: 'mangrove.jpg',
    alt: {
      fr: 'Vue aérienne des méandres d’un bolong à travers la mangrove',
      en: 'Aerial view of a bolong winding through the mangroves',
    },
  },
  quad: {
    file: 'randonnee-quad-senegal1-cropped.jpg',
    alt: {
      fr: 'Deux quads et leurs passagers sur une piste de sable',
      en: 'Two quad bikes and their riders on a sandy track',
    },
  },
  giraffe: {
    file: 'reserve de bandia.jpg',
    alt: {
      fr: 'Girafe parmi les acacias de la réserve de Bandia',
      en: 'A giraffe among the acacias of the Bandia reserve',
    },
  },
  microlight: {
    file: 'ulm-balade.webp',
    alt: {
      fr: 'Avion ULM rouge et blanc sur une piste en terre',
      en: 'A red and white microlight aircraft on a dirt airstrip',
    },
  },
  // Photos haute définition de l'équipe (iPhone, HEIC converti par ffmpeg).
  jetty: {
    file: 'IMG_0269.HEIC',
    alt: {
      fr: 'Ponton en bois qui part d’une plage vers un abri posé sur l’eau',
      en: 'A wooden jetty running from a beach to a shelter on the water',
    },
  },
  jettyGarden: {
    file: 'IMG_0273.heic',
    alt: {
      fr: 'Jardin ombragé qui descend vers la plage et un ponton',
      en: 'A shady garden sloping down to the beach and a jetty',
    },
  },
  bolongLodge: {
    file: 'IMG_0300.HEIC',
    alt: {
      fr: 'Bolong bordé de mangrove, une construction au bord de l’eau au loin',
      en: 'A bolong lined with mangroves, a building on the water’s edge in the distance',
    },
  },
  bolongPontoons: {
    file: 'IMG_0306.HEIC',
    alt: {
      fr: 'Bolong avec des pontons et des abris sur l’eau, sous un ciel nuageux',
      en: 'A bolong with jetties and shelters on the water, under a cloudy sky',
    },
  },
  bolongChannel: {
    file: 'IMG_0309.HEIC',
    alt: {
      fr: 'Chenal calme entre deux massifs de mangrove',
      en: 'A calm channel between two stands of mangroves',
    },
  },
  bolongBend: {
    file: 'IMG_0315.HEIC',
    alt: {
      fr: 'Bolong qui serpente entre les palétuviers, sous les nuages',
      en: 'A bolong winding between the mangrove trees, under the clouds',
    },
  },
  bolongWide: {
    file: 'IMG_0386.HEIC',
    alt: {
      fr: 'Large bolong entre deux rives de mangrove',
      en: 'A wide bolong between two banks of mangroves',
    },
  },
  villageWaterfront: {
    file: 'IMG_0391.heic',
    alt: {
      fr: 'Pirogues amarrées devant un village bordé de palmiers',
      en: 'Pirogues moored in front of a village lined with palm trees',
    },
  },
  villageShore: {
    file: 'IMG_0392.heic',
    alt: {
      fr: 'Pirogues colorées le long du rivage d’un village',
      en: 'Colourful pirogues along the shore of a village',
    },
  },
  villaCorridor: {
    file: 'app1a.jpg',
    alt: {
      fr: 'Couloir intérieur aux murs blancs, avec des étagères en bois',
      en: 'An indoor corridor with white walls and wooden shelves',
    },
  },
  villaFacade: {
    file: 'app1b.jpg',
    alt: {
      fr: 'Façade en pierre avec une baie vitrée, derrière un palmier',
      en: 'A stone façade with a glass door, behind a palm tree',
    },
  },
  villaTerrace: {
    file: 'app1c.jpg',
    alt: {
      fr: 'Terrasse couverte d’une pergola en bois, contre un mur de pierre',
      en: 'A terrace covered by a wooden pergola, against a stone wall',
    },
  },
  villaPool: {
    file: 'app1d.jpg',
    alt: {
      fr: 'Piscine dans un jardin arboré, une personne se baigne',
      en: 'A swimming pool in a leafy garden, with someone swimming',
    },
  },
  familyMeal: {
    file: 'en famille.jpg',
    alt: {
      fr: 'Famille attablée autour d’un repas de plats sénégalais',
      en: 'A family gathered round a table of Senegalese dishes',
    },
  },
  boatTrip: {
    file: 'excursion en bateau.jpg',
    alt: {
      fr: 'Voyageuse au chapeau de paille installée à l’avant d’un bateau, sur le bolong',
      en: 'A traveller in a straw hat sitting at the bow of a boat on the bolong',
    },
  },
  quadYard: {
    file: 'squad.jpg',
    alt: {
      fr: 'Quatre quads et leurs pilotes dans une cour plantée de palmiers',
      en: 'Four quad bikes and their riders in a yard with palm trees',
    },
  },
  clearWater: {
    file: 'IMG-20261115-WA0017.jpg',
    alt: {
      fr: 'Pied dans une eau claire et peu profonde',
      en: 'A foot in clear, shallow water',
    },
  },
} as const satisfies Record<string, { file: string; alt: Bilingual }>;

/** HEIC (iPhone) : sharp ne le décode pas ; ffmpeg le convertit en JPEG, s'il est installé. */
const readPhoto = (path: string): Buffer | null => {
  if (!path.toLowerCase().endsWith('.heic')) return readFileSync(path);
  const result = spawnSync(
    'ffmpeg',
    [
      '-v',
      'error',
      '-i',
      path,
      '-frames:v',
      '1',
      '-q:v',
      '2',
      '-f',
      'image2pipe',
      '-vcodec',
      'mjpeg',
      '-',
    ],
    { maxBuffer: 64 * 1024 * 1024 },
  );
  return result.status === 0 && result.stdout.length > 0 ? result.stdout : null;
};

export type PhotoKey = keyof typeof photoCatalog;

const PHOTO_KEYS = Object.keys(photoCatalog).filter((key): key is PhotoKey => key in photoCatalog);

/** Importe les photos disponibles ; renvoie l'identifiant du média de chaque photo importée. */
export const importPhotos = async (
  payload: Payload,
  context: Record<string, unknown>,
): Promise<Partial<Record<PhotoKey, number>>> => {
  const ids: Partial<Record<PhotoKey, number>> = {};
  if (!existsSync(PHOTO_DIR)) return ids;
  for (const key of PHOTO_KEYS) {
    const photo = photoCatalog[key];
    const path = join(PHOTO_DIR, photo.file);
    const file = existsSync(path) ? readPhoto(path) : null;
    if (!file) continue;
    const source = sharp(file).rotate();
    const width = (await source.metadata()).width ?? 0;
    // Décision du propriétaire (2026-11-15) : en démonstration, une photo plus étroite que le
    // minimum du CMS est agrandie au minimum et signalée « original HD à fournir ».
    const upscaled = width < MEDIA_MIN_WIDTH;
    const data = await source
      .resize({ width: upscaled ? MEDIA_MIN_WIDTH : Math.min(width, MAX_WIDTH) })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();
    const doc = await payload.create({
      collection: 'media',
      context,
      data: {
        alt: { fr: photo.alt.fr, en: photo.alt.en },
        provenance: {
          author: upscaled
            ? `À vérifier (photo fournie, droits à confirmer ; agrandie depuis ${width} px, original HD à fournir)`
            : 'À vérifier (photo fournie, droits à confirmer)',
          place: 'Sénégal (lieu exact à confirmer)',
          date: '2026-11-15',
        },
      },
      file: {
        data,
        mimetype: 'image/jpeg',
        name: `${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}.jpg`,
        size: data.length,
      },
    });
    ids[key] = doc.id;
  }
  return ids;
};
