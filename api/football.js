export default async function handler(req, res) {
  // Allow requests from the browser
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { endpoint } = req.query;
  if (!endpoint) return res.status(400).json({ error: 'No endpoint specified' });

  // Allowed endpoints for security
  const allowed = [
    'competitions/PD/standings',       // LaLiga tabla
    'competitions/PD/matches',         // LaLiga partidos
    'teams/7/matches',                 // Rayo Vallecano partidos (id=7)
    'competitions/ECNL/matches',       // Conference League
    'competitions/ECNL/standings',
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
