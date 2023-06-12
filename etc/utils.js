const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function getGitHubDir() {
  const gitHubDir =  process.env.CQ_GITHUB_DIR;
  if (!gitHubDir) {
    throw new Error("Environment variable CQ_GITHUB_DIR is not set. Refer to the project README for usage details.");
  }
  return gitHubDir;
}

function readWorkflowScriptAction({workflowFileName = "", jobId = "", replacements = []}) {
    let script = null;
    const workflow = yaml.load(fs.readFileSync(path.join(getGitHubDir(), 'workflows', workflowFileName), 'utf8'));
    workflow.jobs[jobId].steps.forEach(step => {
      if (step.uses && step.uses.startsWith("actions/github-script")) {
        // Clean up script so it can be used safely
        let workflowScriptBody = step.with.script.replaceAll("await", "");
        replacements.forEach(replacement => {
            workflowScriptBody = workflowScriptBody.replaceAll(replacement.pattern, replacement.replacement)
        });

        // Wrap the script within a function so we can pass mocks to it
        script = `
          function runGitHubScriptAction(context, github) {
            ${workflowScriptBody}
          }
        `;
      }
    });

    if (script === null) {
      throw new Error("Failed to find actions/github-script step in workflow script");
    }

    return script;
}

module.exports = { getGitHubDir, readWorkflowScriptAction }
