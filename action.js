const Netsparker = require('./netsparker');
const core = require('@actions/core')
const githubEvent = require(process.env.GITHUB_EVENT_PATH)

async function exec () {
    try
    {
        var config = parseConfig();
        netsparker = new Netsparker(config.userid, config.apitoken, config.profilename, config.targetsite);
        const scanId = await netsparker.scan();
        if(config.report === 'true') {
            await netsparker.waitForScanToComplete(scanId);
            const scanResults = await netsparker.scanResults(scanId);
            core.setOutput('scanresults', scanResults);
            const scanReport = await netsparker.scanReport(scanId, 'Vulnerabilities', 'Json');
            core.setOutput('scanreport', scanReport);
            if(config.report === 'true') {
                if(config.junit) {
                    await this.netsparker.createJunitTestReport(scanResults, config.junit);
                } else {
                    console.table(scanResults);
                }
            }
            if(config.criticalthreshold || config.highthreshold || config.mediumthreshold) {
                var criticalCount = 0;
                var highCount = 0;
                var mediumCount = 0;
                for(var i = 0; i < scanReport.Vulnerabilities.length; i++) {
                    var v = scanReport.Vulnerabilities[i];
                    switch(v.Severity) {
                        case "Critical":
                            criticalCount++;
                            break;
                        case "High":
                            highCount++;
                            break;
                        case "Medium":
                            mediumCount++;
                            break;
                    }
                }

                var thresholdReached = false;
                if(config.criticalthreshold) {
                    if(criticalCount > parseInt(config.criticalthreshold)) {
                        thresholdReached = true;
                        console.error(`Critical count exceeds threshold (${criticalCount}).`);
                    }
                }
                if(config.highthreshold) {
                    if(highCount > parseInt(config.highthreshold)) {
                        thresholdReached = true;
                        console.error(`High count exceeds threshold (${highCount}).`);
                    }
                }
                if(config.mediumthreshold) {
                    if(mediumCount > parseInt(config.mediumthreshold)) {
                        thresholdReached = true;
                        console.error(`Medium count exceeds threshold (${mediumCount}).`)
                    }
                }

                if(thresholdReached) {
                    throw new Error("One or more thresholds where reached.  Please see report in Netsparker");
                }
            }
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
      junit: core.getInput('junit'),
      criticalthreshold: core.getInput('criticalthreshold'),
      highthreshold: core.getInput('highthreshold'),
      mediumthreshold: core.getInput('mediumthreshold')
    }
}

exec()