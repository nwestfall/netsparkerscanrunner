# Netsparker Scan Runner

[![npm version](https://badge.fury.io/js/netsparkerscanrunner.svg)](https://badge.fury.io/js/netsparkerscanrunner)

Quickly and easily run a Netsparker Scan using your Netsparker 
Cloud Account.

## Requirements
You have a [Netsparker Cloud](https://www.netsparkercloud.com/) account.

## Features

Using the Netsparker Cloud API, run a scan using a profile against a url.  You can then either make it "fire-and-forget" or report back either in the console or jUnit.

## Install

`npm install -g netsparker-scan-runner`

## How to Use

`netsparker-scan-runner --help`

```
Netsparker Scan Runner

  Run a scan against your Netsparker Cloud instance using a configured profile.
  Can optionally wait for the report.

Options

  --userid userid             The user id from your Netsparker Account
  --apitoken apitoken         The api token from your Netsparker Account
  --profilename profilename   The profile name saved in your Netsparker Account
  --targetsite                The target url you want to run against
  --report                    If you want to wait around for the report (true) or to file and forget
                              (false)
  --junit                     If you want to generate a junit report, enter the file name and location here
  --help                      Print this usage guide
```

`netsparker-scan-runner -u userid -t apitoken -p ProfileName -s https://example.com/ -j path/to/junit/report.xml`

And that's it.  Super simple.  Super easy.