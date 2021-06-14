#!/usr/bin/env node
const ECSLIb = require('./lib/ecs-data');
const argv = require('minimist')(process.argv.slice(2));

const clusterName = argv.cluster;
if (!clusterName) {
  console.log('--cluster is required');
  return;
}

const serviceName = argv.service;
if (!serviceName) {
  console.log('--service is required');
  return;
}

const desiredCount = argv.desiredCount ? argv.desiredCount : 1;
const serviceCopyName = argv.serviceCopyName ? argv.serviceCopyName : `${serviceName}-Copy`;
const clusterCopyName = argv.clusterCopyName ? argv.clusterCopyName : argv.cluster;
const region = argv.region ? argv.region : "eu-west-1";

const serviceParams = {
  clusterName,
  serviceName,
};

const serviceCopyParams = {
  clusterCopyName,
  serviceCopyName,
};

(async () => {
//const notAvailable = await ECSLIb.getAvaliability(clusterCopyName, serviceCopyName, region);
//if (notAvailable == true) {process.exit(144)};
console.log(`Retrieving configuration from service/${clusterName}/${serviceName} ....`);
const serviceCopyData = await ECSLIb.getService(clusterName, serviceCopyName, region);
console.log(`Cloning service in service/${clusterCopyName}/${serviceCopyName} ....`);
const data = await ECSLIb.copyService({ serviceCopyName, clusterCopyName, serviceCopyData, desiredCount, clusterName, region});
console.log("service cloned, please wait for the end of deploy")
})();