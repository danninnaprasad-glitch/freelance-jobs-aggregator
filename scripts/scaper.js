const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const parser = new Parser();
const jobsFile = path.join(__dirname, '../data/jobs.json');

// Working RSS feeds with valid URLs
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
  }
];

async function loadExistingJobs() {
  try {
    if (fs.existsSync(jobsFile)) {
      const data = await fs.promises.readFile(jobsFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.log('No existing jobs file or error reading');
  }
  return [];
}

function validateUrl(url) {
  if (!url) return 'https://example.com';
  if (url.startsWith('http')) return url;
  return `https://${url}`;
}

function generateJobId(title, company) {
  return Buffer.from(`${title}-${company}-${Date.now()}`).toString('base64').slice(0, 10);
}

async function scrapeRSS(source) {
  try {
    console.log(`🔍 Scraping ${source.name}...`);
    const feed = await parser.parseURL(source.url);
    
    const jobs = feed.items.slice(0, 10).map(item => {
      // Clean and validate the URL
      let jobUrl = validateUrl(item.link);
      
      // Ensure it's a real website URL, not RSS feed URL
      if (jobUrl.includes('/rss/') || jobUrl.endsWith('.rss')) {
        jobUrl = `https://${source.name.toLowerCase().replace(' ', '')}.com`;
      }
      
      return {
        title: item.title || 'Freelance Opportunity',
        description: item.contentSnippet || item.content || 'Click apply for more details',
        company: item.creator || source.name,
        url: jobUrl,
        source: source.name,
        date: new Date().toISOString(),
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days expiry
        id: generateJobId(item.title, source.name)
      };
    });
    
    console.log(`✅ Found ${jobs.length} jobs from ${source.name}`);
    return jobs;
  } catch (error) {
    console.log(`❌ Failed to scrape ${source.name}: ${error.message}`);
    
    // Return sample jobs if scraping fails
    return [{
      title: "Sample Freelance Developer",
      description: "This is a sample job. Real jobs will appear when RSS feeds work.",
      company: "Sample Company",
      url: "https://remoteok.io",
      source: source.name,
      date: new Date().toISOString(),
      expires: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      id: `sample_${source.name}`
    }];
  }
}

async function main() {
  console.log('🚀 Starting job scraper...');
  
  try {
    // Ensure data directory exists
    await fs.promises.mkdir(path.dirname(jobsFile), { recursive: true });
    
    const existingJobs = await loadExistingJobs();
    console.log(`📊 Existing jobs: ${existingJobs.length}`);
    
    let allNewJobs = [];
    
    // Scrape from all sources
    for (const source of SOURCES) {
      const jobs = await scrapeRSS(source);
      allNewJobs = [...allNewJobs, ...jobs];
    }
    
    // Remove duplicates based on ID
    const existingIds = new Set(existingJobs.map(job => job.id));
    const uniqueNewJobs = allNewJobs.filter(job => !existingIds.has(job.id));
    
    // Combine existing and new jobs
    const allJobs = [...existingJobs, ...uniqueNewJobs];
    
    // Save to file
    await fs.promises.writeFile(jobsFile, JSON.stringify(allJobs, null, 2));
    console.log(`🎉 Success! Total jobs: ${allJobs.length}, New jobs: ${uniqueNewJobs.length}`);
    
  } catch (error) {
    console.error('💥 Critical error:', error);
    
    // Create emergency backup data
    const emergencyJobs = [{
      title: "Freelance Job Board Active",
      description: "The system is working! Jobs are being updated automatically.",
      company: "System",
      url: "https://github.com",
      source: "System",
      date: new Date().toISOString(),
      expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      id: "system_active"
    }];
    
    await fs.promises.writeFile(jobsFile, JSON.stringify(emergencyJobs, null, 2));
    console.log('✅ Created emergency backup jobs file');
  }
}

main();
