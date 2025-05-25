document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const osmdContainer = document.getElementById('osmdContainer');
    const statusMessages = document.getElementById('statusMessages');
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stopBtn = document.getElementById('stopBtn');

    let osmd;
    let playbackManager; // Aquí almacenaremos el PlaybackManager real

    function initializeOSMD() {
        osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay(osmdContainer, {
            autoResize: true,
            backend: "svg",
            drawTitle: true,
            drawingParameters: "compacttight",
            followCursor: true, // Importante para que el cursor se mueva
            cursorsOptions: [{
                type: 0,
                color: "green", // Cambiemos el color para ver si este cursor se usa
                alpha: 0.7,
                follow: true,
                show_on_play: true // Esta opción es para el cursor visual, no el audio
            }]
        });
        console.log("OSMD initialized. Version:", osmd.version);
        statusMessages.textContent = "OSMD inicializado. Cargue un archivo MusicXML.";

        // Imprimir el objeto global para ver qué clases están disponibles
        console.log("Objeto global opensheetmusicdisplay:", opensheetmusicdisplay);
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
        if (!file) return;

        displayMessage(`Cargando archivo: ${file.name}...`);
        enablePlaybackControls(false);
        playbackManager = null; // Resetear

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                await osmd.load(e.target.result);
                osmd.render();
                displayMessage(`Archivo "${file.name}" cargado y renderizado.`);

                console.log("----------------------------------------------------");
                console.log("BUSCANDO PLAYBACK MANAGER:");

                // Verificar si la clase PlaybackManager existe en el objeto global
                if (opensheetmusicdisplay && opensheetmusicdisplay.PlaybackManager) {
                    console.log("opensheetmusicdisplay.PlaybackManager CLASE ENCONTRADA.");
                    try {
                        // Para instanciar PlaybackManager, usualmente necesita al menos el cursor.
                        // El cursor principal de OSMD es osmd.cursor o, más robustamente, osmd.cursors[0]
                        if (osmd.cursors && osmd.cursors.length > 0) {
                            const mainCursor = osmd.cursors[0]; // Usar el primer cursor
                            console.log("Intentando instanciar PlaybackManager con el cursor:", mainCursor);

                            // El constructor de PlaybackManager puede variar.
                            // Puede necesitar:
                            // 1. Solo el cursor
                            // 2. El objeto osmd completo
                            // 3. El cursor y un AudioContext (para audio real, no solo cursor)
                            // 4. Otros parámetros
                            // Empecemos con lo más simple:
                            playbackManager = new opensheetmusicdisplay.PlaybackManager(mainCursor);
                            // Si esto da error, revisa la documentación de OSMD v1.9.0 para los parámetros del constructor de PlaybackManager

                            console.log("PlaybackManager instanciado:", playbackManager);

                            if (playbackManager && typeof playbackManager.play === 'function') {
                                console.log("¡PlaybackManager instanciado y parece válido (tiene método play)!");
                                enablePlaybackControls(true);
                            } else {
                                console.error("PlaybackManager instanciado, PERO no parece válido o no tiene método play.");
                                displayMessage("Error: El controlador de reproducción se instanció pero es inválido.", true);
                            }
                        } else {
                            console.error("No se encontraron cursores en osmd.cursors para pasar a PlaybackManager.");
                            displayMessage("Error: No hay cursores para la reproducción.", true);
                        }
                    } catch (initError) {
                        console.error("Error al instanciar opensheetmusicdisplay.PlaybackManager:", initError);
                        displayMessage(`Error inicializando reproducción: ${initError.message}`, true);
                        playbackManager = null; // Asegurarse de que es null si falla
                    }
                } else {
                    console.error("La clase opensheetmusicdisplay.PlaybackManager NO FUE ENCONTRADA en el objeto global.");
                    displayMessage("Error: Módulo de PlaybackManager no encontrado en la biblioteca OSMD.", true);
                }

                if (!playbackManager) { // Si después de todo, playbackManager sigue siendo null
                    enablePlaybackControls(false);
                    console.log("FALLO FINAL en el intento de instanciar PlaybackManager.");
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
            playbackManager.play();
        } else { console.warn("Intento de play, PM no válido."); }
    });

    pauseBtn.addEventListener('click', () => {
        if (playbackManager && typeof playbackManager.pause === 'function') {
            playbackManager.pause();
        } else { console.warn("Intento de pause, PM no válido."); }
    });

    stopBtn.addEventListener('click', () => {
        if (playbackManager && typeof playbackManager.stop === 'function') {
            playbackManager.stop();
            // El reseteo del cursor visual debería ser manejado por el PlaybackManager o
            // puedes hacerlo explícitamente si es necesario:
            if (osmd.cursors && osmd.cursors.length > 0) {
                 osmd.cursors[0].reset();
            }
        } else { console.warn("Intento de stop, PM no válido."); }
    });

    initializeOSMD();
});
