#!/usr/bin/env node
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const Netsparker = require('./netsparker');

const cmdOptions = [
    { name: 'userid', alias: 'u', type: String },
    { name: 'apitoken', alias: 't', type: String },
    { name: 'profilename', alias: 'p', type: String },
    { name: 'targetsite', alias: 's', type: String },
    { name: 'junit', alias: 'j', type: String },
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
                description: 'If you want to wait around for the report (true) or to fire and forget (false)'
            },
            {
                name: 'junit',
                typelabel: 'junit export location/name',
                description: 'If you want to generate a junit report, enter the file name and location here'
            },
            {
                name: 'help',
                description: 'Print this usage guide'
            }
        ]
    }
]


async function run() {
    try {
        const options = commandLineArgs(cmdOptions)

        if(options.help) {
            const usage = commandLineUsage(sections)
            console.log(usage)
        } else {
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
            if(!(options.junit) && options.report == false) {
                console.error("You cannot specify a --junit location and set --report to false");
                return;
            }

            const netsparker = new Netsparker(options.userid, options.apitoken, options.profilename, options.targetsite);
            
            console.info("Starting scan...");
            const scanId = await netsparker.scan();
            console.info("Scan complete");
            if(options.report) {
                await netsparker.waitForScanToComplete(scanId);
                const scanResults = await netsparker.scanResults(scanId);
                console.table(scanResults);
                if(options.junit) {
                    console.log("Generating jUnit report...");
                    netsparker.createJunitTestReport(scanResults, options.junit);
                    console.log("jUnit report generated");
                }
            } else {
                console.log("Check the Netsparker Cloud portal for the status and outcome of your scan.");
                return;
            }
        }
    } catch(e) {
        console.error(e);
    }
}


run();