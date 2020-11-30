const Netsparker = require('./netsparker');
const core = require('@actions/core')
const githubEvent = require(process.env.GITHUB_EVENT_PATH)

async function exec () {
    try
    {
        var config = parseConfig();
        netsparker = new Netsparker(config.userid, config.apitoken, config.profilename, config.targetsite);
        const scanId = await netsparker.scan();
        if(config.report) {
            await netsparker.waitForScanToComplete(scanId);
            const scanResults = await netsparker.scanResults(scanId);
            if(config.junit) {
                await this.netsparker.createJunitTestReport(scanResults, config.junit);
            } else {
                console.table(scanResults);
            }

            core.setOutput('scanresults', scanResults);
        }
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}

function parseConfig () {
    return {
      userid: core.getInput('userid'),
      apitoken: core.getInput('apitoken'),
      profilename: core.getInput('profilename'),
      targetsite: core.getInput('targetsite'),
      report: core.getInput('report'),
      junit: core.getInput('junit')
    }
}

exec()