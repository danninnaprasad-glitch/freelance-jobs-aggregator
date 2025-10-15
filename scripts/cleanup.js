const fs = require('fs');
const path = require('path');

const jobsFile = path.join(__dirname, '../data/jobs.json');

async function cleanupExpiredJobs() {
  try {
    console.log('🧹 Starting cleanup of expired jobs...');
    
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
    
    const expiredCount = jobs.length - activeJobs.length;
    
    if (expiredCount > 0) {
      await fs.promises.writeFile(jobsFile, JSON.stringify(activeJobs, null, 2));
      console.log(`✅ Removed ${expiredCount} expired jobs`);
      console.log(`📊 Active jobs remaining: ${activeJobs.length}`);
    } else {
      console.log('✅ No expired jobs found');
    }
    
    // Log expiry dates for debugging
    console.log('📅 Next expiry check:');
    activeJobs.forEach(job => {
      const expires = new Date(job.expires);
      const daysLeft = Math.ceil((expires - now) / (1000 * 60 * 60 * 24));
      console.log(`   - ${job.title}: ${daysLeft} days left`);
    });
    
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
  }
}

cleanupExpiredJobs();
