import * as migration_20261114_225605_initial from './20261114_225605_initial';

export const migrations = [
  {
    up: migration_20261114_225605_initial.up,
    down: migration_20261114_225605_initial.down,
    name: '20261114_225605_initial',
  },
];
