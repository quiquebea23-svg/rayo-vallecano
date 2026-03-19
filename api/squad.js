export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=86400'); // 24h cache

  const url = 'https://v3.football.api-sports.io/players/squads?team=728';
  try {
    const response = await fetch(url, {
      headers: { 'x-apisports-key': process.env.APIFOOTBALL_KEY }
    });
    const data = await response.json();
    // Return players array with id, name, number, photo
    const players = data.response?.[0]?.players || [];
    res.json({ players });
  } catch(e) {
    res.json({ players: [], error: e.message });
  }
}
