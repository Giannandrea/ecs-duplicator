# ecs-service-clone

Command line tool to copy an AWS ECS service to another service with the same name. 
Ideal for creating a 'canary service' to run against the same ELB/Target group or in order to move services on another cluster without downtime.
All properties of the service will be copied including the autoscaling policy.

## Environment
- nodejs > 10
- aws account with access key configured

## Installation (npm)
- npm install ecs-service-clone

## Example
```
$ ecs-service-clone --cluster my-ecs-cluster --service my-ecs-service --serviceCopyName my-ecs-service-copy
```
##
