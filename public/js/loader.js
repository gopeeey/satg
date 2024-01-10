export const show = () => {
  const el = document.getElementById("loader");
  if (!el) return;
  el.style.display = "flex";
};

export const hide = () => {
  const el = document.getElementById("loader");
  if (!el) return;
  el.style.display = "none";
};

export default {
  show,
  hide,
};
