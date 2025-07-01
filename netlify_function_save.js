// netlify/functions/save-data.js
const { Octokit } = require("@octokit/rest");

exports.handler = async (event, context) => {
  // Solo metodi POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parsing del body
    const data = JSON.parse(event.body);
    
    // Configurazione GitHub
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    const owner = process.env.GITHUB_OWNER; // Il tuo username GitHub
    const repo = process.env.GITHUB_REPO;   // Nome del repo (es: pct-sottogruppi)
    const path = 'sottogruppi.json';        // File nel repo
    
    // Aggiunge commit info
    data.commitInfo = {
      message: `Aggiornamento sottogruppi - ${new Date().toLocaleString('it-IT')}`,
      timestamp: new Date().toISOString()
    };

    // Converte i dati in base64
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
    
    // Verifica se il file esiste per ottenere l'SHA
    let sha;
    try {
      const existingFile = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      });
      sha = existingFile.data.sha;
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }
      // File non esiste, sha rimane undefined (creazione nuovo file)
    }

    // Crea o aggiorna il file
    const result = await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: data.commitInfo.message,
      content,
      sha, // undefined per nuovo file, SHA esistente per aggiornamento
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({
        success: true,
        commit: result.data.commit.sha,
        message: 'Dati salvati con successo su GitHub'
      }),
    };

  } catch (error) {
    console.error('Errore nel salvataggio GitHub:', error);
    
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