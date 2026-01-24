#!/bin/bash

# Array of all files to create
declare -a files=(
  "architecture-workflow/workflow.md"
  "workloads-services/pods-rc-rs-deployment.md"
  "workloads-services/design-patterns-microservices.md"
  "workloads-services/imperative-commands.md"
  "workloads-services/services-namespaces.md"
  "scheduling/manual-scheduling-static-pods.md"
  "scheduling/taints-tolerations-node-selectors-affinity.md"
  "resource-management/resource-limits-ranges-quotas.md"
  "resource-management/hpa-vpa.md"
  "resource-management/multi-container-pod-patterns.md"
  "resource-management/pod-termination-lifecycle-restart-imagepull.md"
  "resource-management/health-probes.md"
  "resource-management/core-extensions-plugins.md"
  "storage/docker-volumes-revisited.md"
  "storage/volumes-ephemeral-emptydir-downward-api.md"
  "storage/volumes-persistent-in-tree-csi-hostpath.md"
  "storage/volumes-persistent-pv-pvc-storage-classes.md"
  "storage/configmaps-secrets.md"
  "storage/daemonsets-jobs-cronjobs.md"
  "authentication/symmetric-asymmetric-encryption-https.md"
  "authentication/tls-in-kubernetes.md"
  "authorization/authorization-mechanisms.md"
  "authorization/rbac.md"
  "authorization/service-accounts.md"
  "authorization/admission-controllers.md"
  "crds-operators/crds.md"
  "crds-operators/operators.md"
  "kustomize-helm/kustomize.md"
  "kustomize-helm/helm.md"
  "kustomize-helm/statefulsets.md"
  "security/pod-security-standards.md"
  "security/image-pull-secrets.md"
  "security/priority-classes.md"
  "networking/network-policies.md"
  "networking/dns-coredns.md"
  "ingress-gateway/ingress.md"
  "ingress-gateway/gateway-api.md"
)

# Create each file
for file in "${files[@]}"; do
  filepath="docs/$file"
  filename=$(basename "$file" .md)
  title=$(echo "$filename" | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g')
  
  cat > "$filepath" << EOF
---
id: $filename
title: $title
sidebar_label: $title
---

# $title

Content coming soon...

Add your Kubernetes notes here.
EOF

  echo "✅ Created: $filepath"
done

echo ""
echo "🎉 All files created successfully!"
