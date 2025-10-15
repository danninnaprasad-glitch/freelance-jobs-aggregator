const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const parser = new Parser();
const jobsFile = path.join(__dirname, '../docs/data/jobs.json'); // Changed to docs/data

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
  }
];

async function loadExistingJobs() {
  try {
    if (fs.existsSync(jobsFile)) {
      const data = await fs.promises.readFile(jobsFile, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.log('No existing jobs file found, starting fresh...');
    return [];
  }
}

async function scrapeRSS(source) {
  try {
    console.log(`🔍 Scraping from ${source.name}...`);
    const feed = await parser.parseURL(source.url);
    
    const jobs = feed.items.map(item => ({
      title: item.title || 'Freelance Opportunity',
      description: item.contentSnippet || item.content || 'Check the link for more details',
      company: item.creator || source.name,
      url: item.link,
      source: source.name,
      date: new Date(item.pubDate || Date.now()).toISOString(),
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      id: `job_${source.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }));
    
    console.log(`✅ Found ${jobs.length} jobs from ${source.name}`);
    return jobs;
  } catch (error) {
    console.error(`❌ Error scraping ${source.name}:`, error.message);
    return [];
  }
}

async function main() {
  console.log('🚀 Starting job scraping process...');
  
  try {
    // Ensure data directory exists
    await fs.promises.mkdir(path.dirname(jobsFile), { recursive: true });
    console.log('📁 Data directory ready');
    
    const existingJobs = await loadExistingJobs();
    console.log(`📊 Existing jobs: ${existingJobs.length}`);
    
    let allNewJobs = [];
    
    for (const source of SOURCES) {
      const newJobs = await scrapeRSS(source);
      allNewJobs = [...allNewJobs, ...newJobs];
    }
    
    // Combine existing and new jobs (in real scenario, we'd dedupe)
    const allJobs = [...existingJobs, ...allNewJobs];
    
    // Save to file
    await fs.promises.writeFile(jobsFile, JSON.stringify(allJobs, null, 2));
    console.log(`🎉 Success! Total jobs: ${allJobs.length}`);
    console.log(`💾 Saved to: ${jobsFile}`);
    
  } catch (error) {
    console.error('💥 Critical error:', error);
  }
}

main();
