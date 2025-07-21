/**
 * Image Hotspots Builder
 * Interactive GUI for creating image hotspots
 * 
 * Copyright 2025 Will Myers
**/

class ImageHotspotsBuilder {
  constructor() {
    this.container = document.getElementById('image-hotspot-builder');
    this.image = null;
    this.hotspots = [];
    this.selectedHotspot = null;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.hotspotCounter = 1;
    
    if (!this.container) {
      console.error('ImageHotspotsBuilder: Container #image-hotspot-builder not found');
      return;
    }
    
    this.init();
  }

  init() {
    this.createInterface();
    this.bindEvents();
    this.updateHotspotsList(); // Show initial empty state
  }

  createInterface() {
    this.container.innerHTML = `
      <div class="ihb-main">
        <div class="ihb-left-panel">

          <div class="ihb-upload-section" id="upload-section">
             <h3>Upload Image</h3>
             <p>Upload an image and click to add your interactive hotspots.</p>
             <div class="ihb-upload-area" id="upload-area">
              <div class="ihb-upload-content">
                <svg class="ihb-upload-icon" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                <p>Click to upload image or drag & drop</p>
                <small>Supports JPG, PNG, GIF, WebP</small>
              </div>
              <input type="file" id="image-upload" accept="image/*" style="display: none;">
            </div>
          </div>
          
          <div class="ihb-image-section" id="image-section" style="display: none;">
            <div class="ihb-image-container" id="image-container">
              <img id="preview-image" alt="Preview">
              <div class="ihb-hotspots-overlay" id="hotspots-overlay"></div>
            </div>
            
            <div class="ihb-image-controls">
              <button class="ihb-btn ihb-btn-secondary" id="clear-hotspots">Clear All Hotspots</button>
              <button class="ihb-btn ihb-btn-secondary" id="change-image">Change Image</button>
            </div>
          </div>
        </div>
        
        <div class="ihb-right-panel">
          <div class="ihb-hotspots-list">
            <h3>Edit Hotspots (<span id="hotspot-count">0</span>)</h3>
            <div class="ihb-hotspots-container" id="hotspots-list"></div>
          </div>
          
          <div class="ihb-hotspot-editor" id="hotspot-editor" style="display: none;">
            <h3>Edit Hotspot</h3>
            <div class="ihb-form-group">
              <label for="hotspot-title">Title:</label>
              <input type="text" id="hotspot-title" placeholder="Enter hotspot title">
            </div>
            
            <div class="ihb-form-group">
              <label for="hotspot-description">Description:</label>
              <div class="ihb-editor-toolbar">
                <button type="button" class="ihb-format-btn" data-format="bold">B</button>
                <button type="button" class="ihb-format-btn" data-format="italic">I</button>
                <button type="button" class="ihb-format-btn" data-format="underline">U</button>
                <button type="button" class="ihb-format-btn" data-format="insertUnorderedList">•</button>
                <button type="button" class="ihb-format-btn" data-format="createLink">🔗</button>
              </div>
              <div class="ihb-rich-editor" id="hotspot-description" contenteditable="true" 
                   placeholder="Enter hotspot description..."></div>
            </div>
            
            
            
            <div class="ihb-form-actions">
              <button class="ihb-btn ihb-btn-danger" id="delete-hotspot">Delete Hotspot</button>
              <button class="ihb-btn ihb-btn-primary" id="save-hotspot">Save Changes</button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="ihb-output-section">
        <h3>Copy your HTML.</h3>
        <p>Copy this HTML to your page header code injection area. Replace <code>#your-image-block-id</code> with the block id of your image.</p>
        <div class="ihb-code-section">
          <div class="ihb-code-header">
            <button class="ihb-btn ihb-btn-secondary" id="copy-code">Copy Code</button>
          </div>
          <textarea id="generated-code" readonly placeholder="Upload an image and add hotspots to generate code..."></textarea>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // File upload events
    const uploadArea = document.getElementById('upload-area');
    const imageUpload = document.getElementById('image-upload');
    
    uploadArea.addEventListener('click', () => imageUpload.click());
    uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
    uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
    imageUpload.addEventListener('change', (e) => this.handleImageUpload(e));
    
    // Image interaction events
    const imageContainer = document.getElementById('image-container');
    imageContainer.addEventListener('click', (e) => this.handleImageClick(e));
    
    // Hotspot editing events
    document.getElementById('hotspot-title').addEventListener('input', (e) => this.updateHotspotProperty('title', e.target.value));
    document.getElementById('hotspot-description').addEventListener('input', (e) => this.updateHotspotProperty('description', e.target.innerHTML));
    
    // Control buttons
    document.getElementById('clear-hotspots').addEventListener('click', () => this.clearAllHotspots());
    document.getElementById('change-image').addEventListener('click', () => this.changeImage());
    document.getElementById('delete-hotspot').addEventListener('click', () => this.deleteHotspot());
    document.getElementById('save-hotspot').addEventListener('click', () => this.saveHotspot());
    document.getElementById('copy-code').addEventListener('click', () => this.copyCode());
    
    // Rich text editor
    document.querySelectorAll('.ihb-format-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleTextFormat(e));
    });
  }

  handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('ihb-dragover');
  }

  handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('ihb-dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      this.processImageFile(files[0]);
    }
  }

  handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
      this.processImageFile(file);
    }
  }

  processImageFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.loadImage(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  loadImage(src) {
    const previewImage = document.getElementById('preview-image');
    previewImage.src = src;
    
    previewImage.onload = () => {
      // Hide upload section and show image section
      document.getElementById('upload-section').style.display = 'none';
      document.getElementById('image-section').style.display = 'block';
      this.image = previewImage;
      this.clearAllHotspots();
      this.generateCode();
    };
  }

  handleImageClick(e) {
    if (e.target.classList.contains('ihb-hotspot-dot')) {
      this.selectHotspot(e.target.dataset.hotspotId);
      return;
    }
    
    if (e.target.id === 'preview-image') {
      const rect = e.target.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      this.addHotspot(x, y);
    }
  }

  addHotspot(x, y) {
    const hotspot = {
      id: Date.now().toString(),
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      title: this.hotspotCounter.toString(),
      description: 'This is the tippy content'
    };
    
    this.hotspots.push(hotspot);
    this.hotspotCounter++;
    
    this.renderHotspots();
    this.updateHotspotsList();
    this.selectHotspot(hotspot.id);
    this.generateCode();
    
    // Focus on description and select all content for immediate editing
    setTimeout(() => {
      const descriptionEditor = document.getElementById('hotspot-description');
      if (descriptionEditor) {
        descriptionEditor.focus();
        
        // Select all content in the contenteditable div
        const range = document.createRange();
        range.selectNodeContents(descriptionEditor);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }, 50); // Small delay to ensure DOM is updated
  }

  renderHotspots() {
    const overlay = document.getElementById('hotspots-overlay');
    overlay.innerHTML = '';
    
    this.hotspots.forEach(hotspot => {
      const dotElement = document.createElement('div');
      dotElement.className = 'ihb-hotspot-dot';
      dotElement.dataset.hotspotId = hotspot.id;
      dotElement.style.left = `${hotspot.x}%`;
      dotElement.style.top = `${hotspot.y}%`;
      dotElement.textContent = hotspot.title;
      
      // Add drag functionality
      dotElement.addEventListener('mousedown', (e) => this.startDrag(e, hotspot.id));
      
      overlay.appendChild(dotElement);
    });
    
    // Initialize tooltips after all dots are rendered
    this.initializeTooltips();
    
    // Add global mouse events for dragging
    document.addEventListener('mousemove', (e) => this.handleDrag(e));
    document.addEventListener('mouseup', () => this.stopDrag());
  }

  startDrag(e, hotspotId) {
    e.preventDefault();
    e.stopPropagation();
    
    this.isDragging = true;
    this.selectedHotspot = hotspotId;
    
    const dotElement = e.target;
    const rect = dotElement.getBoundingClientRect();
    this.dragOffset = {
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2
    };
    
    dotElement.classList.add('ihb-dragging');
  }

  handleDrag(e) {
    if (!this.isDragging || !this.selectedHotspot) return;
    
    const imageRect = this.image.getBoundingClientRect();
    const x = ((e.clientX - this.dragOffset.x - imageRect.left) / imageRect.width) * 100;
    const y = ((e.clientY - this.dragOffset.y - imageRect.top) / imageRect.height) * 100;
    
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));
    
    const hotspot = this.hotspots.find(h => h.id === this.selectedHotspot);
    if (hotspot) {
      hotspot.x = Math.round(clampedX * 10) / 10;
      hotspot.y = Math.round(clampedY * 10) / 10;
      
      const dotElement = document.querySelector(`[data-hotspot-id="${this.selectedHotspot}"]`);
      if (dotElement) {
        dotElement.style.left = `${hotspot.x}%`;
        dotElement.style.top = `${hotspot.y}%`;
      }
      
      this.updateHotspotEditor();
    }
  }

  stopDrag() {
    if (this.isDragging) {
      this.isDragging = false;
      
      const draggingElement = document.querySelector('.ihb-dragging');
      if (draggingElement) {
        draggingElement.classList.remove('ihb-dragging');
      }
      
      this.generateCode();
    }
  }

  selectHotspot(hotspotId) {
    this.selectedHotspot = hotspotId;
    
    // Update visual selection on image
    document.querySelectorAll('.ihb-hotspot-dot').forEach(dot => {
      dot.classList.remove('ihb-selected');
    });
    
    const selectedDot = document.querySelector(`[data-hotspot-id="${hotspotId}"]`);
    if (selectedDot) {
      selectedDot.classList.add('ihb-selected');
    }
    
    // Update hotspot list to show active selection
    this.updateHotspotsList();
    this.updateHotspotEditor();
    document.getElementById('hotspot-editor').style.display = 'block';
  }

  updateHotspotEditor() {
    const hotspot = this.hotspots.find(h => h.id === this.selectedHotspot);
    if (!hotspot) return;
    
    document.getElementById('hotspot-title').value = hotspot.title;
    document.getElementById('hotspot-description').innerHTML = hotspot.description;
  }

  updateHotspotProperty(property, value) {
    const hotspot = this.hotspots.find(h => h.id === this.selectedHotspot);
    if (hotspot) {
      hotspot[property] = value;
      
      if (property === 'title') {
        const dotElement = document.querySelector(`[data-hotspot-id="${this.selectedHotspot}"]`);
        if (dotElement) {
          dotElement.textContent = value;
        }
      }
      
      if (property === 'description') {
        // Update tooltip content when description changes
        this.updateTooltipContent(this.selectedHotspot, value);
      }
      
      this.updateHotspotsList();
      this.generateCode();
    }
  }



  updateHotspotsList() {
    const listContainer = document.getElementById('hotspots-list');
    const countElement = document.getElementById('hotspot-count');
    
    countElement.textContent = this.hotspots.length;
    
    // Show appropriate message based on current state
    if (this.hotspots.length === 0) {
      if (!this.image) {
        // No image loaded yet
        listContainer.innerHTML = `
          <div class="ihb-empty-state">
            <div class="ihb-empty-icon">📷</div>
            <div class="ihb-empty-title">No Image Yet</div>
            <div class="ihb-empty-description">Upload an image above to get started</div>
          </div>
        `;
      } else {
        // Image loaded but no hotspots
        listContainer.innerHTML = `
          <div class="ihb-empty-state">
            <div class="ihb-empty-icon">📍</div>
            <div class="ihb-empty-title">No Hotspots Yet</div>
            <div class="ihb-empty-description">Click anywhere on the image to add your first hotspot</div>
          </div>
        `;
      }
    } else {
      // Show hotspots list
      listContainer.innerHTML = this.hotspots.map(hotspot => `
        <div class="ihb-hotspot-item ${this.selectedHotspot === hotspot.id ? 'ihb-selected' : ''}" 
             data-hotspot-id="${hotspot.id}">
          <div class="ihb-hotspot-preview">
            <div class="ihb-hotspot-dot-mini">${hotspot.title}</div>
            <div class="ihb-hotspot-info">
              <div class="ihb-hotspot-description">${this.stripHtml(hotspot.description)}</div>
            </div>
          </div>
        </div>
      `).join('');
      
      // Add click events to hotspot items
      listContainer.querySelectorAll('.ihb-hotspot-item').forEach(item => {
        item.addEventListener('click', () => {
          this.selectHotspot(item.dataset.hotspotId);
        });
      });
    }
  }

  deleteHotspot() {
    if (!this.selectedHotspot) return;
    
    // Destroy tooltip for the hotspot being deleted
    const dotElement = document.querySelector(`[data-hotspot-id="${this.selectedHotspot}"]`);
    if (dotElement && dotElement._tippy) {
      dotElement._tippy.destroy();
    }
    
    this.hotspots = this.hotspots.filter(h => h.id !== this.selectedHotspot);
    this.selectedHotspot = null;
    
    this.renderHotspots();
    this.updateHotspotsList();
    this.generateCode();
    
    document.getElementById('hotspot-editor').style.display = 'none';
  }

  saveHotspot() {
    // This is handled automatically by the input events
    // Just provide visual feedback
    const saveBtn = document.getElementById('save-hotspot');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Saved!';
    saveBtn.classList.add('ihb-btn-success');
    
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.classList.remove('ihb-btn-success');
    }, 1000);
  }

  clearAllHotspots() {
    // Destroy all existing tooltips
    const dots = document.querySelectorAll('.ihb-hotspot-dot');
    dots.forEach(dot => {
      if (dot._tippy) {
        dot._tippy.destroy();
      }
    });
    
    this.hotspots = [];
    this.selectedHotspot = null;
    this.hotspotCounter = 1;
    
    this.renderHotspots();
    this.updateHotspotsList();
    this.generateCode();
    
    document.getElementById('hotspot-editor').style.display = 'none';
  }

  changeImage() {
    // Show upload section again and clear image reference
    document.getElementById('upload-section').style.display = 'block';
    document.getElementById('image-section').style.display = 'none';
    this.image = null;
    this.updateHotspotsList();
    document.getElementById('image-upload').click();
  }

  handleTextFormat(e) {
    e.preventDefault();
    const format = e.target.dataset.format;
    
    if (format === 'createLink') {
      const url = prompt('Enter URL:');
      if (url) {
        document.execCommand('createLink', false, url);
      }
    } else {
      document.execCommand(format, false, null);
    }
    
    document.getElementById('hotspot-description').focus();
  }

  generateCode() {
    const codeOutput = document.getElementById('generated-code');
    
    if (this.hotspots.length === 0) {
      codeOutput.value = 'Upload an image and add hotspots to generate code...';
      return;
    }
    
    const hotspotsHtml = this.hotspots.map(hotspot => `  <Dot x="${hotspot.x}%" y="${hotspot.y}%">
    <DotTitle>${this.escapeHtml(hotspot.title)}</DotTitle>
    <DotDescription>${hotspot.description}</DotDescription>
  </Dot>`).join('\n\n');
    
    const fullHtml = `<ImageHotspots block="#your-image-block-id">
${hotspotsHtml}
</ImageHotspots>`;
    
    codeOutput.value = fullHtml;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  initializeTooltips() {
    // Only initialize if tippy is available
    if (typeof tippy === 'undefined') {
      console.warn('ImageHotspotsBuilder: TippyJS not found. Tooltips will not work in preview.');
      return;
    }

    // Find all hotspot dots and initialize tooltips
    const dots = document.querySelectorAll('.ihb-hotspot-dot');
    dots.forEach(dot => {
      const hotspotId = dot.dataset.hotspotId;
      const hotspot = this.hotspots.find(h => h.id === hotspotId);
      
      if (hotspot) {
        const tooltipContent = this.createTooltipContent(hotspot.description);
        
        // Destroy existing tooltip if it exists
        if (dot._tippy) {
          dot._tippy.destroy();
        }
        
        // Create new tooltip
        tippy(dot, {
          content: tooltipContent,
          allowHTML: true,
          placement: 'top',
          theme: 'image-hotspot',
          arrow: true,
          offset: [0, 10],
          maxWidth: 300,
          interactive: true,
          appendTo: document.body,
          // Prevent tooltip from showing during drag
          onShow: () => !this.isDragging,
          // Custom trigger to prevent conflicts with drag
          trigger: 'mouseenter focus',
          hideOnClick: false
        });
      }
    });
  }

  createTooltipContent(description) {
    // If description contains HTML tags, use it directly
    if (description && description.includes('<')) {
      return `<div class="image-hotspot-tooltip">${description}</div>`;
    }
    
    // Otherwise, wrap plain text in description div
    let content = '<div class="image-hotspot-tooltip">';
    
    if (description) {
      content += `<div class="image-hotspot-tooltip-description">${description}</div>`;
    }

    content += "</div>";
    return content;
  }

  updateTooltipContent(hotspotId, description) {
    // Only update if tippy is available
    if (typeof tippy === 'undefined') return;
    
    const dotElement = document.querySelector(`[data-hotspot-id="${hotspotId}"]`);
    if (dotElement && dotElement._tippy) {
      const newContent = this.createTooltipContent(description);
      dotElement._tippy.setContent(newContent);
    }
  }

  copyCode() {
    const codeOutput = document.getElementById('generated-code');
    codeOutput.select();
    document.execCommand('copy');
    
    const copyBtn = document.getElementById('copy-code');
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    copyBtn.classList.add('ihb-btn-success');
    
    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.classList.remove('ihb-btn-success');
    }, 1000);
  }
}

// Initialize the builder when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ImageHotspotsBuilder();
});
