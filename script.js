document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const osmdContainer = document.getElementById('osmdContainer');
    const statusMessages = document.getElementById('statusMessages');
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stopBtn = document.getElementById('stopBtn');

    let osmd;
    let playbackManager;

    function initializeOSMD() {
        osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay(osmdContainer, {
            autoResize: true,
            backend: "svg",
            drawTitle: true,
            drawingParameters: "compacttight",
            followCursor: true, // Esencial para que el cursor siga la reproducción
            // Intenta añadir esta configuración explícita del cursor:
            cursorsOptions: [{
                type: 0, // Cursor musical estándar
                color: "purple", // Color para identificarlo visualmente
                alpha: 0.8,
                follow: true,
                show_on_play: true
            }]
        });
        console.log("OSMD initialized with cursor options.");
        statusMessages.textContent = "OSMD inicializado. Cargue un archivo MusicXML.";
    }

    function displayMessage(message, isError = false) {
        statusMessages.textContent = message;
        statusMessages.style.color = isError ? 'red' : 'inherit';
        statusMessages.style.borderColor = isError ? 'red' : '#007bff';
    }

    function enablePlaybackControls(enable = true) {
        playBtn.disabled = !enable;
        pauseBtn.disabled = !enable;
        stopBtn.disabled = !enable;
    }
    
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        displayMessage(`Cargando archivo: ${file.name}...`);
        enablePlaybackControls(false); // Deshabilitar mientras se carga

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                await osmd.load(e.target.result);
                osmd.render(); // Esta función crea/actualiza el cursor
                displayMessage(`Archivo "${file.name}" cargado y renderizado.`);
                
                console.log("OSMD Object after render:", osmd);
                console.log("OSMD Cursor Object after render:", osmd.cursor);

                if (osmd.cursor) {
                    playbackManager = osmd.cursor.playbackManager;
                    if (playbackManager) {
                        console.log("PlaybackManager encontrado:", playbackManager);
                        enablePlaybackControls(true);
                    } else {
                        console.error("PlaybackManager NO encontrado en osmd.cursor, aunque osmd.cursor existe.");
                        displayMessage(`Archivo cargado, pero la reproducción no está disponible (PlaybackManager ausente en cursor).`, true);
                        enablePlaybackControls(false);
                    }
                } else {
                    console.error("osmd.cursor es NULO o indefinido después de render().");
                    displayMessage("Error: El cursor de OSMD no se pudo crear. La reproducción no estará disponible.", true);
                    enablePlaybackControls(false);
                }

            } catch (error) {
                console.error("Error al cargar o renderizar MusicXML:", error);
                displayMessage(`Error al procesar el archivo: ${error.message}`, true);
                enablePlaybackControls(false);
            }
        };
        reader.onerror = () => {
            displayMessage(`Error al leer el archivo: ${reader.error}`, true);
            enablePlaybackControls(false);
        };
        reader.readAsText(file);
    });

    playBtn.addEventListener('click', () => {
        if (playbackManager) {
            console.log("Intentando reproducir...");
            playbackManager.play();
        } else {
            console.warn("Play intentado pero PlaybackManager no está disponible.");
        }
    });

    pauseBtn.addEventListener('click', () => {
        if (playbackManager) {
            playbackManager.pause();
        }
    });

    stopBtn.addEventListener('click', () => {
        if (playbackManager) {
            playbackManager.stop();
            if (osmd.cursor) { // Asegurarse de que el cursor existe antes de resetearlo
                 osmd.cursor.reset(); 
            }
        }
    });

    initializeOSMD();
});
