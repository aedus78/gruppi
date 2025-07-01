// netlify/functions/get-data.js
const { Octokit } = require("@octokit/rest");

exports.handler = async (event, context) => {
  // Solo metodi GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Configurazione GitHub
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    const owner = process.env.GITHUB_OWNER; // Il tuo username GitHub
    const repo = process.env.GITHUB_REPO;   // Nome del repo
    const path = 'sottogruppi.json';        // File nel repo

    // Legge il file dal repo
    const response = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
    });

    // Decodifica il contenuto da base64
    const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
    const data = JSON.parse(content);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: JSON.stringify(data),
    };

  } catch (error) {
    console.error('Errore nel caricamento GitHub:', error);
    
    // Se il file non esiste (404), è normale per la prima volta
    if (error.status === 404) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'File non trovato',
          message: 'Nessun dato salvato presente nel repository'
        }),
      };
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Errore interno del server',
        details: error.message
      }),
    };
  }
};
