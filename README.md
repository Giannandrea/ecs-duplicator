# ecs-duplicator

Command line tool to copy an AWS ECS service to another service with the same name. 
Ideal for creating a 'canary service' to run against the same ELB/Target group or in order to move services on another cluster without downtime.
All properties of the service will be copied including the autoscaling policy.

## Environment
- nodejs > 10
- aws account with access key configured

## Installation (npm)
- npm install ecs-service-clone

## Use docker
```
$ docker run -ti -e AWS_ACCESS_KEY_ID <ACCESS_KEY_ID> -e AWS_SECRET_ACCESS_KEY <SECRET_ACCESS_KEY> -e AWS_DEFAULT_REGION <DEFAULT_REGION> giannandrea/ecs-duplicator
```

## Example
```
$ ecs-duplicator --cluster <source-ecs-cluster> --service <source-ecs-service> --clusterCopyName <destination-ecs-cluster> --serviceCopyName <destination-ecs-service>
```
##
