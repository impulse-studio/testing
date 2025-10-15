(() => {
  // Generate selector for an element
  function generateSelectorInPage(element) {
    // Priority 1: Check for unique ID
    const id = element.getAttribute("id");
    if (id) {
      const selector = `#${id}`;
      const matches = document.querySelectorAll(selector);
      if (matches.length === 1) {
        return selector;
      }
    }

    // Priority 2: Check for data-testid or data-test attributes
    const testId = element.getAttribute("data-testid");
    if (testId) {
      const selector = `[data-testid="${testId}"]`;
      const matches = document.querySelectorAll(selector);
      if (matches.length === 1) {
        return selector;
      }
    }

    const dataTest = element.getAttribute("data-test");
    if (dataTest) {
      const selector = `[data-test="${dataTest}"]`;
      const matches = document.querySelectorAll(selector);
      if (matches.length === 1) {
        return selector;
      }
    }

    // Priority 3: Generate a path-based selector
    function getPath(el) {
      if (el.id) return `#${el.id}`;
      if (!el.parentElement) return el.tagName.toLowerCase();

      const siblings = Array.from(el.parentElement.children);
      const sameTagSiblings = siblings.filter((s) => s.tagName === el.tagName);

      if (sameTagSiblings.length === 1) {
        return `${getPath(el.parentElement)} > ${el.tagName.toLowerCase()}`;
      }

      const index = sameTagSiblings.indexOf(el) + 1;
      return `${getPath(el.parentElement)} > ${el.tagName.toLowerCase()}:nth-of-type(${index})`;
    }

    return getPath(element);
  }

  // Track if we've already attached listeners
  if (window.__impulse_listeners_attached) {
    return;
  }
  window.__impulse_listeners_attached = true;

  // Helper to check if element is part of impulse UI
  function isImpulseUI(element) {
    return !!(element.closest("#__impulse-testing__ui") || element.id === "__impulse-testing__ui");
  }

  // Click listener
  document.addEventListener(
    "click",
    (e) => {
      const target = e.target;
      if (isImpulseUI(target)) return;

      try {
        const selector = generateSelectorInPage(target);
        window.__impulse_captureEvent({
          type: "click",
          selector: selector,
        });
      } catch (err) {
        console.warn("Failed to generate selector for click:", err);
      }
    },
    true,
  );

  // Input listener (for text inputs and textareas)
  document.addEventListener(
    "input",
    (e) => {
      const target = e.target;
      if (isImpulseUI(target)) return;

      const inputType = target.getAttribute("type") || "text";

      // Only track text-based inputs
      if (
        target.tagName === "TEXTAREA" ||
        (target.tagName === "INPUT" &&
          ["text", "email", "password", "search", "tel", "url"].indexOf(inputType) !== -1)
      ) {
        try {
          const selector = generateSelectorInPage(target);
          window.__impulse_captureEvent({
            type: "input",
            selector: selector,
            value: target.value,
          });
        } catch (err) {
          console.warn("Failed to generate selector for input:", err);
        }
      }
    },
    true,
  );

  // Change listener (for selects, checkboxes, radios)
  document.addEventListener(
    "change",
    (e) => {
      const target = e.target;
      if (isImpulseUI(target)) return;

      try {
        const selector = generateSelectorInPage(target);
        const inputType = target.getAttribute("type");

        if (target.tagName === "SELECT") {
          window.__impulse_captureEvent({
            type: "change",
            selector: selector,
            value: target.value,
            inputType: "select",
          });
        } else if (inputType === "checkbox" || inputType === "radio") {
          window.__impulse_captureEvent({
            type: "change",
            selector: selector,
            checked: target.checked,
            inputType: inputType,
          });
        }
      } catch (err) {
        console.warn("Failed to generate selector for change:", err);
      }
    },
    true,
  );
})();
