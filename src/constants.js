export const DEMO = 0;
export const GAME = 1;
export const COMPLETE = 2;

export const DISK_HEIGHT = 0.2;
export const SLICES = 50;

// World-space X positions of the three towers
export const TOWER_X = [0, 4, 8];

// Parabolic arc peak height
export const Y_MAX = DISK_HEIGHT * 16; // 3.2

// Animation speed limits
export const STEPPING_MIN = 0.06;
export const STEPPING_MAX = 1.46;
export const STEPPING_DELTA = 0.05;

export const DEMO_STEPPING = 0.1;
export const GAME_STEPPING = 0.6;

// Frame counts (at 50fps ticks)
export const DEMO_PAUSE_TICKS = 125;
export const VICTORY_TICKS = 500;

// Disk color palette (7 colors cycling by disk index)
export const COLORS = [
  [0.9, 0.0, 0.0], // red
  [1.0, 0.5, 0.1], // orange
  [1.0, 1.0, 0.0], // yellow
  [0.0, 0.9, 0.1], // green
  [0.3, 0.8, 1.0], // cyan
  [0.1, 0.2, 1.0], // blue
  [0.5, 0.1, 1.0], // purple
];

// Lighting (matches C++ original)
export const LIGHT_DIR = [-1, 3.7, 15]; // directional (w=0), normalized in shader
export const AMBIENT = [0.2, 0.2, 0.2];
export const SPECULAR = [0.6, 0.6, 0.6];
export const SHININESS = 64.0;

// Camera
export const CAM_PAN_STEP = 0.3;
export const CAM_MIN_X = -6.7;
export const CAM_MAX_X = 12.7;
export const DEMO_CAM_MIN = -5.0;
export const DEMO_CAM_MAX = 11.0;
