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
            followCursor: true,
            cursorsOptions: [{ // Mantener esto es bueno para la configuración explícita del cursor
                type: 0,
                color: "purple",
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
        enablePlaybackControls(false);

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                await osmd.load(e.target.result);
                osmd.render();
                displayMessage(`Archivo "${file.name}" cargado y renderizado.`);

                console.log("OSMD Object after render:", osmd);
                console.log("OSMD Cursor Object after render:", osmd.cursor);
                if (osmd.cursor) {
                    console.log("Claves de osmd.cursor:", Object.keys(osmd.cursor));
                }


                if (osmd.cursor && typeof osmd.cursor.manager !== 'undefined') { // Verifica que .manager exista
                    playbackManager = osmd.cursor.manager; // ACCESO CORREGIDO

                    if (playbackManager && typeof playbackManager.play === 'function') { // Verifica si tiene un método play
                        console.log("PlaybackManager encontrado en osmd.cursor.manager:", playbackManager);
                        enablePlaybackControls(true);
                    } else {
                        console.error("osmd.cursor.manager existe, PERO no parece ser un PlaybackManager válido (no tiene método play).");
                        console.log("Contenido de osmd.cursor.manager:", osmd.cursor.manager);
                        displayMessage(`Error: El objeto 'manager' del cursor no es un controlador de reproducción válido.`, true);
                        enablePlaybackControls(false);
                    }
                } else if (osmd.cursor) {
                    console.error("osmd.cursor.manager es indefinido o no existe.");
                    displayMessage(`Error: No se encontró 'manager' en el objeto cursor. La reproducción no estará disponible.`, true);
                    enablePlaybackControls(false);
                }
                 else {
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
        if (playbackManager && typeof playbackManager.play === 'function') {
            console.log("Intentando reproducir...");
            playbackManager.play();
        } else {
            console.warn("Play intentado pero PlaybackManager no está disponible o no es válido.");
        }
    });

    pauseBtn.addEventListener('click', () => {
        if (playbackManager && typeof playbackManager.pause === 'function') {
            playbackManager.pause();
        }
    });

    stopBtn.addEventListener('click', () => {
        if (playbackManager && typeof playbackManager.stop === 'function') {
            playbackManager.stop();
            if (osmd.cursor) {
                 osmd.cursor.reset();
            }
        }
    });

    initializeOSMD();
});
