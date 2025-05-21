export const SESSION_TIMEOUT: number = 1209600000;

export const BOLD_FONT_WEIGHT = 600;

export const PLAYER_INVITATIONS_FEATURE_FLAG = true;

// TODO: Create consistent modal styles, probably a custom modal component as well
export const MODAL_STYLE = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  minWidth: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
};

export const LINK_STYLE = {
  '&:hover': {
    cursor: 'pointer',
  },
};

export const SUBTITLE_VARIANT = 'h4';

export const NAVBAR_HEIGHT_PIXELS = '64px';

// (X, Y)
export const DEFAULT_STICKY_NOTE_DIMENSIONS: [number, number] = [225, 150];