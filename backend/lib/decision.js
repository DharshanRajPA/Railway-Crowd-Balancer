import { 
  getAllPlatforms, 
  getPlatformById,
  getActiveRedirect,
  createRedirect,
  clearRedirect,
  createEscalation,
  getRedirectAttemptCount
} from './db.js';
import { calculateDensity, getDensityStatus } from './counter.js';

const REDIRECT_COOLDOWN_MS = parseInt(process.env.REDIRECT_COOLDOWN_MS || '15000', 10);
const RETRY_LIMIT = parseInt(process.env.RETRY_LIMIT || '2', 10);
const ESCALATION_THRESHOLD = parseFloat(process.env.ESCALATION_THRESHOLD || '0.85');
const DENSITY_MODERATE = parseFloat(process.env.DENSITY_MODERATE || '0.70');

// Track last redirect time per platform (hysteresis)
const lastRedirectTime = new Map();

/**
 * Evaluate all platforms and issue redirects if needed
 * Returns array of redirect actions taken
 */
export function evaluateAllPlatforms(emitEvent) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/29840694-9044-4d03-9b89-358de3fe5abe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'decision.js:evaluateAllPlatforms',message:'Starting platform evaluation',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  const platforms = getAllPlatforms();
  const redirects = [];
  
  for (const platform of platforms) {
    const density = calculateDensity(platform.count, platform.area);
    const status = getDensityStatus(density);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/29840694-9044-4d03-9b89-358de3fe5abe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'decision.js:evaluateAllPlatforms',message:'Evaluating platform',data:{platformId:platform.id,name:platform.name,density,status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // Check if platform is overcrowded
    if (status === 'OVERCROWDED') {
      const existingRedirect = getActiveRedirect(platform.id);
      
      // Hysteresis check: don't redirect if we just redirected recently
      const lastRedirect = lastRedirectTime.get(platform.id);
      const now = Date.now();
      
      if (lastRedirect && (now - lastRedirect) < REDIRECT_COOLDOWN_MS) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/29840694-9044-4d03-9b89-358de3fe5abe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'decision.js:evaluateAllPlatforms',message:'Redirect cooldown active',data:{platformId:platform.id,cooldownRemaining:REDIRECT_COOLDOWN_MS-(now-lastRedirect)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        continue;
      }
      
      if (!existingRedirect) {
        // Find safest alternative platform
        const targetPlatform = findSafestPlatform(platform.id, platforms);
        
        if (targetPlatform) {
          const redirectId = createRedirect(platform.id, targetPlatform.id, 1);
          lastRedirectTime.set(platform.id, now);
          
          const redirectData = {
            fromPlatformId: platform.id,
            fromPlatformName: platform.name,
            toPlatformId: targetPlatform.id,
            toPlatformName: targetPlatform.name,
            attempt: 1
          };
          
          emitEvent('redirect_issued', redirectData);
          redirects.push(redirectData);
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/29840694-9044-4d03-9b89-358de3fe5abe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'decision.js:evaluateAllPlatforms',message:'Redirect issued',data:redirectData,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
        }
      }
    } else if (status !== 'OVERCROWDED') {
      // Platform is safe now, clear any active redirects
      const existingRedirect = getActiveRedirect(platform.id);
      if (existingRedirect) {
        clearRedirect(platform.id);
        emitEvent('redirect_cleared', {
          platformId: platform.id,
          platformName: platform.name
        });
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/29840694-9044-4d03-9b89-358de3fe5abe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'decision.js:evaluateAllPlatforms',message:'Redirect cleared',data:{platformId:platform.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
      }
    }
  }
  
  return redirects;
}

/**
 * Find the safest platform (lowest density) excluding the given platform
 */
function findSafestPlatform(excludePlatformId, platforms) {
  const candidates = platforms
    .filter(p => p.id !== excludePlatformId)
    .map(p => ({
      ...p,
      density: calculateDensity(p.count, p.area)
    }))
    .sort((a, b) => a.density - b.density);
  
  return candidates.length > 0 ? candidates[0] : null;
}

/**
 * Check feedback loop: re-evaluate overcrowded platforms and escalate if needed
 * Returns array of actions taken
 */
export function checkFeedbackLoop(emitEvent) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/29840694-9044-4d03-9b89-358de3fe5abe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'decision.js:checkFeedbackLoop',message:'Starting feedback loop check',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  const platforms = getAllPlatforms();
  const actions = [];
  
  for (const platform of platforms) {
    const density = calculateDensity(platform.count, platform.area);
    const status = getDensityStatus(density);
    const activeRedirect = getActiveRedirect(platform.id);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/29840694-9044-4d03-9b89-358de3fe5abe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'decision.js:checkFeedbackLoop',message:'Checking platform in feedback loop',data:{platformId:platform.id,density,status,hasRedirect:!!activeRedirect},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    if (activeRedirect && status === 'OVERCROWDED') {
      // Platform still overcrowded, check if we need to retry or escalate
      const attemptCount = getRedirectAttemptCount(platform.id);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/29840694-9044-4d03-9b89-358de3fe5abe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'decision.js:checkFeedbackLoop',message:'Platform still overcrowded',data:{platformId:platform.id,attemptCount,density,escalationThreshold:ESCALATION_THRESHOLD},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      // Check escalation conditions
      if (density >= ESCALATION_THRESHOLD || attemptCount >= RETRY_LIMIT) {
        // Create escalation
        const reason = density >= ESCALATION_THRESHOLD 
          ? `Density ${(density * 100).toFixed(1)}% exceeds escalation threshold`
          : `Redirect retry limit (${RETRY_LIMIT}) exceeded`;
        
        createEscalation(platform.id, reason);
        
        emitEvent('escalation_created', {
          platformId: platform.id,
          platformName: platform.name,
          reason,
          density
        });
        
        actions.push({ type: 'escalation', platformId: platform.id });
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/29840694-9044-4d03-9b89-358de3fe5abe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'decision.js:checkFeedbackLoop',message:'Escalation created',data:{platformId:platform.id,reason},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
      } else {
        // Retry redirect with incremented attempt
        const targetPlatform = findSafestPlatform(platform.id, platforms);
        
        if (targetPlatform) {
          // Clear old redirect and create new one with incremented attempt
          clearRedirect(platform.id);
          const newAttempt = attemptCount + 1;
          createRedirect(platform.id, targetPlatform.id, newAttempt);
          
          emitEvent('redirect_retried', {
            fromPlatformId: platform.id,
            fromPlatformName: platform.name,
            toPlatformId: targetPlatform.id,
            toPlatformName: targetPlatform.name,
            attempt: newAttempt
          });
          
          actions.push({ type: 'retry', platformId: platform.id, attempt: newAttempt });
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/29840694-9044-4d03-9b89-358de3fe5abe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'decision.js:checkFeedbackLoop',message:'Redirect retried',data:{platformId:platform.id,attempt:newAttempt},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
        }
      }
    }
  }
  
  return actions;
}

