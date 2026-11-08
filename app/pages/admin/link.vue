<script setup lang="ts">
import AdminLink from '~/components/admin/Link.vue'
import { PRIVATE_ROBOTS } from '~/composables/useSeo'

definePageMeta({ layout: 'admin', middleware: 'admin' })

useSeo({ title: '友链管理', robots: PRIVATE_ROBOTS })
</script>

<template>
  <AdminLink />
</template>
