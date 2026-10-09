// Wake Up: load only the imported Tidewater Plaza stage.
import * as layout from './tidewater/layout.js';
import * as props from './tidewater/props.js';
import * as surfaces from './tidewater/surfaces.js';
import * as murals from './tidewater/murals.js';
export const STAGES={tidewater:{...layout,...props,...surfaces,...murals}};
