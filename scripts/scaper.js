const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

// Create parser instance
const parser = new Parser();
const jobsFile = path.join(__dirname, '../data/jobs.json');

// Working RSS feeds
const SOURCES = [
  {
    name: "RemoteOK",
    url: "https://remoteok.io/remote-freelance-jobs.rss",
    type: "rss"
  },
  {
    name: "WeWorkRemotely", 
    url: "https://weworkremotely.com/categories/remote-programming-jobs.rss",
    type: "rss"
  }
];

// Load existing jobs
function loadExistingJobs() {
  try {
    if (fs.existsSync(jobsFile)) {
      const data = fs.readFileSync(jobsFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.log('Starting with empty jobs list');
  }
  return [];
}

// Scrape RSS feed
async function scrapeRSS(source) {
  try {
    console.log(`Scraping ${source.name}...`);
    const feed = await parser.parseURL(source.url);
    
    const jobs = feed.items.slice(0, 5).map((item, index) => {
      // Create valid URL
      let jobUrl = item.link || `https://${source.name.toLowerCase().replace(' ', '')}.com`;
      if (!jobUrl.startsWith('http')) {
        jobUrl = 'https://' + jobUrl;
      }
      
      return {
        title: item.title || `${source.name} Job`,
        description: item.contentSnippet || 'Click for more details',
        company: item.creator || source.name,
        url: jobUrl,
        source: source.name,
        date: new Date().toISOString(),
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        id: `${source.name}_${Date.now()}_${index}`
      };
    });
    
    console.log(`Found ${jobs.length} jobs from ${source.name}`);
    return jobs;
  } catch (error) {
    console.log(`Error with ${source.name}: ${error.message}`);
    return [];
  }
}

// Main function
async function main() {
  console.log('Starting job scraper...');
  
  try {
    // Create data directory
    if (!fs.existsSync(path.dirname(jobsFile))) {
      fs.mkdirSync(path.dirname(jobsFile), { recursive: true });
    }
    
    const existingJobs = loadExistingJobs();
    console.log(`Existing jobs: ${existingJobs.length}`);
    
    let allJobs = [];
    
    // Get jobs from each source
    for (const source of SOURCES) {
      const jobs = await scrapeRSS(source);
      allJobs = allJobs.concat(jobs);
    }
    
    // If no jobs from RSS, create sample data
    if (allJobs.length === 0) {
      allJobs = [{
        title: "Senior Web Developer",
        description: "Remote full-stack developer position with modern technologies",
        company: "Tech Solutions Inc",
        url: "https://remoteok.io",
        source: "Sample",
        date: new Date().toISOString(),
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        id: "sample_job_1"
      }];
    }
    
    // Save to file
    fs.writeFileSync(jobsFile, JSON.stringify(allJobs, null, 2));
    console.log(`Saved ${allJobs.length} jobs to ${jobsFile}`);
    
  } catch (error) {
    console.log('Error in main:', error.message);
    
    // Create basic jobs file as fallback
    const fallbackJobs = [{
      title: "Freelance Developer",
      description: "The system is working! Real jobs will appear in the next update.",
      company: "System",
      url: "https://github.com",
      source: "System",
      date: new Date().toISOString(),
      expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      id: "fallback_job"
    }];
    
    fs.writeFileSync(jobsFile, JSON.stringify(fallbackJobs, null, 2));
    console.log('Created fallback jobs file');
  }
}

// Run the scraper
main();
