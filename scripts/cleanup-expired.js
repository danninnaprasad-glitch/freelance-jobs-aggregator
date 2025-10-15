const fs = require('fs');
const path = require('path');

const jobsFile = path.join(__dirname, '../data/jobs.json');

async function cleanupExpiredJobs() {
  try {
    console.log('Cleaning up expired jobs...');
    
    if (!fs.existsSync(jobsFile)) {
      console.log('No jobs file found, skipping cleanup.');
      return;
    }
    
    const data = await fs.promises.readFile(jobsFile, 'utf8');
    let jobs = JSON.parse(data);
    
    const now = new Date();
    const activeJobs = jobs.filter(job => new Date(job.expires) > now);
    
    if (activeJobs.length < jobs.length) {
      await fs.promises.writeFile(jobsFile, JSON.stringify(activeJobs, null, 2));
      console.log(`✅ Removed ${jobs.length - activeJobs.length} expired jobs.`);
    } else {
      console.log('✅ No expired jobs to remove.');
    }
  } catch (error) {
    console.error('❌ Error cleaning up expired jobs:', error.message);
  }
}

cleanupExpiredJobs();
