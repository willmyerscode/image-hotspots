/**
 * Image Hotspots Plugin for Squarespace
 * Requires TippyJS and Popper to be loaded
 */

class ImageHotspots {
  constructor() {
    this.hotspotInstances = [];
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () =>
        this.processHotspots()
      );
    } else {
      this.processHotspots();
    }
  }

  processHotspots() {
    // Find all ImageHotspots elements
    const imageHotspotElements = document.querySelectorAll("ImageHotspots");

    imageHotspotElements.forEach(element => this.createHotspotInstance(element));
  }

  createHotspotInstance(element) {
    const blockId = element.getAttribute("block");
    if (!blockId) {
      console.warn("ImageHotspots: No block ID specified");
      return;
    }

    // Find the target image block
    const targetBlock = document.querySelector(blockId);
    if (!targetBlock) {
      console.warn(`ImageHotspots: Target block ${blockId} not found`);
      return;
    }

    // Find the image container within the block
    const imageContainer =
      targetBlock.querySelector(".fluid-image-container") ||
      targetBlock.querySelector(".sqs-image-content") ||
      targetBlock.querySelector("img").parentElement;

    targetBlock.dataset.wmPlugin = "image-hotspots";

    if (!imageContainer) {
      console.warn(`ImageHotspots: Image container not found in ${blockId}`);
      return;
    }

    // Process dots
    const dots = element.querySelectorAll("Dot");
    dots.forEach(dot => {
      this.createDot(dot, imageContainer, blockId);
    });

    // Store instance
    this.hotspotInstances.push({
      element,
      targetBlock,
      imageContainer,
      blockId,
    });

    // Hide the original ImageHotspots element
    element.style.display = "none";
  }

  createDot(dotElement, imageContainer, blockId) {
    const x = dotElement.getAttribute("x") || "50%";
    const y = dotElement.getAttribute("y") || "50%";

    // Get content
    const titleElement = dotElement.querySelector("DotTitle");
    const descriptionElement = dotElement.querySelector("DotDescription");

    const title = titleElement ? titleElement.textContent : "";
    const description = descriptionElement
      ? descriptionElement.innerHTML
        : "";

    // Create dot HTML element
    const dotDiv = document.createElement("div");
    dotDiv.className = "image-hotspot-dot";
    dotDiv.style.position = "absolute";
    
    // Use clamp to ensure dots stay within image boundaries
    // Uses the CSS custom property --dot-radius which is responsive
    dotDiv.style.left = `clamp(var(--dot-radius), ${x}, calc(100% - var(--dot-radius)))`;
    dotDiv.style.top = `clamp(var(--dot-radius), ${y}, calc(100% - var(--dot-radius)))`;
    dotDiv.style.transform = "translate(-50%, -50%)";
    dotDiv.innerHTML = title;

    // Ensure the image container has relative positioning
    const computedStyle = window.getComputedStyle(imageContainer);
    if (computedStyle.position === "static") {
      imageContainer.style.position = "relative";
    }

    // Add dot to image container
    imageContainer.appendChild(dotDiv);

    // Initialize Tippy tooltip if content exists
    if (description || title) {
      const tooltipContent = this.createTooltipContent(description);

      // Check if tippy is available
      if (typeof tippy !== "undefined") {
        // Find the site wrapper element, fallback to body
        const appendTarget = document.querySelector('#siteWrapper') || document.body;
        
        tippy(dotDiv, {
          content: tooltipContent,
          allowHTML: true,
          placement: "top",
          theme: "image-hotspot",
          arrow: true,
          offset: [0, 10],
          maxWidth: 300,
          interactive: true,
          appendTo: appendTarget,
          onCreate(instance) {
            // Add data-wm-plugin attribute to the tippy root element
            const tippyRoot = instance.popper.closest('[data-tippy-root]');
            if (tippyRoot) {
              tippyRoot.setAttribute('data-wm-plugin', 'image-hotspots');
            }
          },
        });
      } else {
        console.warn(
          "ImageHotspots: TippyJS not found. Please ensure TippyJS is loaded."
        );
      }
    }
  }

  createTooltipContent(description) {
    let content = '<div class="image-hotspot-tooltip">';
    
    if (description) {
      // If description contains HTML tags, parse and determine wrapping
      if (description.includes('<')) {
        // Parse HTML fragment using DOMParser
        const parser = new DOMParser();
        const doc = parser.parseFromString(description, 'text/html');
        
        // Define block-level tags that shouldn't be wrapped in <p>
        const blockTags = ['img', 'button', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                          'div', 'section', 'article', 'ul', 'ol', 'li', 'table', 
                          'tr', 'td', 'th', 'form', 'input', 'textarea', 'select', 
                          'p', 'blockquote', 'pre', 'hr', 'br'];
        
        // Check if any block-level tags are present
        const hasBlockTags = blockTags.some(tag => 
          doc.querySelector(tag) !== null
        );
        
        if (hasBlockTags) {
          // Contains block-level tags, use as-is
          content += description;
        } else {
          // Only contains inline/semantic tags, wrap in <p>
          content += `<p>${description}</p>`;
        }
      } else {
        // Plain text, wrap in <p>
        content += `<p>${description}</p>`;
      }
    }

    content += "</div>";
    return content;
  }

  // Method to refresh hotspots (useful for dynamic content)
  refresh() {
    // Clear existing instances
    this.hotspotInstances.forEach(instance => {
      const dots =
        instance.imageContainer.querySelectorAll(".image-hotspot-dot");
      dots.forEach(dot => dot.remove());
    });

    this.hotspotInstances = [];
    this.processHotspots();
  }

  // Method to destroy all hotspots
  destroy() {
    this.hotspotInstances.forEach(instance => {
      const dots =
        instance.imageContainer.querySelectorAll(".image-hotspot-dot");
      dots.forEach(dot => {
        // Destroy tippy instance if it exists
        if (dot._tippy) {
          dot._tippy.destroy();
        }
        dot.remove();
      });
    });

    this.hotspotInstances = [];
  }
}

(() => {
  // Auto-initialize when script loads
  let imageHotspotsInstance;

  // Initialize immediately or wait for DOM
  function initImageHotspots() {
    if (!imageHotspotsInstance) {
      imageHotspotsInstance = new ImageHotspots();
    }
  }

  // Initialize
  initImageHotspots();

  // Expose global methods
  window.ImageHotspots = {
    refresh: () => imageHotspotsInstance && imageHotspotsInstance.refresh(),
    destroy: () => imageHotspotsInstance && imageHotspotsInstance.destroy(),
    init: initImageHotspots,
  };
})();
