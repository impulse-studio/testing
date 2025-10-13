import { getCssSelector } from 'css-selector-generator';

/**
 * Generate a stable CSS selector for an element with priority:
 * 1. ID attribute (if unique)
 * 2. data-testid or data-test attributes
 * 3. Complex selector from css-selector-generator
 */
export function generateSelector(element: Element): string {
  // Priority 1: Check for unique ID
  const id = element.getAttribute('id');
  if (id) {
    const selector = `#${id}`;
    // Validate that this selector returns exactly one element
    const matches = document.querySelectorAll(selector);
    if (matches.length === 1) {
      return selector;
    }
  }

  // Priority 2: Check for data-testid or data-test attributes
  const testId = element.getAttribute('data-testid');
  if (testId) {
    const selector = `[data-testid="${testId}"]`;
    // Validate uniqueness
    const matches = document.querySelectorAll(selector);
    if (matches.length === 1) {
      return selector;
    }
  }

  const dataTest = element.getAttribute('data-test');
  if (dataTest) {
    const selector = `[data-test="${dataTest}"]`;
    // Validate uniqueness
    const matches = document.querySelectorAll(selector);
    if (matches.length === 1) {
      return selector;
    }
  }

  // Priority 3: Use css-selector-generator for complex selectors
  const selector = getCssSelector(element, {
    selectors: ['id', 'class', 'tag', 'attribute'],
    maxCombinations: 100,
  });

  // Validate the generated selector
  const matches = document.querySelectorAll(selector);
  if (matches.length !== 1) {
    throw new Error(
      `Generated selector "${selector}" matches ${matches.length} elements, expected exactly 1`
    );
  }

  return selector;
}
