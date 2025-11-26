exports.handler = async function(event, context) {

    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "POST, OPTIONS"
            }
        };
    }

    try {
        const body = JSON.parse(event.body || "{}");
        const { filename, html } = body;

        if (!filename || !html) {
            return {
                statusCode: 400,
                body: JSON.stringify({ success: false, error: "Datos incompletos" })
            };
        }

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({
                success: true,
                url: `https://landify-app.netlify.app/landing-pages/${filename}`
            })
        };

    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: err.toString() })
        };
    }
};


