export interface StickyNote {
  id: string;
  textContent: string;
  isDisplayed: boolean;
  isMinimized: boolean;

  // Number of pixels away from the top left window corner (X, Y)
  position: [number, number];
  dimensions: [number, number];
}