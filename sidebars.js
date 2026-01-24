/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  kubernetesSidebar: [
    {
      type: 'category',
      label: 'Kubernetes - Architecture and Workflow',
      collapsed: false,
      items: [
        'architecture-workflow/architecture',
        'architecture-workflow/workflow',
      ],
    },
    {
      type: 'category',
      label: 'Kubernetes - Workloads, Services, Namespaces & Imperative Commands',
      collapsed: false,
      items: [
        'workloads-services/pods-rc-rs-deployment',
        'workloads-services/design-patterns-microservices',
        'workloads-services/imperative-commands',
        'workloads-services/services-namespaces',
      ],
    },
    {
      type: 'category',
      label: 'Kubernetes - Scheduling',
      collapsed: false,
      items: [
        'scheduling/manual-scheduling-static-pods',
        'scheduling/taints-tolerations-node-selectors-affinity',
      ],
    },
    {
      type: 'category',
      label: 'Kubernetes - Resource Management',
      collapsed: false,
      items: [
        'resource-management/resource-limits-ranges-quotas',
        'resource-management/hpa-vpa',
        'resource-management/multi-container-pod-patterns',
        'resource-management/pod-termination-lifecycle-restart-imagepull',
        'resource-management/health-probes',
        'resource-management/core-extensions-plugins',
      ],
    },
    {
      type: 'category',
      label: 'Kubernetes - Storage & ConfigMaps',
      collapsed: false,
      items: [
        'storage/docker-volumes-revisited',
        'storage/volumes-ephemeral-emptydir-downward-api',
        'storage/volumes-persistent-in-tree-csi-hostpath',
        'storage/volumes-persistent-pv-pvc-storage-classes',
        'storage/configmaps-secrets',
        'storage/daemonsets-jobs-cronjobs',
      ],
    },
    {
      type: 'category',
      label: 'Kubernetes - Authentication',
      collapsed: false,
      items: [
        'authentication/symmetric-asymmetric-encryption-https',
        'authentication/tls-in-kubernetes',
      ],
    },
    {
      type: 'category',
      label: 'Kubernetes - Authorization & Admission',
      collapsed: false,
      items: [
        'authorization/authorization-mechanisms',
        'authorization/rbac',
        'authorization/service-accounts',
        'authorization/admission-controllers',
      ],
    },
    {
      type: 'category',
      label: 'Kubernetes - CRDs & Operators',
      collapsed: false,
      items: [
        'crds-operators/crds',
        'crds-operators/operators',
      ],
    },
    {
      type: 'category',
      label: 'Kubernetes - Kustomize, Helm, Statefulsets',
      collapsed: false,
      items: [
        'kustomize-helm/kustomize',
        'kustomize-helm/helm',
        'kustomize-helm/statefulsets',
      ],
    },
    {
      type: 'category',
      label: 'Kubernetes - Pod Security',
      collapsed: false,
      items: [
        'security/pod-security-standards',
        'security/image-pull-secrets',
        'security/priority-classes',
      ],
    },
    {
      type: 'category',
      label: 'Kubernetes - Networking',
      collapsed: false,
      items: [
        'networking/network-policies',
        'networking/dns-coredns',
      ],
    },
    {
      type: 'category',
      label: 'Kubernetes - Ingress & Gateway API',
      collapsed: false,
      items: [
        'ingress-gateway/ingress',
        'ingress-gateway/gateway-api',
      ],
    },
  ],
};

module.exports = sidebars;
