document.getElementById('validar').addEventListener('click', validarPDFs);
document.getElementById('exportar').addEventListener('click', exportarErrores);

const archivosDañados = [];
const tamañoLote = 10; // Procesa 10 archivos a la vez

function validarPDFs() {
    const carpetaInput = document.getElementById('carpeta').files;
    const fechaInicio = new Date(document.getElementById('fechaInicio').value);
    const fechaFin = new Date(document.getElementById('fechaFin').value);
    const resultado = document.getElementById('resultado');
    const mensajeEspera = document.getElementById('mensajeEspera');
    
    resultado.innerHTML = ""; // Limpiar resultados anteriores
    archivosDañados.length = 0; // Limpiar lista de errores
    
    if (carpetaInput.length === 0) {
        alert("Por favor, selecciona una carpeta con archivos PDF.");
        return;
    }

    mensajeEspera.style.display = "block"; // Mostrar mensaje de espera

    // Filtrar archivos PDF dentro del rango de fechas
    const archivosFiltrados = Array.from(carpetaInput).filter(archivo => 
        archivo.name.endsWith(".pdf") &&
        archivo.lastModified >= fechaInicio.getTime() &&
        archivo.lastModified <= fechaFin.getTime()
    );

    if (archivosFiltrados.length === 0) {
        mensajeEspera.style.display = "none"; // Ocultar mensaje de espera
        alert("No se encontraron archivos PDF en el rango de fechas especificado.");
        return;
    }

    // Procesar los archivos en lotes
    procesarLote(archivosFiltrados, 0, mensajeEspera);
}

function procesarLote(archivos, indiceInicio, mensajeEspera) {
    const lote = archivos.slice(indiceInicio, indiceInicio + tamañoLote);

    lote.forEach(archivo => {
        const lector = new FileReader();
        lector.onload = function(event) {
            const contenido = new Uint8Array(event.target.result);
            const encabezado = new TextDecoder("utf-8").decode(contenido.slice(0, 4));

            if (encabezado !== "%PDF") {
                archivosDañados.push({ nombre: archivo.name, error: "Encabezado incorrecto, no es un PDF válido" });
                mostrarResultados();
            }
        };
        lector.onerror = function() {
            archivosDañados.push({ nombre: archivo.name, error: "Error al leer el archivo" });
            mostrarResultados();
        };

        lector.readAsArrayBuffer(archivo);
    });

    // Esperar antes de procesar el siguiente lote
    if (indiceInicio + tamañoLote < archivos.length) {
        setTimeout(() => {
            procesarLote(archivos, indiceInicio + tamañoLote, mensajeEspera);
        }, 100); // Espera 100 ms entre lotes
    } else {
        mensajeEspera.style.display = "none"; // Ocultar mensaje de espera cuando termina
        document.getElementById('exportar').style.display = archivosDañados.length > 0 ? 'block' : 'none';
    }
}

function mostrarResultados() {
    const resultado = document.getElementById('resultado');
    resultado.innerHTML = ""; // Limpiar resultados antes de mostrar
    for (const archivo of archivosDañados) {
        const li = document.createElement('li');
        li.textContent = `${archivo.nombre} - ${archivo.error}`;
        resultado.appendChild(li);
    }
}

function exportarErrores() {
    if (archivosDañados.length === 0) {
        alert("No hay errores para exportar.");
        return;
    }

    // Crear contenido del archivo de errores
    let contenido = "Lista de archivos PDF dañados:\n\n";
    archivosDañados.forEach(archivo => {
        contenido += `${archivo.nombre}: ${archivo.error}\n`;
    });

    // Crear un Blob para el archivo de texto
    const blob = new Blob([contenido], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    // Crear un enlace para descargar el archivo
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "errores_pdf.txt";
    enlace.click();

    // Liberar el objeto URL
    URL.revokeObjectURL(url);
}
