import { CssClassMap } from "@ionic/core";

export const findItemLabel = (componentElement: HTMLElement) => {
  const itemElement = componentElement.closest('ion-item');
  if (itemElement) {
    return itemElement.querySelector('ion-label');
  }
  return null;
};

export const findItem = (componentEl: HTMLElement) => {
  const itemEl = componentEl.closest('ion-item');
  return itemEl;
};

export const addRippleEffectElement = (componentElement: HTMLElement) => {
  const itemElement = componentElement.closest('ion-item');
  if (!itemElement) {
    return;
  }
  const itemNative = itemElement.shadowRoot.querySelector('div.item-native');
  if (itemNative) {
    const ionRipple = itemNative.ownerDocument!.createElement('ion-ripple-effect');
    itemNative.appendChild(ionRipple);
  }
};

export const hostContext = (selector: string, element: HTMLElement): boolean => {
  return element.closest(selector) !== null;
};

export const renderHiddenInput = (
  always: boolean,
  container: HTMLElement,
  name: string,
  value: string | undefined | null,
  disabled: boolean
) => {
  if (always || hasShadowDom(container)) {
    let input = container.querySelector('input.aux-input') as HTMLInputElement | null;
    if (!input) {
      input = container.ownerDocument!.createElement('input');
      input.type = 'hidden';
      input.classList.add('aux-input');
      container.appendChild(input);
    }
    input.disabled = disabled;
    input.name = name;
    input.value = value || '';
  }
};

export const hasShadowDom = (element: HTMLElement) => {
  return !!element.shadowRoot && !!(element as any).attachShadow;
};

export const getClassMap = (classes: string | string[] | undefined): CssClassMap => {
  const map: CssClassMap = {};
  getClassList(classes).forEach((c) => (map[c] = true));
  return map;
};

export const getClassList = (classes: string | (string | null | undefined)[] | undefined): string[] => {
  if (classes !== undefined) {
    const array = Array.isArray(classes) ? classes : classes.split(' ');
    return array
      .filter((c) => c != null)
      .map((c) => (c as string).trim())
      .filter((c) => c !== '');
  }
  return [];
};
