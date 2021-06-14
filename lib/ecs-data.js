const { ECSClient, DescribeServicesCommand, CreateServiceCommand } = require("@aws-sdk/client-ecs");
const { ApplicationAutoScalingClient, DescribeScalingPoliciesCommand, DescribeScalableTargetsCommand, PutScalingPolicyCommand, RegisterScalableTargetCommand } = require("@aws-sdk/client-application-auto-scaling");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getNewServiceParams(serviceCopyName, clusterCopyName, serviceCopyData) {
  const newServiceParams = {
    capacityProviderStrategy: serviceCopyData.capacityProviderStrategy,
    clientToken: serviceCopyData.clientToken,
    cluster: clusterCopyName,
    deploymentConfiguration: serviceCopyData.deploymentConfiguration,
    deploymentController: serviceCopyData.deploymentController,
    desiredCount: serviceCopyData.desiredCount,
    enableECSManagedTags: serviceCopyData.enableECSManagedTags,
    enableExecuteCommand: serviceCopyData.enableExecuteCommand,
    healthCheckGracePeriodSeconds: serviceCopyData.healthCheckGracePeriodSeconds,
    launchType: serviceCopyData.launchType,
    loadBalancers: serviceCopyData.loadBalancers,
    networkConfiguration: serviceCopyData.networkConfiguration,
    platformVersion: serviceCopyData.platformVersion,
    placementConstraints: serviceCopyData.placementConstraints,
    placementStrategy: serviceCopyData.placementStrategy,
    role: serviceCopyData.role,
    schedulingStrategy: serviceCopyData.schedulingStrategy,
    serviceName: serviceCopyName,
    serviceRegistries: serviceCopyData.serviceRegistries,
    tags: serviceCopyData.tags,
    taskDefinition: serviceCopyData.taskDefinition,
  };
  return newServiceParams;
}

function getNewServicePolicyParams(serviceCopyName, clusterCopyName, data_scaling) {
  let newServicePolicyParams = {
    PolicyName: data_scaling.PolicyName,
    PolicyType: data_scaling.PolicyType,
    ResourceId: `service/${clusterCopyName}/${serviceCopyName}`,
    ScalableDimension: data_scaling.ScalableDimension,
    ServiceNamespace: data_scaling.ServiceNamespace,
    TargetTrackingScalingPolicyConfiguration: {
      PredefinedMetricSpecification: {
        PredefinedMetricType: data_scaling.TargetTrackingScalingPolicyConfiguration.PredefinedMetricSpecification.PredefinedMetricType
      },
      ScaleInCooldown: data_scaling.TargetTrackingScalingPolicyConfiguration.ScaleInCooldown,
      ScaleOutCooldown: data_scaling.TargetTrackingScalingPolicyConfiguration.ScaleOutCooldown,
      TargetValue: data_scaling.TargetTrackingScalingPolicyConfiguration.TargetValue
    }
  };
  return newServicePolicyParams;
}

async function getNewServiceInfo(clusterName, serviceName, region) {
  const params = {
    cluster: clusterName,
    services: [
      serviceName,
    ],
  };
  const ecs = new ECSClient({ region: region });
  const describeServicesCommand = await new DescribeServicesCommand(params);
  const data = await ecs.send(describeServicesCommand);
  return data;
}

async function getAvaliability(clusterName, serviceName, region) {
  const service_ret = await getNewServiceParams(clusterName, serviceName, region);
  if (service_ret && service_ret.services && service_ret.services.length > 0) {
    return true;
  } else {
    return false;
  }
}
exports.getAvaliability = getAvaliability;

async function getService(clusterName, serviceName, region) {
  let policy;

  const params_autoscaling = {
    ServiceNamespace: "ecs",
    ResourceId: `service/${clusterName}/${serviceName}`,
  };

  const params_scalable_target = {
    ServiceNamespace: "ecs",
    ResourceIds: [`service/${clusterName}/${serviceName}`],
  };
  let data;
  try {
    data = await getNewServiceInfo(clusterName, serviceName, region);
    if (data && data.services && data.services.length > 0) {
      const aas = new ApplicationAutoScalingClient({ region: region });
      const describeScalableTargetsCommand = await new DescribeScalableTargetsCommand(params_scalable_target);
      scalable_target = await aas.send(describeScalableTargetsCommand);

      const describeScalingPoliciesCommand = await new DescribeScalingPoliciesCommand(params_autoscaling);
      policy = await aas.send(describeScalingPoliciesCommand);
    } else {
      // not found
      return null;
    }
  } catch (err) {
    return err;
  }
  return Object.assign(data.services[0], policy, scalable_target);
}
exports.getService = getService;


async function copyService({ serviceCopyName, clusterCopyName, serviceCopyData, desiredCount, clusterName, region }) {
  const newServiceParams = await getNewServiceParams(serviceCopyName, clusterCopyName, serviceCopyData);

  try {
    const ecs = new ECSClient({ region: region });
    const createService = await new CreateServiceCommand(newServiceParams);
    const data = await ecs.send(createService);
    await sleep(2000)

    var newServiceRegisterParams = {
      MaxCapacity: serviceCopyData.ScalableTargets[0].MaxCapacity,
      MinCapacity: serviceCopyData.ScalableTargets[0].MinCapacity,
      ResourceId: `service/${clusterCopyName}/${serviceCopyName}`,
      ScalableDimension: serviceCopyData.ScalableTargets[0].ScalableDimension,
      ServiceNamespace: serviceCopyData.ScalableTargets[0].ServiceNamespace
    };

    const aas = new ApplicationAutoScalingClient({ region: region });
    const registerScalableTarget = await new RegisterScalableTargetCommand(newServiceRegisterParams);
    const scalableTarget = await aas.send(registerScalableTarget);
    await sleep(2000)

    let policy;
    for await (let data_scaling of serviceCopyData.ScalingPolicies) {
      newServicePolicyParams = getNewServicePolicyParams(serviceCopyName, clusterCopyName, data_scaling);
      const putScalingPolicyCommand = await new PutScalingPolicyCommand(newServicePolicyParams);
      policy = await aas.send(putScalingPolicyCommand);
    }

    return true;
  } catch (err) {
    console.log(err);
    return err;
  }
}
exports.copyService = copyService;