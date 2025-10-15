const fs = require('fs');
const path = require('path');

const jobsFile = path.join(__dirname, '../docs/data/jobs.json'); // Changed to docs/data

async function cleanupExpiredJobs() {
  try {
    console.log('🧹 Checking for expired jobs...');
    
    if (!fs.existsSync(jobsFile)) {
      console.log('📭 No jobs file found, skipping cleanup');
      return;
    }
    
    const data = await fs.promises.readFile(jobsFile, 'utf8');
    const jobs = JSON.parse(data);
    
    const now = new Date();
    const activeJobs = jobs.filter(job => {
      const expires = new Date(job.expires);
      return expires > now;
    });
    
    if (activeJobs.length < jobs.length) {
      await fs.promises.writeFile(jobsFile, JSON.stringify(activeJobs, null, 2));
      console.log(`✅ Removed ${jobs.length - activeJobs.length} expired jobs`);
      console.log(`📊 Remaining active jobs: ${activeJobs.length}`);
    } else {
      console.log('✅ No expired jobs found');
    }
    
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
  }
}

cleanupExpiredJobs();
