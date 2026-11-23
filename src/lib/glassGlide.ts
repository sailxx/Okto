import type { Action } from 'svelte/action';

const attributes = ['aria-current', 'aria-selected', 'aria-pressed'];
const selected = ':scope > :is(button[aria-current="page"], button[aria-selected="true"], button[aria-pressed="true"])';

/** One glass lens follows the selected button in a navigation or segmented control. */
export const glassGlide: Action<HTMLElement> = (group) => {
  const lens = document.createElement('span');
  lens.className = 'glide';
  lens.setAttribute('aria-hidden', 'true');
  group.prepend(lens);

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let previous: HTMLElement | null = null;
  let animation: Animation | undefined;
  let target = '';

  function update() {
    const current = group.querySelector<HTMLElement>(selected);
    if (!current?.offsetWidth || !current.offsetHeight) {
      animation?.cancel();
      previous = null;
      target = '';
      lens.hidden = true;
      return;
    }

    const { offsetLeft: x, offsetTop: y, offsetWidth: width, offsetHeight: height } = current;
    const end = `translate(${x}px, ${y}px)`;
    const geometry = `${end} ${width} ${height}`;
    if (target === geometry) {
      previous = current;
      return;
    }

    if (previous && current !== previous && !reducedMotion.matches) {
      const from = lens.getBoundingClientRect();
      const bounds = group.getBoundingClientRect();
      const fromX = from.left - bounds.left - group.clientLeft + group.scrollLeft;
      const fromY = from.top - bounds.top - group.clientTop + group.scrollTop;
      const dx = x - fromX;
      const dy = y - fromY;
      const vertical = Math.abs(dy) > Math.abs(dx);
      const stretch = Math.min(.26, Math.abs(vertical ? dy / height : dx / width) * .14);
      animation?.cancel();
      animation = lens.animate([
        { transform: `translate(${fromX}px, ${fromY}px) scale(${from.width / width}, ${from.height / height})` },
        { transform: `translate(${fromX + dx * .72}px, ${fromY + dy * .72}px) scale(${vertical ? 1 - stretch / 2 : 1 + stretch}, ${vertical ? 1 + stretch : 1 - stretch / 2})`, offset: .42 },
        { transform: end },
      ], { duration: 280, easing: getComputedStyle(group).getPropertyValue('--ease').trim() || 'ease-out' });
    } else {
      animation?.cancel();
    }

    lens.style.width = `${width}px`;
    lens.style.height = `${height}px`;
    lens.style.transform = end;
    lens.hidden = false;
    previous = current;
    target = geometry;
  }

  const resize = new ResizeObserver(update);
  function observeButtons() {
    resize.disconnect();
    resize.observe(group);
    for (const button of group.querySelectorAll(':scope > button')) resize.observe(button);
  }
  const selection = new MutationObserver((records) => {
    if (records.some((record) => record.type === 'childList' && record.target === group)) observeButtons();
    update();
  });
  selection.observe(group, { attributeFilter: attributes, childList: true, subtree: true });
  observeButtons();
  update();

  return {
    destroy() {
      animation?.cancel();
      selection.disconnect();
      resize.disconnect();
      lens.remove();
    },
  };
};
