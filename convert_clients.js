const fs = require('fs');
const path = require('path');

// Mappings
const docTypes = {
    'CUIT': '80',
    'DNI': '96',
    'Otro': '80' // Default to 80 (CUIT) or maybe 99 (Sin Identificar)
};

const ivaMap = {
    'IVA responsable inscripto': 'Responsable Inscripto',
    'IVA sujeto exento': 'Exento',
    'IVA No alcanzado': 'Consumidor Final',
    'Monotributo': 'Monotributo',
};

// Main process
try {
    const inputPath = path.join(__dirname, 'clientes.csv');
    const outputPath = path.join(__dirname, 'clientes_importable.csv');

    const content = fs.readFileSync(inputPath, 'utf8');
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);

    const outputLines = [];
    // Add Header expected by Import API (though it skips line 0, visual cues help)
    outputLines.push('Nombre,TipoDoc,CUIT,Direccion,Email,Telefono,CondicionIVA,ItemsJSON');

    // Skip source header
    for (let i = 1; i < lines.length; i++) {
        // Basic CSV parse (assuming quotes form block)
        const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);

        // Fallback split if regex misses (handling complex cases roughly)
        // The previous regex in Route might be flawed for commas inside quotes.
        // Let's use a robust split logic for the source file.
        let parts = [];
        let current = '';
        let inQuote = false;
        for (const char of lines[i]) {
            if (char === '"') {
                inQuote = !inQuote;
            } else if (char === ',' && !inQuote) {
                parts.push(current.replace(/^"|"$/g, '').trim()); // Push clean value
                current = '';
            } else {
                current += char;
            }
        }
        parts.push(current.replace(/^"|"$/g, '').trim()); // Last part

        // Source Columns:
        // 0: Nombre
        // 1: Tipo ID
        // 2: ID (CUIT)
        // 3: Condicion IVA
        // 4: Tel 1
        // 5: Tel 2
        // 6: Fax
        // 7: Celular
        // 8: Provincia
        // 9: Localidad
        // 10: Codigo Postal
        // 11: Domicilio fiscal
        // 12: Correo

        if (parts.length < 5) continue; // Skip bad lines

        const name = parts[0] || 'Sin Nombre';
        const typeId = parts[1] || 'CUIT';
        const cuit = parts[2] || '';
        const rawIva = parts[3] || '';

        // Phones: 4, 5, 7
        const phones = [parts[4], parts[5], parts[7]].filter(p => p).join(' / ');

        // Address: 11 (Street), 9 (City), 8 (Prov)
        const address = `${parts[11] || ''} ${parts[9] || ''} ${parts[8] || ''}`.trim();

        const email = parts[12] || '';

        // Map Values
        const docType = docTypes[typeId] || '80';
        const ivaCondition = ivaMap[rawIva] || 'Consumidor Final';
        const cleanCuit = cuit.replace(/-/g, '').replace(/\s/g, '');

        // Construct CSV Line (Escaping quotes)
        const csvRow = [
            `"${name}"`,
            docType,
            `"${cleanCuit}"`,
            `"${address}"`,
            `"${email}"`,
            `"${phones}"`,
            `"${ivaCondition}"`,
            `"[]"` // Items JSON empty
        ].join(',');

        outputLines.push(csvRow);
    }

    fs.writeFileSync(outputPath, outputLines.join('\n'));
    console.log(`Successfully converted ${lines.length - 1} clients to ${outputPath}`);

} catch (e) {
    console.error(e);
}
