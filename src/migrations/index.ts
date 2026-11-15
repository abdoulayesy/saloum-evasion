import * as migration_20261114_225605_initial from './20261114_225605_initial';
import * as migration_20261115_152522_processing_register_transfers from './20261115_152522_processing_register_transfers';
import * as migration_20261115_160745_video_static_mp4 from './20261115_160745_video_static_mp4';

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
    name: '20261115_160745_video_static_mp4'
  },
];
