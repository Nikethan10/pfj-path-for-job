import API from './api';

export const analyzeResume = (resumeInput, githubUser = '', linkedinText = '') => {
  const formData = new FormData();
  if (resumeInput instanceof File) {
    formData.append('file', resumeInput);
  } else {
    formData.append('resume_text', resumeInput);
  }
  if (githubUser) {
    formData.append('github_user', githubUser);
  }
  if (linkedinText) {
    formData.append('linkedin_text', linkedinText);
  }
  
  return API.post('/resume/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    // The full audit runs several AI calls; give it more room than the 30s default.
    timeout: 120000,
  });
};

export const getResumeAnalysis = () => API.get('/resume');

export const matchJobDescription = (jobDescription) => {
  return API.post('/resume/match', { job_description: jobDescription });
};

export const rewriteBulletPoints = (bulletPoints) => {
  return API.post('/resume/rewrite', { bullet_points: bulletPoints });
};

export const updateSocialProfiles = (githubUser, linkedinText) => {
  return API.post('/resume/social', { github_user: githubUser, linkedin_text: linkedinText });
};
