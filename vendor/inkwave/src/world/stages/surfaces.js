import {SURFACES} from './tidewater/surfaces.js';
export const FIRST_STAGE_SLOT=28,LAST_STAGE_SLOT=30;
export const STAGE_SURFACES=SURFACES.map(s=>({...s,stage:'tidewater',name:`tidewater:${s.name}`,group:3}));
