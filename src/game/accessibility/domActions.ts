export type AccessibleSceneAction = Readonly<{
  label: string;
  activate: () => void;
}>;

export const createAccessibleSceneActions = (
  parent: HTMLElement,
  label: string,
  description: string,
  actions: readonly AccessibleSceneAction[],
): (() => void) => {
  const region = document.createElement('section');
  region.className = 'scene-accessibility-actions';
  region.setAttribute('aria-label', label);

  const summary = document.createElement('p');
  summary.textContent = description;
  region.append(summary);

  const listeners: Array<readonly [HTMLButtonElement, () => void]> = [];
  for (const action of actions) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = action.label;
    const listener = (): void => action.activate();
    button.addEventListener('click', listener);
    listeners.push([button, listener]);
    region.append(button);
  }

  parent.append(region);
  return (): void => {
    for (const [button, listener] of listeners) {
      button.removeEventListener('click', listener);
    }
    region.remove();
  };
};
