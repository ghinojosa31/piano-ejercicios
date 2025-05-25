document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const osmdContainer = document.getElementById('osmdContainer');
    const statusMessages = document.getElementById('statusMessages');
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stopBtn = document.getElementById('stopBtn');

    let osmd;
    let playbackManager;

    // Inicializar OpenSheetMusicDisplay
    function initializeOSMD() {
        osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay(osmdContainer, {
            autoResize: true,
            backend: "svg", // "canvas" también es una opción
            drawTitle: true,
            // Opciones de reproducción (pueden requerir configuración adicional para audio real)
            drawingParameters: "compacttight", // o "default", "compact"
            followCursor: true,
            // pageFormat: "A4_P" // Puedes experimentar con formatos de página
        });
        console.log("OSMD initialized");
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
    
    // Manejar la carga del archivo
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        displayMessage(`Cargando archivo: ${file.name}...`);
        enablePlaybackControls(false);

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                await osmd.load(e.target.result);
                osmd.render();
                displayMessage(`Archivo "${file.name}" cargado y renderizado.`);
                
                // Inicializar PlaybackManager DESPUÉS de cargar y renderizar
                // Esto crea el cursor.
                playbackManager = osmd.cursor.playbackManager; 
                if (!playbackManager) { // Para versiones más antiguas de OSMD o si el cursor no se creó
                    // Intenta crear un PlaybackManager si no existe
                    // Esto puede variar según la versión de OSMD, la documentación es clave.
                    // Para versiones más recientes, suele estar asociado al cursor.
                    console.warn("PlaybackManager no se encontró en osmd.cursor. Intentando alternativa...");
                     // playbackManager = new OSMDPlayback.PlaybackManager(osmd.Sheet); // Esto es un ejemplo, revisar API OSMD
                }

                if (playbackManager) {
                    enablePlaybackControls(true);
                } else {
                    displayMessage(`Archivo cargado, pero la reproducción no está disponible.`, true);
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

    // Controles de reproducción
    playBtn.addEventListener('click', () => {
        if (playbackManager) {
            playbackManager.play();
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
            osmd.cursor.reset(); // Resetea el cursor al inicio
        }
    });

    // Inicializar todo
    initializeOSMD();
});