const axios = require('axios');
const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const parser = new Parser();
const jobsFile = path.join(__dirname, '../data/jobs.json');

// Genuine freelance job sources
const SOURCES = [
  {
    name: "RemoteOK",
    url: "https://remoteok.io/remote-freelance-jobs.rss",
    type: "rss"
  },
  {
    name: "We Work Remotely",
    url: "https://weworkremotely.com/categories/remote-programming-jobs.rss", 
    type: "rss"
  },
  {
    name: "JustRemote",
    url: "https://justremote.co/remote-jobs/rss",
    type: "rss"
  },
  {
    name: "Remote.co",
    url: "https://remote.co/job/software-dev/rss/",
    type: "rss"
  }
];

async function loadExistingJobs() {
  try {
    const data = await fs.promises.readFile(jobsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function scrapeRSS(source) {
  try {
    console.log(`Scraping RSS: ${source.name}`);
    const feed = await parser.parseURL(source.url);
    
    return feed.items.map(item => ({
      title: item.title || 'No title',
      description: item.contentSnippet || item.content || 'No description available',
      company: item.creator || source.name,
      url: item.link,
      source: source.name,
      date: new Date(item.pubDate || Date.now()).toISOString(),
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      id: `rss_${Buffer.from(item.link).toString('base64').slice(0, 15)}`
    }));
  } catch (error) {
    console.error(`Error scraping RSS ${source.name}:`, error.message);
    return [];
  }
}

async function main() {
  console.log('Starting job scraping...');
  
  // Ensure data directory exists
  await fs.promises.mkdir(path.dirname(jobsFile), { recursive: true });
  
  const existingJobs = await loadExistingJobs();
  const existingIds = new Set(existingJobs.map(job => job.id));
  
  let newJobs = [];
  
  for (const source of SOURCES) {
    let jobs = [];
    
    if (source.type === 'rss') {
      jobs = await scrapeRSS(source);
    }
    
    // Filter out duplicates
    const uniqueJobs = jobs.filter(job => !existingIds.has(job.id));
    newJobs = [...newJobs, ...uniqueJobs];
    
    // Add new IDs to existing set
    uniqueJobs.forEach(job => existingIds.add(job.id));
    
    console.log(`Found ${jobs.length} jobs from ${source.name}, ${uniqueJobs.length} new`);
  }
  
  const allJobs = [...existingJobs, ...newJobs];
  
  await fs.promises.writeFile(jobsFile, JSON.stringify(allJobs, null, 2));
  console.log(`✅ Added ${newJobs.length} new jobs. Total: ${allJobs.length} jobs.`);
}

main().catch(console.error);
