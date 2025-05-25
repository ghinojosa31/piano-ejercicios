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
            cursorsOptions: [{
                type: 0,
                color: "purple",
                alpha: 0.8,
                follow: true,
                show_on_play: true
            }]
        });
        console.log("OSMD initialized.");
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
        playbackManager = null; // Resetear por si acaso

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                await osmd.load(e.target.result);
                osmd.render();
                displayMessage(`Archivo "${file.name}" cargado y renderizado.`);

                console.log("----------------------------------------------------");
                console.log("INSPECCIÓN POST-RENDERIZACIÓN DE OSMD:");
                console.log("Objeto OSMD principal:", osmd);
                console.log("Claves de OSMD principal:", Object.keys(osmd));

                if (osmd.cursors && osmd.cursors.length > 0) {
                    console.log("Colección osmd.cursors (longitud):", osmd.cursors.length);
                    console.log("Primer cursor (osmd.cursors[0]):", osmd.cursors[0]);
                    // Asignamos osmd.cursor al primer cursor si no se hace automáticamente
                    // osmd.cursor = osmd.cursors[0]; // Puede que no sea necesario si osmd.cursor ya apunta al correcto
                }

                console.log("Objeto osmd.cursor:", osmd.cursor);
                if (osmd.cursor) {
                    console.log("Claves de osmd.cursor:", Object.keys(osmd.cursor));
                    console.log("Objeto osmd.cursor.manager:", osmd.cursor.manager);
                    if (osmd.cursor.manager) {
                        console.log("Claves de osmd.cursor.manager:", Object.keys(osmd.cursor.manager));
                        // HIPÓTESIS A: ¿Está el PM anidado aquí?
                        // Ejemplo: if (osmd.cursor.manager.playbackController) playbackManager = osmd.cursor.manager.playbackController;
                    }
                }
                console.log("----------------------------------------------------");


                // INTENTO DE OBTENER PLAYBACKMANAGER
                if (osmd.cursor && osmd.cursor.manager) {
                    // Intenta diferentes posibilidades basadas en lo que veas en la consola:
                    // playbackManager = osmd.cursor.manager; // Ya sabemos que esto no tiene .play()
                    // playbackManager = osmd.cursor.manager.playback; // Si ves 'playback' dentro de manager
                    // playbackManager = osmd.cursor.manager.player;   // Si ves 'player' dentro de manager

                    // Por ahora, dejaremos playbackManager como null y lo reasignaremos si encontramos algo
                    let potentialPM = osmd.cursor.manager; // El objeto que ya tenemos

                    // Revisa si `potentialPM` (que es osmd.cursor.manager) tiene alguna propiedad que sea el PM
                    // Esto es un bucle para buscar una propiedad con un método 'play'
                    let foundPM = false;
                    if (typeof potentialPM === 'object' && potentialPM !== null) {
                        for (const key in potentialPM) {
                            if (potentialPM.hasOwnProperty(key) && 
                                typeof potentialPM[key] === 'object' && 
                                potentialPM[key] !== null && 
                                typeof potentialPM[key].play === 'function') {
                                playbackManager = potentialPM[key];
                                console.log(`PlaybackManager encontrado en osmd.cursor.manager.${key}`);
                                foundPM = true;
                                break;
                            }
                        }
                    }

                    if (!foundPM) {
                         // Si sigue sin encontrarse, intenta directamente con el manager,
                         // aunque ya sabemos que no tiene .play, quizás tenga otros métodos de control.
                         // O quizás el `manager` ES el objeto que controla la reproducción, pero los métodos se llaman diferente.
                         console.log("No se encontró una sub-propiedad de osmd.cursor.manager con un método .play().");
                         console.log("Revisa la consola para ver los métodos disponibles en osmd.cursor.manager.");
                         // playbackManager = osmd.cursor.manager; // Asignar de todas formas para ver si tiene pause/stop
                    }


                    if (playbackManager && typeof playbackManager.play === 'function') {
                        enablePlaybackControls(true);
                    } else {
                        console.error("FALLO FINAL: PlaybackManager aún no es válido o no se encontró un método .play().");
                        displayMessage(`Error: El controlador de reproducción no se pudo inicializar correctamente.`, true);
                        enablePlaybackControls(false);
                    }

                } else {
                    displayMessage(`Error: osmd.cursor o osmd.cursor.manager no están definidos.`, true);
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

    // ... (botones de play/pause/stop sin cambios por ahora, asumirán que playbackManager es correcto)
    playBtn.addEventListener('click', () => {
        if (playbackManager && typeof playbackManager.play === 'function') {
            playbackManager.play();
        } else { console.warn("Intento de play, pero PM no válido.");}
    });

    pauseBtn.addEventListener('click', () => {
        if (playbackManager && typeof playbackManager.pause === 'function') {
            playbackManager.pause();
        } else { console.warn("Intento de pause, pero PM no válido.");}
    });

    stopBtn.addEventListener('click', () => {
        if (playbackManager && typeof playbackManager.stop === 'function') {
            playbackManager.stop();
            if (osmd.cursor) {
                 osmd.cursor.reset();
            }
        } else { console.warn("Intento de stop, pero PM no válido.");}
    });

    initializeOSMD();
});
