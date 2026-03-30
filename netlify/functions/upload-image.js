exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const { password, path, data } = JSON.parse(event.body);

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  // Only allow specific image paths
  const allowedPaths = [
    'assets/images/hero-2.webp',
    'assets/images/hero-2.png',
    'assets/images/book-stand.webp',
    'assets/images/book-stand.png',
    'assets/images/josh-speaking.webp',
    'assets/images/josh-drawn.webp',
    'assets/images/backstory-logo-dark.png',
    'assets/images/unfurl.jpg'
  ];

  if (!allowedPaths.includes(path)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid image path' }) };
  }

  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;

  try {
    let sha;
    const getRes = await fetch(
      `https://api.github.com/repos/${repo}/contents/${path}`,
      { headers: { Authorization: `token ${token}`, 'User-Agent': 'josh-admin' } }
    );

    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    }

    const body = {
      message: `Update ${path} via admin`,
      content: data
    };
    if (sha) body.sha = sha;

    const putRes = await fetch(
      `https://api.github.com/repos/${repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'josh-admin'
        },
        body: JSON.stringify(body)
      }
    );

    if (!putRes.ok) {
      const err = await putRes.text();
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to upload', details: err }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
