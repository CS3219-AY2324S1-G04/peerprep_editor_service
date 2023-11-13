#!/usr/bin/env bash

kubectl delete -f ./config_maps/redis_client.yaml
kubectl delete -f ./secrets/redis_client.yaml

kubectl delete -f ./config_maps/api.yaml

kubectl delete -f ./deployments/api.yaml
kubectl delete -f ./services/api.yaml
kubectl delete -f ./hpas/api.yaml
