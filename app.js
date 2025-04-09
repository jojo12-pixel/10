// --- START OF FILE app.js ---

// ... (Imports remain the same) ...
import { config } from './config.js';
// ... (other imports) ...

// Initialize app state
const state = {
    // ... (existing state) ...
    isPreviewVisible: true // New state to track preview pane visibility
};

// ... (window.state, chatFeatures, genAI setup remain the same) ...

// Function to create the appropriate model instance based on selection
// ... (getSelectedModel remains the same) ...

// Get system instruction for the model
// ... (getSystemInstruction remains the same) ...

// Configure marked for syntax highlighting
// ... (marked.setOptions remains the same) ...

// DOM elements
const elements = {
    // ... (existing elements) ...
    previewToggleButton: document.getElementById('preview-toggle-button'), // Added
    leftPane: document.getElementById('left-pane'),         // Added
    rightPane: document.getElementById('right-pane'),       // Added
    resizer: document.getElementById('resizer'),           // Added
    mainAreaWrapper: document.querySelector('.main-area-wrapper'), // Added
};

// Event listeners
function setupEventListeners() {
    // ... (existing listeners for send, input, theme, refresh, download, image, new chat, paste, asset) ...

    // Navigation menu - MODIFIED
    elements.menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const view = item.getAttribute('data-view');
            if (view === 'preview-toggle') {
                togglePreviewPane(); // Specific handler for toggle button
            } else {
                changeView(view); // Handle other view changes
            }
        });
    });

    // ... (listeners for model select, project management, etc.) ...

    // --- START: Resizer Logic ---
    let isResizing = false;
    let startX, startWidth;

    elements.resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startWidth = elements.rightPane.offsetWidth;
        document.body.style.cursor = 'col-resize'; // Indicate resizing
        document.body.style.userSelect = 'none'; // Prevent text selection

        // Add listeners to the document to capture mouse move everywhere
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    });

    function handleMouseMove(e) {
        if (!isResizing) return;
        const currentX = e.clientX;
        const diffX = currentX - startX;
        let newWidth = startWidth - diffX; // Subtract because we move left to increase right pane

        // Apply constraints (min/max width from CSS or defined here)
        const minWidth = 250; // Example min width
        const maxWidthPercentage = 70; // Example max width percentage
        const containerWidth = elements.mainAreaWrapper.offsetWidth;
        const maxWidth = containerWidth * (maxWidthPercentage / 100);

        if (newWidth < minWidth) newWidth = minWidth;
        if (newWidth > maxWidth) newWidth = maxWidth;

        elements.rightPane.style.width = `${newWidth}px`;
        // No need to explicitly set left pane width if it uses flex: 1
    }

    function handleMouseUp() {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = 'default'; // Reset cursor
            document.body.style.userSelect = 'auto'; // Re-enable text selection
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
    }
    // --- END: Resizer Logic ---

    // Initialize preview state visually
    updatePreviewPaneVisibility();

} // End of setupEventListeners

// Populate model selector dropdown
// ... (populateModelSelector remains the same) ...

// Change the current model
// ... (changeModel remains the same) ...

// --- START: Preview Pane Toggle ---
function togglePreviewPane() {
    state.isPreviewVisible = !state.isPreviewVisible;
    updatePreviewPaneVisibility();
}

function updatePreviewPaneVisibility() {
    if (state.isPreviewVisible) {
        elements.rightPane.classList.remove('hidden');
        elements.resizer.classList.remove('hidden'); // Show resizer too
         // Optionally re-render preview when shown
        if (!elements.rightPane.classList.contains('hidden')) { // Check if it was actually hidden
           renderPreview();
        }
    } else {
        elements.rightPane.classList.add('hidden');
        elements.resizer.classList.add('hidden'); // Hide resizer too
    }
     // Update toggle button active state
     elements.previewToggleButton?.classList.toggle('active', state.isPreviewVisible);
}
// --- END: Preview Pane Toggle ---


// Change the current view (chat, export, projects) - MODIFIED
function changeView(view) {
    // Don't change if trying to switch to the same view
    if (state.currentView === view && view !== 'preview') return; // Allow re-rendering preview

    state.currentView = view; // Update state

    // Update menu items active state (excluding toggle button)
    elements.menuItems.forEach(item => {
        const itemView = item.getAttribute('data-view');
        if (itemView !== 'preview-toggle') {
             item.classList.toggle('active', itemView === view);
        }
    });
     // Ensure toggle button reflects current preview state
     elements.previewToggleButton?.classList.toggle('active', state.isPreviewVisible);


    // Update view containers within the LEFT pane
    const leftPaneViewContainers = elements.leftPane.querySelectorAll('.view-container');
    leftPaneViewContainers.forEach(container => {
        container.classList.toggle('active', container.id === `${view}-view`);
    });

    // Special handling: Render preview if visible, render export list if switching to export
    if (view === 'preview') { // If someone clicks the old (now hidden) preview button or triggers preview
        if (!state.isPreviewVisible) {
             togglePreviewPane(); // Show the pane if hidden
        } else {
             renderPreview(); // Just refresh if already visible
        }
    } else if (view === 'export') {
        renderFileList();
    } else if (view === 'projects') {
        renderProjectsList(); // Make sure projects list renders when switching to it
    }
    
    // Ensure chat is default view in left pane if nothing else matches
    const activeLeftView = elements.leftPane.querySelector('.view-container.active');
    if (!activeLeftView && elements.leftPane.querySelector('#chat-view')) {
        elements.leftPane.querySelector('#chat-view').classList.add('active');
        state.currentView = 'chat'; // Reset state if defaulted
         // Update chat menu item active state
         document.querySelector('.menu-item[data-view="chat"]')?.classList.add('active');
    }
}

// Toggle between light and dark themes
// ... (toggleTheme remains the same) ...

// Handle user message sending
// ... (sendMessage remains the same, sends message, gets response) ...

// Extract chat history for context
// ... (extractChatHistory remains the same) ...

// Add a message to the chat
// ... (addMessageToChat remains the same) ...

// Render AI response with typing effect
// ... (renderAIResponse remains the same) ...

// Extract files from AI response - MODIFIED slightly to trigger preview render reliably
function extractFilesFromResponse(text) {
    // ... (existing extraction logic) ...
     const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    let filesExtracted = false;
    
    // Clear previous files before extracting new ones? Optional.
    // state.files = {}; 

    while ((match = codeBlockRegex.exec(text)) !== null) {
        // ... (determine language and code) ...
        const language = match[1]?.toLowerCase() || '';
        const code = match[2].trim();

        if (language === 'html' || language === 'htm') {
            state.files['index.html'] = code;
            filesExtracted = true;
        } else if (language === 'css') {
            state.files['styles.css'] = code;
            filesExtracted = true;
        } else if (language === 'javascript' || language === 'js') {
            state.files['script.js'] = code;
            filesExtracted = true;
        } else if (language) {
            state.files[`file.${language}`] = code;
            filesExtracted = true;
        }
    }

    // ... (asset integration logic remains the same) ...

    // If files were extracted, render the preview immediately IF visible
    if (filesExtracted && state.isPreviewVisible) {
        renderPreview(); // Call renderPreview directly
        // No need for changeView('preview') anymore
    } else if (filesExtracted && !state.isPreviewVisible) {
        // Optional: maybe flash the toggle button or show a notification
        console.log("Files extracted, but preview pane is hidden.");
    }
}

// Render the preview of extracted files
// ... (renderPreview function remains mostly the same, just renders in the iframe) ...
// It should be called automatically by extractFilesFromResponse or refresh button

// Create a blob URL for the preview
// ... (createPreviewBlobUrl remains the same) ...

// Download all files as a zip
// ... (downloadAllFiles remains the same) ...

// Create and download a single HTML file with all content embedded
// ... (createAndDownloadSingleFile remains the same) ...

// Render the file list for export view
// ... (renderFileList remains the same, renders in the export-view container) ...

// Show copy feedback
// ... (showCopyFeedback remains the same) ...

// Download a single file
// ... (downloadFile remains the same) ...

// Handle image upload
// ... (handleImageUpload remains the same) ...

// Handle pasting images from clipboard
// ... (handleImagePaste remains the same) ...

// Handle asset upload
// ... (handleAssetUpload remains the same) ...

// Clear assets when starting a new chat - MODIFIED to reset view correctly
function clearChatAndAssets() {
    // ... (clear chat, reset state, clear assets) ...
    elements.messages.innerHTML = '';
    state.files = {};
    state.imageHistory = [];
    state.assets = [];
    clearAssets();
    window.state.assets = []; // Ensure global state is also cleared if used elsewhere

    // Switch view in left pane to chat
    changeView('chat'); // This now correctly targets the left pane

    // Reset input
    elements.userInput.value = '';
    elements.userInput.style.height = 'auto';
    
    // Clear preview pane
    elements.previewFrame.srcdoc = '<html><body></body></html>'; // Clear iframe

    // Reset project name and history
    state.currentProjectName = 'Untitled Project';
    if (elements.projectNameInput) {
        elements.projectNameInput.value = state.currentProjectName;
    }
     updateProjectHistory(true); // Create new project history entry

     // Optionally ensure preview pane is visible on new chat?
     // if (!state.isPreviewVisible) {
     //    togglePreviewPane();
     // }
}


// Helper functions
// ... (scrollToBottom, escapeHtml remain the same) ...

// Project functions
// ... (updateProjectHistory, saveCurrentProject, createNewProject, updateProjectName remain the same) ...

// Render projects list
// ... (renderProjectsList remains the same, renders in projects-view) ...

// Load project by ID - MODIFIED to update view state
function loadProjectById(id) {
     // Load project into current state
    if (loadProject(id, state)) {
        // ... (update project name input) ...
        const project = getCurrentProject();
        if (project) {
            state.currentProjectName = project.name;
            elements.projectNameInput.value = project.name;
        }

        // Render preview in the right pane IF VISIBLE
        if(state.isPreviewVisible) {
            renderPreview();
        } else {
            // Maybe just update the srcdoc silently?
            // Or leave it blank until preview is toggled on? Let's update silently.
             const html = buildPreviewHtml(); // Use a helper to build the HTML string
             elements.previewFrame.srcdoc = html || '<html><body>No preview available.</body></html>';
             if (html) createPreviewBlobUrl(html); // Update blob URL too
        }

        // Show confirmation
        showNotification('Project loaded successfully!');

        // Switch left pane view to chat
        changeView('chat');

         // Ensure chat history is scrolled
         scrollToBottom();
    } else {
        showNotification('Failed to load project', 'error');
    }
}

// Helper function to build preview HTML (used in loadProjectById and renderPreview)
function buildPreviewHtml() {
    if (Object.keys(state.files).length === 0) {
        return `
            <html>
                <body style="font-family: sans-serif; color: #333; display: flex; justify-content: center; align-items: center; height: 100vh; text-align: center; padding: 20px;">
                    <div>
                        <h2>No content to preview yet</h2>
                        <p>Ask the AI to create something for you, or load a project!</p>
                    </div>
                </body>
            </html>
        `;
    }
    let html = state.files['index.html'] || '';
    const css = state.files['styles.css'] || '';
    const js = state.files['script.js'] || '';

    if (!html && (css || js)) {
        html = `
        <!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Generated Preview</title></head><body><div id="app"></div></body></html>`;
    }
    if (html) {
        if (css) html = html.replace('</head>', `<style>${css}</style></head>`);
        if (js) html = html.replace('</body>', `<script>${js}</script></body>`);
    }
    return html;
}

// Modify renderPreview to use the helper
function renderPreview() {
    const html = buildPreviewHtml();
    elements.previewFrame.srcdoc = html;
    if (chatFeatures.newTabPreview && html && Object.keys(state.files).length > 0) {
        createPreviewBlobUrl(html);
    }
}


// Delete project by ID
// ... (deleteProjectById remains the same) ...

// Show notification
// ... (showNotification remains the same) ...

// Initialize the app
function initApp() {
    setupEventListeners();
    // Load project history and render list
    loadProjectHistory();
    renderProjectsList(); // Render initial list if projects view exists

     // Set up current project name if exists
    const currentProject = getCurrentProject();
    if (currentProject) {
        state.currentProjectName = currentProject.name;
        elements.projectNameInput.value = currentProject.name;
        // Optionally load the last active project on startup?
        // loadProjectById(currentProject.id);
    } else {
         // If no current project, create one
         updateProjectHistory(true);
         state.currentProjectName = 'Untitled Project';
         elements.projectNameInput.value = state.currentProjectName;
    }

     // Set initial view to chat
     changeView('chat');
     // Set initial preview visibility
     updatePreviewPaneVisibility(); // Ensure pane is visible/hidden based on default state.isPreviewVisible

     // Add welcome message
     // Moved welcome message creation to HTML for simplicity, but could be added dynamically here
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// --- END OF FILE app.js ---
