exports.handler = async (event, context) => {
    try {
        const body = JSON.parse(event.body);
        const { id, html } = body;

        if (!id || !html) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: "Faltan parámetros: id o html"
                })
            };
        }

        // ⚠️ NETLIFY NO PUEDE GUARDAR ARCHIVOS FÍSICOS
        // Entonces devolvemos la URL final que *debería* tener
        // El usuario sube el archivo manualmente a /landing-pages

        const urlPublica = `${process.env.URL || "https://TU-DOMINIO-NETLIFY.netlify.app"}/landing-pages/${id}.html`;

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                url: urlPublica,
                mensaje: "Landing generada. Descarga el archivo y súbelo a /landing-pages/"
            })
        };

    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Error procesando guardar landing",
                detalle: err.message
            })
        };
    }
};

