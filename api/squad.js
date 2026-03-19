export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const url = 'https://v3.football.api-sports.io/players/squads?team=728';
  const response = await fetch(url, {
    headers: { 'x-apisports-key': process.env.APIFOOTBALL_KEY }
  });

  const data = await response.json();
  res.status(response.status).json(data);
}
