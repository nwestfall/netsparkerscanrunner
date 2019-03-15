const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const cTable = require('console.table');
const request = require('request');

const cmdOptions = [
    { name: 'userid', alias: 'u', type: String },
    { name: 'apitoken', alias: 't', type: String },
    { name: 'profilename', alias: 'p', type: String },
    { name: 'targetsite', alias: 's', type: String },
    { name: 'report', alias: 'r', type: Boolean },
    { name: 'help', alias: 'h', type: Boolean }
]

const sections = [
    {
        header: 'Netsparker Scan Runner',
        content: 'Run a scan against your Netsparker Cloud instance using a configured profile.  Can optionally wait for the report.'
    },
    {
        header: 'Options',
        optionList: [
            {
                name: 'userid',
                typeLabel: '{underline userid}',
                description: 'The user id from your Netsparker Account'
            },
            {
                name: 'apitoken',
                typeLabel: '{underline apitoken}',
                description: 'The api token from your Netsparker Account'
            },
            {
                name: 'profilename',
                typeLabel: '{underline profilename}',
                description: 'The profile name saved in your Netsparker Account'
            },
            {
                name: 'targetsite',
                typelabel: '{underline targeturl}',
                description: 'The target url you want to run against'
            },
            {
                name: 'report',
                typelabel: 'true/false (defaults: true)',
                description: 'If you want to wait around for the report (true) or to file and forget (false)'
            },
            {
                name: 'help',
                description: 'Print this usage guide'
            }
        ]
    }
]

const options = commandLineArgs(cmdOptions)

if(options.help) {
    const usage = commandLineUsage(sections)
    console.log(usage)
}
else {
    if(!(options.userid)) {
        console.error("--userid is a required argument");
        return;
    }
    if(!(options.apitoken)) {
        console.error("--apitoken is a required argument");
        return;
    }
    if(!(options.profilename)) {
        console.error("--profilename is a required argument");
        return;
    }
    if(!(options.targetsite)) {
        console.error("--targetsite is a required argument");
        return;
    }
    if(options.report === undefined) {
        options.report = true;
    }

    console.info("Starting scan...");
    var scanRequestOptions = {
        url: 'https://www.netsparkercloud.com/api/1.0/scans/newwithprofile',
        method: 'POST',
        body: `{ "ProfileName": "${options.profilename}", "TargetUri": "${options.targetsite}" }`,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        auth: {
            'user': options.userid,
            'pass': options.apitoken
        }
    };
    request(scanRequestOptions, function(err, httpResponse, body) {
        if(err) {
            console.error(err);
            return;
        }

        if(httpResponse.statusCode == 201) {
            // OK!
            var scanId = JSON.parse(body).Id;
            console.log(`Scan triggered! - ${scanId}`);

            // if we want a report, keep checking the status
            if(options.report) {
                // check status until complete or failed
                
                loopScanStatus(options, scanId).then((resp) => {
                    console.log(`Scan complete!  Completed Steps - ${resp.CompletedSteps}`);
                    var scanResultOptions = {
                        url: `https://www.netsparkercloud.com/api/1.0/scans/result/${scanId}`,
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json'
                        },
                        auth: {
                            'user': options.userid,
                            'pass': options.apitoken
                        }
                    };
                    request(scanResultOptions, function(err, httpResponse, body) {
                        if(err) {
                            console.error(err);
                            return;
                        }

                        if(httpResponse.statusCode == 200) { 
                            console.table(JSON.parse(body));
                            console.log("Netsparker Scan Runner Complete!");
                        } else {
                            console.error("Invalid status code from Scan Result");
                        }
                    });
                }).catch((error) => {
                    console.error(error);
                    return;
                })
            } else {
                console.log("Check the Netsparker Cloud portal for the status and outcome of your scan.");
                return;
            }
        }
    });
}

function loopScanStatus(options, scanId) {
    var promise = new Promise(function(resolve, reject) {
        var scanStatusOptions = {
            url: `https://www.netsparkercloud.com/api/1.0/scans/status/${scanId}`,
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            auth: {
                'user': options.userid,
                'pass': options.apitoken
            }
        };
        request(scanStatusOptions, function(err, httpResponse, body) {
            if(err) {
                reject(error);
            } else {
                if(httpResponse.statusCode == 200) {
                    var result = JSON.parse(body);
                    if(result.State == "Complete") {
                        resolve(result);
                    } else {
                        if(result.EstimatedLaunchTime == null)
                            console.log(`Scan running - ${result.CompletedSteps}/${result.EstimatedSteps} complete`);
                        else
                            console.log(`Scan estimated start time - ${result.EstimatedLaunchTime}`);
                        setTimeout(function() {
                            loopScanStatus(options, scanId).then(resolve).catch(reject);
                        }, 5000);
                    }
                } else {
                    reject("Unknown status code from Scan Status");
                }
            }
        });
    });
    return promise;
}