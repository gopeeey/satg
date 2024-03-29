// Uses linear interpolation to scale a number between two points
export const scaleNumber = (x, x0, x1, y0, y1) => {
  return y0 + ((x - x0) * (y1 - y0)) / (x1 - x0); // returns y
};
