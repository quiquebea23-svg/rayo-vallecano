export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { endpoint } = req.query;
  if (!endpoint) return res.status(400).json({ error: 'No endpoint specified' });

  const allowed = [
    'competitions/PD/standings',       // LaLiga tabla
    'competitions/PD/matches',
    'competitions/CDR/standings',      // Copa del Rey
    'competitions/CDR/matches',
    'competitions/ECNL/standings',     // Conference League
    'competitions/ECNL/matches',
    'competitions/CL/standings',       // Champions (por si acaso)
    'competitions/EL/standings',       // Europa League
    'teams/277/matches',               // Rayo partidos
  ];

  const isAllowed = allowed.some(a => endpoint.startsWith(a));
  if (!isAllowed) return res.status(403).json({ error: 'Endpoint not allowed' });

  const url = `https://api.football-data.org/v4/${endpoint}`;
  const response = await fetch(url, {
    headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY }
  });

  const data = await response.json();
  res.status(response.status).json(data);
}
