#!/usr/bin/env bash

kubectl apply -f ./config_maps/redis_client_config.yaml
kubectl apply -f ./secrets/redis_client.yaml

kubectl apply -f ./deployments/api.yaml
kubectl apply -f ./services/api.yaml
kubectl apply -f ./hpas/api.yaml
