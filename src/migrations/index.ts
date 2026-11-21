import * as migration_20261114_225605_initial from './20261114_225605_initial';
import * as migration_20261115_152522_processing_register_transfers from './20261115_152522_processing_register_transfers';
import * as migration_20261115_160745_video_static_mp4 from './20261115_160745_video_static_mp4';
import * as migration_20261116_065551_checkout_model from './20261116_065551_checkout_model';
import * as migration_20261116_183311_jobs_queue from './20261116_183311_jobs_queue';
import * as migration_20261116_183458_cart_token from './20261116_183458_cart_token';
import * as migration_20261119_213815_unavailable_alternatives from './20261119_213815_unavailable_alternatives';
import * as migration_20261120_202818_guides from './20261120_202818_guides';

export const migrations = [
  {
    up: migration_20261114_225605_initial.up,
    down: migration_20261114_225605_initial.down,
    name: '20261114_225605_initial',
  },
  {
    up: migration_20261115_152522_processing_register_transfers.up,
    down: migration_20261115_152522_processing_register_transfers.down,
    name: '20261115_152522_processing_register_transfers',
  },
  {
    up: migration_20261115_160745_video_static_mp4.up,
    down: migration_20261115_160745_video_static_mp4.down,
    name: '20261115_160745_video_static_mp4',
  },
  {
    up: migration_20261116_065551_checkout_model.up,
    down: migration_20261116_065551_checkout_model.down,
    name: '20261116_065551_checkout_model',
  },
  {
    up: migration_20261116_183311_jobs_queue.up,
    down: migration_20261116_183311_jobs_queue.down,
    name: '20261116_183311_jobs_queue',
  },
  {
    up: migration_20261116_183458_cart_token.up,
    down: migration_20261116_183458_cart_token.down,
    name: '20261116_183458_cart_token',
  },
  {
    up: migration_20261119_213815_unavailable_alternatives.up,
    down: migration_20261119_213815_unavailable_alternatives.down,
    name: '20261119_213815_unavailable_alternatives',
  },
  {
    up: migration_20261120_202818_guides.up,
    down: migration_20261120_202818_guides.down,
    name: '20261120_202818_guides'
  },
];
