const { supabaseAdmin } = require('../config/supabase');
const generateSignedUrl = async (storagePath, expiresIn = 86400) => { 
  try {
    if (!storagePath) return null;
    const { data, error } = await supabaseAdmin.storage
      .from('chat-files')
      .createSignedUrl(storagePath, expiresIn);
    if (error) {
      return null;
    }
    return data.signedUrl;
  } 
  catch (error) {
    return null;
  }
};
const generateSignedUrlsBatch = async (storagePaths, expiresIn = 86400) => {
  try {
    if (!storagePaths || storagePaths.length === 0) return {};
    const urlPromises = storagePaths.map(async (path) => {
      const url = await generateSignedUrl(path, expiresIn);
      return { path, url };
    });
    const results = await Promise.all(urlPromises);
    const urlMap = {};
    results.forEach(({ path, url }) => {
      if (url) urlMap[path] = url;
    });
    return urlMap;
  } 
  catch (error) {
    return {};
  }
};

module.exports = { generateSignedUrl, generateSignedUrlsBatch };