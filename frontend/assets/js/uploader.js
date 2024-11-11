let uppy = null;

function setupUppyEventListeners() {
    const uploadButton = document.getElementById('upload-button');
    const pauseButton = document.getElementById('pause-button');
    const resumeButton = document.getElementById('resume-button');
    const progressElement = document.getElementById('progress');
    const fileListElement = document.getElementById('file-list');
    const debugElement = document.getElementById('debug');

    uppy.on('file-added', (file) => {
        uploadButton.disabled = false;
        fileListElement.textContent = `Selected: ${file.name}`;
    });

    uppy.on('file-removed', (file) => {
        if (uppy.getFiles().length === 0) {
            uploadButton.disabled = true;
            fileListElement.textContent = '';
        }
    });

    uploadButton.addEventListener('click', () => {
        uppy.upload();
    });

    uppy.on('transloadit:upload', (stepName, progress) => {
        console.log(`Upload progress for ${stepName}:`, progress);
        progressElement.textContent = `Uploading: ${Math.floor(progress.percentage)}%`;
    });

    uppy.on('transloadit:assembly-created', (assembly) => {
        console.log('Assembly created:', assembly.assembly_id);
        console.log('Assembly URL:', assembly.assembly_url);
        progressElement.textContent = `Assembly created, ID: ${assembly.assembly_id}`;
    });

    uppy.on('transloadit:assembly-executing', (assembly) => {
        progressElement.textContent = 'Processing images...';
    });

    uppy.on('transloadit:result', (stepName, result) => {
        console.log(`Result for ${stepName}:`, result);
        progressElement.textContent = `Processing ${stepName}...`;
    });

    uppy.on('transloadit:complete', (assembly) => {
        console.log('Transloadit assembly complete:', assembly);

        const results = assembly.results;
        let successMessage = 'Upload complete! Files stored:';

        const versions = ['store_original', 'store_thumbnail', 'store_medium', 'store_webp'];
        versions.forEach(version => {
            if (results[version] && results[version].length > 0) {
                successMessage += `\n${version}: ${results[version].length} files`;
            }
        });

        progressElement.textContent = successMessage;
        uploadButton.disabled = true;
        pauseButton.disabled = true;
        resumeButton.disabled = true;
        fileListElement.textContent = '';

        const pasteArea = document.getElementById('paste-area');
        pasteArea.innerHTML = '<span class="paste-instructions">Paste image here (Ctrl+V or ⌘+V)</span>';
        const preview = document.getElementById('preview');
        preview.innerHTML = '';
    });

    uppy.on('upload-error', (file, error, response) => {
        console.error('Upload error:', error);
        const errorDetails = `Upload error:\n${error.message}\n\nFull error:\n${JSON.stringify(error, null, 2)}`;
        debugElement.textContent = errorDetails;
        progressElement.innerHTML = `<div class="error">Upload failed: ${error.message}</div>`;
        uploadButton.disabled = true;
        pauseButton.disabled = true;
        resumeButton.disabled = true;
    });

    uppy.on('error', (error) => {
        console.error('General error:', error);
        debugElement.textContent = `Error: ${error.message}`;
    });

    uppy.on('upload-progress', (file, progress) => {
        const percentage = Math.floor((progress.bytesUploaded / progress.bytesTotal) * 100);
        progressElement.textContent = `${file.name}: ${percentage}% uploaded`;
        
        // Enable pause button during active upload
        if (percentage > 0 && percentage < 100) {
            pauseButton.disabled = false;
        }
        console.log(`Upload progress: ${percentage}% - pause button enabled`);
    });

    // Updated upload control event handlers
    uppy.on('upload-start', () => {
        uploadButton.disabled = true;
        pauseButton.disabled = false;
        resumeButton.disabled = true;
        console.log('Upload started - enabling pause button');
    });

    uppy.on('upload-pause', (fileID) => {
        pauseButton.disabled = true;
        resumeButton.disabled = false;
        progressElement.textContent += ' (Paused)';
        console.log('Upload paused - enabling resume button');
    });

    uppy.on('upload-resume', (fileID) => {
        pauseButton.disabled = false;
        resumeButton.disabled = true;
        progressElement.textContent = progressElement.textContent.replace(' (Paused)', '');
        console.log('Upload resumed - enabling pause button');
    });

    pauseButton.addEventListener('click', () => {
        console.log('Pause clicked - enabling resume');
        uppy.pauseAll();
        // First update the UI to show paused state
        pauseButton.disabled = true;
        resumeButton.disabled = false;  // Enable resume immediately on pause
        progressElement.textContent += ' (Paused)';
    });

    resumeButton.addEventListener('click', () => {
        console.log('Resume clicked - enabling pause');
        uppy.resumeAll();
        // Update UI to show active upload state
        pauseButton.disabled = false;
        resumeButton.disabled = true;
        progressElement.textContent = progressElement.textContent.replace(' (Paused)', '');
    });
}

function setupPasteListener() {
    const pasteArea = document.getElementById('paste-area');
    const uploadButton = document.getElementById('upload-button');

    pasteArea.addEventListener('paste', (e) => {
        e.preventDefault();

        const items = (e.clipboardData || e.originalEvent.clipboardData).items;

        for (const item of items) {
            if (item.type.indexOf('image') === 0) {
                const blob = item.getAsFile();
                const timestamp = new Date().getTime();

                const file = new File([blob], `pasted-image-${timestamp}.png`, {
                    type: blob.type
                });

                if (uppy) {
                    try {
                        uppy.addFile({
                            name: file.name,
                            type: file.type,
                            data: file,
                            source: 'Paste',
                            isRemote: false
                        });

                        pasteArea.innerHTML = `<strong>Image added:</strong> ${file.name}`;

                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const preview = document.getElementById('preview');
                            preview.innerHTML = `<img src="${e.target.result}" style="max-width: 300px; margin-top: 10px;">`;
                        };
                        reader.readAsDataURL(file);

                        uploadButton.disabled = false;
                    } catch (error) {
                        console.error('Error adding pasted file:', error);
                        pasteArea.innerHTML = `<span style="color: red;">Error adding image: ${error.message}</span>`;
                    }
                } else {
                    console.error('Uppy is not initialized yet, unable to add pasted file.');
                }
            }
        }
    });

    pasteArea.addEventListener('focus', () => {
        if (pasteArea.querySelector('.paste-instructions')) {
            pasteArea.innerHTML = '';
        }
    });

    pasteArea.addEventListener('blur', () => {
        if (pasteArea.innerHTML.trim() === '') {
            pasteArea.innerHTML = '<span class="paste-instructions">Paste image here (Ctrl+V or ⌘+V)</span>';
        }
    });
}

(async () => {
    try {
        const serviceUrl = `${window.location.origin}/transloadit-signature`;

        const response = await fetch(serviceUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const auth = await response.json();
        console.log('Auth params:', auth.params);

        uppy = new Uppy.Uppy({
            debug: true,
            restrictions: {
                allowedFileTypes: ['image/*', 'video/*']
            },
            autoProceed: false
        })
        .use(Uppy.Dashboard, {
            target: '#drag-drop-area',
            inline: true,
            height: 450,
            browserBackButtonClose: false,
            showProgressDetails: true,
            proudlyDisplayPoweredByUppy: false
        })
        .use(Uppy.Transloadit, {
            params: auth.params,
            signature: auth.signature,
            waitForEncoding: true,
            assemblyOptions: window.assemblyOptions,
            tusOptions: {
                limit: 1,
                retryDelays: [0, 1000, 3000, 5000],
                chunkSize: 1 * 1024 * 1024
            }
        })
        .use(Uppy.FileInput, {
            target: '#select-button',
            pretty: true,
            inputName: 'images'
        });

        setupUppyEventListeners();
        setupPasteListener();

    } catch (error) {
        console.error('Failed to initialize Uppy:', error);
        document.getElementById('progress').innerHTML =
            `<div class="error">Failed to initialize uploader: ${error.message}</div>`;
    }
})();