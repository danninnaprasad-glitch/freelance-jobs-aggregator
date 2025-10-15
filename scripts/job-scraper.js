const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const parser = new Parser();
const jobsFile = path.join(__dirname, '../data/jobs.json'); // Changed to root data folder

// Your existing scraper code continues...
