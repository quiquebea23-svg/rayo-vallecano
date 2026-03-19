export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { type, id } = req.query;

  // Solo permitimos estos tipos por seguridad
  const allowed = ['events', 'lineups', 'statistics'];
  if (!type || !allowed.includes(type)) {
    return res.status(400).json({ error: 'Invalid type' });
  }
  if (!id || !/^\d+$/.test(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  // API-Football usa fixture ID, no el mismo que football-data.org
  // Endpoint: https://v3.football.api-sports.io/fixtures/events?fixture=ID
  const url = `https://v3.football.api-sports.io/fixtures/${type}?fixture=${id}`;

  const response = await fetch(url, {
    headers: {
      'x-apisports-key': process.env.APIFOOTBALL_KEY
    }
  });

  const data = await response.json();
  res.status(response.status).json(data);
}
