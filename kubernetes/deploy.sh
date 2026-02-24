#!/bin/bash

set -e

echo "Deploying UnCanvas to Kubernetes..."

# Apply namespace
kubectl apply -f namespace.yaml

# Apply secrets and config
kubectl apply -f postgres-deployment.yaml

# Wait for postgres to be ready
echo "Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=available deployment/postgres -n uncanvas --timeout=120s

# Apply backend
kubectl apply -f backend-deployment.yaml

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
kubectl wait --for=condition=available deployment/uncanvas-backend -n uncanvas --timeout=120s

# Apply frontend
kubectl apply -f frontend-deployment.yaml

# Wait for frontend to be ready
echo "Waiting for frontend to be ready..."
kubectl wait --for=condition=available deployment/uncanvas-frontend -n uncanvas --timeout=120s

# Apply ingress
kubectl apply -f ingress.yaml

echo "Deployment complete!"
echo "Run 'kubectl get pods -n uncanvas' to see status"
