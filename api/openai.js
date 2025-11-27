export default async function handler(req, res) {
  try {
    const { prompt } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "API key missing" });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: "Eres un experto en HTML, diseña landings completas." },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();

    const html =
      data?.choices?.[0]?.message?.content || "";

    res.status(200).json({ output: html });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}




