export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { season, last, next, fixture } = req.query;

  // Rayo Vallecano team ID en API-Football es 728
  const RAYO_ID = '728';

  let url;
  if (fixture) {
    // Buscar un partido específico por ID
    if (!/^\d+$/.test(fixture)) return res.status(400).json({ error: 'Invalid fixture' });
    url = `https://v3.football.api-sports.io/fixtures?id=${fixture}`;
  } else if (last) {
    url = `https://v3.football.api-sports.io/fixtures?team=${RAYO_ID}&last=${last}`;
  } else if (next) {
    url = `https://v3.football.api-sports.io/fixtures?team=${RAYO_ID}&next=${next}`;
  } else {
    const s = season || '2025';
    url = `https://v3.football.api-sports.io/fixtures?team=${RAYO_ID}&season=${s}`;
  }

  const response = await fetch(url, {
    headers: { 'x-apisports-key': process.env.APIFOOTBALL_KEY }
  });

  const data = await response.json();
  res.status(response.status).json(data);
}
