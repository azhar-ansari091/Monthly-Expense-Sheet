// PUBLIC-SHEET MODE — uses a Google API key (sheet must be link-viewable).
// Note: an API key can only read sheets set to "anyone with the link can view".
// For a private sheet, use the service-account version instead.

const toISO = v =>
  typeof v === 'number'
    ? new Date(Date.UTC(1899, 11, 30) + v * 86400000).toISOString().slice(0, 10)
    : v;

exports.handler = async () => {
  try {
    const id = process.env.SHEET_ID;
    const key = process.env.GS_API_KEY;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/Data!A:F`
              + `?valueRenderOption=UNFORMATTED_VALUE&key=${key}`;

    const r = await fetch(url);
    if (!r.ok) throw new Error('Sheets API ' + r.status);
    const data = await r.json();

    const [header, ...rows] = data.values || [[]];
    const out = rows
      .filter(row => row && row.length)
      .map(row => {
        const o = {};
        header.forEach((h, i) => (o[h] = row[i] ?? ''));
        if ('Date/Month' in o) o['Date/Month'] = toISO(o['Date/Month']);
        return o;
      });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
      body: JSON.stringify(out),
    };
  } catch (e) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: e.message }) };
  }
};
