const utils = require('../etc/utils')

/**
 * Prerequisites
 */
const script = utils.readWorkflowScriptAction({workflowFileName: 'assign-wontfix-issue-milestone.yaml', jobId: 'assign-wont-fix-issue-milestone'});


describe("Camel Quarkus Issue Auto wontfix Milestone Assignment", () => {

  it("Adds issues to the wontfix milestone", () => {
    const Context = {
      payload: {
        issue: {
          number: 1234,
        }
      },
      repo: {
        owner: "apache",
        repo: "camel-quarkus",
      }
    };

    const Github = {
      rest: {
        issues: {
          update: jasmine.createSpy(),
        }
      }
    }

    const github = Object.create(Github);
    const context = Object.create(Context);

    // Run the actions/script code with mocks
    eval(script);
    runGitHubScriptAction(context, github);

    // Verify the issue got allocated to the wontfix milestone (4)
    const expectedArgs = {
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.payload.issue.number,
      milestone: 4,
    }
    expect(github.rest.issues.update).toHaveBeenCalledWith(expectedArgs);
  });
});
