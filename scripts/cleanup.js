const fs = require('fs');
const path = require('path');

const jobsFile = path.join(__dirname, '../data/jobs.json');

function cleanupExpiredJobs() {
  try {
    console.log('Checking for expired jobs...');
    
    if (!fs.existsSync(jobsFile)) {
      console.log('No jobs file found');
      return;
    }
    
    const data = fs.readFileSync(jobsFile, 'utf8');
    const jobs = JSON.parse(data);
    
    const now = new Date();
    const activeJobs = jobs.filter(job => {
      try {
        const expires = new Date(job.expires);
        return expires > now;
      } catch (error) {
        // If date is invalid, keep the job
        return true;
      }
    });
    
    const expiredCount = jobs.length - activeJobs.length;
    
    if (expiredCount > 0) {
      fs.writeFileSync(jobsFile, JSON.stringify(activeJobs, null, 2));
      console.log(`Removed ${expiredCount} expired jobs. ${activeJobs.length} jobs remaining.`);
    } else {
      console.log('No expired jobs found.');
    }
    
  } catch (error) {
    console.log('Cleanup error:', error.message);
  }
}

// Run cleanup
cleanupExpiredJobs();
