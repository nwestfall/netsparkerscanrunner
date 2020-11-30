const Netsparker = require('./netsparker');

module.exports = class {
    constructor ({ githubEvent, argv, config }) {
        this.netsparker = new Netsparker(config.userid, config.apitoken, config.profilename, config.targetsite);
    
        this.config = config
        this.argv = argv
        this.githubEvent = githubEvent
    }

    async execute() {
        const scanId = await this.netsparker.scan();
        if(this.config.report) {
            await this.netsparker.waitForScanToComplete(scanId);
            const scanResults = await this.netsparker.scanResults(scanId);
            if(this.config.junit) {
                await this.netsparker.createJunitTestReport(scanResults, this.config.junit);
            } else {
                console.table(scanResults);
            }

            return { scanresults: scanResults };
        }

        return { scanresults: [] };
    }
}