const jUnitBuilder = require('junit-report-builder');
const fetch = require('node-fetch');
const header = require('basic-auth-header');
const sleep = require('sleep-promise');

class Netsparker {
    constructor(userid, apitoken, profilename, targetsite) {
        this.userid = userid;
        this.apitoken = apitoken;
        this.profilename = profilename;
        this.targetsite = targetsite;
    }

    async scan() {
        const response = await fetch('https://www.netsparkercloud.com/api/1.0/scans/newwithprofile', {
            method: 'POST',
            body: `{ "ProfileName": "${this.profilename}", "TargetUri": "${this.targetsite}" }`,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': header(this.userid, this.apitoken)
            }
        });
        const body = await response.text();
        if(!response.ok) {
            throw new Error(`${response.statusText} - ${body}`);
        }
        const scanId = JSON.parse(body).Id;
        return scanId;
    }

    async scanStatus(scanId) {
        const response = await fetch(`https://www.netsparkercloud.com/api/1.0/scans/status/${scanId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': header(this.userid, this.apitoken)
            }
        });

        if(!response.ok) {
            throw new Error(response.statusText);
        }

        const body = await response.text();
        const result = JSON.parse(body);
        return result;
    }

    async waitForScanToComplete(scanId) {
        var complete = false;
        do
        {
            const scanStatusResult = await this.scanStatus(scanId);
            if(scanStatusResult.State == "Complete")
                complete = true;
            else {
                if(scanStatusResult.EstimatedLaunchTime == null)
                    console.log(`Scan running - ${scanStatusResult.CompletedSteps}/${scanStatusResult.EstimatedSteps} complete`);
                else
                    console.log(`Scan estimated start time - ${scanStatusResult.EstimatedLaunchTime}`);
                await sleep(5000);
            }
        } while(!complete);
    }

    async scanResults(scanId) {
        const response = await fetch(`https://www.netsparkercloud.com/api/1.0/scans/result/${scanId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': header(this.userid, this.apitoken)
            }
        });

        if(!response.ok) {
            throw new Error(response.statusText);
        }

        const body = await response.text();
        const results = JSON.parse(body);
        return results;
    }

    async scanReport(scanId, type, format) {
        const response = await fetch(`https://www.netsparkercloud.com/api/1.0/scans/report/?excludeResponseData=true&format=${format}&id=${scanId}&type=${type}`, {
            method: 'GET',
            headers: {
                'Authorization': header(this.userid, this.apitoken)
            }
        });

        if(!response.ok) {
            throw new Error(response.statusText);
        }

        const body = await response.text();
        const results = JSON.parse(body);
        return results;
    }

    createJunitTestReport(scanResults, junitFile) {
        const suite = jUnitBuilder.testSuite().name('NetsparkerSuite');
        for(var i = 0; i < scanResults.length; i++) {
            const result = scanResults[i];
            suite.testCase()
                    .className(result.Type)
                    .name(result.Title)
                    .standardOutput(result.IssueUrl)
                    .failure();
        }
        jUnitBuilder.writeTo(junitFile);
    }
}

module.exports = Netsparker